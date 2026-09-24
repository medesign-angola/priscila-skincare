using System.Security.Cryptography;
using System.Text;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Email;

internal sealed class OtpCodeProtector(NotificationServiceOptions options) : IOtpCodeProtector
{
    public string Protect(string code)
    {
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(options.InternalApiKey));
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plaintext = Encoding.UTF8.GetBytes(code);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(key, tag.Length);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);
        var payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, nonce.Length + tag.Length, ciphertext.Length);
        return $"v1.{Convert.ToBase64String(payload)}";
    }
}
