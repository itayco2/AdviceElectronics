namespace AdivceBackend.Models.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }

        public UserDto()
        {
            Email = string.Empty;
            Role = string.Empty;
        }
    }

    public class RegisterDto
    {
        public string Email { get; set; }
        public string Password { get; set; }

        public RegisterDto()
        {
            Email = string.Empty;
            Password = string.Empty;
        }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }

        public LoginDto()
        {
            Email = string.Empty;
            Password = string.Empty;
        }
    }
} 