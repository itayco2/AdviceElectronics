using AdivceBackend.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace AdivceBackend.Services
{
    public interface IBuildingService
    {
        Task<IEnumerable<BuildingDto>> GetAllForUserAsync(Guid userId);
        Task<BuildingDto> CreateAsync(CreateBuildingDto dto);
        Task<BuildingDto> GetByIdAsync(Guid id);
        Task DeleteAsync(Guid id);
    }
} 