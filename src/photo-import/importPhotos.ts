import type { PhotoAsset } from "../domain/types";
import { parsePhotoExif, type ParsedPhotoExif } from "./exif";
import { createDisplayImage, createThumbnail } from "./images";

export interface ImportSummary {
  importedCount: number;
  geotaggedCount: number;
  missingLocationCount: number;
  parseFailureCount: number;
  skippedCount: number;
}

export interface ImportPhotosResult {
  photos: PhotoAsset[];
  summary: ImportSummary;
}

type ImportableFiles = File[] | FileList | ArrayLike<File>;

const emptySummary = (): ImportSummary => ({
  importedCount: 0,
  geotaggedCount: 0,
  missingLocationCount: 0,
  parseFailureCount: 0,
  skippedCount: 0,
});

const isSupportedImage = (file: File): boolean => file.type.startsWith("image/");

const createPhotoId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const summarizeImportedPhoto = (summary: ImportSummary, exif: ParsedPhotoExif): void => {
  summary.importedCount += 1;

  if (exif.latitude !== undefined && exif.longitude !== undefined) {
    summary.geotaggedCount += 1;
  }

  if (exif.exifStatus === "missing-gps") {
    summary.missingLocationCount += 1;
  }

  if (exif.exifStatus === "failed") {
    summary.parseFailureCount += 1;
  }
};

const parseExifBestEffort = async (file: File): Promise<ParsedPhotoExif> => {
  try {
    return await parsePhotoExif(file);
  } catch {
    return {
      exifStatus: "failed",
    };
  }
};

export const importPhotos = async (
  tripId: string,
  files: ImportableFiles,
): Promise<ImportPhotosResult> => {
  const photos: PhotoAsset[] = [];
  const summary = emptySummary();

  for (const file of Array.from(files)) {
    if (!isSupportedImage(file)) {
      summary.skippedCount += 1;
      continue;
    }

    try {
      const [thumbnailBlob, displayBlob] = await Promise.all([
        createThumbnail(file),
        createDisplayImage(file),
      ]);
      const exif = await parseExifBestEffort(file);
      const photo: PhotoAsset = {
        id: createPhotoId(),
        tripId,
        fileName: file.name,
        ...exif,
        thumbnailBlob,
        displayBlob,
        memberIds: [],
        createdAt: new Date().toISOString(),
      };

      photos.push(photo);
      summarizeImportedPhoto(summary, exif);
    } catch {
      summary.skippedCount += 1;
    }
  }

  return { photos, summary };
};
