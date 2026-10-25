namespace ETrental.Infrastructure.Security;

/// <summary>
/// Resolved JWT configuration. The secret is resolved once at start up so that
/// authentication and token generation always use the exact same signing key.
/// </summary>
public class JwtOptions
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "ETrentalAPI";
    public string Audience { get; set; } = "ETrentalClient";
    public int ExpirationMinutes { get; set; } = 120;
}
