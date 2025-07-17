using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace AdivceBackend.Models.EF
{
    public enum CallType
    {
        Standard,
        Express,
        Freight,
        Emergency,
        VIP
    }

    public enum CallPriority
    {
        Low,
        Normal,
        High,
        Emergency
    }

    public class ElevatorCall
    {
        [Key]
        public Guid Id { get; set; }
        public ElevatorCall() { Id = Guid.NewGuid(); }
        [ForeignKey("Building")]
        public Guid BuildingId { get; set; }
        public int RequestedFloor { get; set; }
        public int? DestinationFloor { get; set; }
        public DateTime CallTime { get; set; }
        public DateTime? CompletionTime { get; set; }
        public bool IsHandled { get; set; }
        public CallType Type { get; set; } = CallType.Standard;
        public int PassengerCount { get; set; } = 1;
        public CallPriority Priority { get; set; } = CallPriority.Normal;
        public virtual Building Building { get; set; }
        public virtual ICollection<ElevatorCallAssignment> ElevatorCallAssignments { get; set; }
    }
} 