using System.Security.Cryptography;
using System.Text;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Authentication;

internal sealed class SecretHasher(string secret) : ISecretHasher
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(secret);

    public string Hash(string value)
    {
        var bytes = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    public bool Verify(string value, string hash)
    {
        byte[] expected;
        try
        {
            expected = Convert.FromHexString(hash);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(value));
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
