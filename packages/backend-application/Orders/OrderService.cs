using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Integration;
using PriscilaSkincare.Domain.Integration;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Application.Orders;

public sealed class OrderService(IOrderRepository orders, IShoppingCartRepository carts,
    ICustomerRepository customers, ICustomerAddressRepository addresses, ICatalogGateway catalog,
    IOrderProjection projection, IPaymentRepository payments, IIntegrationOutbox integrationOutbox,
    IIntegrationInbox integrationInbox, IInventoryService inventory, IOrderEmailOutbox emailOutbox, ICommercePricing pricing,
    IUnitOfWork unitOfWork, IClock clock, ICommerceTransactions transactions)
{
    public async Task<CheckoutPreviewResult> PreviewAsync(Guid customerId, CheckoutPreviewRequest request, CancellationToken cancellationToken = default)
    {
        var (_, address, cart) = await Context(customerId, request.AddressId, cancellationToken, request.PickupLocationId, request.Contact, request.Locale);
        var preview = await BuildPreview(cart, address.Id, request.Currency, request.Locale, cancellationToken);
        if (request.PickupLocationId.HasValue) await RequirePickup(customerId, request.PickupLocationId.Value, request.Locale, cancellationToken);
        var stock = new List<InventoryRequest>();
        foreach (var item in preview.Items)
        foreach (var component in item.Components ?? [])
        {
            var product = await catalog.FindBySkuAsync(Domain.Catalog.ProductSku.Create(component.Sku), request.Locale, cancellationToken)
                ?? throw new CommerceException("product_not_found", "Produto não encontrado.");
            stock.Add(new(component.Sku, checked(component.Quantity * item.Quantity), product.Stock, request.PickupLocationId));
        }
        await inventory.ValidateAsync(stock, cancellationToken);
        var quote = await pricing.QuoteAsync(customerId, address, preview.Currency, preview.Items, request.Coupon, request.DeliveryRateId, token: cancellationToken, pickup: request.PickupLocationId.HasValue);
        return preview with { Shipping = quote.Shipping, Discount = quote.Discount, Total = preview.Subtotal + quote.Shipping - quote.Discount,
            PromotionName = quote.PromotionName, DeliveryRateId = quote.DeliveryRateId, DeliveryOptions = quote.DeliveryOptions };
    }

    public async Task<OrderResult> CreateAsync(Guid customerId, CreateOrderCommand command, CancellationToken cancellationToken = default)
    {
        await using var transaction = await transactions.BeginAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(command.IdempotencyKey)) throw new CommerceException("idempotency_required", "Não foi possível identificar a confirmação.");
        var existing = await orders.FindByIdempotencyKeyAsync(customerId, command.IdempotencyKey, cancellationToken);
        if (existing is not null) return await MapOne(existing, cancellationToken);
        var (customer, address, cart) = await Context(customerId, command.AddressId, cancellationToken, command.PickupLocationId, command.Contact, command.Locale);
        var preview = await BuildPreview(cart, address.Id, command.Currency, command.Locale, cancellationToken);
        var now = clock.UtcNow;
        var order = Order.Create(customerId, $"PSC-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            preview.Currency, new(address.Recipient, address.Phone, address.Country, address.Province, address.City,
                address.Neighborhood, address.Street, address.HouseNumber, address.Apartment, address.PostalCode),
            customer.Name, customer.Email.Value, now, command.IdempotencyKey);
        foreach (var item in preview.Items)
            order.AddItem(CartService.ParseType(item.ItemType), CommerceItemReference.Create(item.Reference), item.ProductName, item.Variant,
                Money.Create(item.UnitPrice, preview.Currency), item.Quantity, item.ImageUrl, item.Components);
        order.SetShipping(Money.Create(preview.Shipping, preview.Currency));
        if (command.PickupLocationId.HasValue)
        {
            var location = await RequirePickup(customerId, command.PickupLocationId.Value, command.Locale, cancellationToken);
            order.SetPickup(new(location.Id, location.Name, location.Country, location.City, location.Address, location.Phone, location.Instructions));
        }
        var stockRequests = await BuildInventoryRequests(order, command.Locale, cancellationToken);
        // Validate commercial conditions before taking any stock out of circulation.
        await pricing.QuoteAsync(customerId, address, preview.Currency, preview.Items, command.Coupon, command.DeliveryRateId, token: cancellationToken, pickup: command.PickupLocationId.HasValue);
        await inventory.ReserveAsync(order.Id, stockRequests, cancellationToken);
        CommerceQuote quote;
        try { quote = await pricing.QuoteAsync(customerId, address, preview.Currency, preview.Items, command.Coupon, command.DeliveryRateId, order.Id, cancellationToken, pickup: command.PickupLocationId.HasValue); }
        catch { await inventory.ReleaseAsync(order.Id, CancellationToken.None); throw; }
        order.SetShipping(Money.Create(quote.Shipping, preview.Currency));
        order.SetCommercialTerms(quote.Discount, quote.PromotionName, quote.DeliveryRateId);
        if (command.ExpectedTotal.HasValue && command.ExpectedTotal.Value != order.TotalAmount)
        {
            await pricing.CompleteAsync(order.Id, false, cancellationToken);
            await inventory.ReleaseAsync(order.Id, cancellationToken);
            throw new CommerceException("checkout_changed", "O valor da encomenda mudou. Actualize o resumo antes de confirmar.");
        }
        var payment = Payment.Create(order.Id, command.PaymentMethod,
            $"PENDING-{order.Id:N}", Money.Create(order.TotalAmount, order.Currency), now);
        orders.Add(order);
        payments.Add(payment);
        var eventId = Guid.NewGuid();
        var paymentEvent = new IntegrationEvent<PaymentRequestedEvent>(eventId,
            "payment.requested.v1", now, new(order.Id, order.TotalAmount, order.Currency,
                command.IdempotencyKey, NormalizeLocale(command.Locale)));
        integrationOutbox.Add(IntegrationOutboxMessage.Create(eventId, paymentEvent.Type,
            "payments", JsonSerializer.Serialize(paymentEvent), now));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        try
        {
            var documentId = await projection.UpsertAsync(order, customer, payment, cancellationToken);
            if (!string.IsNullOrWhiteSpace(documentId)) { order.MarkProjected(documentId); await unitOfWork.SaveChangesAsync(cancellationToken); }
        }
        catch { /* a encomenda local não pode ser descartada por indisponibilidade do painel */ }
        return Map(order, payment);
    }

    public async Task ApplyPaymentResultAsync(Guid eventId, PaymentResultEvent result,
        CancellationToken cancellationToken = default, bool synchronizeProjection = true)
    {
        await using var transaction = await transactions.BeginAsync(cancellationToken);
        if (await integrationInbox.ContainsAsync(eventId, cancellationToken)) return;
        var order = await orders.FindByIdAsync(result.OrderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada.");
        var payment = await payments.FindByOrderAsync(order.Id, cancellationToken)
            ?? throw new CommerceException("payment_not_found", "Pagamento não encontrado.");
        if (payment.Status != PaymentStatus.Pending)
            throw new CommerceException("payment_already_processed", "Este pagamento já foi processado.");
        var now = clock.UtcNow;

        if (result.Approved)
        {
            await pricing.CompleteAsync(order.Id, true, cancellationToken);
            var stockRequests = await BuildInventoryRequests(order, result.Locale, cancellationToken);
            await inventory.DebitAsync(order.Id, stockRequests, cancellationToken);
            payment.Complete(result.Provider, result.Reference, PaymentStatus.Approved, now);
            order.ChangeStatus(OrderStatus.Confirmed, now);
            order.ChangeStatus(OrderStatus.Paid, now);
            var cart = await carts.FindAsync(order.CustomerId, cancellationToken);
            cart?.Clear(now);
            var customer = await customers.FindByIdAsync(order.CustomerId, cancellationToken)
                ?? throw new CommerceException("customer_not_found", "Cliente não encontrado.");
            emailOutbox.Enqueue(CreateConfirmationEmail(order, payment, customer, result.Locale), now);
        }
        else
        {
            await pricing.CompleteAsync(order.Id, false, cancellationToken);
            await inventory.ReleaseAsync(order.Id, cancellationToken);
            payment.Complete(result.Provider, result.Reference, PaymentStatus.Rejected, now);
            order.ChangeStatus(OrderStatus.PaymentFailed, now);
        }

        integrationInbox.Add(IntegrationInboxMessage.Receive(eventId, "payment.result.v1", now));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (synchronizeProjection)
        {
            var owner = await customers.FindByIdAsync(order.CustomerId, cancellationToken);
            try { await projection.UpsertAsync(order, owner, payment, cancellationToken); }
            catch { /* a confirmação do pagamento permanece local e será reconciliada */ }
        }
    }

    public async Task<IReadOnlyList<OrderResult>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        await MapMany(await orders.ListAsync(customerId, cancellationToken), cancellationToken);

    public async Task<IReadOnlyList<PickupLocation>> PickupOptionsAsync(Guid customerId, string locale, CancellationToken token = default)
    {
        var cart = await carts.FindAsync(customerId, token) ?? throw new CommerceException("cart_empty", "O carrinho está vazio.");
        var requests = new List<InventoryRequest>();
        foreach (var item in cart.Items)
        {
            var entry = await catalog.FindAsync(item.ItemType, item.Reference, locale, token);
            if (entry is null || !entry.IsAvailable) return [];
            requests.AddRange(entry.Components.Select(x => new InventoryRequest(x.Sku.Value, checked(x.Quantity * item.Quantity), null)));
        }
        return await inventory.PickupLocationsAsync(requests, token);
    }

    private async Task<PickupLocation> RequirePickup(Guid customerId, Guid locationId, string locale, CancellationToken token) =>
        (await PickupOptionsAsync(customerId, locale, token)).FirstOrDefault(x => x.Id == locationId)
        ?? throw new CommerceException("pickup_unavailable", "Esta loja já não dispõe de todos os produtos para levantamento.");

    public async Task<OrderResult> FindAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken = default) =>
        await MapOne(await orders.FindByIdAsync(customerId, orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada."));

    public async Task<ManualPaymentRequest> BuildManualPaymentRequestAsync(Guid orderId, string status,
        CancellationToken cancellationToken = default)
    {
        var normalized = status.Trim().ToLowerInvariant();
        if (normalized is not ("approved" or "rejected"))
            throw new CommerceException("invalid_payment_status",
                "O pagamento manual só pode ser aprovado ou rejeitado.");
        var order = await orders.FindByIdAsync(orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada.");
        var payment = await payments.FindByOrderAsync(order.Id, cancellationToken)
            ?? throw new CommerceException("payment_not_found", "Pagamento não encontrado.");
        if (payment.Status != PaymentStatus.Pending)
            throw new CommerceException("payment_already_processed", "Este pagamento já foi processado.");
        return new(order.Id, order.TotalAmount, order.Currency,
            order.IdempotencyKey ?? $"manual-{order.Id:N}", normalized == "approved", "pt");
    }

    public async Task ChangeStatusAsync(Guid orderId, string status, CancellationToken cancellationToken = default,
        bool synchronizeProjection = true)
    {
        await using var transaction = await transactions.BeginAsync(cancellationToken);
        if (!Enum.TryParse<OrderStatus>(status, true, out var target))
            throw new CommerceException("invalid_order_status", "Estado da encomenda inválido.");
        var order = await orders.FindByIdAsync(orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada.");
        var payment = await payments.FindByOrderAsync(order.Id, cancellationToken)
            ?? throw new CommerceException("payment_not_found", "Pagamento não encontrado.");
        var previous = order.Status;
        order.ChangeStatus(target, clock.UtcNow);
        if (target == OrderStatus.Cancelled && payment.Status == PaymentStatus.Pending)
        {
            await pricing.CompleteAsync(order.Id, false, cancellationToken);
            await inventory.ReleaseAsync(order.Id, cancellationToken);
            payment.ChangeStatus(PaymentStatus.Cancelled, clock.UtcNow);
        }
        if (target == OrderStatus.Refunded)
            payment.ChangeStatus(PaymentStatus.Refunded, clock.UtcNow);
        if (target is OrderStatus.Cancelled or OrderStatus.Refunded && previous is OrderStatus.Paid or OrderStatus.Processing)
            await inventory.CreditAsync(order.Id, cancellationToken);
        if (target == OrderStatus.Delivered || (target == OrderStatus.Shipped && order.Pickup is not null))
        {
            var deliveredCustomer = await customers.FindByIdAsync(order.CustomerId, cancellationToken)
                ?? throw new CommerceException("customer_not_found", "Cliente não encontrado.");
            emailOutbox.Enqueue(CreateConfirmationEmail(order, payment, deliveredCustomer, "pt"), clock.UtcNow);
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        if (synchronizeProjection)
        {
            var customer = await customers.FindByIdAsync(order.CustomerId, cancellationToken);
            try { await projection.UpsertAsync(order, customer, payment, cancellationToken); }
            catch { /* o estado já foi persistido e será reconciliado com o CMS */ }
        }
    }

    private async Task<(Domain.Customers.Customer Customer, Domain.Customers.CustomerAddress Address, ShoppingCart Cart)> Context(Guid customerId, Guid addressId, CancellationToken token,
        Guid? pickupLocationId = null, CheckoutContact? contact = null, string locale = "pt")
    {
        var customer = await customers.FindByIdAsync(customerId, token) ?? throw new CommerceException("customer_not_found", "Cliente não encontrado.");
        if (!customer.IsActive) throw new CommerceException("customer_unavailable", "Cliente indisponível.");
        Domain.Customers.CustomerAddress address;
        if (pickupLocationId.HasValue)
        {
            var store = await RequirePickup(customerId, pickupLocationId.Value, locale, token);
            var name = contact?.Name ?? customer.Name;
            var phone = contact?.Phone ?? customer.Phone;
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(phone))
                throw new CommerceException("contact_required", "Indique o nome e telefone para levantamento.");
            // Contact snapshot only: no home address is required or saved for store pickup.
            address = Domain.Customers.CustomerAddress.Create(customerId, "Levantamento", name, phone,
                store.Country, store.City, store.City, store.City, store.Address[..Math.Min(240, store.Address.Length)],
                null, null, null, false, clock.UtcNow);
        }
        else address = await addresses.FindAsync(customerId, addressId, token) ?? throw new CommerceException("address_not_found", "Morada não encontrada.");
        var cart = await carts.FindAsync(customerId, token) ?? throw new CommerceException("cart_empty", "O carrinho está vazio.");
        if (cart.Items.Count == 0) throw new CommerceException("cart_empty", "O carrinho está vazio.");
        return (customer, address, cart);
    }

    private async Task<CheckoutPreviewResult> BuildPreview(ShoppingCart cart, Guid addressId, string currency, string locale, CancellationToken token)
    {
        var normalized = Money.Create(0, currency).Currency;
        var items = new List<CheckoutItemResult>();
        foreach (var cartItem in cart.Items)
        {
            var product = await catalog.FindAsync(cartItem.ItemType, cartItem.Reference, locale, token)
                ?? throw new CommerceException("catalog_item_not_found", $"O item {cartItem.Reference.Value} deixou de existir.");
            CartService.ValidateItem(product, cartItem.VariantId, cartItem.Quantity);
            var unit = normalized == "EUR" ? product.EurPrice : product.AoaPrice;
            var components = new List<OrderComponentSnapshot>();
            foreach (var component in product.Components)
            {
                var included = await catalog.FindBySkuAsync(component.Sku, locale, token)
                    ?? throw new CommerceException("product_not_found", $"O produto {component.Sku.Value} deixou de existir.");
                components.Add(new(component.Sku.Value, included.Name, component.Quantity, included.ImageUrl));
            }
            items.Add(new(cartItem.ItemType.ToString().ToLowerInvariant(), cartItem.Reference.Value, product.Name, cartItem.VariantLabel, cartItem.Quantity, unit, unit * cartItem.Quantity, product.ImageUrl, components));
        }
        var subtotal = items.Sum(item => item.Total);
        const decimal shipping = 0;
        return new(addressId, normalized, subtotal, shipping, subtotal + shipping, items);
    }

    private async Task<IReadOnlyList<OrderResult>> MapMany(IReadOnlyList<Order> source,CancellationToken token){var result=new List<OrderResult>();foreach(var order in source)result.Add(await MapOne(order,token));return result;}
    private async Task<OrderResult> MapOne(Order order,CancellationToken token=default)=>Map(order,await payments.FindByOrderAsync(order.Id,token));
    private static OrderResult Map(Order order, Payment? payment = null) => new(order.Id, order.Number, order.CreatedAt,
        order.Status.ToString().ToLowerInvariant(), order.Currency, order.SubtotalAmount, order.ShippingAmount,
        order.TotalAmount, order.Items.Select(item => new CheckoutItemResult(item.ItemType.ToString().ToLowerInvariant(), item.Reference?.Value ?? string.Empty, item.ProductName,
            item.Variant, item.Quantity, item.UnitPriceAmount, item.UnitPriceAmount * item.Quantity, item.ImageUrl, item.Components)).ToArray(),
        new(order.Recipient, order.Phone, order.Country, order.Province, order.City, order.Neighborhood,
            order.Street, order.HouseNumber, order.Apartment, order.PostalCode),
        order.Timeline.OrderBy(item => item.OccurredAt).Select(item => new OrderTimelineResult(item.Status.ToString().ToLowerInvariant(), item.OccurredAt)).ToArray(),payment is null?null:new(payment.Provider,payment.Reference,payment.Status.ToString().ToLowerInvariant()), order.DiscountAmount, order.PromotionName, order.Pickup);

    private async Task<IReadOnlyList<InventoryRequest>> BuildInventoryRequests(Order order,string locale,CancellationToken token)
    {
        var totals = new Dictionary<string, InventoryRequest>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in order.Items)
        {
            IReadOnlyList<CatalogComponent> components;
            if (item.Components is { } snapshot)
                components = snapshot.Select(x => new CatalogComponent(Domain.Catalog.ProductSku.Create(x.Sku), x.Quantity)).ToArray();
            else
            {
                // Legacy orders have no composition snapshot.
                var entry = await catalog.FindAsync(item.ItemType, item.Reference, locale, token)
                    ?? throw new CommerceException("catalog_item_not_found", $"O item {item.Reference.Value} deixou de existir.");
                components = entry.Components;
            }
            foreach (var component in components)
            {
                var product = await catalog.FindBySkuAsync(component.Sku, locale, token)
                    ?? throw new CommerceException("product_not_found", $"O produto {component.Sku.Value} deixou de existir.");
                var quantity = checked(component.Quantity * item.Quantity);
                totals[component.Sku.Value] = totals.TryGetValue(component.Sku.Value, out var current)
                    ? current with { Quantity = checked(current.Quantity + quantity) }
                    : new(component.Sku.Value, quantity, product.Stock, order.Pickup?.LocationId);
            }
        }
        return totals.Values.ToArray();
    }

    private static OrderConfirmationEmail CreateConfirmationEmail(Order order, Payment payment,
        Domain.Customers.Customer customer, string locale) => new(
        order.Id, order.Number, customer.Email.Value, customer.Name, locale, order.CreatedAt,
        order.Status.ToString(), payment.Status.ToString(), order.Currency, order.SubtotalAmount,
        order.ShippingAmount, order.TotalAmount,
        order.Items.Select(item => new OrderConfirmationEmailItem(item.ProductName, item.Variant,
            item.Quantity, item.UnitPriceAmount, item.UnitPriceAmount * item.Quantity)).ToArray(),
        new(order.Recipient, order.Phone, order.Country, order.Province, order.City, order.Neighborhood,
            order.Street, order.HouseNumber, order.Apartment, order.PostalCode), order.Pickup);

    private static string NormalizeLocale(string locale) =>
        locale.StartsWith("fr", StringComparison.OrdinalIgnoreCase) ? "fr" : "pt";
}
