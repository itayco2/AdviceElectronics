using System;

namespace AdivceBackend.Models.DTOs
{
    public class ElevatorCallAssignmentDto
    {
        public Guid Id { get; set; }
        public Guid ElevatorId { get; set; }
        public string ElevatorName { get; set; }
        public Guid ElevatorCallId { get; set; }
        public DateTime AssignmentTime { get; set; }
        public DateTime? PickupTime { get; set; }
        public DateTime? DropoffTime { get; set; }
        public double ResponseTime { get; set; }
        public double TravelTime { get; set; }
    }
} 