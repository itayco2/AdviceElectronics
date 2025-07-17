using FluentValidation;
using AdivceBackend.Models.DTOs;
using System;

namespace AdivceBackend.Models.Validators
{
    public class ElevatorCallDtoValidator : AbstractValidator<ElevatorCallDto>
    {
        public ElevatorCallDtoValidator()
        {
            RuleFor(x => x.RequestedFloor).GreaterThanOrEqualTo(0);
            RuleFor(x => x.CallTime).NotEmpty();
            RuleFor(x => x.Type).NotEmpty();
            RuleFor(x => x.Priority).NotEmpty();
            RuleFor(x => x.PassengerCount).GreaterThan(0);
            RuleFor(x => x.WaitTime).GreaterThanOrEqualTo(0);
        }
    }

    public class CreateElevatorCallDtoValidator : AbstractValidator<CreateElevatorCallDto>
    {
        public CreateElevatorCallDtoValidator()
        {
            RuleFor(x => x.BuildingId).NotEqual(Guid.Empty);
            RuleFor(x => x.RequestedFloor).GreaterThanOrEqualTo(0);
            RuleFor(x => x.DestinationFloor).GreaterThanOrEqualTo(0).When(x => x.DestinationFloor.HasValue);
            RuleFor(x => x.Type).IsInEnum();
            RuleFor(x => x.Priority).IsInEnum();
            RuleFor(x => x.PassengerCount).GreaterThan(0);
        }
    }
} 