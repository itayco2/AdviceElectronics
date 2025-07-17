using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using AdivceBackend.Models.DTOs;

namespace AdivceBackend.Services
{
    public class ElevatorHub : Hub
    {
        // Called by the simulation or controller to notify clients of elevator status changes
        public async Task SendElevatorUpdate(ElevatorStatusUpdateDto update)
        {
            await Clients.All.SendAsync("ReceiveElevatorUpdate", update);
        }
    }
} 