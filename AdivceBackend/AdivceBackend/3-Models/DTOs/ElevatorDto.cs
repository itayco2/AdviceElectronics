namespace AdivceBackend.Models.DTOs
{
    public class ElevatorDto
    {
        public Guid Id { get; set; }
        public Guid BuildingId { get; set; }
        public string Name { get; set; }
        public int CurrentFloor { get; set; }
        public int MinFloor { get; set; }
        public int MaxFloor { get; set; }
        public string Status { get; set; }
        public string Direction { get; set; }
        public string DoorStatus { get; set; }
        public int Capacity { get; set; }
        public int CurrentLoad { get; set; }
        public bool IsExpress { get; set; }
        public double EfficiencyScore { get; set; }
        public int ActiveCalls { get; set; }
    }

    public class CreateElevatorDto
    {
        public Guid BuildingId { get; set; }
        public int? CurrentFloor { get; set; }
        public string? Status { get; set; }
        public string? Direction { get; set; }
        public string? DoorStatus { get; set; }
    }
} 