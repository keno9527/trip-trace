import type { PhotoAsset } from "./types";

export interface TimelinePhotoGroup {
  dateLabel: string;
  photos: PhotoAsset[];
}

const UNKNOWN_TIME_LABEL = "未知时间";

const formatLocalDate = (capturedAt: string): string => {
  const date = new Date(capturedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const compareByCapturedAt = (left: PhotoAsset, right: PhotoAsset): number => {
  if (!left.capturedAt || !right.capturedAt) {
    return left.id.localeCompare(right.id);
  }

  const timestampDifference =
    new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime();

  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return left.id.localeCompare(right.id);
};

export const groupPhotosByDate = (
  photos: PhotoAsset[],
): TimelinePhotoGroup[] => {
  const datedPhotos = [...photos]
    .filter(
      (photo): photo is PhotoAsset & { capturedAt: string } =>
        Boolean(photo.capturedAt),
    )
    .sort(compareByCapturedAt);
  const unknownPhotos = [...photos]
    .filter((photo) => !photo.capturedAt)
    .sort((left, right) => left.id.localeCompare(right.id));

  const groups = new Map<string, PhotoAsset[]>();

  for (const photo of datedPhotos) {
    const dateLabel = formatLocalDate(photo.capturedAt);
    const groupPhotos = groups.get(dateLabel) ?? [];

    groups.set(dateLabel, [...groupPhotos, photo]);
  }

  const timelineGroups = Array.from(groups, ([dateLabel, groupPhotos]) => ({
    dateLabel,
    photos: groupPhotos,
  }));

  if (unknownPhotos.length > 0) {
    timelineGroups.push({
      dateLabel: UNKNOWN_TIME_LABEL,
      photos: unknownPhotos,
    });
  }

  return timelineGroups;
};
