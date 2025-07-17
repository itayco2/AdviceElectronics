import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElevatorState {
  id: string;
  currentFloor: number;
  status: 'Idle' | 'MovingUp' | 'MovingDown' | 'OpeningDoors' | 'ClosingDoors';
  direction: 'Up' | 'Down' | 'None';
  doorStatus: 'Open' | 'Closed';
  targetFloors: number[];
}

interface ElevatorShaftProps {
  elevator: ElevatorState;
  buildingFloors: number;
  onCallElevator: (floor: number, direction: 'Up' | 'Down') => void;
  onSelectDestination: (floor: number) => void;
  showDestinationSelector: boolean;
}

export function ElevatorShaft({ 
  elevator, 
  buildingFloors, 
  onCallElevator, 
  onSelectDestination,
  showDestinationSelector 
}: ElevatorShaftProps) {
  const floors = Array.from({ length: buildingFloors }, (_, i) => buildingFloors - 1 - i);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Idle': return 'bg-elevator-idle';
      case 'MovingUp':
      case 'MovingDown': return 'bg-elevator-moving';
      case 'OpeningDoors':
      case 'ClosingDoors': return 'bg-elevator-doorOpen';
      default: return 'bg-elevator-car';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Idle': return 'עומד';
      case 'MovingUp': return 'עולה';
      case 'MovingDown': return 'יורד';
      case 'OpeningDoors': return 'פותח דלתות';
      case 'ClosingDoors': return 'סוגר דלתות';
      default: return status;
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-b from-card to-accent/20">
      <div className="space-y-4">
        {/* Elevator Status */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">מעלית {elevator.id}</h3>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className={cn("px-3 py-1", getStatusColor(elevator.status))}>
              {getStatusText(elevator.status)}
            </Badge>
            <Badge variant="outline">קומה {elevator.currentFloor}</Badge>
          </div>
          {elevator.targetFloors.length > 0 && (
            <div className="text-sm text-muted-foreground">
              יעדים: {elevator.targetFloors.join(', ')}
            </div>
          )}
        </div>

        {/* Elevator Shaft Visualization */}
        <div className="relative bg-elevator-shaft rounded-lg p-4" style={{ height: `${buildingFloors * 60}px` }}>
          {floors.map((floor) => (
            <div
              key={floor}
              className="absolute w-full border-b border-border/50 flex items-center justify-between px-2"
              style={{ 
                top: `${(buildingFloors - 1 - floor) * 60}px`,
                height: '60px'
              }}
            >
              <span className="text-sm font-medium">קומה {floor}</span>
              
              {/* Call Buttons */}
              <div className="flex gap-1">
                {floor < buildingFloors - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCallElevator(floor, 'Up')}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                )}
                {floor > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCallElevator(floor, 'Down')}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {/* Elevator Car */}
          <div
            className={cn(
              "absolute w-20 h-12 rounded-md border-2 border-primary/20 flex items-center justify-center",
              getStatusColor(elevator.status),
              elevator.status.includes('Moving') && "animate-pulse-gentle"
            )}
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: `${(buildingFloors - 1 - elevator.currentFloor) * 60 + 24}px`,
              transition: 'top 2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span className="text-xs font-bold text-white">
              {elevator.currentFloor}
            </span>
          </div>
        </div>

        {/* Destination Selector */}
        {showDestinationSelector && elevator.doorStatus === 'Open' && (
          <div className="space-y-2 animate-slide-up">
            <h4 className="text-sm font-medium text-center">בחר יעד:</h4>
            <div className="grid grid-cols-4 gap-2">
              {floors
                .filter(floor => floor !== elevator.currentFloor)
                .map((floor) => (
                  <Button
                    key={floor}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectDestination(floor)}
                    className="h-8"
                  >
                    {floor}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}