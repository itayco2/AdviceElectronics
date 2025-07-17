using FluentValidation;
using AdivceBackend.Models.DTOs;

namespace AdivceBackend.Models.Validators
{
    public class UserDtoValidator : AbstractValidator<UserDto>
    {
        public UserDtoValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
        }
    }
} 