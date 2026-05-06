import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhotoAsset } from "../domain/types";
import { TimelinePanel } from "./TimelinePanel";

const makePhoto = (overrides: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id: "photo-1",
  tripId: "trip-1",
  fileName: "IMG_0001.HEIC",
  capturedAt: "2026-05-06T09:00:00.000Z",
  exifStatus: "parsed",
  memberIds: [],
  createdAt: "2026-05-06T10:00:00.000Z",
  ...overrides,
});

afterEach(() => {
  cleanup();
});

describe("TimelinePanel", () => {
  it("shows photos grouped by date", () => {
    render(
      <TimelinePanel
        photos={[
          makePhoto({ id: "photo-1", fileName: "西湖.jpg", capturedAt: "2026-05-06T09:00:00.000Z" }),
          makePhoto({ id: "photo-2", fileName: "夜游.jpg", capturedAt: "2026-05-07T20:00:00.000Z" }),
        ]}
        onSelectPhoto={() => undefined}
      />,
    );

    const firstDateGroup = screen.getByRole("group", { name: "2026-05-06" });
    const secondDateGroup = screen.getByRole("group", { name: "2026-05-07" });

    expect(within(firstDateGroup).getByRole("button", { name: "西湖.jpg" })).toBeInTheDocument();
    expect(within(secondDateGroup).getByRole("button", { name: "夜游.jpg" })).toBeInTheDocument();
  });

  it("shows a thumbnail placeholder for each photo", () => {
    render(
      <TimelinePanel
        photos={[makePhoto({ id: "photo-thumb", fileName: "缩略图测试.jpg" })]}
        onSelectPhoto={() => undefined}
      />,
    );

    expect(screen.getByLabelText("缩略图测试.jpg 缩略图占位")).toBeInTheDocument();
  });

  it("shows unknown-time photos under the Chinese unknown group", () => {
    render(
      <TimelinePanel
        photos={[makePhoto({ id: "photo-unknown", fileName: "旧相机.jpg", capturedAt: undefined })]}
        onSelectPhoto={() => undefined}
      />,
    );

    const unknownGroup = screen.getByRole("group", { name: "未知时间" });

    expect(within(unknownGroup).getByRole("button", { name: "旧相机.jpg" })).toBeInTheDocument();
  });

  it("clicking a photo selects it and exposes the selected state", async () => {
    const user = userEvent.setup();
    const onSelectPhoto = vi.fn();

    render(
      <TimelinePanel
        photos={[makePhoto({ id: "photo-selected", fileName: "合影.jpg" })]}
        selectedPhotoId="photo-selected"
        onSelectPhoto={onSelectPhoto}
      />,
    );

    const photoButton = screen.getByRole("button", { name: "合影.jpg" });

    expect(photoButton).toHaveAttribute("aria-current", "true");

    await user.click(photoButton);

    expect(onSelectPhoto).toHaveBeenCalledWith("photo-selected");
  });
});
