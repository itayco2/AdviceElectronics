using Microsoft.EntityFrameworkCore;
using AdivceBackend.Models.EF;
using System.Security.Cryptography;
using System.Text;

namespace AdivceBackend.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger>();

                try
                {
                    // Apply migrations
                    await context.Database.MigrateAsync();

                    // The admin user is created via EF Core data seeding in OnModelCreating
                    // Here we can add additional runtime seeding if needed

                    // Check if we need to add test data
                    if (!await context.Users.AnyAsync(u => u.Email == "user@gmail.com"))
                    {
                        await SeedTestDataAsync(context);
                        logger.LogInformation("הנתונים נזרעו בהצלחה.");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "אירעה שגיאה בעת זריעת הנתונים.");
                    throw;
                }
            }
        }

        private static async Task SeedTestDataAsync(ApplicationDbContext context)
        {
            // Create test user
            var testUser = CreateUser("user@gmail.com", "User123!", UserRole.User);
            context.Users.Add(testUser);

            // Create test building
            var testBuilding = new Building
            {
                Id = Guid.NewGuid(),
                Name = "Test Building",
                NumberOfFloors = 10
            };
            context.Buildings.Add(testBuilding);

            // Create test elevators
            var elevators = new List<Elevator>
            {
                new Elevator
                {
                    Id = Guid.NewGuid(),
                    BuildingId = testBuilding.Id,
                    Name = "Elevator A",
                    CurrentFloor = 1,
                    MinFloor = 1,
                    MaxFloor = 10,
                    Status = ElevatorStatus.Idle,
                    Direction = ElevatorDirection.None,
                    DoorStatus = DoorStatus.Closed
                },
                new Elevator
                {
                    Id = Guid.NewGuid(),
                    BuildingId = testBuilding.Id,
                    Name = "Elevator B",
                    CurrentFloor = 5,
                    MinFloor = 1,
                    MaxFloor = 10,
                    Status = ElevatorStatus.Idle,
                    Direction = ElevatorDirection.None,
                    DoorStatus = DoorStatus.Closed
                }
            };

            context.Elevators.AddRange(elevators);
            await context.SaveChangesAsync();
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