import { describe, expect, it } from "vitest";
import { groupPhotosByDate } from "./timeline";
import type { PhotoAsset } from "./types";

const makePhoto = (overrides: Partial<PhotoAsset>): PhotoAsset => ({
  id: "photo-id",
  tripId: "trip-id",
  fileName: "photo.jpg",
  exifStatus: "parsed",
  memberIds: [],
  createdAt: "2026-05-06T00:00:00.000Z",
  ...overrides,
});

describe("groupPhotosByDate", () => {
  it("groups photos with capturedAt by local capture date", () => {
    const groups = groupPhotosByDate([
      makePhoto({
        id: "morning",
        capturedAt: "2026-05-06T09:00:00.000",
      }),
      makePhoto({
        id: "next-day",
        capturedAt: "2026-05-07T10:00:00.000",
      }),
    ]);

    expect(groups.map((group) => group.dateLabel)).toEqual([
      "2026-05-06",
      "2026-05-07",
    ]);
  });

  it("groups timezone timestamps by UTC calendar date", () => {
    const groups = groupPhotosByDate([
      makePhoto({
        id: "utc-boundary",
        capturedAt: "2026-05-06T00:30:00.000Z",
      }),
    ]);

    expect(groups.map((group) => group.dateLabel)).toEqual(["2026-05-06"]);
  });

  it("uses capturedDate to preserve the original EXIF local shooting date", () => {
    const groups = groupPhotosByDate([
      makePhoto({
        id: "late-night-local",
        capturedAt: "2026-05-05T16:30:00.000Z",
        capturedDate: "2026-05-06",
      }),
    ]);

    expect(groups.map((group) => group.dateLabel)).toEqual(["2026-05-06"]);
  });

  it("sorts photos on the same date by capturedAt ascending", () => {
    const groups = groupPhotosByDate([
      makePhoto({
        id: "late",
        capturedAt: "2026-05-06T20:00:00.000",
      }),
      makePhoto({
        id: "early",
        capturedAt: "2026-05-06T08:00:00.000",
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].photos.map((photo) => photo.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("places photos without capturedAt into the Chinese fallback group", () => {
    const groups = groupPhotosByDate([
      makePhoto({
        id: "unknown",
        capturedAt: undefined,
        exifStatus: "missing-time",
      }),
    ]);

    expect(groups).toEqual([
      {
        dateLabel: "未知时间",
        photos: [
          expect.objectContaining({
            id: "unknown",
          }),
        ],
      },
    ]);
  });
});
