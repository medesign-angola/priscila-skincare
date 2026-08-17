using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Application.Orders;

public sealed class OrderService(IOrderRepository orders, IShoppingCartRepository carts,
    ICustomerRepository customers, ICustomerAddressRepository addresses, ICatalogGateway catalog,
    IOrderProjection projection, IPaymentRepository payments, IPaymentGateway paymentGateway,
    IInventoryService inventory, IUnitOfWork unitOfWork, IClock clock)
{
    public async Task<CheckoutPreviewResult> PreviewAsync(Guid customerId, CheckoutPreviewRequest request, CancellationToken cancellationToken = default)
    {
        var (_, address, cart) = await Context(customerId, request.AddressId, cancellationToken);
        return await BuildPreview(cart, address.Id, request.Currency, request.Locale, cancellationToken);
    }

    public async Task<OrderResult> CreateAsync(Guid customerId, CreateOrderCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.IdempotencyKey)) throw new CommerceException("idempotency_required", "Não foi possível identificar a confirmação.");
        var existing = await orders.FindByIdempotencyKeyAsync(customerId, command.IdempotencyKey, cancellationToken);
        if (existing is not null) return await MapOne(existing, cancellationToken);
        var (customer, address, cart) = await Context(customerId, command.AddressId, cancellationToken);
        var preview = await BuildPreview(cart, address.Id, command.Currency, command.Locale, cancellationToken);
        var now = clock.UtcNow;
        var order = Order.Create(customerId, $"PSC-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            preview.Currency, new(address.Recipient, address.Phone, address.Country, address.Province, address.City,
                address.Neighborhood, address.Street, address.HouseNumber, address.Apartment, address.PostalCode), now, command.IdempotencyKey);
        foreach (var item in preview.Items)
            order.AddItem(CartService.ParseType(item.ItemType), CommerceItemReference.Create(item.Reference), item.ProductName, item.Variant,
                Money.Create(item.UnitPrice, preview.Currency), item.Quantity, item.ImageUrl);
        order.SetShipping(Money.Create(preview.Shipping, preview.Currency));
        var stockRequests = await BuildInventoryRequests(order, command.Locale, cancellationToken);
        await inventory.ValidateAsync(stockRequests, cancellationToken);
        var decision = await paymentGateway.AuthorizeAsync(new(order.Id, Money.Create(order.TotalAmount, order.Currency), command.IdempotencyKey), cancellationToken);
        var payment = Payment.Create(order.Id, decision.Provider, decision.Reference, Money.Create(order.TotalAmount, order.Currency), now);
        orders.Add(order);
        payments.Add(payment);
        if (decision.Approved) { await inventory.DebitAsync(order.Id, stockRequests, cancellationToken); payment.ChangeStatus(PaymentStatus.Approved, now); order.ChangeStatus(OrderStatus.Confirmed, now); order.ChangeStatus(OrderStatus.Paid, now); cart.Clear(now); }
        else { payment.ChangeStatus(PaymentStatus.Rejected, now); order.ChangeStatus(OrderStatus.PaymentFailed, now); }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        try
        {
            var documentId = await projection.UpsertAsync(order, customer, cancellationToken);
            if (!string.IsNullOrWhiteSpace(documentId)) { order.MarkProjected(documentId); await unitOfWork.SaveChangesAsync(cancellationToken); }
        }
        catch { /* a encomenda local não pode ser descartada por indisponibilidade do painel */ }
        return Map(order, payment);
    }

    public async Task<IReadOnlyList<OrderResult>> ListAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        await MapMany(await orders.ListAsync(customerId, cancellationToken), cancellationToken);

    public async Task<OrderResult> FindAsync(Guid customerId, Guid orderId, CancellationToken cancellationToken = default) =>
        await MapOne(await orders.FindByIdAsync(customerId, orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada."));

    public async Task ChangeStatusAsync(Guid orderId, string status, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<OrderStatus>(status, true, out var target))
            throw new CommerceException("invalid_order_status", "Estado da encomenda inválido.");
        var order = await orders.FindByIdAsync(orderId, cancellationToken)
            ?? throw new CommerceException("order_not_found", "Encomenda não encontrada.");
        var previous = order.Status;
        order.ChangeStatus(target, clock.UtcNow);
        if (target is OrderStatus.Cancelled or OrderStatus.Refunded && previous is OrderStatus.Paid or OrderStatus.Processing)
            await inventory.CreditAsync(order.Id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var customer = await customers.FindByIdAsync(order.CustomerId, cancellationToken);
        if (customer is not null) await projection.UpsertAsync(order, customer, cancellationToken);
    }

    private async Task<(Domain.Customers.Customer Customer, Domain.Customers.CustomerAddress Address, ShoppingCart Cart)> Context(Guid customerId, Guid addressId, CancellationToken token)
    {
        var customer = await customers.FindByIdAsync(customerId, token) ?? throw new CommerceException("customer_not_found", "Cliente não encontrado.");
        var address = await addresses.FindAsync(customerId, addressId, token) ?? throw new CommerceException("address_not_found", "Morada não encontrada.");
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
            items.Add(new(cartItem.ItemType.ToString().ToLowerInvariant(), cartItem.Reference.Value, product.Name, cartItem.VariantLabel, cartItem.Quantity, unit, unit * cartItem.Quantity, product.ImageUrl));
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
            item.Variant, item.Quantity, item.UnitPriceAmount, item.UnitPriceAmount * item.Quantity, item.ImageUrl)).ToArray(),
        new(order.Recipient, order.Phone, order.Country, order.Province, order.City, order.Neighborhood,
            order.Street, order.HouseNumber, order.Apartment, order.PostalCode),
        order.Timeline.OrderBy(item => item.OccurredAt).Select(item => new OrderTimelineResult(item.Status.ToString().ToLowerInvariant(), item.OccurredAt)).ToArray(),payment is null?null:new(payment.Provider,payment.Reference,payment.Status.ToString().ToLowerInvariant()));

    private async Task<IReadOnlyList<InventoryRequest>> BuildInventoryRequests(Order order,string locale,CancellationToken token)
    {var totals=new Dictionary<string,InventoryRequest>(StringComparer.OrdinalIgnoreCase);foreach(var item in order.Items){var entry=await catalog.FindAsync(item.ItemType,item.Reference,locale,token)??throw new CommerceException("catalog_item_not_found",$"O item {item.Reference.Value} deixou de existir.");foreach(var component in entry.Components){var product=await catalog.FindBySkuAsync(component.Sku,locale,token)??throw new CommerceException("product_not_found",$"O produto {component.Sku.Value} deixou de existir.");var quantity=component.Quantity*item.Quantity;totals[component.Sku.Value]=totals.TryGetValue(component.Sku.Value,out var current)?current with{Quantity=current.Quantity+quantity}:new(component.Sku.Value,quantity,product.Stock);}}return totals.Values.ToArray();}
}
