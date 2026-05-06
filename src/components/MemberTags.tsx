import type { FormEvent } from "react";
import { useState } from "react";
import type { Member } from "../domain/types";

interface MemberTagsProps {
  members: Member[];
  selectedMemberIds: string[];
  selectedPhotoIds: string[];
  onCreateMember: (name: string) => void;
  onToggleMemberFilter: (memberId: string) => void;
  onApplyMemberToSelection: (memberId: string, photoIds: string[]) => void;
}

export const MemberTags = ({
  members,
  selectedMemberIds,
  selectedPhotoIds,
  onCreateMember,
  onToggleMemberFilter,
  onApplyMemberToSelection,
}: MemberTagsProps) => {
  const [memberName, setMemberName] = useState("");
  const hasSelectedPhotos = selectedPhotoIds.length > 0;

  const handleCreateMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = memberName.trim();

    if (!trimmedName) {
      return;
    }

    onCreateMember(trimmedName);
    setMemberName("");
  };

  return (
    <section className="member-tags" aria-labelledby="member-tags-title">
      <h2 id="member-tags-title">家庭成员</h2>

      <form className="member-create-form" onSubmit={handleCreateMember}>
        <label htmlFor="member-name">成员名称</label>
        <div className="member-create-row">
          <input
            id="member-name"
            name="memberName"
            type="text"
            value={memberName}
            onChange={(event) => setMemberName(event.target.value)}
            placeholder="例如：妈妈"
          />
          <button type="submit">添加成员</button>
        </div>
      </form>

      <div className="member-filter-section" aria-label="按成员筛选">
        {members.length === 0 ? (
          <p className="empty-copy">添加成员后可以筛选照片。</p>
        ) : (
          <div className="member-chip-list">
            {members.map((member) => (
              <button
                type="button"
                className={
                  selectedMemberIds.includes(member.id)
                    ? "member-chip is-selected"
                    : "member-chip"
                }
                key={member.id}
                aria-pressed={selectedMemberIds.includes(member.id)}
                onClick={() => onToggleMemberFilter(member.id)}
              >
                {member.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="member-apply-section" aria-label="给选中照片添加成员">
        <p className="member-selection-copy">
          {hasSelectedPhotos
            ? `已选择 ${selectedPhotoIds.length} 张照片`
            : "先在时间轴选择照片。"}
        </p>
        {members.length > 0 ? (
          <div className="member-chip-list">
            {members.map((member) => (
              <button
                type="button"
                className="member-apply-button"
                key={member.id}
                disabled={!hasSelectedPhotos}
                onClick={() => onApplyMemberToSelection(member.id, selectedPhotoIds)}
              >
                添加到 {member.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
