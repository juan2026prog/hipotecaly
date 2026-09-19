// ==============================================================================
// HIPOTECALY GEOCORE - LOCATION PICKER CON LEAFLET, OSM Y PIN DRAGGABLE
// ==============================================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoService } from '../../lib/geo/geoService';
import { ReverseGeocodeResult } from '../../lib/geo/types';

// Marker Pin Draggable Icon
const draggablePinIcon = L.divIcon({
  className: 'custom-draggable-pin',
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      background: #102d49;
      border: 3px solid #f4b43b;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(16, 45, 73, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Componente para recentrar cuando cambian lat/lng
const MapCenterController: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (map && coords) {
      map.flyTo(coords, 16, { animate: true, duration: 1 });
    }
  }, [map, coords]);

  return null;
};

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number, reverseData?: ReverseGeocodeResult | null) => void;
  addressLabel?: string;
  className?: string;
  readOnly?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  addressLabel,
  className = 'w-full h-64',
  readOnly = false,
}) => {
  const markerRef = useRef<L.Marker>(null);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0);

  const position: [number, number] | null = hasCoords ? [latitude!, longitude!] : null;
  const defaultCenter: [number, number] = position || [-34.9011, -56.1645]; // Montevideo centro

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          const newLat = Number(newLatLng.lat.toFixed(6));
          const newLng = Number(newLatLng.lng.toFixed(6));

          // Reverse geocode al mover pin
          GeoService.getInstance()
            .reverseGeocode(newLat, newLng)
            .then((reverse) => {
              onLocationChange(newLat, newLng, reverse);
            })
            .catch(() => {
              onLocationChange(newLat, newLng, null);
            });
        }
      },
    }),
    [onLocationChange]
  );

  const currentCenter: [number, number] = hasCoords ? [latitude!, longitude!] : defaultCenter;

  return (
    <div className="space-y-2">
      <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}>
        <MapContainer
          center={currentCenter}
          zoom={hasCoords ? 16 : 13}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <Marker
            draggable={!readOnly}
            eventHandlers={!readOnly ? eventHandlers : undefined}
            position={currentCenter}
            icon={draggablePinIcon}
            ref={markerRef}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <p className="font-bold text-[#102d49]">
                  {addressLabel || (hasCoords ? 'Ubicación seleccionada' : 'Ubicar en el mapa')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {currentCenter[0].toFixed(5)}, {currentCenter[1].toFixed(5)}
                </p>
                {!readOnly && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded font-semibold">
                    Arrastrá el pin para calibrar la ubicación exacta.
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {hasCoords && <MapCenterController coords={position} />}
        </MapContainer>
      </div>

      {hasCoords && !readOnly && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Coordenadas: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}</span>
          </span>
          <span className="text-slate-400 italic">Podés arrastrar el marcador en el mapa para ajustar</span>
        </div>
      )}
    </div>
  );
};
