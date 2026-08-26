using PriscilaSkincare.Domain.Notifications;

namespace PriscilaSkincare.Api.Tests.Domain;

public sealed class EmailOutboxMessageTests
{
    [Fact]
    public void ScheduleRetry_UsesProgressiveDelayAndEventuallyFails()
    {
        var now = DateTimeOffset.UtcNow;
        var message = EmailOutboxMessage.Create("order-confirmation", Guid.NewGuid(),
            "cliente@example.com", "{}", now);

        message.ScheduleRetry("SMTP indisponível", now, 3);
        Assert.Equal(EmailOutboxStatus.Pending, message.Status);
        Assert.Equal(now.AddMinutes(1), message.NextAttemptAt);

        message.ScheduleRetry("SMTP indisponível", now, 3);
        Assert.Equal(now.AddMinutes(5), message.NextAttemptAt);

        message.ScheduleRetry("SMTP indisponível", now, 3);
        Assert.Equal(EmailOutboxStatus.Failed, message.Status);
        Assert.Equal(3, message.Attempts);
    }

    [Fact]
    public void MarkSent_ClosesTheMessage()
    {
        var now = DateTimeOffset.UtcNow;
        var message = EmailOutboxMessage.Create("order-confirmation", Guid.NewGuid(),
            "cliente@example.com", "{}", now);

        message.MarkSent(now.AddSeconds(2));

        Assert.Equal(EmailOutboxStatus.Sent, message.Status);
        Assert.Equal(now.AddSeconds(2), message.SentAt);
        Assert.Null(message.LastError);
    }
}
