using FluentValidation;
using AdivceBackend.Models.DTOs;

namespace AdivceBackend.Models.Validators
{
    public class ElevatorDtoValidator : AbstractValidator<ElevatorDto>
    {
        public ElevatorDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.CurrentFloor).GreaterThanOrEqualTo(x => x.MinFloor);
            RuleFor(x => x.MinFloor).LessThanOrEqualTo(x => x.MaxFloor);
            RuleFor(x => x.MaxFloor).GreaterThanOrEqualTo(x => x.MinFloor);
            RuleFor(x => x.Status).NotEmpty();
            RuleFor(x => x.Direction).NotEmpty();
            RuleFor(x => x.DoorStatus).NotEmpty();
            RuleFor(x => x.Capacity).GreaterThan(0);
            RuleFor(x => x.CurrentLoad).GreaterThanOrEqualTo(0).LessThanOrEqualTo(x => x.Capacity);
            RuleFor(x => x.EfficiencyScore).GreaterThanOrEqualTo(0);
            RuleFor(x => x.ActiveCalls).GreaterThanOrEqualTo(0);
        }
    }

    public class CreateElevatorDtoValidator : AbstractValidator<CreateElevatorDto>
    {
        public CreateElevatorDtoValidator()
        {
            RuleFor(x => x.BuildingId).NotEqual(Guid.Empty);
            RuleFor(x => x.CurrentFloor).GreaterThanOrEqualTo(0).When(x => x.CurrentFloor.HasValue);
            RuleFor(x => x.Status).NotEmpty();
            RuleFor(x => x.Direction).NotEmpty();
            RuleFor(x => x.DoorStatus).NotEmpty();
        }
    }
} 