const DB_NAME = "trip-trace";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | undefined;

export const openTripTraceDb = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("trips")) {
        db.createObjectStore("trips", { keyPath: "id" });
      }

      let photosStore: IDBObjectStore;
      if (db.objectStoreNames.contains("photos")) {
        photosStore = request.transaction!.objectStore("photos");
      } else {
        photosStore = db.createObjectStore("photos", { keyPath: "id" });
      }

      if (!photosStore.indexNames.contains("tripId")) {
        photosStore.createIndex("tripId", "tripId");
      }

      if (!db.objectStoreNames.contains("members")) {
        db.createObjectStore("members", { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = undefined;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = undefined;
      reject(request.error);
    };
  });

  return dbPromise;
};

export const resetTripTraceDb = async (): Promise<void> => {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = undefined;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Trip Trace database reset was blocked."));
  });
};
