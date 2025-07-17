using AdivceBackend.Models.DTOs;
using AdivceBackend.Models.EF;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AdivceBackend.Services
{
    public class ElevatorCallService : IElevatorCallService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public ElevatorCallService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // Creates a new elevator call and marks it as unhandled.
        public async Task<ElevatorCallDto> CreateAsync(CreateElevatorCallDto dto)
        {
            var call = new ElevatorCall
            {
                BuildingId = dto.BuildingId,
                RequestedFloor = dto.RequestedFloor,
                DestinationFloor = dto.DestinationFloor,
                CallTime = DateTime.UtcNow,
                IsHandled = false,
                Type = dto.Type,
                Priority = dto.Priority,
                PassengerCount = dto.PassengerCount
            };
            _db.ElevatorCalls.Add(call);
            await _db.SaveChangesAsync();
            return _mapper.Map<ElevatorCallDto>(call);
        }

        public async Task<IEnumerable<ElevatorCallDto>> GetAllForBuildingAsync(Guid buildingId)
        {
            var calls = await _db.ElevatorCalls.Where(c => c.BuildingId == buildingId).ToListAsync();
            return _mapper.Map<IEnumerable<ElevatorCallDto>>(calls);
        }

        // Returns all assignments (elevator-call links) for a given call.
        public async Task<IEnumerable<ElevatorCallAssignmentDto>> GetAssignmentsForCallAsync(Guid callId)
        {
            var assignments = await _db.ElevatorCallAssignments.Where(a => a.ElevatorCallId == callId).ToListAsync();
            return _mapper.Map<IEnumerable<ElevatorCallAssignmentDto>>(assignments);
        }
    }
} 