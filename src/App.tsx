import { useEffect, useState } from "react";
import { ImportSummary } from "./components/ImportSummary";
import { TripSidebar } from "./components/TripSidebar";
import type { Trip } from "./domain/types";
import { listTrips, saveTrip } from "./storage/repositories";

const emptyImportSummary = {
  importedCount: 0,
  geotaggedCount: 0,
  missingLocationCount: 0,
  parseFailureCount: 0,
  skippedCount: 0,
};

const createTripId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>();
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  useEffect(() => {
    let isMounted = true;

    listTrips().then((storedTrips) => {
      if (!isMounted) {
        return;
      }

      setTrips(storedTrips);
      setSelectedTripId((currentTripId) => currentTripId ?? storedTrips[0]?.id);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateTrip = async (name: string) => {
    const now = new Date().toISOString();
    const trip: Trip = {
      id: createTripId(),
      name,
      createdAt: now,
      updatedAt: now,
      memberIds: [],
    };

    await saveTrip(trip);
    setTrips((currentTrips) => [...currentTrips, trip]);
    setSelectedTripId(trip.id);
  };

  return (
    <main className="app-shell">
      <TripSidebar
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
        onCreateTrip={handleCreateTrip}
        onImportFiles={() => undefined}
      />

      <section className="map-workspace" aria-labelledby="app-title">
        <div>
          <h1 id="app-title">Trip Trace</h1>
          <p>{selectedTrip ? `${selectedTrip.name} 的地图将在这里展示。` : "创建旅行后开始整理家庭回忆。"}</p>
        </div>
      </section>

      <section className="timeline-workspace" aria-labelledby="timeline-title">
        <h2 id="timeline-title">时间轴</h2>
        <p>{selectedTrip ? "导入照片后会按拍摄日期显示在这里。" : "暂无旅行。"}</p>
        <ImportSummary summary={emptyImportSummary} />
      </section>
    </main>
  );
}
