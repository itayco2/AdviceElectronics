using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using AdivceBackend.Models.EF;
using AdivceBackend.Utils;
using AdivceBackend.Services;
using FluentValidation.AspNetCore;
using FluentValidation;
using AutoMapper;
using AdivceBackend.Middleware;
using System.Security.Cryptography;
using System.Text;

namespace AdivceBackend
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Suppress EF Core info-level logs (show only warnings and errors)
            builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);

            // AppConfig
            AppConfig.Configure(builder.Environment, builder.Configuration);

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:8080", "http://localhost:3000", "http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // DbContext
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(AppConfig.ConnectionString));

            // AutoMapper
            builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

            // FluentValidation
            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddValidatorsFromAssemblyContaining<Program>();

            // SignalR
            builder.Services.AddSignalR();

            // JWT Authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options => JwtHelper.SetBearerOptions(options));

            // Services
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IBuildingService, BuildingService>();
            builder.Services.AddScoped<IElevatorService, ElevatorService>();
            builder.Services.AddScoped<IElevatorCallService, ElevatorCallService>();
            // ElevatorSimulationService as hosted service only
            builder.Services.AddHostedService<ElevatorSimulationService>();

            var app = builder.Build();

            // Initialize database and seed data
            await InitializeDatabase(app);

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();

            // Use CORS before HTTPS redirection
            app.UseCors("AllowFrontend");

            // Only redirect to HTTPS in production
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<ErrorHandlingMiddleware>();

            app.MapControllers();
            app.MapHub<ElevatorHub>("/elevatorHub");

            await app.RunAsync();
        }

        private static async Task InitializeDatabase(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();

                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();

                    // Apply any pending migrations
                    await context.Database.MigrateAsync();

                    // Seed the database with additional data if needed
                    await SeedDatabase(context, logger);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "אירעה שגיאה בעת אתחול מסד הנתונים.");
                }
            }
        }

        private static async Task SeedDatabase(ApplicationDbContext context, ILogger logger)
        {
            // Check if we need to create a test user (admin is created via migrations)
            if (!await context.Users.AnyAsync(u => u.Email == "user@gmail.com"))
            {
                var testUser = CreateUser("user@gmail.com", "User123!", UserRole.User);
                context.Users.Add(testUser);
                await context.SaveChangesAsync();
                logger.LogInformation("Test user created successfully.");
            }

            // You can add more seeding logic here for Buildings, Elevators, etc.
        }

        private static User CreateUser(string email, string password, UserRole role)
        {
            using (var hmac = new HMACSHA512())
            {
                return new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    PasswordSalt = hmac.Key,
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password)),
                    Role = role
                };
            }
        }
    }
}