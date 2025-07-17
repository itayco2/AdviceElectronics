using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AdivceBackend.Models.EF;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace AdivceBackend.Services
{
    public class ElevatorSimulationService : BackgroundService, IElevatorSimulationService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ElevatorSimulationService> _logger;
        private bool _running = false;
        private readonly IHubContext<ElevatorHub> _hubContext;

        // Configuration constants
        private const int SIMULATION_INTERVAL_MS = 1000; // 1 second per floor movement
        private const int DOOR_OPERATION_TIME_MS = 3000; // 3 seconds for door operations
        private const int MAX_CAPACITY = 10; // Maximum passengers per elevator
        private const double ENERGY_COST_PER_FLOOR = 0.5; // Energy cost factor

        public ElevatorSimulationService(IServiceScopeFactory scopeFactory,
            ILogger<ElevatorSimulationService> logger,
            IHubContext<ElevatorHub> hubContext)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _hubContext = hubContext;
        }

        public void StartSimulation() => _running = true;
        public void StopSimulation() => _running = false;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _running = true;
            while (!stoppingToken.IsCancellationRequested && _running)
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    // Process unhandled calls
                    await ProcessUnhandledCalls(db);

                    // Move elevators
                    await ProcessElevatorMovements(db);

                    // Handle door operations
                    await ProcessDoorOperations(db);

                    await db.SaveChangesAsync();
                }

                await Task.Delay(SIMULATION_INTERVAL_MS, stoppingToken);
            }
        }

        private async Task ProcessUnhandledCalls(ApplicationDbContext db)
        {
            var unhandledCalls = await db.ElevatorCalls
                .Where(c => !c.IsHandled)
                .OrderBy(c => c.CallTime)
                .ToListAsync();

            var assignedElevatorIds = new HashSet<Guid>();

            foreach (var call in unhandledCalls)
            {
                // Prevent duplicate assignment: only assign if no assignment exists for this call
                bool alreadyAssigned = db.ElevatorCallAssignments.Any(a => a.ElevatorCallId == call.Id);
                if (alreadyAssigned)
                    continue;

                var elevator = await SelectBestElevator(db, call, assignedElevatorIds);

                if (elevator != null)
                {
                    AssignCallToElevator(db, call, elevator);
                    assignedElevatorIds.Add(elevator.Id);

                    _logger.LogInformation($"Assigned call {call.Id} (floor {call.RequestedFloor}->{call.DestinationFloor}) to elevator {elevator.Id}");

                    await NotifyElevatorUpdate(elevator);
                }
            }
        }

        private async Task<Elevator?> SelectBestElevator(ApplicationDbContext db, ElevatorCall call, HashSet<Guid> excludedIds)
        {
            var elevators = await db.Elevators
                .Include(e => e.ElevatorCallAssignments)
                .Where(e => e.BuildingId == call.BuildingId && !excludedIds.Contains(e.Id))
                .ToListAsync();

            // Only consider idle elevators for assignment
            var idleElevators = elevators.Where(e => e.Status == ElevatorStatus.Idle).ToList();
            if (idleElevators.Any())
            {
                // Find the closest idle elevator(s)
                int minDistance = idleElevators.Min(e => Math.Abs(e.CurrentFloor - call.RequestedFloor));
                var closestElevators = idleElevators
                    .Where(e => Math.Abs(e.CurrentFloor - call.RequestedFloor) == minDistance)
                    .OrderBy(e => e.Id) // Tie-breaker: lowest Guid
                    .ToList();
                return closestElevators.FirstOrDefault();
            }

            // If no idle elevators, fall back to previous scoring logic
            var scoredElevators = new List<(Elevator elevator, double score)>();
            foreach (var elevator in elevators)
            {
                var score = CalculateElevatorScore(elevator, call, db);
                scoredElevators.Add((elevator, score));
            }
            return scoredElevators
                .Where(e => e.score >= 0)
                .OrderByDescending(e => e.score)
                .Select(e => e.elevator)
                .FirstOrDefault();
        }

        private double CalculateElevatorScore(Elevator elevator, ElevatorCall call, ApplicationDbContext db)
        {
            double score = 100.0;

            // Distance penalty
            int distance = Math.Abs(elevator.CurrentFloor - call.RequestedFloor);
            score -= distance * 10;

            // Direction bonus/penalty
            if (elevator.Direction != ElevatorDirection.None)
            {
                bool sameDirection = IsInSameDirection(elevator, call);
                if (sameDirection && IsOnTheWay(elevator, call))
                {
                    score += 30; // Bonus for calls in the same direction
                }
                else if (!sameDirection)
                {
                    score -= 50; // Penalty for opposite direction
                }
            }

            // Load penalty (check current assignments)
            var activeAssignments = db.ElevatorCallAssignments
                .Count(a => a.ElevatorId == elevator.Id &&
                       !db.ElevatorCalls.Any(c => c.Id == a.ElevatorCallId && c.IsHandled));

            score -= activeAssignments * 20;

            // Status penalty
            switch (elevator.Status)
            {
                case ElevatorStatus.Idle:
                    score += 20;
                    break;
                case ElevatorStatus.OpeningDoors:
                case ElevatorStatus.ClosingDoors:
                    score -= 15;
                    break;
                case ElevatorStatus.OutOfService:
                    return -1; // Exclude from selection
            }

            // Energy efficiency bonus (prefer elevators closer to the call)
            score -= distance * ENERGY_COST_PER_FLOOR;

            return score;
        }

        private bool IsInSameDirection(Elevator elevator, ElevatorCall call)
        {
            if (elevator.Direction == ElevatorDirection.Up && call.RequestedFloor > elevator.CurrentFloor)
                return true;
            if (elevator.Direction == ElevatorDirection.Down && call.RequestedFloor < elevator.CurrentFloor)
                return true;
            return false;
        }

        private bool IsOnTheWay(Elevator elevator, ElevatorCall call)
        {
            if (elevator.Direction == ElevatorDirection.Up)
                return call.RequestedFloor >= elevator.CurrentFloor && call.RequestedFloor <= GetElevatorDestination(elevator);
            if (elevator.Direction == ElevatorDirection.Down)
                return call.RequestedFloor <= elevator.CurrentFloor && call.RequestedFloor >= GetElevatorDestination(elevator);
            return false;
        }

        private int GetElevatorDestination(Elevator elevator)
        {
            // This would need to check all active assignments to find the furthest destination
            // For simplicity, returning current floor + 10 for up, current floor - 10 for down
            return elevator.Direction == ElevatorDirection.Up ? elevator.CurrentFloor + 10 : elevator.CurrentFloor - 10;
        }

        // Assigns an elevator call to an elevator and updates its status/direction if idle
        private void AssignCallToElevator(ApplicationDbContext db, ElevatorCall call, Elevator elevator)
        {
            db.ElevatorCallAssignments.Add(new ElevatorCallAssignment
            {
                ElevatorId = elevator.Id,
                ElevatorCallId = call.Id,
                AssignmentTime = DateTime.UtcNow
            });

            // Update elevator status and direction if idle
            if (elevator.Status == ElevatorStatus.Idle)
            {
                if (elevator.CurrentFloor < call.RequestedFloor)
                {
                    elevator.Status = ElevatorStatus.MovingUp;
                    elevator.Direction = ElevatorDirection.Up;
                }
                else if (elevator.CurrentFloor > call.RequestedFloor)
                {
                    elevator.Status = ElevatorStatus.MovingDown;
                    elevator.Direction = ElevatorDirection.Down;
                }
                else
                {
                    elevator.Status = ElevatorStatus.OpeningDoors;
                    elevator.DoorOpenTime = DateTime.UtcNow;
                }
            }
        }

        // Moves elevators towards their next stop if they have active assignments
        private async Task ProcessElevatorMovements(ApplicationDbContext db)
        {
            // Only move elevators that have active assignments (calls not handled)
            var elevators = await db.Elevators
                .Include(e => e.ElevatorCallAssignments)
                .Where(e => e.ElevatorCallAssignments.Any(a => !db.ElevatorCalls.Any(c => c.Id == a.ElevatorCallId && c.IsHandled)))
                .ToListAsync();

            foreach (var elevator in elevators)
            {
                var activeAssignments = await GetActiveAssignments(db, elevator.Id);
                if (!activeAssignments.Any())
                {
                    elevator.Status = ElevatorStatus.Idle;
                    elevator.Direction = ElevatorDirection.None;
                    continue;
                }

                // Get all floors where the elevator needs to stop
                var stopFloors = GetStopFloors(activeAssignments, elevator.Direction);
                var nextStop = GetNextStop(stopFloors, elevator.CurrentFloor, elevator.Direction);

                if (nextStop.HasValue)
                {
                    // Move one floor towards the next stop
                    if (elevator.Direction == ElevatorDirection.Up && elevator.CurrentFloor < nextStop.Value)
                    {
                        elevator.CurrentFloor++;
                    }
                    else if (elevator.Direction == ElevatorDirection.Down && elevator.CurrentFloor > nextStop.Value)
                    {
                        elevator.CurrentFloor--;
                    }

                    _logger.LogInformation($"Elevator {elevator.Id} moved to floor {elevator.CurrentFloor}");

                    // Check if we've reached a stop floor
                    if (elevator.CurrentFloor == nextStop.Value)
                    {
                        if (elevator.Status != ElevatorStatus.OpeningDoors) // Only set DoorOpenTime on transition
                        {
                            elevator.Status = ElevatorStatus.OpeningDoors;
                            elevator.DoorOpenTime = DateTime.UtcNow;
                            _logger.LogInformation($"Elevator {elevator.Id} opening doors at floor {elevator.CurrentFloor}");
                        }
                    }

                    await NotifyElevatorUpdate(elevator);
                }
                else
                {
                    // No more stops, go idle
                    elevator.Status = ElevatorStatus.Idle;
                    elevator.Direction = ElevatorDirection.None;
                }
            }
        }

        // Handles door opening/closing logic and transitions elevator state accordingly
        private async Task ProcessDoorOperations(ApplicationDbContext db)
        {
            var elevatorsWithOpenDoors = await db.Elevators
                .Where(e => e.Status == ElevatorStatus.OpeningDoors || e.Status == ElevatorStatus.ClosingDoors)
                .ToListAsync();

            foreach (var elevator in elevatorsWithOpenDoors)
            {
                if (elevator.Status == ElevatorStatus.OpeningDoors)
                {
                    if (elevator.DoorOpenTime.HasValue)
                    {
                        var elapsed = (DateTime.UtcNow - elevator.DoorOpenTime.Value).TotalMilliseconds;
                        _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} OpeningDoors elapsed={elapsed}ms (threshold={DOOR_OPERATION_TIME_MS}ms)");
                        if (elapsed >= DOOR_OPERATION_TIME_MS)
                        {
                            elevator.Status = ElevatorStatus.ClosingDoors;
                            elevator.DoorStatus = DoorStatus.Closed;
                            await MarkCallsAsHandled(db, elevator);
                            _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} closing doors at floor {elevator.CurrentFloor}");
                        }
                        else
                        {
                            _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} door timer not yet elapsed");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"[DoorOps] Elevator {elevator.Id} OpeningDoors but DoorOpenTime is null!");
                    }
                }
                else if (elevator.Status == ElevatorStatus.ClosingDoors)
                {
                    var activeAssignments = await GetActiveAssignments(db, elevator.Id);
                    if (activeAssignments.Any())
                    {
                        var stopFloors = GetStopFloors(activeAssignments, elevator.Direction);
                        if (stopFloors.Any())
                        {
                            elevator.Status = elevator.Direction == ElevatorDirection.Up ?
                                ElevatorStatus.MovingUp : ElevatorStatus.MovingDown;
                            _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} closing doors, continuing to move {elevator.Direction}");
                        }
                        else
                        {
                            elevator.Direction = elevator.Direction == ElevatorDirection.Up ?
                                ElevatorDirection.Down : ElevatorDirection.Up;
                            elevator.Status = elevator.Direction == ElevatorDirection.Up ?
                                ElevatorStatus.MovingUp : ElevatorStatus.MovingDown;
                            _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} closing doors, changing direction to {elevator.Direction}");
                        }
                    }
                    else
                    {
                        elevator.Status = ElevatorStatus.Idle;
                        elevator.Direction = ElevatorDirection.None;
                        _logger.LogInformation($"[DoorOps] Elevator {elevator.Id} closing doors, now idle");
                    }
                    elevator.DoorOpenTime = null;
                }
                await NotifyElevatorUpdate(elevator);
            }
        }

        // Returns all active (unhandled) assignments for a given elevator
        private async Task<List<(ElevatorCall call, ElevatorCallAssignment assignment)>> GetActiveAssignments(
            ApplicationDbContext db, Guid elevatorId)
        {
            var assignments = await db.ElevatorCallAssignments
                .Where(a => a.ElevatorId == elevatorId)
                .Join(db.ElevatorCalls.Where(c => !c.IsHandled),
                    a => a.ElevatorCallId,
                    c => c.Id,
                    (a, c) => new { Assignment = a, Call = c })
                .Select(x => new { x.Call, x.Assignment })
                .ToListAsync();

            return assignments.Select(x => (x.Call, x.Assignment)).ToList();
        }

        // Returns all floors where the elevator needs to stop (pickups and destinations)
        private HashSet<int> GetStopFloors(List<(ElevatorCall call, ElevatorCallAssignment assignment)> assignments,
            ElevatorDirection direction)
        {
            var floors = new HashSet<int>();

            foreach (var (call, _) in assignments)
            {
                // Add pickup floors
                floors.Add(call.RequestedFloor);

                // Add destination floors if specified
                if (call.DestinationFloor.HasValue)
                {
                    floors.Add(call.DestinationFloor.Value);
                }
            }

            return floors;
        }

        // Determines the next stop floor for the elevator based on direction
        private int? GetNextStop(HashSet<int> stopFloors, int currentFloor, ElevatorDirection direction)
        {
            if (!stopFloors.Any()) return null;

            if (direction == ElevatorDirection.Up)
            {
                return stopFloors.Where(f => f >= currentFloor).OrderBy(f => f).FirstOrDefault();
            }
            else if (direction == ElevatorDirection.Down)
            {
                return stopFloors.Where(f => f <= currentFloor).OrderByDescending(f => f).FirstOrDefault();
            }

            return null;
        }

        // Marks calls as handled if the elevator is at the correct floor
        private async Task MarkCallsAsHandled(ApplicationDbContext db, Elevator elevator)
        {
            var assignments = await GetActiveAssignments(db, elevator.Id);

            foreach (var (call, _) in assignments)
            {
                // Mark as handled if we're at the destination floor
                if ((call.DestinationFloor.HasValue && elevator.CurrentFloor == call.DestinationFloor.Value) ||
                    (!call.DestinationFloor.HasValue && elevator.CurrentFloor == call.RequestedFloor))
                {
                    call.IsHandled = true;
                    call.CompletionTime = DateTime.UtcNow;
                    _logger.LogInformation($"Completed call {call.Id} at floor {elevator.CurrentFloor}");
                }
            }
        }

        // Sends a real-time update to all clients about the elevator's current state
        private async Task NotifyElevatorUpdate(Elevator elevator)
        {
            _logger.LogInformation($"[SignalR] Broadcasting update for elevator {elevator.Id}: Floor={elevator.CurrentFloor}, Status={elevator.Status}, Direction={elevator.Direction}, DoorStatus={elevator.DoorStatus}");
            await _hubContext.Clients.All.SendAsync("ReceiveElevatorUpdate", new
            {
                elevatorId = elevator.Id,
                currentFloor = elevator.CurrentFloor,
                status = elevator.Status.ToString(),
                direction = elevator.Direction.ToString(),
                doorStatus = elevator.DoorStatus.ToString(),
                timestamp = DateTime.UtcNow
            });
        }
    }
} 