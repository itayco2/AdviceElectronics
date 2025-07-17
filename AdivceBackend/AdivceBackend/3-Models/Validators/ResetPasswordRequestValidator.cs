using FluentValidation;
using AdivceBackend.Models.DTOs;

namespace AdivceBackend.Models.Validators
{
    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Token).NotEmpty();
            IRuleBuilderOptions<ResetPasswordRequest, string> ruleBuilderOptions = RuleFor(x => x.NewPassword)
                .NotEmpty()
                .MinimumLength(8)
                .Matches("[A-Z]").WithMessage("הסיסמה חייבת להכיל לפחות אות גדולה אחת.")
                .Matches("[a-z]").WithMessage("הסיסמה חייבת להכיל לפחות אות קטנה אחת.")
                .Matches("[0-9]").WithMessage("הסיסמה חייבת להכיל לפחות ספרה אחת.")
                .Matches(@"[!@#$%^&*(),.?""{}|<>[\]\\/'`~_-]").WithMessage("הסיסמה חייבת להכיל לפחות תו מיוחד אחד.");

        }
    }
} 