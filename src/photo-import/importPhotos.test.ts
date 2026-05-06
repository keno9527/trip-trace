import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDisplayImage, createThumbnail } from "./images";
import { parsePhotoExif } from "./exif";
import { importPhotos } from "./importPhotos";

vi.mock("./exif", () => ({
  parsePhotoExif: vi.fn(),
}));

vi.mock("./images", () => ({
  createThumbnail: vi.fn(),
  createDisplayImage: vi.fn(),
}));

const parseExif = vi.mocked(parsePhotoExif);
const createThumbnailMock = vi.mocked(createThumbnail);
const createDisplayImageMock = vi.mocked(createDisplayImage);
const photoId = "00000000-0000-4000-8000-000000000000";

const makeFile = (name: string, type = "image/jpeg"): File => new File(["image"], name, { type });
const makeBlob = (name: string): Blob => new Blob([name], { type: "image/jpeg" });

describe("importPhotos", () => {
  beforeEach(() => {
    parseExif.mockReset();
    createThumbnailMock.mockReset();
    createDisplayImageMock.mockReset();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(photoId);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("imports best-effort and summarizes geotagged, missing GPS, parse failures, and skipped files", async () => {
    const thumbnailBlob = makeBlob("thumb");
    const displayBlob = makeBlob("display");
    createThumbnailMock.mockResolvedValue(thumbnailBlob);
    createDisplayImageMock.mockResolvedValue(displayBlob);
    parseExif
      .mockResolvedValueOnce({
        exifStatus: "parsed",
        capturedAt: "2026-05-06T10:30:00.000Z",
        latitude: 31.2304,
        longitude: 121.4737,
      })
      .mockResolvedValueOnce({
        exifStatus: "missing-gps",
        capturedAt: "2026-05-06T11:00:00.000Z",
      })
      .mockResolvedValueOnce({
        exifStatus: "failed",
      });

    const result = await importPhotos("trip-1", [
      makeFile("geotagged.jpg"),
      makeFile("missing-gps.jpg"),
      makeFile("failed-exif.jpg"),
      makeFile("notes.txt", "text/plain"),
    ]);

    expect(result.summary).toEqual({
      importedCount: 3,
      geotaggedCount: 1,
      missingLocationCount: 2,
      parseFailureCount: 1,
      skippedCount: 1,
    });
    expect(result.photos).toEqual([
      {
        id: photoId,
        tripId: "trip-1",
        fileName: "geotagged.jpg",
        capturedAt: "2026-05-06T10:30:00.000Z",
        latitude: 31.2304,
        longitude: 121.4737,
        thumbnailBlob,
        displayBlob,
        exifStatus: "parsed",
        memberIds: [],
        createdAt: "2026-05-06T12:00:00.000Z",
      },
      {
        id: photoId,
        tripId: "trip-1",
        fileName: "missing-gps.jpg",
        capturedAt: "2026-05-06T11:00:00.000Z",
        thumbnailBlob,
        displayBlob,
        exifStatus: "missing-gps",
        memberIds: [],
        createdAt: "2026-05-06T12:00:00.000Z",
      },
      {
        id: photoId,
        tripId: "trip-1",
        fileName: "failed-exif.jpg",
        thumbnailBlob,
        displayBlob,
        exifStatus: "failed",
        memberIds: [],
        createdAt: "2026-05-06T12:00:00.000Z",
      },
    ]);
  });

  it("skips supported image files when image copies cannot be generated", async () => {
    createThumbnailMock.mockRejectedValue(new Error("decode failed"));

    const result = await importPhotos("trip-1", [makeFile("broken.jpg")]);

    expect(result.summary).toEqual({
      importedCount: 0,
      geotaggedCount: 0,
      missingLocationCount: 0,
      parseFailureCount: 0,
      skippedCount: 1,
    });
    expect(result.photos).toEqual([]);
    expect(parseExif).not.toHaveBeenCalled();
  });

  it("counts imported photos without coordinates as missing location", async () => {
    createThumbnailMock.mockResolvedValue(makeBlob("thumb"));
    createDisplayImageMock.mockResolvedValue(makeBlob("display"));
    parseExif.mockResolvedValue({
      exifStatus: "missing-time",
    });

    const result = await importPhotos("trip-1", [makeFile("no-exif.jpg")]);

    expect(result.summary).toEqual({
      importedCount: 1,
      geotaggedCount: 0,
      missingLocationCount: 1,
      parseFailureCount: 0,
      skippedCount: 0,
    });
    expect(result.photos[0]).toMatchObject({
      fileName: "no-exif.jpg",
      exifStatus: "missing-time",
    });
    expect(result.photos[0].latitude).toBeUndefined();
    expect(result.photos[0].longitude).toBeUndefined();
  });
});
