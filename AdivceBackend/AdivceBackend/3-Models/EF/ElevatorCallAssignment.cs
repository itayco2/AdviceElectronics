using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AdivceBackend.Models.EF
{
    public class ElevatorCallAssignment
    {
        [Key]
        public Guid Id { get; set; }
        [ForeignKey("Elevator")]
        public Guid ElevatorId { get; set; }
        [ForeignKey("ElevatorCall")]
        public Guid ElevatorCallId { get; set; }
        public DateTime AssignmentTime { get; set; }
        public DateTime? PickupTime { get; set; }
        public DateTime? DropoffTime { get; set; }
        public virtual Elevator Elevator { get; set; }
        public virtual ElevatorCall ElevatorCall { get; set; }
    }
} 