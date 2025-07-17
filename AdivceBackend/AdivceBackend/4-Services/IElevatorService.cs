using AdivceBackend.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace AdivceBackend.Services
{
    public interface IElevatorService
    {
        Task<IEnumerable<ElevatorDto>> GetAllForBuildingAsync(Guid buildingId);
        Task<ElevatorDto> GetByIdAsync(Guid id);
        Task UpdateStatusAsync(Guid id, ElevatorDto dto);
        Task<ElevatorDto> CreateAsync(CreateElevatorDto dto);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<ElevatorDto>> GetAllForUserAsync(Guid userId);
    }
} 