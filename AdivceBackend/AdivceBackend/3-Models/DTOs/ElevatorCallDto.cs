using System;
using AdivceBackend.Models.EF;

namespace AdivceBackend.Models.DTOs
{
    public class ElevatorCallDto
    {
        public Guid Id { get; set; }
        public Guid BuildingId { get; set; }
        public int RequestedFloor { get; set; }
        public int? DestinationFloor { get; set; }
        public DateTime CallTime { get; set; }
        public DateTime? CompletionTime { get; set; }
        public bool IsHandled { get; set; }
        public string? Type { get; set; }
        public string? Priority { get; set; }
        public int PassengerCount { get; set; }
        public double WaitTime { get; set; }
        public Guid? AssignedElevatorId { get; set; }
        public string? AssignedElevatorName { get; set; }
    }

    public class CreateElevatorCallDto
    {
        public Guid BuildingId { get; set; }
        public int RequestedFloor { get; set; }
        public int? DestinationFloor { get; set; }
        public CallType Type { get; set; } = CallType.Standard;
        public CallPriority Priority { get; set; } = CallPriority.Normal;
        public int PassengerCount { get; set; } = 1;
    }
} 