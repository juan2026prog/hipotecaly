// ==============================================================================
// HIPOTECALY TASADOR IA - MAPA INTERACTIVO DE COMPARABLES
// Proyección Mercator con marcadores bidireccionales y soporte offline
// ==============================================================================

import React, { useState } from 'react';
import { AppraisalLocation, AppraisalComparableItem } from '../../lib/tasador/appraisal/appraisalTypes';
import { Navigation, Info } from 'lucide-react';

interface InteractiveMapProps {
  targetLocation: AppraisalLocation;
  comparables: AppraisalComparableItem[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  targetLocation,
  comparables,
  selectedCandidateId,
  onSelectCandidate,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filtrar comparables con coordenadas válidas
  const geocodedComparables = comparables.filter(
    (c) =>
      c.candidateData.latitude !== null &&
      c.candidateData.latitude !== undefined &&
      c.candidateData.longitude !== null &&
      c.candidateData.longitude !== undefined
  );

  const missingCoordsCount = comparables.length - geocodedComparables.length;

  // Centro de proyección: coordenadas del target o default Montevideo (-34.915, -56.148)
  const centerLat = targetLocation.latitude || -34.915;
  const centerLng = targetLocation.longitude || -56.148;

  // Encontrar límites para auto-escalar en viewport SVG (400x300 viewBox)
  const allPoints = [
    { lat: centerLat, lng: centerLng, isTarget: true, id: 'target' },
    ...geocodedComparables.map((c) => ({
      lat: c.candidateData.latitude!,
      lng: c.candidateData.longitude!,
      isTarget: false,
      id: c.id,
      selected: c.selected,
      score: c.similarityScore,
      title: c.candidateData.title,
      price: c.candidateData.adjustedPriceUsd,
    })),
  ];

  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);

  const minLat = Math.min(...lats) - 0.005;
  const maxLat = Math.max(...lats) + 0.005;
  const minLng = Math.min(...lngs) - 0.005;
  const maxLng = Math.max(...lngs) + 0.005;

  const latRange = maxLat - minLat || 0.02;
  const lngRange = maxLng - minLng || 0.02;

  // Conversión Lat/Lng a coordenadas SVG (viewBox 0 0 500 350)
  const svgWidth = 500;
  const svgHeight = 350;
  const padding = 40;

  const projectPoint = (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / lngRange) * (svgWidth - padding * 2);
    // Latitud invertida (Y crece hacia abajo en SVG)
    const y = padding + ((maxLat - lat) / latRange) * (svgHeight - padding * 2);
    return { x, y };
  };

  const targetCoord = projectPoint(centerLat, centerLng);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header del Mapa */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-[#102d49]" />
          <span className="font-bold text-[#102d49] uppercase tracking-wider text-[11px]">
            Distribución Geoespacial de Comparables
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#102d49] inline-block ring-2 ring-[#f4b43b]" />
            <span className="font-semibold">Inmueble Objetivo</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Incluido</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            <span>Excluido</span>
          </span>
        </div>
      </div>

      {/* Canvas SVG Interactivo */}
      <div className="relative w-full h-[320px] bg-slate-100 flex items-center justify-center select-none overflow-hidden">
        {/* Trama de cuadrícula topográfica sutil */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          style={{ background: 'radial-gradient(#e2e8f0 1.5px, #f8fafc 1.5px)', backgroundSize: '24px 24px' }}
        >
          {/* Círculos de radio concéntrico desde el target */}
          <circle
            cx={targetCoord.x}
            cy={targetCoord.y}
            r="45"
            fill="none"
            stroke="#102d49"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.25"
          />
          <circle
            cx={targetCoord.x}
            cy={targetCoord.y}
            r="90"
            fill="none"
            stroke="#102d49"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.15"
          />

          {/* Líneas conectoras a comparables geolocalizados */}
          {geocodedComparables.map((comp) => {
            const coord = projectPoint(comp.candidateData.latitude!, comp.candidateData.longitude!);
            const isHighlighted = selectedCandidateId === comp.id || hoveredId === comp.id;
            return (
              <line
                key={`line_${comp.id}`}
                x1={targetCoord.x}
                y1={targetCoord.y}
                x2={coord.x}
                y2={coord.y}
                stroke={isHighlighted ? '#102d49' : comp.selected ? '#10b981' : '#94a3b8'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={comp.selected ? undefined : '2 2'}
                opacity={isHighlighted ? 0.9 : 0.3}
              />
            );
          })}

          {/* Marcadores de Comparables */}
          {geocodedComparables.map((comp) => {
            const coord = projectPoint(comp.candidateData.latitude!, comp.candidateData.longitude!);
            const isSelected = selectedCandidateId === comp.id;
            const isHovered = hoveredId === comp.id;
            const isHighlighted = isSelected || isHovered;

            return (
              <g
                key={`marker_${comp.id}`}
                transform={`translate(${coord.x}, ${coord.y})`}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectCandidate && onSelectCandidate(comp.id)}
                onMouseEnter={() => setHoveredId(comp.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Halo de resalto en hover/selección */}
                {isHighlighted && (
                  <circle
                    r="16"
                    fill={comp.selected ? '#10b981' : '#64748b'}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                )}

                {/* Pin pinche */}
                <circle
                  r={isHighlighted ? 9 : 7}
                  fill={comp.selected ? '#10b981' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow"
                />

                {/* Badge con score */}
                <text
                  y="-12"
                  textAnchor="middle"
                  fill="#102d49"
                  fontSize="9"
                  fontWeight="bold"
                  className="pointer-events-none select-none drop-shadow"
                >
                  {comp.similarityScore}
                </text>
              </g>
            );
          })}

          {/* Marcador del Inmueble Objetivo (Siempre encima) */}
          <g transform={`translate(${targetCoord.x}, ${targetCoord.y})`}>
            <circle r="16" fill="#f4b43b" opacity="0.35" className="animate-ping" />
            <circle r="12" fill="#102d49" stroke="#f4b43b" strokeWidth="3" />
            <circle r="4" fill="#ffffff" />
            <text
              y="-18"
              textAnchor="middle"
              fill="#102d49"
              fontSize="10"
              fontWeight="900"
              className="drop-shadow bg-white"
            >
              INMUEBLE A TASAR
            </text>
          </g>
        </svg>

        {/* Floating Tooltip en Hover */}
        {hoveredId && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-xs max-w-xs pointer-events-none transition-all">
            {(() => {
              const comp = geocodedComparables.find((c) => c.id === hoveredId);
              if (!comp) return null;
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between space-x-2">
                    <span className="font-bold text-[#102d49] truncate">{comp.candidateData.title}</span>
                    <span className="font-mono font-bold text-xs text-emerald-600">
                      USD {comp.candidateData.adjustedPriceUsd.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {comp.candidateData.builtAreaM2} m² • {comp.candidateData.bedrooms} dorms • {comp.candidateData.distanceMeters} m de distancia
                  </p>
                  <div className="flex items-center space-x-2 pt-0.5 text-[10px]">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
                      Similitud: {comp.similarityScore}/100
                    </span>
                    <span className={`px-1.5 py-0.5 font-bold rounded ${comp.selected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {comp.selected ? 'INCLUIDO' : 'EXCLUIDO'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer con aviso de comparables sin GPS */}
      {missingCoordsCount > 0 && (
        <div className="px-4 py-2 bg-amber-50/80 border-t border-amber-200/50 flex items-center space-x-2 text-[11px] text-amber-800">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {missingCoordsCount} de los {comparables.length} comparables no poseen coordenadas GPS exactas. Se listan en tarjetas y tabla sin inventar posición geográfica.
          </span>
        </div>
      )}
    </div>
  );
};
