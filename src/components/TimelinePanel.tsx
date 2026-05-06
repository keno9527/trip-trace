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
                  <span
                    className="timeline-photo-thumb"
                    aria-label={`${photo.fileName} 缩略图占位`}
                  />
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
