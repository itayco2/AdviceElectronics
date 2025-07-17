using System.Threading.Tasks;

namespace AdivceBackend.Services
{
    public interface IElevatorSimulationService
    {
        void StartSimulation();
        void StopSimulation();
    }
} 