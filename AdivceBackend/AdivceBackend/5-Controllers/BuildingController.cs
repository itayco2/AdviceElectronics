using Microsoft.AspNetCore.Mvc;
using AdivceBackend.Models.DTOs;
using AdivceBackend.Services;

namespace AdivceBackend.Controllers
{
    [ApiController]
    [Route("api/buildings")]
    public class BuildingController : ControllerBase
    {
        private readonly IBuildingService _buildingService;
        public BuildingController(IBuildingService buildingService)
        {
            _buildingService = buildingService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetAllForUser(Guid userId)
        {
            var buildings = await _buildingService.GetAllForUserAsync(userId);
            return Ok(buildings);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBuildingDto dto)
        {
            var building = await _buildingService.CreateAsync(dto);
            return Ok(building);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var building = await _buildingService.GetByIdAsync(id);
            return Ok(building);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _buildingService.DeleteAsync(id);
            return NoContent();
        }
    }
} 