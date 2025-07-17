using AutoMapper;
using AdivceBackend.Models.EF;
using AdivceBackend.Models.DTOs;
using System.Linq;

namespace AdivceBackend.Utils
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<Building, BuildingDto>();
            CreateMap<Elevator, ElevatorDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.Direction, opt => opt.MapFrom(src => src.Direction.ToString()))
                .ForMember(dest => dest.DoorStatus, opt => opt.MapFrom(src => src.DoorStatus.ToString()))
                .ForMember(dest => dest.EfficiencyScore, opt => opt.MapFrom(src => src.TotalDistance > 0 ? (src.CurrentLoad / src.TotalDistance) : 0))
                .ForMember(dest => dest.ActiveCalls, opt => opt.MapFrom(src => src.ElevatorCallAssignments != null ? src.ElevatorCallAssignments.Count(a => a.DropoffTime == null) : 0));
            CreateMap<ElevatorCall, ElevatorCallDto>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
                .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
                .ForMember(dest => dest.WaitTime, opt => opt.MapFrom(src => src.CompletionTime.HasValue ? (src.CompletionTime.Value - src.CallTime).TotalSeconds : 0))
                .ForMember(dest => dest.AssignedElevatorId, opt => opt.MapFrom(src => src.ElevatorCallAssignments != null && src.ElevatorCallAssignments.Any() ? src.ElevatorCallAssignments.First().ElevatorId : (Guid?)null))
                .ForMember(dest => dest.AssignedElevatorName, opt => opt.MapFrom(src => src.ElevatorCallAssignments != null && src.ElevatorCallAssignments.Any() && src.ElevatorCallAssignments.First().Elevator != null ? src.ElevatorCallAssignments.First().Elevator.Name : null));
            CreateMap<ElevatorCallAssignment, ElevatorCallAssignmentDto>()
                .ForMember(dest => dest.ElevatorName, opt => opt.MapFrom(src => src.Elevator != null ? src.Elevator.Name : null))
                .ForMember(dest => dest.ResponseTime, opt => opt.MapFrom(src => src.PickupTime.HasValue ? (src.PickupTime.Value - src.AssignmentTime).TotalSeconds : 0))
                .ForMember(dest => dest.TravelTime, opt => opt.MapFrom(src => src.PickupTime.HasValue && src.DropoffTime.HasValue ? (src.DropoffTime.Value - src.PickupTime.Value).TotalSeconds : 0));
        }
    }
} 