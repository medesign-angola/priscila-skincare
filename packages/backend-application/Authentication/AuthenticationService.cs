using System.Text.Json;
using PriscilaSkincare.Application.Abstractions;
using PriscilaSkincare.Application.Integration;
using PriscilaSkincare.Domain.Authentication;
using PriscilaSkincare.Domain.Common;
using PriscilaSkincare.Domain.Customers;
using PriscilaSkincare.Domain.Integration;
using PriscilaSkincare.Domain.Orders;

namespace PriscilaSkincare.Application.Authentication;

public sealed class AuthenticationService(
    ICustomerRepository customers,
    IOtpChallengeRepository otpChallenges,
    IRefreshTokenRepository refreshTokens,
    IUnitOfWork unitOfWork,
    IClock clock,
    IOtpCodeGenerator otpCodeGenerator,
    ISecretHasher secretHasher,
    IOtpCodeProtector otpCodeProtector,
    IIntegrationOutbox integrationOutbox,
    IIntegrationInbox integrationInbox,
    ITokenService tokenService,
    ICustomerProjection customerProjection,
    ICustomerAddressRepository customerAddresses,
    IOrderRepository orders,
    IShoppingCartRepository carts,
    IPaymentRepository payments,
    IOrderProjection orderProjection,
    IOrderEmailOutbox emailOutbox,
    AuthenticationOptions options)
{
    public async Task<OtpRequestResult> RequestOtpAsync(
        RequestOtpCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = EmailAddress.Create(command.Email);
        var now = clock.UtcNow;
        var latest = await otpChallenges.FindLatestSentAsync(email, cancellationToken);

        if (latest is not null)
        {
            var retryAt = latest.SentAt!.Value.AddSeconds(options.ResendCooldownSeconds);
            if (retryAt > now)
            {
                throw new AuthenticationException(
                    "otp_resend_too_soon",
                    $"Aguarde {(int)Math.Ceiling((retryAt - now).TotalSeconds)} segundos antes de pedir outro código.");
            }
        }

        var pending = await otpChallenges.FindLatestPendingAsync(email, cancellationToken);
        if (pending is not null && pending.ExpiresAt > now)
            return new OtpRequestResult(pending.ExpiresAt, 0);
        pending?.MarkDeliveryFailed();

        var code = otpCodeGenerator.Generate();
        var lifetime = TimeSpan.FromMinutes(options.OtpLifetimeMinutes);
        var challenge = OtpChallenge.Create(email, secretHasher.Hash(code), now, lifetime);

        otpChallenges.Add(challenge);
        var notification = new OtpNotificationRequestedEvent(
            $"otp:{challenge.Id:N}", challenge.Id, email.Value, otpCodeProtector.Protect(code),
            NormalizeLocale(command.Locale), options.OtpLifetimeMinutes);
        integrationOutbox.Add(IntegrationOutboxMessage.Create(
            challenge.Id, "notification.otp.requested.v1", "notifications",
            JsonSerializer.Serialize(notification), now));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new OtpRequestResult(challenge.ExpiresAt, 0);
    }

    public async Task ApplyOtpDeliveryResultAsync(Guid eventId, OtpDeliveryResultEvent result,
        CancellationToken cancellationToken = default)
    {
        if (await integrationInbox.ContainsAsync(eventId, cancellationToken)) return;
        var challenge = await otpChallenges.FindByIdAsync(result.ChallengeId, cancellationToken)
            ?? throw new AuthenticationException("otp_not_found", "A solicitação do código não foi encontrada.");
        var status = result.Status.Trim().ToLowerInvariant();
        if (challenge.DeliveryStatus == OtpDeliveryStatus.Pending)
        {
            if (status == "sent")
                challenge.MarkSent(result.SentAt ?? clock.UtcNow,
                    TimeSpan.FromMinutes(options.OtpLifetimeMinutes));
            else if (status == "failed")
                challenge.MarkDeliveryFailed();
            else
                throw new AuthenticationException("otp_delivery_status_invalid",
                    "O resultado do envio do código é inválido.");
        }
        integrationInbox.Add(IntegrationInboxMessage.Receive(eventId,
            "notification.otp.delivery-result.v1", clock.UtcNow));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthenticationResult> VerifyOtpAsync(
        VerifyOtpCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = EmailAddress.Create(command.Email);
        var now = clock.UtcNow;
        var challenge = await otpChallenges.FindLatestSentAsync(email, cancellationToken);

        if (challenge is null || !challenge.IsUsableAt(now))
        {
            throw new AuthenticationException("otp_expired", "O código expirou ou já não pode ser utilizado.");
        }

        if (!secretHasher.Verify(command.Code, challenge.CodeHash))
        {
            challenge.RegisterFailedAttempt();
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new AuthenticationException("otp_invalid", "O código informado é inválido.");
        }

        challenge.Consume(now);
        var customer = await customers.FindByEmailAsync(email, cancellationToken);
        if (customer is null)
        {
            customer = Customer.Register(email, now);
            customers.Add(customer);
        }
        if (command.AcceptsMarketing && !customer.AcceptsMarketing)
        {
            customer.AcceptMarketing(now);
        }

        var issued = tokenService.Issue(customer.Id, customer.Email);
        AddRefreshToken(customer.Id, issued.RefreshToken, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await SynchronizeCustomerAsync(customer, cancellationToken);

        return new AuthenticationResult(customer.Id, issued.AccessToken, issued.RefreshToken, issued.ExpiresAt);
    }

    public async Task<AuthenticationResult> RefreshAsync(
        RefreshSessionCommand command,
        CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;
        var current = await refreshTokens.FindByHashAsync(secretHasher.Hash(command.RefreshToken), cancellationToken);
        if (current is null || !current.IsUsableAt(now))
        {
            throw new AuthenticationException("refresh_token_invalid", "A sessão expirou. Entre novamente.");
        }

        var customer = await customers.FindByIdAsync(current.CustomerId, cancellationToken);
        if (customer is null || !customer.IsActive)
        {
            throw new AuthenticationException("customer_unavailable", "A conta já não está disponível.");
        }

        current.Revoke(now);
        var issued = tokenService.Issue(customer.Id, customer.Email);
        AddRefreshToken(customer.Id, issued.RefreshToken, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await SynchronizeCustomerAsync(customer, cancellationToken);

        return new AuthenticationResult(customer.Id, issued.AccessToken, issued.RefreshToken, issued.ExpiresAt);
    }

    public async Task LogoutAsync(LogoutCommand command, CancellationToken cancellationToken = default)
    {
        var current = await refreshTokens.FindByHashAsync(secretHasher.Hash(command.RefreshToken), cancellationToken);
        if (current is null) return;

        current.Revoke(clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthenticatedCustomer?> GetCustomerAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await customers.FindByIdAsync(customerId, cancellationToken);
        return customer is null
            ? null
            : new AuthenticatedCustomer(customer.Id, customer.Email.Value, customer.Name, customer.Phone, customer.AcceptsMarketing);
    }

    public async Task<AuthenticatedCustomer> UpdateCustomerAsync(
        Guid customerId,
        string name,
        string? phone,
        CancellationToken cancellationToken = default)
    {
        var customer = await customers.FindByIdAsync(customerId, cancellationToken)
            ?? throw new AuthenticationException("customer_not_found", "Cliente não encontrado.");

        customer.UpdateProfile(name, phone, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await SynchronizeCustomerAsync(customer, cancellationToken);
        return new AuthenticatedCustomer(customer.Id, customer.Email.Value, customer.Name, customer.Phone, customer.AcceptsMarketing);
    }

    public async Task AnonymizeCustomerAsync(Guid customerId, string confirmation, CancellationToken cancellationToken = default)
    {
        var customer = await customers.FindByIdAsync(customerId, cancellationToken)
            ?? throw new AuthenticationException("customer_not_found", "Cliente não encontrado.");
        if (!customer.IsActive) return;
        if (!string.Equals(customer.Email.Value, confirmation?.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new AuthenticationException("account_deletion_confirmation_required",
                "Digite o e-mail da conta para confirmar a eliminação.");

        var customerOrders = await orders.ListAsync(customerId, cancellationToken);
        var activeStatuses = new[]
        {
            OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Paid,
            OrderStatus.PaymentFailed, OrderStatus.Processing, OrderStatus.Shipped
        };
        if (customerOrders.Any(order => activeStatuses.Contains(order.Status)))
            throw new AuthenticationException("active_orders_exist",
                "A conta não pode ser eliminada enquanto existir uma encomenda ativa.");

        var now = clock.UtcNow;
        var originalEmail = customer.Email;
        var addresses = await customerAddresses.ListAsync(customerId, cancellationToken);
        foreach (var address in addresses) customerAddresses.Remove(address);

        var cart = await carts.FindAsync(customerId, cancellationToken);
        cart?.Clear(now);
        foreach (var order in customerOrders)
            order.PreserveCustomerHistory(customer.Name, originalEmail.Value, now);
        await emailOutbox.RemovePersonalDataAsync(customerOrders.Select(order => order.Id).ToArray(), cancellationToken);
        await otpChallenges.RemoveAllAsync(originalEmail, cancellationToken);
        await integrationOutbox.RemovePersonalDataAsync(originalEmail.Value, cancellationToken);
        await refreshTokens.RevokeAllAsync(customerId, now, cancellationToken);
        customer.Anonymize(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var order in customerOrders)
        {
            try
            {
                var payment = await payments.FindByOrderAsync(order.Id, cancellationToken);
                // A encomenda deixa de apontar ao perfil eliminado, mas mantém os
                // snapshots necessários para o histórico comercial.
                await orderProjection.UpsertAsync(order, null, payment, cancellationToken);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) { }
            catch { /* a anonimização local prevalece e a projeção pode ser reconciliada */ }
        }
        try
        {
            // Só removemos o espelho administrativo depois de todas as relações
            // das encomendas terem sido desligadas no CMS.
            await customerProjection.DeleteAsync(customerId, cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) { }
        catch { /* o perfil local já está anonimizado; a remoção no CMS será reconciliada */ }
    }

    private async Task SynchronizeCustomerAsync(Customer customer, CancellationToken cancellationToken)
    {
        try
        {
            await customerProjection.UpsertAsync(customer, cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // O Strapi administrativo não deve impedir a autenticação do cliente.
        }
        catch
        {
            // A API transacional continua sendo a fonte oficial e pode sincronizar novamente depois.
        }
    }

    private void AddRefreshToken(Guid customerId, string token, DateTimeOffset now)
    {
        refreshTokens.Add(RefreshToken.Issue(
            customerId,
            secretHasher.Hash(token),
            now,
            TimeSpan.FromDays(options.RefreshTokenDays)));
    }

    private static string NormalizeLocale(string? locale) =>
        string.Equals(locale, "fr", StringComparison.OrdinalIgnoreCase) ? "fr" : "pt";
}
