using System;
using System.Collections.Generic;

namespace AdivceBackend.Models.DTOs
{
    public class BuildingElevatorStatsDto
    {
        public Guid BuildingId { get; set; }
        public int TotalElevators { get; set; }
        public int ActiveElevators { get; set; }
        public int IdleElevators { get; set; }
        public double AverageWaitTime { get; set; }
        public double AverageResponseTime { get; set; }
        public int PendingCalls { get; set; }
        public int CompletedCallsToday { get; set; }
        public Dictionary<string, int> CallsByFloor { get; set; }
        public Dictionary<string, double> EfficiencyByElevator { get; set; }
    }
} 