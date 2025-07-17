using AdivceBackend.Models.DTOs;
using System.Threading.Tasks;

namespace AdivceBackend.Services
{
    public interface IUserService
    {
        Task<UserDto> RegisterAsync(RegisterDto dto);
        Task<string> LoginAsync(LoginDto dto);
        Task<UserDto> GetByIdAsync(Guid id);
        Task ForgotPasswordAsync(ForgotPasswordRequest request);
        Task ResetPasswordAsync(ResetPasswordRequest request);
        Task DeleteUserAsync(Guid id);
        Task<IEnumerable<UserDto>> GetAllAsync();
    }
} 