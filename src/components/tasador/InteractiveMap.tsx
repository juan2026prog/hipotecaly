// ==============================================================================
// HIPOTECALY TASADOR IA - MAPA INTERACTIVO REAL DE COMPARABLES (LEAFLET + OSM)
// ==============================================================================

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AppraisalLocation, AppraisalComparableItem } from '../../lib/tasador/appraisal/appraisalTypes';
import { Navigation, Info, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { calculateHaversineDistanceMeters } from '../../lib/geo/distance';

// Fix de iconos de Leaflet para Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Marcador distintivo para el Inmueble Objetivo
const targetIcon = L.divIcon({
  className: 'custom-target-marker',
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

// Marcador para comparables incluidos / elegibles
const includedIcon = L.divIcon({
  className: 'custom-comp-included-marker',
  html: `
    <div style="
      position: relative;
      width: 26px;
      height: 26px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 6px rgba(16, 185, 129, 0.4);
    "></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

// Marcador para comparables excluidos
const excludedIcon = L.divIcon({
  className: 'custom-comp-excluded-marker',
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      background: #94a3b8;
      border: 2px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(148, 163, 184, 0.4);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Componente para ajustar límites automáticamente (fitBounds)
const MapBoundsController: React.FC<{
  targetCoords: [number, number] | null;
  comparableCoords: [number, number][];
}> = ({ targetCoords, comparableCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const allPoints: [number, number][] = [];
    if (targetCoords) allPoints.push(targetCoords);
    allPoints.push(...comparableCoords);

    if (allPoints.length === 1) {
      map.setView(allPoints[0], 15);
    } else if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, targetCoords, comparableCoords]);

  return null;
};

interface InteractiveMapProps {
  targetLocation: AppraisalLocation;
  comparables: AppraisalComparableItem[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  radiusMeters?: number;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  targetLocation,
  comparables,
  selectedCandidateId,
  onSelectCandidate,
  radiusMeters = 2500,
  className = '',
}) => {
  const hasTargetCoords =
    typeof targetLocation?.latitude === 'number' &&
    typeof targetLocation?.longitude === 'number' &&
    !isNaN(targetLocation.latitude) &&
    !isNaN(targetLocation.longitude) &&
    (targetLocation.latitude !== 0 || targetLocation.longitude !== 0);

  const targetCoords: [number, number] | null = hasTargetCoords
    ? [targetLocation.latitude!, targetLocation.longitude!]
    : null;

  // Filtrar comparables con coordenadas reales válidas
  const geocodedComparables = useMemo(() => {
    return comparables.filter(
      (c) =>
        typeof c.candidateData?.latitude === 'number' &&
        typeof c.candidateData?.longitude === 'number' &&
        !isNaN(c.candidateData.latitude) &&
        !isNaN(c.candidateData.longitude) &&
        (c.candidateData.latitude !== 0 || c.candidateData.longitude !== 0)
    );
  }, [comparables]);

  const missingCoordsCount = comparables.length - geocodedComparables.length;

  const comparableCoords = useMemo(() => {
    return geocodedComparables.map(
      (c) => [c.candidateData.latitude!, c.candidateData.longitude!] as [number, number]
    );
  }, [geocodedComparables]);

  // Coordenadas iniciales para montar el contenedor de mapa si no hay target
  const defaultCenter: [number, number] = targetCoords || [-34.9011, -56.1645];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Header del Mapa */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-[#102d49]" />
          <span className="font-bold text-[#102d49] uppercase tracking-wider text-[11px]">
            Distribución Geoespacial Real (OpenStreetMap)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-slate-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#102d49] inline-block ring-2 ring-[#f4b43b]" />
            <span>Inmueble Objetivo</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Incluido</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-500 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            <span>Excluido</span>
          </span>
          <span className="text-slate-400 font-medium pl-1">
            Radio activo: {(radiusMeters / 1000).toFixed(1)} km ({radiusMeters} m)
          </span>
        </div>
      </div>

      {/* Contenedor del Mapa Leaflet Real */}
      <div className="relative w-full h-[360px] bg-slate-100">
        {!hasTargetCoords && geocodedComparables.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Layers className="w-8 h-8 text-slate-400 mb-2" />
            <p className="font-bold text-sm text-[#102d49]">
              El inmueble todavía no tiene una ubicación geográfica geocodificada.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Ingresá una dirección o ajustá el pin en el formulario para visualizar los comparables en el mapa real.
            </p>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={15}
            scrollWheelZoom={false}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Círculo de Radio Métrico Real desde el Inmueble Objetivo */}
            {hasTargetCoords && (
              <Circle
                center={targetCoords!}
                radius={radiusMeters}
                pathOptions={{
                  color: '#102d49',
                  fillColor: '#102d49',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4 4',
                }}
              />
            )}

            {/* Marker del Inmueble Objetivo */}
            {hasTargetCoords && (
              <Marker position={targetCoords!} icon={targetIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1 text-xs">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f4b43b] text-[#102d49] uppercase tracking-wider block w-fit">
                      INMUEBLE A TASAR
                    </span>
                    <p className="font-bold text-[#102d49] text-xs">
                      {[targetLocation.streetName, targetLocation.streetNumber].filter(Boolean).join(' ') || 'Dirección del Inmueble'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {targetLocation.neighborhood || targetLocation.city}, {targetLocation.department}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                      <span>Lat: {targetLocation.latitude?.toFixed(4)}</span>
                      <span>Lng: {targetLocation.longitude?.toFixed(4)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Markers de Comparables Reales */}
            {geocodedComparables.map((comp) => {
              const compLat = comp.candidateData.latitude!;
              const compLng = comp.candidateData.longitude!;
              const isSelectedInList = selectedCandidateId === comp.id;
              const isIncluded = comp.selected;

              const markerIcon = isSelectedInList ? targetIcon : (isIncluded ? includedIcon : excludedIcon);

              const distanceRealMeters = hasTargetCoords
                ? calculateHaversineDistanceMeters(
                    targetCoords![0],
                    targetCoords![1],
                    compLat,
                    compLng
                  )
                : comp.candidateData.distanceMeters || 0;

              return (
                <Marker
                  key={comp.id}
                  position={[compLat, compLng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => {
                      if (onSelectCandidate) onSelectCandidate(comp.id);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1.5 text-xs min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#102d49] truncate max-w-[150px]">
                          {comp.candidateData.title}
                        </span>
                        <span className="font-mono font-bold text-xs text-emerald-600 shrink-0">
                          USD {comp.candidateData.adjustedPriceUsd?.toLocaleString('es-UY')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p>{comp.candidateData.streetName || comp.candidateData.neighborhood || 'Zona comparable'}</p>
                        <p className="text-slate-500">
                          {comp.candidateData.builtAreaM2} m² • {comp.candidateData.bedrooms} dorms • USD {comp.candidateData.pricePerM2Usd}/m²
                        </p>
                        <p className="font-semibold text-slate-700">
                          Distancia real: {distanceRealMeters} m
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                          Score: {comp.similarityScore}/100
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${
                            isIncluded
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isIncluded ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {isIncluded ? 'INCLUIDO' : 'EXCLUIDO'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Ajuste dinámico de límites */}
            <MapBoundsController
              targetCoords={targetCoords}
              comparableCoords={comparableCoords}
            />
          </MapContainer>
        )}
      </div>

      {/* Footer con aviso de comparables sin GPS */}
      {missingCoordsCount > 0 && (
        <div className="px-4 py-2 bg-amber-50/80 border-t border-amber-200/50 flex items-center space-x-2 text-[11px] text-amber-800">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {missingCoordsCount} de los {comparables.length} comparables no poseen coordenadas GPS verificadas. Se mantienen en el análisis tabular y matricial sin falsear su ubicación en el mapa.
          </span>
        </div>
      )}
    </div>
  );
};
