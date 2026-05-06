export type ExifStatus = "parsed" | "missing-gps" | "missing-time" | "failed";

export interface Trip {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  coverPhotoId?: string;
  mapViewport?: { center: [number, number]; zoom: number };
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
}

export interface PhotoAsset {
  id: string;
  tripId: string;
  fileName: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  thumbnailBlob?: Blob;
  displayBlob?: Blob;
  exifStatus: ExifStatus;
  memberIds: string[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  avatarInitial: string;
  createdAt: string;
}
