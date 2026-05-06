import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { Marker } from "react-leaflet/Marker";
import { Polyline } from "react-leaflet/Polyline";
import { Popup } from "react-leaflet/Popup";
import { TileLayer } from "react-leaflet/TileLayer";
import { buildRoutePoints } from "../domain/route";
import type { PhotoAsset } from "../domain/types";

interface MapViewProps {
  photos: PhotoAsset[];
  selectedPhotoId?: string;
  onSelectPhoto: (photoId: string) => void;
}

const hasCoordinates = (
  photo: PhotoAsset,
): photo is PhotoAsset & { latitude: number; longitude: number } =>
  photo.latitude !== undefined && photo.longitude !== undefined;

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileAttribution = "&copy; OpenStreetMap contributors";

export const MapView = ({ photos, selectedPhotoId, onSelectPhoto }: MapViewProps) => {
  const geotaggedPhotos = photos.filter(hasCoordinates);
  const routePositions = buildRoutePoints(photos).map((point) => [
    point.latitude,
    point.longitude,
  ]) as [number, number][];
  const mapCenter: [number, number] =
    geotaggedPhotos.length > 0
      ? [geotaggedPhotos[0].latitude, geotaggedPhotos[0].longitude]
      : [35.8617, 104.1954];

  return (
    <div className="map-view">
      <MapContainer
        center={mapCenter}
        className="map-canvas"
        scrollWheelZoom={false}
        zoom={geotaggedPhotos.length > 0 ? 12 : 4}
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />
        {routePositions.length > 1 ? (
          <Polyline className="map-route-line" positions={routePositions} />
        ) : null}
        {geotaggedPhotos.map((photo) => {
          const isSelected = photo.id === selectedPhotoId;
          const markerIcon = divIcon({
            className: isSelected ? "map-photo-marker is-selected" : "map-photo-marker",
            html: "<span></span>",
          });

          return (
            <Marker
              eventHandlers={{ click: () => onSelectPhoto(photo.id) }}
              icon={markerIcon}
              key={photo.id}
              position={[photo.latitude, photo.longitude]}
              title={photo.fileName}
            >
              <Popup>{photo.fileName}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {geotaggedPhotos.length === 0 ? (
        <div className="map-empty-state">
          <h2>暂无带定位的照片</h2>
          <p>导入包含 GPS 信息的照片后，路线会显示在地图上。</p>
        </div>
      ) : null}

      <p className="map-privacy-notice">
        地图可能请求远程瓦片，但不会上传照片或旅行记录。
      </p>
    </div>
  );
};
