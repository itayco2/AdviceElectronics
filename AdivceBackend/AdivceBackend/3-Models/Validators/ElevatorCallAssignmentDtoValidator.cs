using FluentValidation;
using AdivceBackend.Models.DTOs;

namespace AdivceBackend.Models.Validators
{
    public class ElevatorCallAssignmentDtoValidator : AbstractValidator<ElevatorCallAssignmentDto>
    {
        public ElevatorCallAssignmentDtoValidator()
        {
            RuleFor(x => x.AssignmentTime).NotEmpty();
            RuleFor(x => x.ElevatorName).NotEmpty();
            RuleFor(x => x.ResponseTime).GreaterThanOrEqualTo(0);
            RuleFor(x => x.TravelTime).GreaterThanOrEqualTo(0);
        }
    }
} 