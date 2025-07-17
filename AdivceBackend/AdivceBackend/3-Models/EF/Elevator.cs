using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System;

namespace AdivceBackend.Models.EF
{
    public enum ElevatorStatus
    {
        Idle,
        MovingUp,
        MovingDown,
        OpeningDoors,
        ClosingDoors,
        OutOfService,
        Emergency
    }

    public enum ElevatorDirection
    {
        None,
        Up,
        Down
    }

    public enum DoorStatus
    {
        Open,
        Closed,
        Opening,
        Closing,
        Blocked
    }

    public class Elevator
    {
        [Key]
        public Guid Id { get; set; }
        [ForeignKey("Building")]
        public Guid BuildingId { get; set; }
        public string Name { get; set; }
        public int CurrentFloor { get; set; }
        public int MinFloor { get; set; }
        public int MaxFloor { get; set; }
        public ElevatorStatus Status { get; set; }
        public ElevatorDirection Direction { get; set; }
        public DoorStatus DoorStatus { get; set; }
        public DateTime? DoorOpenTime { get; set; }
        public int Capacity { get; set; } = 10;
        public int CurrentLoad { get; set; } = 0;
        public double TotalDistance { get; set; } = 0;
        public DateTime LastMaintenanceDate { get; set; }
        public bool IsExpress { get; set; } = false;
        public virtual Building Building { get; set; }
        public virtual ICollection<ElevatorCallAssignment> ElevatorCallAssignments { get; set; }
    }
} 