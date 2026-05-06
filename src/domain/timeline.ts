import type { PhotoAsset } from "./types";

export interface TimelinePhotoGroup {
  dateLabel: string;
  photos: PhotoAsset[];
}

const UNKNOWN_TIME_LABEL = "未知时间";

const hasExplicitTimezone = (capturedAt: string): boolean =>
  /(?:Z|[+-]\d{2}:\d{2})$/u.test(capturedAt);

const formatCaptureDate = (capturedAt: string): string => {
  if (hasExplicitTimezone(capturedAt)) {
    return new Date(capturedAt).toISOString().slice(0, 10);
  }

  return capturedAt.slice(0, 10);
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
    const dateLabel = formatCaptureDate(photo.capturedAt);
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
