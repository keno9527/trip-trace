import exifr from "exifr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePhotoExif } from "./exif";

vi.mock("exifr", () => ({
  default: {
    parse: vi.fn(),
  },
}));

const parseExif = vi.mocked(exifr.parse);

const makeFile = (): File => new File(["image"], "IMG_0001.jpeg", { type: "image/jpeg" });

describe("parsePhotoExif", () => {
  beforeEach(() => {
    parseExif.mockReset();
  });

  it("returns parsed metadata when time and GPS are present", async () => {
    parseExif.mockResolvedValue({
      DateTimeOriginal: new Date("2026-05-06T10:30:00.000Z"),
      latitude: 31.2304,
      longitude: 121.4737,
    });

    await expect(parsePhotoExif(makeFile())).resolves.toEqual({
      exifStatus: "parsed",
      capturedAt: "2026-05-06T10:30:00.000Z",
      latitude: 31.2304,
      longitude: 121.4737,
    });
  });

  it("marks missing GPS while preserving captured time", async () => {
    parseExif.mockResolvedValue({
      DateTimeOriginal: new Date("2026-05-06T10:30:00.000Z"),
    });

    await expect(parsePhotoExif(makeFile())).resolves.toEqual({
      exifStatus: "missing-gps",
      capturedAt: "2026-05-06T10:30:00.000Z",
    });
  });

  it("marks missing time while preserving coordinates", async () => {
    parseExif.mockResolvedValue({
      latitude: 31.2304,
      longitude: 121.4737,
    });

    await expect(parsePhotoExif(makeFile())).resolves.toEqual({
      exifStatus: "missing-time",
      latitude: 31.2304,
      longitude: 121.4737,
    });
  });

  it("returns failed with empty metadata when parsing throws", async () => {
    parseExif.mockRejectedValue(new Error("bad exif"));

    await expect(parsePhotoExif(makeFile())).resolves.toEqual({
      exifStatus: "failed",
    });
  });
});
