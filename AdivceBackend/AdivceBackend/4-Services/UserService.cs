using AdivceBackend.Models.DTOs;
using AdivceBackend.Models.EF;
using AdivceBackend.Utils;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Concurrent;

namespace AdivceBackend.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        // In-memory store for reset tokens (for demo)
        private static readonly ConcurrentDictionary<string, string> _resetTokens = new(); // email -> token
        private static readonly TimeSpan _tokenExpiry = TimeSpan.FromMinutes(15);
        private static readonly ConcurrentDictionary<string, DateTime> _tokenTimestamps = new();

        public UserService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // Registers a new user. The first user with admin@gmail.com is assigned the Admin role.
        public async Task<UserDto> RegisterAsync(RegisterDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("אימייל קיים כבר במערכת");

            using var hmac = new HMACSHA512();
            var user = new User
            {
                Email = dto.Email,
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password)),
                PasswordSalt = hmac.Key,
                Role = dto.Email.ToLower() == "admin@gmail.com" ? UserRole.Admin : UserRole.User
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }

        // Authenticates a user by verifying the password hash.
        public async Task<string> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                throw new InvalidOperationException("אימייל או סיסמה שגויים");

            using var hmac = new HMACSHA512(user.PasswordSalt);
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));
            if (!computedHash.SequenceEqual(user.PasswordHash))
                throw new InvalidOperationException("אימייל או סיסמה שגויים");

            return JwtHelper.GetNewToken(user);
        }

        public async Task<UserDto> GetByIdAsync(Guid id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) throw new KeyNotFoundException("המשתמש לא נמצא");
            return _mapper.Map<UserDto>(user);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _db.Users.ToListAsync();
            return users.Select(u => _mapper.Map<UserDto>(u));
        }

        // In-memory password reset token system for demo purposes only (not production-safe).
        public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return; // Don't reveal if user exists
            // Generate token
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            _resetTokens[user.Email] = token;
            _tokenTimestamps[user.Email] = DateTime.UtcNow;
            // For demo: log token to console (in real app, send email)
        }

        // In-memory password reset token system for demo purposes only (not production-safe).
        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            if (!_resetTokens.TryGetValue(request.Email, out var token) || token != request.Token)
                throw new InvalidOperationException("אסימון איפוס שגוי או שפג תוקפו.");
            if (_tokenTimestamps.TryGetValue(request.Email, out var ts))
            {
                if (DateTime.UtcNow - ts > _tokenExpiry)
                {
                    _resetTokens.TryRemove(request.Email, out _);
                    _tokenTimestamps.TryRemove(request.Email, out _);
                    throw new InvalidOperationException("פג תוקף אסימון האיפוס.");
                }
            }
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) throw new InvalidOperationException("המשתמש לא נמצא.");
            using var hmac = new HMACSHA512();
            user.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.NewPassword));
            user.PasswordSalt = hmac.Key;
            await _db.SaveChangesAsync();
            _resetTokens.TryRemove(request.Email, out _);
            _tokenTimestamps.TryRemove(request.Email, out _);
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) throw new KeyNotFoundException("המשתמש לא נמצא");
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }
} 