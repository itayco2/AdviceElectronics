using Microsoft.AspNetCore.Mvc;
using AdivceBackend.Models.DTOs;
using AdivceBackend.Services;

namespace AdivceBackend.Controllers
{
    [ApiController]
    [Route("api/elevatorcalls")]
    public class ElevatorCallController : ControllerBase
    {
        private readonly IElevatorCallService _elevatorCallService;
        public ElevatorCallController(IElevatorCallService elevatorCallService)
        {
            _elevatorCallService = elevatorCallService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateElevatorCallDto dto)
        {
            var call = await _elevatorCallService.CreateAsync(dto);
            return Ok(call);
        }

        [HttpGet("building/{buildingId}")]
        public async Task<IActionResult> GetAllForBuilding(Guid buildingId)
        {
            var calls = await _elevatorCallService.GetAllForBuildingAsync(buildingId);
            return Ok(calls);
        }

        [HttpGet("{callId}/assignments")]
        public async Task<IActionResult> GetAssignmentsForCall(Guid callId)
        {
            var assignments = await _elevatorCallService.GetAssignmentsForCallAsync(callId);
            return Ok(assignments);
        }
    }
} 