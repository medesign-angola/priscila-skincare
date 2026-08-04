using System.Security.Cryptography;
using PriscilaSkincare.Application.Abstractions;

namespace PriscilaSkincare.Infrastructure.Authentication;

internal sealed class OtpCodeGenerator : IOtpCodeGenerator
{
    public string Generate() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
}
