using System;

namespace AdivceBackend.Models.DTOs
{
    public class ElevatorStatusUpdateDto
    {
        public Guid ElevatorId { get; set; }
        public int CurrentFloor { get; set; }
        public string Status { get; set; }
        public string Direction { get; set; }
        public string DoorStatus { get; set; }
        public int CurrentLoad { get; set; }
        public DateTime Timestamp { get; set; }
    }
} 