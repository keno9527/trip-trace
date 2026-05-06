import { describe, expect, it } from "vitest";
import { filterPhotosByMembers } from "./members";
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

describe("filterPhotosByMembers", () => {
  it("returns all photos when no member ids are selected", () => {
    const photos = [
      makePhoto({ id: "first", memberIds: ["alice"] }),
      makePhoto({ id: "second", memberIds: ["bob"] }),
      makePhoto({ id: "third", memberIds: [] }),
    ];

    expect(filterPhotosByMembers(photos, [])).toEqual(photos);
  });

  it("returns photos containing one selected member id", () => {
    const photos = [
      makePhoto({ id: "alice-only", memberIds: ["alice"] }),
      makePhoto({ id: "bob-only", memberIds: ["bob"] }),
      makePhoto({ id: "family", memberIds: ["alice", "bob"] }),
    ];

    expect(filterPhotosByMembers(photos, ["alice"]).map((photo) => photo.id))
      .toEqual(["alice-only", "family"]);
  });

  it("returns photos containing any selected member id", () => {
    const photos = [
      makePhoto({ id: "alice", memberIds: ["alice"] }),
      makePhoto({ id: "bob", memberIds: ["bob"] }),
      makePhoto({ id: "charlie", memberIds: ["charlie"] }),
      makePhoto({ id: "untagged", memberIds: [] }),
    ];

    expect(filterPhotosByMembers(photos, ["alice", "bob"]).map(
      (photo) => photo.id,
    )).toEqual(["alice", "bob"]);
  });
});
