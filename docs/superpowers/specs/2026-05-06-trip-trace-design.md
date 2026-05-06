# Trip Trace Design

Date: 2026-05-06
Status: Draft

## Goal

Build a Chinese-first, PC-first local web app for recording family trips as a memory map. The first version focuses on importing original iPhone photos, extracting capture time and GPS data from EXIF, and showing the trip as a map with a timeline and family member tags.

The app is local-first. It does not require accounts, a backend, cloud sync, collaboration, or public sharing in the first version.

"Family collaboration" in the first version means one maintainer organizes the trip and tags family members for shared browsing. It does not mean multi-user editing.

## Scope

### In Scope

- Create and select trips.
- Import batches of original iPhone photos from the user's computer.
- Extract photo capture time and GPS coordinates from EXIF.
- Show geotagged photos as points on a map.
- Connect geotagged photos by capture time as a memory route.
- Show all imported photos in a date-based timeline.
- Let the user tag photos with family members.
- Filter photos by family member tags.
- Persist trips, photo metadata, thumbnails, display-size image copies, and member tags in browser-local storage.

### Out of Scope

- Cloud sync.
- User accounts.
- Multi-user editing.
- Public sharing pages.
- Native iOS photo library access.
- Real-time GPS recording.
- GPX, KML, or GeoJSON track import.
- Full-resolution long-term photo archive guarantees.
- Advanced manual location repair flows.
- Map point clustering.
- Offline or self-hosted map tiles.

## Product Flow

1. The user opens the PC web app in a browser.
2. If no trip exists, the app shows an empty state with a create-trip action.
3. The user creates a trip with a name and optional date range.
4. The user imports a batch of original iPhone photos.
5. The app parses each file, extracts EXIF capture time and GPS coordinates, and creates a thumbnail or display copy.
6. The app shows an import summary: imported count, geotagged count, missing-location count, and parse-failure count.
7. The user browses the trip through a map and a timeline.
8. Selecting a map point highlights the matching timeline photo. Selecting a timeline photo pans the map to that photo when it has coordinates.
9. The user can assign member tags to selected photos.

## Data Model

### Trip

Represents a family trip.

Fields:

- `id`
- `name`
- `startDate`
- `endDate`
- `createdAt`
- `updatedAt`
- `coverPhotoId`
- `memberIds`
- `mapViewport`

### PhotoAsset

Represents an imported photo and its extracted metadata.

Fields:

- `id`
- `tripId`
- `fileName`
- `capturedAt`
- `latitude`
- `longitude`
- `exifStatus`
- `thumbnailBlob`
- `displayBlob`
- `memberIds`
- `createdAt`

Photos without GPS still belong to the trip and appear in the timeline. They do not appear as map points.

If EXIF parsing fails but the image can still be decoded, the app imports the photo as an unknown-time, no-location photo and reports the EXIF failure in the import summary. If the file cannot be decoded as an image, the app skips it and reports it as unsupported or unreadable.

### Member

Represents a family member tag.

Fields:

- `id`
- `name`
- `color`
- `avatarInitial`
- `createdAt`

Photos can have zero or more member tags.

### TimelineItem

Timeline items are derived from `PhotoAsset` records at runtime. The app groups photos by local capture date and sorts them by capture time. This avoids persisting duplicate timeline state.

## Storage

Use IndexedDB for all first-version persistence. It is a better fit than `localStorage` for structured records and binary blobs.

Persist:

- Trips.
- Members.
- Photo metadata.
- Thumbnails.
- Display-size image blobs suitable for in-app browsing.

The first version stores thumbnails and display-size image copies, not full-resolution original photos. Browser storage can be quota-limited or cleared by the browser. The UI should make it clear that original photos should remain backed up outside the app.

The first version may use remote map tiles through the chosen map provider. The UI should disclose that map display can request remote tile data and that the app still does not upload photos or trip records. Offline or self-hosted tiles are out of scope for the MVP.

The storage layer should be wrapped behind a small module so future cloud sync or export/import can be added without rewriting feature code.

## Interface

Use a PC-first workbench layout:

- Left panel: trip list, current trip summary, and import action.
- Center: map view with photo points, route line, and selected-photo state.
- Right panel: date-grouped photo timeline with thumbnails and member tags.

Primary states:

- No trips yet.
- Trip created but no photos imported.
- Import in progress.
- Import result summary.
- Map and timeline browsing.
- Member tag editing.
- Member tag filtering.

The timeline is the main navigation surface. The map provides spatial context and recall. Member tags support filtering and recognition, but first-version members do not have personal home pages or separate route lines.

All user-facing copy should be Chinese-first for the MVP.

## Technical Architecture

Use React, TypeScript, and Vite for the frontend app.

Recommended modules:

- `trip`: create, select, and update trips.
- `photo-import`: read files, parse EXIF, normalize metadata, and generate thumbnails.
- `map-view`: render photo points, route lines, and selected state.
- `timeline`: group and render photos by date.
- `members`: create member tags, apply tags, and filter photos.
- `storage`: IndexedDB read/write operations.

Use a mature browser map library such as Leaflet or MapLibre. Use a proven EXIF parser instead of hand-parsing binary photo metadata.

## Error Handling

Import should be best-effort and batch-safe. One bad file must not stop the whole import.

Handle:

- Missing GPS coordinates: import the photo, show it in the timeline, omit it from the map.
- Missing capture time: import the photo with an unknown-time status and place it in a fallback timeline section.
- EXIF parse failure: import the photo as unknown-time and no-location if the image can be decoded; include the failure in the import summary.
- Unsupported file type: skip and report.
- Large import batches: show progress and avoid blocking the UI where possible.
- IndexedDB unavailable: show a blocking local-storage error.
- Map tile failure: keep the timeline usable and show a map loading/error state.

## Testing And Verification

Automated tests should cover:

- EXIF metadata normalization.
- Capture-time sorting.
- Timeline grouping by date.
- Member tag filtering.
- Route point ordering.
- IndexedDB storage read/write behavior.

Manual acceptance should verify:

- A trip can be created.
- A batch of original iPhone photos can be imported.
- Geotagged photos appear on the map.
- All imported photos appear in the timeline.
- Map and timeline selection stay in sync.
- Member tags can be applied and filtered.
- Refreshing the browser preserves the trip data.
- The app explains that original photos are not archived and that map tiles may be loaded from a remote provider.

## Open Decisions

- Exact map library: Leaflet is simpler; MapLibre gives more styling control.
- How much import progress detail the UI should show for very large batches.
- Whether version one needs a manual "set location" action for photos missing GPS.
