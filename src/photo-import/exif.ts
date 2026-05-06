import exifr from "exifr";
import type { ExifStatus } from "../domain/types";

export interface ParsedPhotoExif {
  exifStatus: ExifStatus;
  capturedAt?: string;
  capturedDate?: string;
  latitude?: number;
  longitude?: number;
}

type ExifTags = Record<string, unknown>;

interface NormalizedCaptureTime {
  capturedAt: string;
  capturedDate: string;
}

const normalizeDate = (value: unknown): NormalizedCaptureTime | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const capturedAt = value.toISOString();

    return {
      capturedAt,
      capturedDate: capturedAt.slice(0, 10),
    };
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedExifDate = value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
  const date = new Date(normalizedExifDate);
  const capturedDate = normalizedExifDate.slice(0, 10);

  return Number.isNaN(date.getTime())
    ? undefined
    : {
        capturedAt: date.toISOString(),
        capturedDate,
      };
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

const getCaptureTime = (tags: ExifTags): NormalizedCaptureTime | undefined =>
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

    const captureTime = getCaptureTime(tags ?? {});
    const coordinates = getCoordinates(tags ?? {});

    if (!captureTime) {
      return {
        exifStatus: "missing-time",
        ...coordinates,
      };
    }

    if (coordinates.latitude === undefined || coordinates.longitude === undefined) {
      return {
        exifStatus: "missing-gps",
        ...captureTime,
      };
    }

    return {
      exifStatus: "parsed",
      ...captureTime,
      ...coordinates,
    };
  } catch {
    return {
      exifStatus: "failed",
    };
  }
};
