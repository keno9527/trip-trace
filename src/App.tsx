import { useEffect, useRef, useState } from "react";
import { ImportSummary } from "./components/ImportSummary";
import { MemberTags } from "./components/MemberTags";
import { TimelinePanel } from "./components/TimelinePanel";
import { TripSidebar } from "./components/TripSidebar";
import { filterPhotosByMembers } from "./domain/members";
import type { Member, PhotoAsset, Trip } from "./domain/types";
import { listTrips, saveTrip } from "./storage/repositories";

const emptyImportSummary = {
  importedCount: 0,
  geotaggedCount: 0,
  missingLocationCount: 0,
  parseFailureCount: 0,
  skippedCount: 0,
};

const createTripId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const memberColors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea"];

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>();
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [tripLoadState, setTripLoadState] = useState<"loading" | "ready" | "error">("loading");
  const hasLocalTripChanges = useRef(false);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const visiblePhotos = filterPhotosByMembers(photos, selectedMemberIds);
  const selectedPhotoIds = selectedPhotoId ? [selectedPhotoId] : [];

  useEffect(() => {
    let isMounted = true;

    listTrips()
      .then((storedTrips) => {
        if (!isMounted) {
          return;
        }

        if (!hasLocalTripChanges.current) {
          setTrips(storedTrips);
          setSelectedTripId((currentTripId) => currentTripId ?? storedTrips[0]?.id);
        }

        setTripLoadState("ready");
      })
      .catch(() => {
        if (isMounted) {
          setTripLoadState("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateTrip = async (name: string) => {
    const now = new Date().toISOString();
    const trip: Trip = {
      id: createTripId(),
      name,
      createdAt: now,
      updatedAt: now,
      memberIds: [],
    };

    hasLocalTripChanges.current = true;
    await saveTrip(trip);
    setTrips((currentTrips) => [...currentTrips, trip]);
    setSelectedTripId(trip.id);
  };

  const handleCreateMember = (name: string) => {
    const now = new Date().toISOString();
    const member: Member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      color: memberColors[members.length % memberColors.length],
      avatarInitial: name.slice(0, 1),
      createdAt: now,
    };

    setMembers((currentMembers) => [...currentMembers, member]);
  };

  const handleToggleMemberFilter = (memberId: string) => {
    setSelectedMemberIds((currentMemberIds) =>
      currentMemberIds.includes(memberId)
        ? currentMemberIds.filter((currentMemberId) => currentMemberId !== memberId)
        : [...currentMemberIds, memberId],
    );
  };

  const handleApplyMemberToSelection = (memberId: string, photoIds: string[]) => {
    const selectedPhotoIdSet = new Set(photoIds);

    setPhotos((currentPhotos) =>
      currentPhotos.map((photo) => {
        if (!selectedPhotoIdSet.has(photo.id) || photo.memberIds.includes(memberId)) {
          return photo;
        }

        return {
          ...photo,
          memberIds: [...photo.memberIds, memberId],
        };
      }),
    );
  };

  return (
    <main className="app-shell">
      <TripSidebar
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
        onCreateTrip={handleCreateTrip}
      />

      <section className="map-workspace" aria-labelledby="app-title">
        <div>
          <h1 id="app-title">Trip Trace</h1>
          {tripLoadState === "loading" ? <p>正在加载本地旅行...</p> : null}
          {tripLoadState === "error" ? <p role="alert">旅行加载失败，请稍后重试。</p> : null}
          <p>{selectedTrip ? `${selectedTrip.name} 的地图将在这里展示。` : "创建旅行后开始整理家庭回忆。"}</p>
        </div>
      </section>

      <section className="timeline-workspace" aria-labelledby="timeline-title">
        <h2 id="timeline-title">时间轴</h2>
        <MemberTags
          members={members}
          selectedMemberIds={selectedMemberIds}
          selectedPhotoIds={selectedPhotoIds}
          onCreateMember={handleCreateMember}
          onToggleMemberFilter={handleToggleMemberFilter}
          onApplyMemberToSelection={handleApplyMemberToSelection}
        />
        {selectedTrip ? (
          <TimelinePanel
            photos={visiblePhotos}
            selectedPhotoId={selectedPhotoId}
            onSelectPhoto={setSelectedPhotoId}
          />
        ) : (
          <p className="empty-copy">暂无旅行。</p>
        )}
        <ImportSummary summary={emptyImportSummary} />
      </section>
    </main>
  );
}
