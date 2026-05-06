import { beforeEach, describe, expect, it } from "vitest";
import type { Member, PhotoAsset, Trip } from "../domain/types";
import {
  listMembers,
  listPhotosByTrip,
  listTrips,
  resetTripTraceDbForTests,
  saveMember,
  savePhotos,
  saveTrip,
} from "./repositories";

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "trip-1",
  name: "上海家庭旅行",
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:00.000Z",
  memberIds: [],
  ...overrides,
});

const makePhoto = (overrides: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id: "photo-1",
  tripId: "trip-1",
  fileName: "IMG_0001.jpeg",
  exifStatus: "parsed",
  memberIds: [],
  createdAt: "2026-05-06T00:00:00.000Z",
  ...overrides,
});

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: "member-1",
  name: "妈妈",
  color: "#2563eb",
  avatarInitial: "妈",
  createdAt: "2026-05-06T00:00:00.000Z",
  ...overrides,
});

describe("Trip Trace repositories", () => {
  beforeEach(async () => {
    await resetTripTraceDbForTests();
  });

  it("returns a saved trip from listTrips", async () => {
    const trip = makeTrip();

    await saveTrip(trip);

    expect(await listTrips()).toEqual([trip]);
  });

  it("returns only photos for the requested trip", async () => {
    const tripPhoto = makePhoto({ id: "photo-trip-1", tripId: "trip-1" });
    const otherTripPhoto = makePhoto({ id: "photo-trip-2", tripId: "trip-2" });

    await savePhotos([tripPhoto, otherTripPhoto]);

    expect(await listPhotosByTrip("trip-1")).toEqual([tripPhoto]);
  });

  it("returns saved members from listMembers", async () => {
    const members = [
      makeMember({ id: "member-1", name: "妈妈", avatarInitial: "妈" }),
      makeMember({ id: "member-2", name: "爸爸", avatarInitial: "爸" }),
    ];

    await saveMember(members[0]);
    await saveMember(members[1]);

    expect(await listMembers()).toEqual(members);
  });

  it("starts each test with reset database state", async () => {
    expect(await listTrips()).toEqual([]);
    expect(await listPhotosByTrip("trip-1")).toEqual([]);
    expect(await listMembers()).toEqual([]);
  });
});
