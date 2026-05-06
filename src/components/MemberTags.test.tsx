import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Member } from "../domain/types";
import { MemberTags } from "./MemberTags";

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: "member-1",
  name: "妈妈",
  color: "#2563eb",
  avatarInitial: "妈",
  createdAt: "2026-05-06T10:00:00.000Z",
  ...overrides,
});

afterEach(() => {
  cleanup();
});

describe("MemberTags", () => {
  it("creates a member tag from an entered name", async () => {
    const user = userEvent.setup();
    const onCreateMember = vi.fn();

    render(
      <MemberTags
        members={[]}
        selectedMemberIds={[]}
        selectedPhotoIds={[]}
        onCreateMember={onCreateMember}
        onToggleMemberFilter={() => undefined}
        onApplyMemberToSelection={() => undefined}
      />,
    );

    await user.type(screen.getByLabelText("成员名称"), "妈妈");
    await user.click(screen.getByRole("button", { name: "添加成员" }));

    expect(onCreateMember).toHaveBeenCalledWith("妈妈");
  });

  it("toggles a member filter through the filter callback", async () => {
    const user = userEvent.setup();
    const onToggleMemberFilter = vi.fn();

    render(
      <MemberTags
        members={[makeMember({ id: "member-mom", name: "妈妈" })]}
        selectedMemberIds={["member-mom"]}
        selectedPhotoIds={[]}
        onCreateMember={() => undefined}
        onToggleMemberFilter={onToggleMemberFilter}
        onApplyMemberToSelection={() => undefined}
      />,
    );

    const filterButton = screen.getByRole("button", { name: "妈妈" });

    expect(filterButton).toHaveAttribute("aria-pressed", "true");

    await user.click(filterButton);

    expect(onToggleMemberFilter).toHaveBeenCalledWith("member-mom");
  });

  it("applies a member to selected photos through the apply callback", async () => {
    const user = userEvent.setup();
    const onApplyMemberToSelection = vi.fn();

    render(
      <MemberTags
        members={[makeMember({ id: "member-dad", name: "爸爸" })]}
        selectedMemberIds={[]}
        selectedPhotoIds={["photo-1", "photo-2"]}
        onCreateMember={() => undefined}
        onToggleMemberFilter={() => undefined}
        onApplyMemberToSelection={onApplyMemberToSelection}
      />,
    );

    await user.click(screen.getByRole("button", { name: "添加到 爸爸" }));

    expect(onApplyMemberToSelection).toHaveBeenCalledWith("member-dad", [
      "photo-1",
      "photo-2",
    ]);
  });
});
