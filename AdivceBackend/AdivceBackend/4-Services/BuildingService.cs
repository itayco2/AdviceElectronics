using AdivceBackend.Models.DTOs;
using AdivceBackend.Models.EF;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AdivceBackend.Services
{
    // Service for managing buildings (CRUD operations for buildings)
    public class BuildingService : IBuildingService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public BuildingService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        public async Task<IEnumerable<BuildingDto>> GetAllForUserAsync(Guid userId)
        {
            var buildings = await _db.Buildings.Where(b => b.UserId == userId).ToListAsync();
            return _mapper.Map<IEnumerable<BuildingDto>>(buildings);
        }

        public async Task<BuildingDto> CreateAsync(CreateBuildingDto dto)
        {
            var building = new Building
            {
                UserId = dto.UserId,
                Name = dto.Name,
                NumberOfFloors = dto.NumberOfFloors
            };
            _db.Buildings.Add(building);
            await _db.SaveChangesAsync();
            return _mapper.Map<BuildingDto>(building);
        }

        public async Task<BuildingDto> GetByIdAsync(Guid id)
        {
            var building = await _db.Buildings.FindAsync(id);
            if (building == null) throw new KeyNotFoundException("הבניין לא נמצא");
            return _mapper.Map<BuildingDto>(building);
        }

        public async Task DeleteAsync(Guid id)
        {
            var building = await _db.Buildings.FindAsync(id);
            if (building == null) throw new KeyNotFoundException("הבניין לא נמצא");
            _db.Buildings.Remove(building);
            await _db.SaveChangesAsync();
        }
    }
} 