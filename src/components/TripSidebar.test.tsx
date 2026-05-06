import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Trip } from "../domain/types";
import { TripSidebar } from "./TripSidebar";

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "trip-1",
  name: "杭州亲子游",
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:00.000Z",
  memberIds: [],
  ...overrides,
});

const renderSidebar = (initialTrips: Trip[] = []) => {
  const Harness = () => {
    const [trips, setTrips] = useState(initialTrips);
    const [selectedTripId, setSelectedTripId] = useState(initialTrips[0]?.id);

    return (
      <TripSidebar
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
        onCreateTrip={(name) => {
          const trip = makeTrip({ id: `trip-${trips.length + 1}`, name });
          setTrips([...trips, trip]);
          setSelectedTripId(trip.id);
        }}
        onImportFiles={() => undefined}
      />
    );
  };

  return render(<Harness />);
};

afterEach(() => {
  cleanup();
});

describe("TripSidebar", () => {
  it("shows a Chinese empty state and create action when there are no trips", () => {
    renderSidebar();

    expect(screen.getByText("还没有旅行")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建第一趟旅行" })).toBeInTheDocument();
  });

  it("creates a trip from an entered name and shows the import entry", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.type(screen.getByLabelText("旅行名称"), "杭州亲子游");
    await user.click(screen.getByRole("button", { name: "创建第一趟旅行" }));

    expect(screen.getByRole("button", { name: "杭州亲子游" })).toBeInTheDocument();
    expect(screen.getByLabelText("导入照片")).toBeInTheDocument();
  });
});
