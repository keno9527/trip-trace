import type { Member, PhotoAsset, Trip } from "../domain/types";
import { openTripTraceDb, resetTripTraceDb } from "./db";

type StoreName = "trips" | "photos" | "members";

const writeAll = async <T>(storeName: StoreName, values: T[]): Promise<void> => {
  const db = await openTripTraceDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    values.forEach((value) => {
      store.put(value);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

const readAll = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await openTripTraceDb();

  return new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export const saveTrip = async (trip: Trip): Promise<void> => {
  await writeAll("trips", [trip]);
};

export const listTrips = async (): Promise<Trip[]> => readAll<Trip>("trips");

export const savePhotos = async (photos: PhotoAsset[]): Promise<void> => {
  await writeAll("photos", photos);
};

export const listPhotosByTrip = async (tripId: string): Promise<PhotoAsset[]> => {
  const db = await openTripTraceDb();

  return new Promise<PhotoAsset[]>((resolve, reject) => {
    const request = db
      .transaction("photos")
      .objectStore("photos")
      .index("tripId")
      .getAll(IDBKeyRange.only(tripId));

    request.onsuccess = () => resolve(request.result as PhotoAsset[]);
    request.onerror = () => reject(request.error);
  });
};

export const saveMember = async (member: Member): Promise<void> => {
  await writeAll("members", [member]);
};

export const listMembers = async (): Promise<Member[]> => readAll<Member>("members");

export const resetTripTraceDbForTests = resetTripTraceDb;
