import type { PhotoAsset } from "./types";

export interface RoutePoint {
  photoId: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
}

const hasRouteFields = (
  photo: PhotoAsset,
): photo is PhotoAsset & {
  latitude: number;
  longitude: number;
  capturedAt: string;
} =>
  photo.latitude !== undefined &&
  photo.longitude !== undefined &&
  photo.capturedAt !== undefined;

export const buildRoutePoints = (photos: PhotoAsset[]): RoutePoint[] =>
  photos
    .filter(hasRouteFields)
    .map((photo) => ({
      photoId: photo.id,
      latitude: photo.latitude,
      longitude: photo.longitude,
      capturedAt: photo.capturedAt,
    }))
    .sort(
      (left, right) =>
        new Date(left.capturedAt).getTime() -
        new Date(right.capturedAt).getTime(),
    );
