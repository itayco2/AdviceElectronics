import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  getElevatorsForBuilding,
  getCallsForBuilding,
  createElevator,
  deleteElevator,
} from '../lib/api';
import { useSignalR, ElevatorUpdate } from '../hooks/useSignalR';
import type { Building } from '../types/Building';

/**
 * Elevator representation returned by the backend.
 */
interface Elevator {
  id: string;
  buildingId: string;
  currentFloor: number;
  status: 'Idle' | 'MovingUp' | 'MovingDown' | 'OpeningDoors' | 'ClosingDoors';
  direction: 'None' | 'Up' | 'Down';
  doorStatus: 'Open' | 'Closed';
}

/**
 * Elevator‑call representation returned by the backend.
 */
interface ElevatorCall {
  id: string;
  buildingId: string;
  requestedFloor: number;
  destinationFloor?: number;
  callTime: string; // ISO timestamp from backend (UTC)
  isHandled: boolean;
}

interface BuildingDashboardProps {
  /** Current building to display. */
  building: Building;
  /** Callback invoked when the user clicks the "back" button. */
  onBack: () => void;
}

/**
 * Main dashboard component that visualises a building, its elevators, the call queue and
 * real‑time updates via SignalR.
 */
const BuildingDashboard: React.FC<BuildingDashboardProps> = ({ building, onBack }) => {
  /* -------------------------------------------------------------------------- */
  /*                                  State                                     */
  /* -------------------------------------------------------------------------- */

  const { user } = useAuth();

  /** All elevators belonging to the building. */
  const [elevators, setElevators] = useState<Elevator[]>([]);
  /** All calls (handled + pending). */
  const [calls, setCalls] = useState<ElevatorCall[]>([]);

  /** High‑level loading + error flags for initial fetches. */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Manual call form state. */
  const [requestedFloor, setRequestedFloor] = useState<number>(0);
  const [destinationFloor, setDestinationFloor] = useState<number | ''>('');
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  /** UI state for highlighting updated elevators + remove timers. */
  const [recentlyUpdatedElevatorId, setRecentlyUpdatedElevatorId] = useState<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Admin actions (add / delete elevator). */
  const [addElevatorLoading, setAddElevatorLoading] = useState(false);
  const [addElevatorError, setAddElevatorError] = useState<string | null>(null);
  const [deletingElevatorId, setDeletingElevatorId] = useState<string | null>(null);

  /** Track the last tick we received for every elevator so we can flag "stuck" ones. */
  const [lastElevatorUpdate, setLastElevatorUpdate] = useState<Record<string, number>>({});
  const [stuckElevators, setStuckElevators] = useState<string[]>([]);

  /** Track if initial data is loaded. */
  const [dataLoaded, setDataLoaded] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                          Initial load & polling                            */
  /* -------------------------------------------------------------------------- */

  /** Wrapper for the initial + refresh fetches so we can re‑use it in polling. */
  const fetchElevatorsAndCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const [elevatorsData, callsData] = await Promise.all([
        getElevatorsForBuilding(building.id),
        getCallsForBuilding(building.id),
      ]);
      setElevators(elevatorsData);
      setCalls(callsData);
      setDataLoaded(true);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      setError(message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // load on mount + when the building changes
  useEffect(() => {
    setDataLoaded(false);
    fetchElevatorsAndCalls();
    // eslint‑disable‑next‑line react‑hooks/exhaustive‑deps
  }, [building.id]);

  /* -------------------------------------------------------------------------- */
  /*                              Real‑time (SignalR)                           */
  /* -------------------------------------------------------------------------- */

  useSignalR((update: ElevatorUpdate) => {
    console.debug('[SignalR]', update);

    // merge the change into local state
    setElevators((prev) => {
      const exists = prev.some((e) => e.id === update.elevatorId);
      const updatedElevator: Elevator = {
        id: update.elevatorId,
        buildingId: building.id,
        currentFloor: update.currentFloor,
        status: update.status as Elevator['status'],
        direction: update.direction as Elevator['direction'],
        doorStatus: update.doorStatus as Elevator['doorStatus'],
      };
      return exists ? prev.map((e) => (e.id === update.elevatorId ? updatedElevator : e)) : [...prev, updatedElevator];
    });

    // record last tick (ms)
    setLastElevatorUpdate((prev) => ({ ...prev, [update.elevatorId]: Date.now() }));

    // visual pulse
    setRecentlyUpdatedElevatorId(update.elevatorId);
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => setRecentlyUpdatedElevatorId(null), 1200);

    // refresh calls – simpler than keeping incremental state logic here
    getCallsForBuilding(building.id)
      .then(setCalls)
      .catch((e) => console.error('[SignalR] failed to refresh calls', e));
  }, dataLoaded);

  /* -------------------------------------------------------------------------- */
  /*                            Polling fallback + stuck                        */
  /* -------------------------------------------------------------------------- */

  // every 10 s: refresh data

  // every 5 s: check for elevators that have been silent for > 20 s

  /* -------------------------------------------------------------------------- */
  /*                              Helper utilities                              */
  /* -------------------------------------------------------------------------- */

  const getStatusColor = (status: Elevator['status']) => {
    switch (status) {
      case 'Idle':
        return 'bg-gray-600';
      case 'MovingUp':
        return 'bg-green-600';
      case 'MovingDown':
        return 'bg-blue-600';
      case 'OpeningDoors':
      case 'ClosingDoors':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status: Elevator['status']) => {
    switch (status) {
      case 'Idle':
        return 'ממתינה';
      case 'MovingUp':
        return 'עולה';
      case 'MovingDown':
        return 'יורדת';
      case 'OpeningDoors':
        return 'פותחת דלתות';
      case 'ClosingDoors':
        return 'סוגרת דלתות';
      default:
        return status;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Handlers                                   */
  /* -------------------------------------------------------------------------- */

  /** Manual call form submit. */
  const handleCallSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setCallError(null);
    setCallLoading(true);
    try {
      const { createElevatorCall } = await import('../lib/api');
      await createElevatorCall({
        buildingId: building.id,
        requestedFloor,
        destinationFloor: destinationFloor === '' ? undefined : Number(destinationFloor),
      });
      // clear form + refresh calls
      setRequestedFloor(0);
      setDestinationFloor('');
      setCalls(await getCallsForBuilding(building.id));
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      setCallError(message ?? 'Failed to create call');
    } finally {
      setCallLoading(false);
    }
  };

  /** Quick "up"/"down" arrow click from the shaft visual. */
  const handleFloorCall = async (floor: number) => {
    setCallLoading(true);
    setCallError(null);
    try {
      const { createElevatorCall } = await import('../lib/api');
      await createElevatorCall({ buildingId: building.id, requestedFloor: floor });
      setCalls(await getCallsForBuilding(building.id));
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      setCallError(message ?? 'Failed to create call');
    } finally {
      setCallLoading(false);
    }
  };

  /** Admin – add new elevator. */
  const handleAddElevator = async () => {
    setAddElevatorLoading(true);
    setAddElevatorError(null);
    try {
      await createElevator({
        buildingId: building.id,
        currentFloor: 0,
        status: 'Idle',
        direction: 'None',
        doorStatus: 'Closed',
      });
      await fetchElevatorsAndCalls();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      setAddElevatorError(message ?? 'שגיאה בהוספת מעלית');
    } finally {
      setAddElevatorLoading(false);
    }
  };

  /** Admin – delete elevator. */
  const handleDeleteElevator = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המעלית? פעולה זו אינה הפיכה.')) return;
    setDeletingElevatorId(id);
    setError(null);
    try {
      await deleteElevator(id);
      await fetchElevatorsAndCalls();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message
          : undefined;
      setError(message ?? 'שגיאה במחיקת מעלית');
    } finally {
      setDeletingElevatorId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Render                                     */
  /* -------------------------------------------------------------------------- */

  return (
<div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Decorative SVG pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

      {/* Header */}
      <header className="relative z-10 bg-black/30 backdrop-blur-md border-b border-purple-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium leading-4 text-purple-400 transition-colors duration-200 hover:text-purple-300 focus:outline-none"
            >
  
              חזרה לרשימת הבניינים
                          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-white">{building.name}</h1>
              <p className="text-sm text-gray-400">{building.numberOfFloors} קומות</p>
            </div>

            {/* spacer */}
            <div className="w-32" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-0 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        )}

        {error && (
                 <div className="mb-8 rounded-lg border border-red-500/50 bg-red-900/50 p-4 backdrop-blur-sm">
            <p className="flex items-center text-red-400">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : (
          /* ───────────────  MAIN DASHBOARD GRID  ─────────────── */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ───────── Elevator Shafts (left, span‑2) ───────── */}
            <section className="lg:col-span-2">
              <div className="rounded-xl border border-purple-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center text-xl font-bold text-white">
                    <svg className="mr-2 h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                    </svg>
                    סימולציית מעלית
                  </h2>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddElevator}
                      disabled={addElevatorLoading}
                      className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-medium text-white shadow transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addElevatorLoading ? 'מוסיף…' : 'הוסף מעלית'}
                    </button>
                    {elevators.length > 0 && (
                      <button
                        onClick={() => handleDeleteElevator(elevators[elevators.length - 1].id)}
                        disabled={deletingElevatorId === elevators[elevators.length - 1].id}
                        className="rounded-md bg-red-600 px-4 py-2 font-medium text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingElevatorId === elevators[elevators.length - 1].id ? 'מוחק…' : 'מחק מעלית'}
                      </button>
                    )}
                  </div>
                </div>

                {addElevatorError && (
                  <div className="mb-4 rounded-md border border-red-500/50 bg-red-900/50 p-3 text-sm text-red-400">
                    {addElevatorError}
                  </div>
                )}

                {/* ───── One “shaft” per elevator ───── */}
                {elevators.map((elevator) => (
                  <div key={elevator.id} className="relative mb-10 last:mb-0">
                    {/* shaft box */}
                    <div
                      className="relative rounded-lg bg-gray-800 p-4"
                      style={{ height: `${building.numberOfFloors * 60}px` }}
                    >
                      {/* floors */}
                      {Array.from({ length: building.numberOfFloors }).map((_, i) => {
                        const floor = building.numberOfFloors - 1 - i;
                        return (
                          <div
                            key={floor}
                            className="absolute left-0 right-0 flex items-center justify-between border-b border-gray-700 px-4"
                            style={{ top: `${i * 60}px`, height: '60px' }}
                          >
                            <span className="text-sm font-medium text-gray-400">קומה {floor}</span>
                            <div className="flex gap-2">
                              {/* Up arrow (not for top floor) */}
                              {floor < building.numberOfFloors - 1 && (
                                <button
                                  onClick={() => handleFloorCall(floor)}
                                  className="rounded-full bg-green-600 hover:bg-green-700 text-white p-1 shadow transition"
                                  title="קרא מעלית לקומה זו (למעלה)"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                              )}
                              {/* Down arrow (not for ground floor) */}
                              {floor > 0 && (
                                <button
                                  onClick={() => handleFloorCall(floor)}
                                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white p-1 shadow transition"
                                  title="קרא מעלית לקומה זו (למטה)"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* elevator car */}
                      <div
                        className={`absolute left-1/2 flex h-12 w-24 -translate-x-1/2 transform items-center justify-center rounded-lg transition-all duration-1000 ease-in-out ${getStatusColor(
                          elevator.status,
                        )} ${recentlyUpdatedElevatorId === elevator.id ? 'ring-2 ring-purple-400 animate-pulse' : ''}`}
                        style={{ top: `${(building.numberOfFloors - 1 - elevator.currentFloor) * 60 + 6}px` }}
                      >
                        <span className="text-lg font-bold text-white">{elevator.currentFloor}</span>
                        {elevator.doorStatus === 'Open' && (
                          <div className="absolute inset-0 animate-pulse rounded-lg bg-yellow-400/20" />
                        )}
                      </div>
                    </div>

                    {/* status bar */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium text-white ${getStatusColor(elevator.status)}`}>
                          {getStatusText(elevator.status)}
                        </span>
                        <span className="text-sm text-gray-400">
                          כיוון: {elevator.direction === 'Up' ? '↑' : elevator.direction === 'Down' ? '↓' : '-'}
                        </span>
                      </div>

                      {recentlyUpdatedElevatorId === elevator.id && (
                        <span className="flex items-center text-sm text-purple-400 animate-pulse">
                          <span className="mr-2 h-2 w-2 rounded-full bg-purple-400" />
                          עדכון זמן אמת
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ───────── SIDE PANEL (right) ───────── */}
            <aside className="space-y-6">
              {/* ─── Call form ─── */}
              <section className="rounded-xl border border-purple-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 flex items-center text-lg font-bold text-white">
                  <svg className="mr-2 h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3a2 2 0 01-.6 1.4L4 17h5" />
                  </svg>
                  קריאה למעלית
                </h3>

                <form onSubmit={handleCallSubmit} className="space-y-4">
                  {/* pickup */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">לקומה</label>
                    <select
                      value={requestedFloor}
                      onChange={(e) => setRequestedFloor(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-purple-500"
                    >
                      {Array.from({ length: building.numberOfFloors }).map((_, i) => (
                        <option key={i} value={i}>
                          קומה {i}
                        </option>
                      ))}
                    </select>
                  </div>
                  {callError && (
                    <div className="rounded-md border border-red-500/50 bg-red-900/50 p-3 text-sm text-red-400">
                      {callError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={callLoading}
                    className="inline-flex w-full items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {callLoading ? (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A8 8 0 014 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65z" />
                        </svg>
                        קורא…
                      </>
                    ) : (
                      'קרא למעלית'
                    )}
                  </button>
                </form>
              </section>

              {/* ─── Recent small list ─── */}
              <section className="rounded-xl border border-purple-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 flex items-center text-lg font-bold text-white">
                  <svg className="mr-2 h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  קריאות אחרונות
                </h3>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {calls.length === 0 ? (
                    <p className="text-sm text-gray-400">אין קריאות במערכת</p>
                  ) : (
                    [...calls]
                      .sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime())
                      .slice(0, 10)
                      .map((call) => {
                        const local = new Date(call.callTime);
                        local.setHours(local.getHours() + 3); // UTC→Israel
                        return (
                          <div
                            key={call.id}
                            className={`rounded-lg border p-3 ${
                              call.isHandled ? 'bg-gray-800 border-gray-700' : 'bg-purple-900/20 border-purple-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">לקומה: {call.requestedFloor}</span>
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400">
                                  {local.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                                {!call.isHandled && (
                                  <span className="mt-1 rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-white animate-pulse">
                                    ממתין
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </section>

              {/* ─── Basic statistics ─── */}
              <section className="rounded-xl border border-purple-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 flex items-center text-lg font-bold text-white">
                  <svg className="mr-2 h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
                  </svg>
                  סטטיסטיקות
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-800 p-3">
                    <p className="mb-1 text-xs text-gray-400">סה\"כ קריאות</p>
                    <p className="text-2xl font-bold text-white">{calls.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-3">
                    <p className="mb-1 text-xs text-gray-400">קריאות ממתינות</p>
                    <p className="text-2xl font-bold text-yellow-400">{calls.filter((c) => !c.isHandled).length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-3">
                    <p className="mb-1 text-xs text-gray-400">קריאות שטופלו</p>
                    <p className="text-2xl font-bold text-green-400">{calls.filter((c) => c.isHandled).length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-800 p-3">
                    <p className="mb-1 text-xs text-gray-400">קריאה אחרונה</p>
                    <p className="text-sm font-bold text-white">
                    {calls[0]
                        ? new Date(new Date(calls[0].callTime).getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })
                        : '--:--'}
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div> /* grid end */
        )}
      </main>
    </div>
  );
};

export default BuildingDashboard;
