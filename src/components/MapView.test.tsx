import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhotoAsset } from "../domain/types";
import { MapView } from "./MapView";

const divIcon = vi.hoisted(() =>
  vi.fn((options: { className?: string } = {}) => ({ options })),
);
const mapControls = vi.hoisted(() => ({
  fitBounds: vi.fn(),
  setView: vi.fn(),
}));

vi.mock("leaflet", () => ({
  default: { divIcon },
  divIcon,
}));

vi.mock("react-leaflet/MapContainer", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
}));

vi.mock("react-leaflet/Marker", () => ({
  Marker: ({
    children,
    eventHandlers,
    icon,
    position,
    title,
  }: {
    children: React.ReactNode;
    eventHandlers?: { click?: () => void };
    icon?: { options?: { className?: string } };
    position: [number, number];
    title?: string;
  }) => (
    <button
      type="button"
      aria-label={title}
      className={icon?.options?.className}
      data-position={JSON.stringify(position)}
      data-testid="photo-marker"
      onClick={eventHandlers?.click}
    >
      {children}
    </button>
  ),
}));

vi.mock("react-leaflet/Polyline", () => ({
  Polyline: ({ positions }: { positions: [number, number][] }) => (
    <div data-positions={JSON.stringify(positions)} data-testid="route-line" />
  ),
}));

vi.mock("react-leaflet/Popup", () => ({
  Popup: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("react-leaflet/TileLayer", () => ({
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
}));

vi.mock("react-leaflet/hooks", () => ({
  useMap: () => mapControls,
}));

const makePhoto = (overrides: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id: "photo-1",
  tripId: "trip-1",
  fileName: "IMG_0001.HEIC",
  capturedAt: "2026-05-06T09:00:00.000Z",
  latitude: 30.249,
  longitude: 120.163,
  exifStatus: "parsed",
  memberIds: [],
  createdAt: "2026-05-06T10:00:00.000Z",
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MapView", () => {
  it("shows a Chinese empty state when no photos have coordinates", () => {
    render(
      <MapView
        photos={[
          makePhoto({ id: "photo-missing", fileName: "无定位.jpg", latitude: undefined, longitude: undefined }),
        ]}
        onSelectPhoto={() => undefined}
      />,
    );

    expect(screen.getByText("暂无带定位的照片")).toBeInTheDocument();
    expect(screen.getByText("导入包含 GPS 信息的照片后，路线会显示在地图上。")).toBeInTheDocument();
    expect(screen.queryByTestId("photo-marker")).not.toBeInTheDocument();
  });

  it("renders geotagged photo markers and route points in captured-time order", () => {
    render(
      <MapView
        photos={[
          makePhoto({
            id: "photo-late",
            fileName: "傍晚.jpg",
            capturedAt: "2026-05-06T18:00:00.000Z",
            latitude: 30.26,
            longitude: 120.18,
          }),
          makePhoto({
            id: "photo-early",
            fileName: "清晨.jpg",
            capturedAt: "2026-05-06T08:00:00.000Z",
            latitude: 30.24,
            longitude: 120.16,
          }),
          makePhoto({
            id: "photo-no-location",
            fileName: "室内.jpg",
            latitude: undefined,
            longitude: undefined,
          }),
        ]}
        selectedPhotoId="photo-late"
        onSelectPhoto={() => undefined}
      />,
    );

    const markers = screen.getAllByTestId("photo-marker");

    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute("data-position", JSON.stringify([30.26, 120.18]));
    expect(markers[0]).toHaveClass("map-photo-marker is-selected");
    expect(within(markers[0]).getByText("傍晚.jpg")).toBeInTheDocument();
    expect(markers[1]).toHaveAttribute("data-position", JSON.stringify([30.24, 120.16]));
    expect(within(markers[1]).getByText("清晨.jpg")).toBeInTheDocument();

    expect(screen.getByTestId("route-line")).toHaveAttribute(
      "data-positions",
      JSON.stringify([
        [30.24, 120.16],
        [30.26, 120.18],
      ]),
    );
  });

  it("selects a photo when its marker is clicked", async () => {
    const user = userEvent.setup();
    const onSelectPhoto = vi.fn();

    render(
      <MapView
        photos={[makePhoto({ id: "photo-click", fileName: "点击.jpg" })]}
        onSelectPhoto={onSelectPhoto}
      />,
    );

    await user.click(screen.getByTestId("photo-marker"));

    expect(onSelectPhoto).toHaveBeenCalledWith("photo-click");
  });

  it("requests a viewport update when geotagged photos change", () => {
    const { rerender } = render(
      <MapView
        photos={[
          makePhoto({ id: "photo-missing", latitude: undefined, longitude: undefined }),
        ]}
        onSelectPhoto={() => undefined}
      />,
    );

    expect(mapControls.fitBounds).not.toHaveBeenCalled();
    expect(mapControls.setView).not.toHaveBeenCalled();

    rerender(
      <MapView
        photos={[
          makePhoto({
            id: "photo-first",
            latitude: 30.24,
            longitude: 120.16,
          }),
          makePhoto({
            id: "photo-second",
            latitude: 30.26,
            longitude: 120.18,
          }),
        ]}
        onSelectPhoto={() => undefined}
      />,
    );

    expect(mapControls.fitBounds).toHaveBeenCalledWith(
      [
        [30.24, 120.16],
        [30.26, 120.18],
      ],
      { padding: [24, 24] },
    );
  });

  it("shows a Chinese privacy notice for remote map tiles", () => {
    render(<MapView photos={[makePhoto()]} onSelectPhoto={() => undefined} />);

    expect(
      screen.getByText("地图可能请求远程瓦片，但不会上传照片或旅行记录。"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toHaveAttribute("data-url", expect.stringContaining("{z}"));
  });
});
