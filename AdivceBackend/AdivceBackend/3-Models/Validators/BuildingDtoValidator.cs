using FluentValidation;
using AdivceBackend.Models.DTOs;
using System;

namespace AdivceBackend.Models.Validators
{
    public class BuildingDtoValidator : AbstractValidator<BuildingDto>
    {
        public BuildingDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.NumberOfFloors).GreaterThan(0);
        }
    }

    public class CreateBuildingDtoValidator : AbstractValidator<CreateBuildingDto>
    {
        public CreateBuildingDtoValidator()
        {
            RuleFor(x => x.UserId).NotEqual(Guid.Empty);
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.NumberOfFloors).GreaterThan(0);
        }
    }
} 