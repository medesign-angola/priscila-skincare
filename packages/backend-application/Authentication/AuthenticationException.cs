namespace PriscilaSkincare.Application.Authentication;

public sealed class AuthenticationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
