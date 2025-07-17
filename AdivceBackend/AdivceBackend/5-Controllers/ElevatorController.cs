using Microsoft.AspNetCore.Mvc;
using AdivceBackend.Models.DTOs;
using AdivceBackend.Services;

namespace AdivceBackend.Controllers
{
    [ApiController]
    [Route("api/elevators")]
    public class ElevatorController : ControllerBase
    {
        private readonly IElevatorService _elevatorService;
        public ElevatorController(IElevatorService elevatorService)
        {
            _elevatorService = elevatorService;
        }

        [HttpGet("building/{buildingId}")]
        public async Task<IActionResult> GetAllForBuilding(Guid buildingId)
        {
            var elevators = await _elevatorService.GetAllForBuildingAsync(buildingId);
            return Ok(elevators);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var elevator = await _elevatorService.GetByIdAsync(id);
            return Ok(elevator);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetAllForUser(Guid userId)
        {
            var elevators = await _elevatorService.GetAllForUserAsync(userId);
            return Ok(elevators);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateElevatorDto dto)
        {
            var elevator = await _elevatorService.CreateAsync(dto);
            return Ok(elevator);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] ElevatorDto dto)
        {
            await _elevatorService.UpdateStatusAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _elevatorService.DeleteAsync(id);
            return NoContent();
        }
    }
} 