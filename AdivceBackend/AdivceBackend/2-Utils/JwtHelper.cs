using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AdivceBackend.Models.EF;

namespace AdivceBackend.Utils
{
    public static class JwtHelper
    {
        private static readonly JwtSecurityTokenHandler _handler = new JwtSecurityTokenHandler();
        private static readonly SymmetricSecurityKey _symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AppConfig.JwtKey));

        public static string GetNewToken(User user)
        {
            var userObject = new Dictionary<string, object>
            {
                { "id", user.Id.ToString() },
                { "email", user.Email }
            };

            var claims = new List<Claim> {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()), // Add role claim
                new Claim("role", user.Role.ToString()) // Add as 'role' for compatibility
            };

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(AppConfig.JwtExpireHours),
                SigningCredentials = new SigningCredentials(_symmetricSecurityKey, SecurityAlgorithms.HmacSha512),
                Claims = new Dictionary<string, object> { { "user", userObject }, { "role", user.Role.ToString() } } // Add role to payload
            };

            var securityToken = _handler.CreateToken(descriptor);
            return _handler.WriteToken(securityToken);
        }

        public static void SetBearerOptions(JwtBearerOptions options)
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _symmetricSecurityKey
            };
        }
    }
} 