import { groupPhotosByDate } from "../domain/timeline";
import type { PhotoAsset } from "../domain/types";

interface TimelinePanelProps {
  photos: PhotoAsset[];
  selectedPhotoId?: string;
  onSelectPhoto: (photoId: string) => void;
}

export const TimelinePanel = ({
  photos,
  selectedPhotoId,
  onSelectPhoto,
}: TimelinePanelProps) => {
  const photoGroups = groupPhotosByDate(photos);

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
            {group.photos.map((photo) => (
              <button
                type="button"
                className={
                  photo.id === selectedPhotoId
                    ? "timeline-photo is-selected"
                    : "timeline-photo"
                }
                key={photo.id}
                aria-current={photo.id === selectedPhotoId ? "true" : undefined}
                onClick={() => onSelectPhoto(photo.id)}
              >
                {photo.fileName}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
