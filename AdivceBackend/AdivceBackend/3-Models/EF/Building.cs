using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace AdivceBackend.Models.EF
{
    public class Building
    {
        [Key]
        public Guid Id { get; set; }
        public Building() { Id = Guid.NewGuid(); }
        [ForeignKey("User")]
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public int NumberOfFloors { get; set; }
        public virtual User User { get; set; }
        public virtual ICollection<Elevator> Elevators { get; set; }
    }
} 