import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const SIGNALR_URL = 'http://localhost:5091/elevatorHub';

export interface ElevatorUpdate {
  elevatorId: string;
  currentFloor: number;
  status: string;
  direction: string;
  doorStatus: string;
}

export function useSignalR(onElevatorUpdate: (update: ElevatorUpdate) => void, start: boolean = true) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!start) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveElevatorUpdate', (update: ElevatorUpdate) => {
      onElevatorUpdate(update);
    });

    connection.start().catch(console.error);
    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
    // eslint-disable-next-line
  }, [start]);
} 