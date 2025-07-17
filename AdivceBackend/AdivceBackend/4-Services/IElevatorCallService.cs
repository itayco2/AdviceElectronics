using AdivceBackend.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace AdivceBackend.Services
{
    public interface IElevatorCallService
    {
        Task<ElevatorCallDto> CreateAsync(CreateElevatorCallDto dto);
        Task<IEnumerable<ElevatorCallDto>> GetAllForBuildingAsync(Guid buildingId);
        Task<IEnumerable<ElevatorCallAssignmentDto>> GetAssignmentsForCallAsync(Guid callId);
    }
} 