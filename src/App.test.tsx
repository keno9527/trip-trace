import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { PhotoAsset, Trip } from "./domain/types";
import { importPhotos } from "./photo-import/importPhotos";
import {
  listPhotosByTrip,
  listTrips,
  savePhotos,
  saveTrip,
} from "./storage/repositories";

const mapViewSnapshots = vi.hoisted(() => [] as Array<{
  photos: PhotoAsset[];
  selectedPhotoId?: string;
}>);

vi.mock("./components/MapView", () => ({
  MapView: ({
    photos,
    selectedPhotoId,
    onSelectPhoto,
  }: {
    photos: PhotoAsset[];
    selectedPhotoId?: string;
    onSelectPhoto: (photoId: string) => void;
  }) => {
    mapViewSnapshots.push({ photos, selectedPhotoId });

    return (
      <section aria-label="测试地图">
        {photos.map((photo) => (
          <button
            type="button"
            aria-current={photo.id === selectedPhotoId ? "true" : undefined}
            aria-label={`地图照片：${photo.fileName}`}
            key={photo.id}
            onClick={() => onSelectPhoto(photo.id)}
          >
            {photo.fileName}
          </button>
        ))}
      </section>
    );
  },
}));

vi.mock("./photo-import/importPhotos", () => ({
  importPhotos: vi.fn(),
}));

vi.mock("./storage/repositories", () => ({
  listPhotosByTrip: vi.fn(),
  listTrips: vi.fn(),
  savePhotos: vi.fn(),
  saveTrip: vi.fn(),
}));

const mockedImportPhotos = vi.mocked(importPhotos);
const mockedListPhotosByTrip = vi.mocked(listPhotosByTrip);
const mockedListTrips = vi.mocked(listTrips);
const mockedSavePhotos = vi.mocked(savePhotos);
const mockedSaveTrip = vi.mocked(saveTrip);

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "trip-1",
  name: "杭州亲子游",
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:00.000Z",
  memberIds: [],
  ...overrides,
});

const makePhoto = (overrides: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id: "photo-1",
  tripId: "trip-1",
  fileName: "西湖.jpg",
  capturedAt: "2026-05-06T09:00:00.000Z",
  latitude: 30.249,
  longitude: 120.163,
  exifStatus: "parsed",
  memberIds: [],
  createdAt: "2026-05-06T10:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  mapViewSnapshots.length = 0;
  mockedImportPhotos.mockReset();
  mockedListPhotosByTrip.mockReset();
  mockedListTrips.mockReset();
  mockedSavePhotos.mockReset();
  mockedSaveTrip.mockReset();

  mockedListTrips.mockResolvedValue([]);
  mockedListPhotosByTrip.mockResolvedValue([]);
  mockedSavePhotos.mockResolvedValue();
  mockedSaveTrip.mockResolvedValue();
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("renders the Chinese empty state", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Trip Trace" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "创建第一趟旅行" })).toBeInTheDocument();
  });

  it("shows a Chinese importing state after selecting files for an existing trip", async () => {
    const user = userEvent.setup();
    const trip = makeTrip();
    let resolveImport: (value: Awaited<ReturnType<typeof importPhotos>>) => void = () => undefined;

    mockedListTrips.mockResolvedValue([trip]);
    mockedImportPhotos.mockReturnValue(
      new Promise((resolve) => {
        resolveImport = resolve;
      }),
    );

    render(<App />);

    const fileInput = await screen.findByLabelText("导入照片");
    await user.upload(fileInput, new File(["photo"], "西湖.jpg", { type: "image/jpeg" }));

    expect(screen.getByText("正在导入")).toBeInTheDocument();
    expect(mockedImportPhotos).toHaveBeenCalledWith(trip.id, expect.any(FileList));

    resolveImport({
      photos: [],
      summary: {
        importedCount: 0,
        geotaggedCount: 0,
        missingLocationCount: 0,
        parseFailureCount: 0,
        skippedCount: 0,
      },
    });
  });

  it("shows the import summary and imported photos in the timeline after import completes", async () => {
    const user = userEvent.setup();
    const trip = makeTrip();
    const importedPhoto = makePhoto({ fileName: "断桥.jpg" });

    mockedListTrips.mockResolvedValue([trip]);
    mockedListPhotosByTrip
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([importedPhoto]);
    mockedImportPhotos.mockResolvedValue({
      photos: [importedPhoto],
      summary: {
        importedCount: 1,
        geotaggedCount: 1,
        missingLocationCount: 0,
        parseFailureCount: 0,
        skippedCount: 0,
      },
    });

    render(<App />);

    await user.upload(
      await screen.findByLabelText("导入照片"),
      new File(["photo"], "断桥.jpg", { type: "image/jpeg" }),
    );

    expect(await screen.findByRole("button", { name: "断桥.jpg" })).toBeInTheDocument();
    expect(screen.getByText("导入摘要")).toBeInTheDocument();
    expect(screen.getByText("已导入")).toBeInTheDocument();
    expect(screen.getByText("带位置")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(mockedSavePhotos).toHaveBeenCalledWith([importedPhoto]);
    expect(mockedListPhotosByTrip).toHaveBeenLastCalledWith(trip.id);
  });

  it("shares selected photo state between the timeline and map", async () => {
    const user = userEvent.setup();
    const trip = makeTrip();
    const firstPhoto = makePhoto({ id: "photo-1", fileName: "西湖.jpg" });
    const secondPhoto = makePhoto({ id: "photo-2", fileName: "灵隐寺.jpg" });

    mockedListTrips.mockResolvedValue([trip]);
    mockedListPhotosByTrip.mockResolvedValue([firstPhoto, secondPhoto]);

    render(<App />);

    const timelinePhoto = await screen.findByRole("button", { name: "西湖.jpg" });
    await user.click(timelinePhoto);

    expect(screen.getByRole("button", { name: "地图照片：西湖.jpg" })).toHaveAttribute("aria-current", "true");
    expect(mapViewSnapshots.at(-1)?.selectedPhotoId).toBe("photo-1");

    await user.click(screen.getByRole("button", { name: "地图照片：灵隐寺.jpg" }));

    expect(screen.getByRole("button", { name: "灵隐寺.jpg" })).toHaveAttribute("aria-current", "true");
    expect(mapViewSnapshots.at(-1)?.selectedPhotoId).toBe("photo-2");
  });
});
