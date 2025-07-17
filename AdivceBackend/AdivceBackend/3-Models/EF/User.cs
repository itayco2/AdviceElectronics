using System.ComponentModel.DataAnnotations;

namespace AdivceBackend.Models.EF
{
    public enum UserRole { Admin, User }
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public byte[] PasswordHash { get; set; }
        [Required]
        public byte[] PasswordSalt { get; set; }
        [Required]
        public UserRole Role { get; set; } = UserRole.User;
        public User() { Id = Guid.NewGuid(); }
    }
} 