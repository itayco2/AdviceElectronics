namespace AdivceBackend.Models.DTOs
{
    public class BuildingDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public int NumberOfFloors { get; set; }
    }

    public class CreateBuildingDto
    {
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public int NumberOfFloors { get; set; }
    }
} 