using AdivceBackend.Models.DTOs;
using AdivceBackend.Models.EF;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace AdivceBackend.Services
{
    public class ElevatorService : IElevatorService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public ElevatorService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ElevatorDto>> GetAllForBuildingAsync(Guid buildingId)
        {
            var elevators = await _db.Elevators.Where(e => e.BuildingId == buildingId).ToListAsync();
            return _mapper.Map<IEnumerable<ElevatorDto>>(elevators);
        }

        public async Task<ElevatorDto> GetByIdAsync(Guid id)
        {
            var elevator = await _db.Elevators.FindAsync(id);
            if (elevator == null) throw new KeyNotFoundException("המעלית לא נמצאה");
            return _mapper.Map<ElevatorDto>(elevator);
        }

        public async Task<IEnumerable<ElevatorDto>> GetAllForUserAsync(Guid userId)
        {
            var buildingIds = await _db.Buildings.Where(b => b.UserId == userId).Select(b => b.Id).ToListAsync();
            var elevators = await _db.Elevators.Where(e => buildingIds.Contains(e.BuildingId)).ToListAsync();
            return _mapper.Map<IEnumerable<ElevatorDto>>(elevators);
        }

        // Creates a new elevator with default values and a random name.
        public async Task<ElevatorDto> CreateAsync(CreateElevatorDto dto)
        {
            var elevator = new Elevator
            {
                Id = Guid.NewGuid(),
                BuildingId = dto.BuildingId,
                Name = $"Elevator {Guid.NewGuid().ToString().Substring(0, 4)}",
                CurrentFloor = dto.CurrentFloor ?? 0,
                MinFloor = 0,
                MaxFloor = 10,
                Status = Enum.TryParse<ElevatorStatus>(dto.Status, out var parsedStatus) ? parsedStatus : ElevatorStatus.Idle,
                Direction = Enum.TryParse<ElevatorDirection>(dto.Direction, out var parsedDirection) ? parsedDirection : ElevatorDirection.None,
                DoorStatus = Enum.TryParse<DoorStatus>(dto.DoorStatus, out var parsedDoorStatus) ? parsedDoorStatus : DoorStatus.Closed,
                Capacity = 10,
                CurrentLoad = 0,
                IsExpress = false,
                LastMaintenanceDate = DateTime.UtcNow
            };
            _db.Elevators.Add(elevator);
            await _db.SaveChangesAsync();
            return _mapper.Map<ElevatorDto>(elevator);
        }

        // Updates the status and properties of an elevator.
        public async Task UpdateStatusAsync(Guid id, ElevatorDto dto)
        {
            var elevator = await _db.Elevators.FindAsync(id);
            if (elevator == null) throw new KeyNotFoundException("המעלית לא נמצאה");

            if (Enum.TryParse<ElevatorStatus>(dto.Status, out var parsedStatus))
                elevator.Status = parsedStatus;
            if (Enum.TryParse<ElevatorDirection>(dto.Direction, out var parsedDirection))
                elevator.Direction = parsedDirection;
            if (Enum.TryParse<DoorStatus>(dto.DoorStatus, out var parsedDoorStatus))
                elevator.DoorStatus = parsedDoorStatus;
            elevator.CurrentFloor = dto.CurrentFloor;
            elevator.CurrentLoad = dto.CurrentLoad;
            elevator.IsExpress = dto.IsExpress;
            // Optionally update other fields as needed

            await _db.SaveChangesAsync();
        }

        // Deletes an elevator and all related assignments and calls (cascade delete).
        public async Task DeleteAsync(Guid id)
        {
            // Delete all assignments for this elevator first
            var assignments = _db.ElevatorCallAssignments.Where(a => a.ElevatorId == id);
            _db.ElevatorCallAssignments.RemoveRange(assignments);

            // Delete all calls assigned to this elevator
            var callIds = assignments.Select(a => a.ElevatorCallId).Distinct().ToList();
            var calls = _db.ElevatorCalls.Where(c => callIds.Contains(c.Id));
            _db.ElevatorCalls.RemoveRange(calls);

            var elevator = await _db.Elevators.FindAsync(id);
            if (elevator == null) throw new KeyNotFoundException("המעלית לא נמצאה");
            _db.Elevators.Remove(elevator);
            await _db.SaveChangesAsync();
        }
    }
} 