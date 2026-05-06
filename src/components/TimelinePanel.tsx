import { useEffect, useMemo } from "react";
import { groupPhotosByDate } from "../domain/timeline";
import type { Member, PhotoAsset } from "../domain/types";

interface TimelinePanelProps {
  photos: PhotoAsset[];
  members?: Member[];
  selectedPhotoId?: string;
  onSelectPhoto: (photoId: string) => void;
}

export const TimelinePanel = ({
  photos,
  members = [],
  selectedPhotoId,
  onSelectPhoto,
}: TimelinePanelProps) => {
  const photoGroups = groupPhotosByDate(photos);
  const membersById = new Map(members.map((member) => [member.id, member]));
  const photoPreviewUrls = useMemo(
    () =>
      new Map(
        photos
          .map((photo) => {
            const blob = photo.thumbnailBlob ?? photo.displayBlob;

            return blob ? [photo.id, URL.createObjectURL(blob)] : undefined;
          })
          .filter((entry): entry is [string, string] => Boolean(entry)),
      ),
    [photos],
  );

  useEffect(
    () => () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    },
    [photoPreviewUrls],
  );

  if (photoGroups.length === 0) {
    return <p className="empty-copy">导入照片后会按拍摄日期显示在这里。</p>;
  }

  return (
    <div className="timeline-panel">
      {photoGroups.map((group) => (
        <section
          className="timeline-date-group"
          key={group.dateLabel}
          aria-label={group.dateLabel}
          role="group"
        >
          <h3>{group.dateLabel}</h3>
          <div className="timeline-photo-list">
            {group.photos.map((photo) => {
              const photoMembers = photo.memberIds
                .map((memberId) => membersById.get(memberId))
                .filter((member): member is Member => Boolean(member));
              const previewUrl = photoPreviewUrls.get(photo.id);

              return (
                <button
                  type="button"
                  className={
                    photo.id === selectedPhotoId
                      ? "timeline-photo is-selected"
                      : "timeline-photo"
                  }
                  key={photo.id}
                  aria-current={photo.id === selectedPhotoId ? "true" : undefined}
                  aria-label={photo.fileName}
                  onClick={() => onSelectPhoto(photo.id)}
                >
                  {previewUrl ? (
                    <img
                      className="timeline-photo-thumb"
                      src={previewUrl}
                      alt={`${photo.fileName} 缩略图`}
                    />
                  ) : (
                    <span
                      className="timeline-photo-thumb"
                      aria-label={`${photo.fileName} 缩略图占位`}
                    />
                  )}
                  <span className="timeline-photo-content">
                    <span className="timeline-photo-name">{photo.fileName}</span>
                    {photoMembers.length > 0 ? (
                      <span className="timeline-member-tags" aria-label="照片成员标签">
                        {photoMembers.map((member) => (
                          <span
                            className="timeline-member-tag"
                            key={member.id}
                            aria-label={`成员标签：${member.name}`}
                          >
                            {member.name}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
