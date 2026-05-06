import { useEffect, useRef, useState } from "react";
import { ImportSummary } from "./components/ImportSummary";
import { MapView } from "./components/MapView";
import { MemberTags } from "./components/MemberTags";
import { TimelinePanel } from "./components/TimelinePanel";
import { TripSidebar } from "./components/TripSidebar";
import { filterPhotosByMembers } from "./domain/members";
import type { Member, PhotoAsset, Trip } from "./domain/types";
import { importPhotos, type ImportSummary as ImportSummaryData } from "./photo-import/importPhotos";
import {
  listMembers,
  listPhotosByTrip,
  listTrips,
  saveMember,
  savePhotos,
  saveTrip,
} from "./storage/repositories";

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
  const [importState, setImportState] = useState<"idle" | "importing" | "error">("idle");
  const [importError, setImportError] = useState<string>();
  const [lastImportSummary, setLastImportSummary] = useState<ImportSummaryData>();
  const hasLocalTripChanges = useRef(false);
  const selectedTripIdRef = useRef<string | undefined>(undefined);
  const photoRefreshTokenRef = useRef(0);
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const visiblePhotos = filterPhotosByMembers(photos, selectedMemberIds);
  const selectedVisiblePhotoId =
    selectedPhotoId && visiblePhotos.some((photo) => photo.id === selectedPhotoId)
      ? selectedPhotoId
      : undefined;
  const selectedPhotoIds = selectedVisiblePhotoId ? [selectedVisiblePhotoId] : [];

  selectedTripIdRef.current = selectedTripId;

  useEffect(() => {
    let isMounted = true;

    Promise.all([listTrips(), listMembers()])
      .then(([storedTrips, storedMembers]) => {
        if (!isMounted) {
          return;
        }

        setMembers(storedMembers);

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

  useEffect(() => {
    let isMounted = true;
    const refreshToken = ++photoRefreshTokenRef.current;

    setImportState("idle");
    setImportError(undefined);
    setLastImportSummary(undefined);

    if (!selectedTripId) {
      setPhotos([]);
      setSelectedPhotoId(undefined);
      return () => {
        isMounted = false;
      };
    }

    listPhotosByTrip(selectedTripId)
      .then((storedPhotos) => {
        if (
          isMounted &&
          photoRefreshTokenRef.current === refreshToken &&
          selectedTripIdRef.current === selectedTripId
        ) {
          setPhotos(storedPhotos);
          setSelectedPhotoId(undefined);
        }
      })
      .catch(() => {
        if (
          isMounted &&
          photoRefreshTokenRef.current === refreshToken &&
          selectedTripIdRef.current === selectedTripId
        ) {
          setPhotos([]);
          setSelectedPhotoId(undefined);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTripId]);

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

  const handleCreateMember = async (name: string) => {
    const now = new Date().toISOString();
    const member: Member = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      color: memberColors[members.length % memberColors.length],
      avatarInitial: name.slice(0, 1),
      createdAt: now,
    };

    await saveMember(member);
    setMembers((currentMembers) => [...currentMembers, member]);
  };

  const handleToggleMemberFilter = (memberId: string) => {
    setSelectedMemberIds((currentMemberIds) =>
      currentMemberIds.includes(memberId)
        ? currentMemberIds.filter((currentMemberId) => currentMemberId !== memberId)
        : [...currentMemberIds, memberId],
    );
  };

  const handleApplyMemberToSelection = async (memberId: string, photoIds: string[]) => {
    const selectedPhotoIdSet = new Set(photoIds);
    const updatedPhotos = photos.map((photo) => {
      if (!selectedPhotoIdSet.has(photo.id) || photo.memberIds.includes(memberId)) {
        return photo;
      }

      return {
        ...photo,
        memberIds: [...photo.memberIds, memberId],
      };
    });
    const changedPhotos = updatedPhotos.filter(
      (photo, index) => photo !== photos[index],
    );

    if (changedPhotos.length > 0) {
      await savePhotos(changedPhotos);
      setPhotos(updatedPhotos);
    }
  };

  const handleImportFiles = async (tripId: string, files: FileList) => {
    const importToken = ++photoRefreshTokenRef.current;

    setImportState("importing");
    setImportError(undefined);

    try {
      const result = await importPhotos(tripId, files);

      await savePhotos(result.photos);
      const storedPhotos = await listPhotosByTrip(tripId);

      if (photoRefreshTokenRef.current !== importToken || selectedTripIdRef.current !== tripId) {
        return;
      }

      setPhotos(storedPhotos);
      setLastImportSummary(result.summary);
      setImportState("idle");
    } catch {
      if (photoRefreshTokenRef.current !== importToken || selectedTripIdRef.current !== tripId) {
        return;
      }

      setImportError("照片导入失败，请重试。");
      setImportState("error");
    }
  };

  return (
    <main className="app-shell">
      <TripSidebar
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
        onCreateTrip={handleCreateTrip}
        onImportFiles={selectedTripId ? handleImportFiles : undefined}
      />

      <section className="map-workspace" aria-labelledby="app-title">
        <div className="map-header">
          <h1 id="app-title">Trip Trace</h1>
          {tripLoadState === "loading" ? <p>正在加载本地旅行...</p> : null}
          {tripLoadState === "error" ? <p role="alert">旅行加载失败，请稍后重试。</p> : null}
          <p>{selectedTrip ? `${selectedTrip.name} 的地图将在这里展示。` : "创建旅行后开始整理家庭回忆。"}</p>
        </div>
        <MapView
          photos={visiblePhotos}
          selectedPhotoId={selectedVisiblePhotoId}
          onSelectPhoto={setSelectedPhotoId}
        />
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
            members={members}
            selectedPhotoId={selectedVisiblePhotoId}
            onSelectPhoto={setSelectedPhotoId}
          />
        ) : (
          <p className="empty-copy">暂无旅行。</p>
        )}
        <ImportSummary
          errorMessage={importError}
          isImporting={importState === "importing"}
          summary={lastImportSummary ?? emptyImportSummary}
        />
      </section>
    </main>
  );
}
