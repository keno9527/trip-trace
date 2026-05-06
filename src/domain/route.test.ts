import { describe, expect, it } from "vitest";
import { buildRoutePoints } from "./route";
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

describe("buildRoutePoints", () => {
  it("only keeps photos with latitude, longitude, and capturedAt", () => {
    const routePoints = buildRoutePoints([
      makePhoto({
        id: "complete",
        latitude: 31.2304,
        longitude: 121.4737,
        capturedAt: "2026-05-06T09:00:00.000Z",
      }),
      makePhoto({
        id: "missing-latitude",
        longitude: 121.4737,
        capturedAt: "2026-05-06T10:00:00.000Z",
      }),
      makePhoto({
        id: "missing-longitude",
        latitude: 31.2304,
        capturedAt: "2026-05-06T11:00:00.000Z",
      }),
      makePhoto({
        id: "missing-time",
        latitude: 31.2304,
        longitude: 121.4737,
      }),
    ]);

    expect(routePoints).toEqual([
      {
        photoId: "complete",
        latitude: 31.2304,
        longitude: 121.4737,
        capturedAt: "2026-05-06T09:00:00.000Z",
      },
    ]);
  });

  it("sorts route points by capturedAt ascending", () => {
    const routePoints = buildRoutePoints([
      makePhoto({
        id: "later",
        latitude: 39.9042,
        longitude: 116.4074,
        capturedAt: "2026-05-07T18:30:00.000Z",
      }),
      makePhoto({
        id: "earlier",
        latitude: 31.2304,
        longitude: 121.4737,
        capturedAt: "2026-05-06T09:00:00.000Z",
      }),
    ]);

    expect(routePoints.map((point) => point.photoId)).toEqual([
      "earlier",
      "later",
    ]);
  });

  it("sorts equal capturedAt route points by photoId ascending", () => {
    const routePoints = buildRoutePoints([
      makePhoto({
        id: "z-photo",
        latitude: 39.9042,
        longitude: 116.4074,
        capturedAt: "2026-05-06T09:00:00.000Z",
      }),
      makePhoto({
        id: "a-photo",
        latitude: 31.2304,
        longitude: 121.4737,
        capturedAt: "2026-05-06T09:00:00.000Z",
      }),
    ]);

    expect(routePoints.map((point) => point.photoId)).toEqual([
      "a-photo",
      "z-photo",
    ]);
  });

  it("retains route points with zero latitude and longitude", () => {
    const routePoints = buildRoutePoints([
      makePhoto({
        id: "zero-coordinates",
        latitude: 0,
        longitude: 0,
        capturedAt: "2026-05-06T09:00:00.000Z",
      }),
    ]);

    expect(routePoints).toEqual([
      {
        photoId: "zero-coordinates",
        latitude: 0,
        longitude: 0,
        capturedAt: "2026-05-06T09:00:00.000Z",
      },
    ]);
  });

  it("returns only photoId, latitude, longitude, and capturedAt", () => {
    const [routePoint] = buildRoutePoints([
      makePhoto({
        id: "photo-with-extra-fields",
        fileName: "extra.jpg",
        latitude: 35.6762,
        longitude: 139.6503,
        capturedAt: "2026-05-08T12:00:00.000Z",
        memberIds: ["alice"],
      }),
    ]);

    expect(Object.keys(routePoint)).toEqual([
      "photoId",
      "latitude",
      "longitude",
      "capturedAt",
    ]);
  });
});
