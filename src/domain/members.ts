import type { PhotoAsset } from "./types";

export const filterPhotosByMembers = (
  photos: PhotoAsset[],
  selectedMemberIds: string[],
): PhotoAsset[] => {
  if (selectedMemberIds.length === 0) {
    return photos;
  }

  const selectedMemberIdSet = new Set(selectedMemberIds);

  return photos.filter((photo) =>
    photo.memberIds.some((memberId) => selectedMemberIdSet.has(memberId)),
  );
};
