import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { Trip } from "../domain/types";

interface TripSidebarProps {
  trips: Trip[];
  selectedTripId?: string;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (name: string) => void | Promise<void>;
  onImportFiles?: (tripId: string, files: FileList) => void;
}

export const TripSidebar = ({
  trips,
  selectedTripId,
  onSelectTrip,
  onCreateTrip,
  onImportFiles,
}: TripSidebarProps) => {
  const [tripName, setTripName] = useState("");

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const createButtonLabel = trips.length === 0 ? "创建第一趟旅行" : "创建旅行";

  const handleCreateTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = tripName.trim();

    if (!trimmedName) {
      return;
    }

    await onCreateTrip(trimmedName);
    setTripName("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedTrip || !onImportFiles || !event.target.files || event.target.files.length === 0) {
      return;
    }

    onImportFiles(selectedTrip.id, event.target.files);
    event.target.value = "";
  };

  return (
    <aside className="trip-sidebar" aria-label="旅行侧栏">
      <div className="sidebar-brand">
        <p>Trip Trace</p>
        <span>家庭旅行工作台</span>
      </div>

      <form className="create-trip-form" onSubmit={handleCreateTrip}>
        <label htmlFor="trip-name">旅行名称</label>
        <input
          id="trip-name"
          name="tripName"
          type="text"
          value={tripName}
          onChange={(event) => setTripName(event.target.value)}
          placeholder="例如：杭州亲子游"
        />
        <button type="submit">{createButtonLabel}</button>
      </form>

      <section className="trip-list-section" aria-labelledby="trip-list-title">
        <h2 id="trip-list-title">我的旅行</h2>
        {trips.length === 0 ? (
          <p className="empty-copy">还没有旅行</p>
        ) : (
          <ul className="trip-list">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  className={trip.id === selectedTripId ? "trip-list-item is-selected" : "trip-list-item"}
                  aria-current={trip.id === selectedTripId ? "true" : undefined}
                  onClick={() => onSelectTrip(trip.id)}
                >
                  {trip.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="import-entry" aria-labelledby="import-entry-title">
        <h2 id="import-entry-title">照片导入</h2>
        {selectedTrip && onImportFiles ? (
          <label className="file-import-label">
            <span>导入照片</span>
            <input type="file" multiple accept="image/*" aria-label="导入照片" onChange={handleFileChange} />
          </label>
        ) : selectedTrip ? (
          <p className="empty-copy">照片导入将在后续步骤接入</p>
        ) : (
          <p className="empty-copy">创建旅行后可以导入照片。</p>
        )}
      </section>
    </aside>
  );
};
