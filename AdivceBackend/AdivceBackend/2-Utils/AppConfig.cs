using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace AdivceBackend.Utils
{
    public static class AppConfig
    {
        public static bool IsDevelopment { get; private set; }
        public static bool IsProduction { get; private set; }
        public static string ConnectionString { get; private set; } = null!;
        public static string JwtKey { get; private set; } = "SuperSecretKey1234567890!@#$%^&*()";
        public static int JwtExpireHours { get; private set; }

        public static void Configure(IWebHostEnvironment env, IConfiguration config)
        {
            IsDevelopment = env.IsDevelopment();
            IsProduction = env.IsProduction();
            ConnectionString = config.GetConnectionString("AdviceDb")!;
            JwtExpireHours = IsDevelopment ? 5 : 1;
            JwtKey = config["JwtKey"] ?? JwtKey;
        }
    }
} 