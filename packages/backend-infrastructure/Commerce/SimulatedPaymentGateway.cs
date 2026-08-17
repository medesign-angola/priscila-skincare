using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Commerce;

internal sealed class SimulatedPaymentGateway : IPaymentGateway
{
    public Task<PaymentDecision> AuthorizeAsync(PaymentRequest request,CancellationToken token=default)
    {
        var reject=request.IdempotencyKey.Contains("reject",StringComparison.OrdinalIgnoreCase);
        return Task.FromResult(new PaymentDecision("simulated",$"SIM-{request.OrderId:N}".ToUpperInvariant(),!reject,reject?"simulated_rejection":null));
    }
}
