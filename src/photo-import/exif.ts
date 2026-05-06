import exifr from "exifr";
import type { ExifStatus } from "../domain/types";

export interface ParsedPhotoExif {
  exifStatus: ExifStatus;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
}

type ExifTags = Record<string, unknown>;

const normalizeDate = (value: unknown): string | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedExifDate = value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
  const date = new Date(normalizedExifDate);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const decimalFromDms = (value: number[]): number | undefined => {
  if (value.length < 3 || value.some((part) => typeof part !== "number")) {
    return undefined;
  }

  return value[0] + value[1] / 60 + value[2] / 3600;
};

const normalizeCoordinate = (value: unknown, ref: unknown): number | undefined => {
  const coordinate =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Array.isArray(value)
          ? decimalFromDms(value)
          : undefined;

  if (coordinate === undefined || Number.isNaN(coordinate)) {
    return undefined;
  }

  return ref === "S" || ref === "W" ? -Math.abs(coordinate) : coordinate;
};

const getCapturedAt = (tags: ExifTags): string | undefined =>
  normalizeDate(
    tags.DateTimeOriginal ??
      tags.CreateDate ??
      tags.DateTimeDigitized ??
      tags.ModifyDate ??
      tags.DateTime,
  );

const getCoordinates = (tags: ExifTags): Pick<ParsedPhotoExif, "latitude" | "longitude"> => {
  const latitude = normalizeCoordinate(tags.latitude ?? tags.GPSLatitude, tags.GPSLatitudeRef);
  const longitude = normalizeCoordinate(tags.longitude ?? tags.GPSLongitude, tags.GPSLongitudeRef);

  return latitude === undefined || longitude === undefined ? {} : { latitude, longitude };
};

export const parsePhotoExif = async (file: File): Promise<ParsedPhotoExif> => {
  try {
    const tags = (await exifr.parse(file, {
      exif: true,
      gps: true,
      mergeOutput: true,
      reviveValues: true,
    })) as ExifTags | undefined;

    const capturedAt = getCapturedAt(tags ?? {});
    const coordinates = getCoordinates(tags ?? {});

    if (!capturedAt) {
      return {
        exifStatus: "missing-time",
        ...coordinates,
      };
    }

    if (coordinates.latitude === undefined || coordinates.longitude === undefined) {
      return {
        exifStatus: "missing-gps",
        capturedAt,
      };
    }

    return {
      exifStatus: "parsed",
      capturedAt,
      ...coordinates,
    };
  } catch {
    return {
      exifStatus: "failed",
    };
  }
};
