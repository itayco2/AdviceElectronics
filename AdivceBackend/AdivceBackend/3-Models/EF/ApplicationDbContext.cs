using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace AdivceBackend.Models.EF
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Elevator> Elevators { get; set; }
        public DbSet<ElevatorCall> ElevatorCalls { get; set; }
        public DbSet<ElevatorCallAssignment> ElevatorCallAssignments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Elevator configurations
            modelBuilder.Entity<Elevator>()
                .Property(e => e.Status)
                .HasConversion<string>();
            modelBuilder.Entity<Elevator>()
                .Property(e => e.Direction)
                .HasConversion<string>();
            modelBuilder.Entity<Elevator>()
                .Property(e => e.DoorStatus)
                .HasConversion<string>();

            // ElevatorCallAssignment configurations
            modelBuilder.Entity<ElevatorCallAssignment>()
                .HasOne(e => e.Elevator)
                .WithMany(e => e.ElevatorCallAssignments)
                .HasForeignKey(e => e.ElevatorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ElevatorCallAssignment>()
                .HasOne(e => e.ElevatorCall)
                .WithMany(e => e.ElevatorCallAssignments)
                .HasForeignKey(e => e.ElevatorCallId)
                .OnDelete(DeleteBehavior.Cascade);

            // User configuration
            modelBuilder.Entity<User>()
                .Property(e => e.Role)
                .HasConversion<string>();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Removed SeedAdminUser and all initial data seeding. No HasData calls remain.
        }
    }
}