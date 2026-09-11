// ==============================================================================
// HIPOTECALY TASADOR IA - TARJETA INDIVIDUAL DE COMPARABLE (HUMAN-IN-THE-LOOP)
// Métricas, desglose de similitud explicable y controles de inclusión/exclusión
// ==============================================================================

import React, { useState } from 'react';
import { AppraisalComparableItem } from '../../lib/tasador/appraisal/appraisalTypes';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ComparableCardProps {
  comparable: AppraisalComparableItem;
  isSelectedForMap?: boolean;
  onSelectForMap?: () => void;
  onToggleInclude: () => void;
  onExcludeWithReason: () => void;
}

export const ComparableCard: React.FC<ComparableCardProps> = ({
  comparable,
  isSelectedForMap = false,
  onSelectForMap,
  onToggleInclude,
  onExcludeWithReason,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const data = comparable.candidateData;
  const breakdown = comparable.scoreBreakdown;

  // Color de badge de similitud
  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col text-left ${
        isSelectedForMap
          ? 'ring-2 ring-[#102d49] border-[#102d49] shadow-md'
          : comparable.selected
          ? 'border-slate-200 hover:border-slate-300 shadow-sm'
          : 'border-slate-200 bg-slate-50/70 opacity-75'
      }`}
    >
      {/* Encabezado de Imagen y Badges */}
      <div className="relative h-40 bg-slate-100 overflow-hidden group">
        <img
          src={
            data.primaryPhotoUrl ||
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'
          }
          alt={data.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-1.5 pointer-events-auto">
            <span className="bg-[#102d49]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              {data.sourceName || data.sourceCode}
            </span>
            {data.distanceMeters !== null && data.distanceMeters !== undefined && (
              <span className="bg-white/90 backdrop-blur-sm text-[#102d49] text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-0.5">
                <MapPin className="w-2.5 h-2.5 text-amber-500" />
                <span>
                  {data.distanceMeters >= 1000
                    ? `${(data.distanceMeters / 1000).toFixed(1)} km`
                    : `${data.distanceMeters} m`}
                </span>
              </span>
            )}
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-extrabold border shadow ${getScoreBadgeColor(
              comparable.similarityScore
            )}`}
          >
            {comparable.similarityScore}/100
          </span>
        </div>

        {/* Estado Excluido Overlay */}
        {!comparable.selected && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center text-white">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-rose-500/90 text-white px-2.5 py-0.5 rounded mb-1">
              EXCLUIDO POR EL ANALISTA
            </span>
            <p className="text-[11px] text-slate-200 line-clamp-2 max-w-xs">
              {comparable.exclusionReason || 'Excluido manualmente del set de tasación'}
            </p>
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Título y Ubicación */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize font-semibold text-slate-500">
                {data.neighborhood}, {data.department}
              </span>
              <span>Hace {data.daysSincePublication}d</span>
            </div>
            <h4
              onClick={onSelectForMap}
              className="text-xs font-bold text-[#102d49] line-clamp-1 hover:text-blue-700 cursor-pointer mt-0.5"
              title={data.title}
            >
              {data.title}
            </h4>
          </div>

          {/* Ficha de Características Técnicas */}
          <div className="grid grid-cols-4 gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-medium text-center">
            <div title="Superficie Construida / Total">
              <span className="text-slate-400 block text-[9px] uppercase">Área</span>
              <span className="font-bold text-slate-800">{data.builtAreaM2} m²</span>
            </div>
            <div title="Dormitorios">
              <span className="text-slate-400 block text-[9px] uppercase">Dorms</span>
              <span className="font-bold text-slate-800">{data.bedrooms}</span>
            </div>
            <div title="Baños">
              <span className="text-slate-400 block text-[9px] uppercase">Baños</span>
              <span className="font-bold text-slate-800">{data.bathrooms}</span>
            </div>
            <div title="Garajes">
              <span className="text-slate-400 block text-[9px] uppercase">Garaje</span>
              <span className="font-bold text-slate-800">{data.garages || 0}</span>
            </div>
          </div>

          {/* Bloque de Precios y Ajuste del 12% */}
          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Precio Ajustado (-12%)
              </span>
              <span className="text-sm font-extrabold text-[#102d49]">
                USD {data.adjustedPriceUsd.toLocaleString('es-UY')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                USD / m²
              </span>
              <span className="text-xs font-bold text-emerald-600">
                USD {data.pricePerM2Usd.toLocaleString('es-UY')}
              </span>
            </div>
          </div>

          {/* Badges de Calidad y Elegibilidad */}
          <div className="flex items-center space-x-1.5 pt-0.5 text-[10px]">
            <span
              className={`px-2 py-0.5 rounded font-semibold border ${
                data.comparableEligibility === 'ELIGIBLE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {data.comparableEligibility === 'ELIGIBLE' ? 'ELEGIBLE' : 'PARCIAL'}
            </span>
            <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Calidad: {data.dataQualityScore}%
            </span>
            {data.originalUrl && (
              <a
                href={data.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-slate-400 hover:text-[#102d49] transition-colors p-1"
                title="Ver publicación original"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Acordeón de Desglose de Score Explicable */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-[#102d49] hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            >
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#f4b43b]" />
                <span>¿Por qué se seleccionó? (Desglose)</span>
              </span>
              {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showBreakdown && breakdown?.factors && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] animate-fadeIn">
                {breakdown.factors.map((f, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        f.status === 'match'
                          ? 'text-emerald-600'
                          : f.status === 'partial'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {f.status === 'match' ? '✓' : f.status === 'partial' ? '△' : '✕'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight">{f.label}</p>
                      <p className="text-[10px] text-slate-400">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controles Human-in-the-Loop (Incluir / Excluir) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {comparable.selected ? (
            <button
              type="button"
              onClick={onExcludeWithReason}
              className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Excluir Comparable</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleInclude}
              className="w-full py-2 px-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-incluir en el Análisis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
