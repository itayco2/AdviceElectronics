using AdivceBackend.Models.DTOs;
using FluentValidation;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("כתובת אימייל נדרשת.")
            .EmailAddress()
            .WithMessage("כתובת אימייל לא תקינה.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("סיסמה נדרשת.")
            .MinimumLength(8)
            .WithMessage("הסיסמה חייבת להכיל לפחות 8 תווים.")
            .Matches("[A-Z]")
            .WithMessage("הסיסמה חייבת להכיל לפחות אות גדולה אחת.")
            .Matches("[a-z]")
            .WithMessage("הסיסמה חייבת להכיל לפחות אות קטנה אחת.")
            .Matches("[0-9]")
            .WithMessage("הסיסמה חייבת להכיל לפחות ספרה אחת.")
            .Matches(@"[!@#$%^&*(),.?\""{}|<>\[\]\\/'`~_=+;-]")
            .WithMessage("הסיסמה חייבת להכיל לפחות תו מיוחד אחת.");
    }
}
