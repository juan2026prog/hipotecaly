// ==============================================================================
// HIPOTECALY TASADOR IA - INDICADOR DE CALIDAD DEL SET Y ESTADÍSTICAS PREVIAS
// Métricas descriptivas, advertencias de mercado y solidez del respaldo técnico
// ==============================================================================

import React from 'react';
import {
  AppraisalSetQuality,
  AppraisalDescriptiveStats,
} from '../../lib/tasador/appraisal/appraisalTypes';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface SetQualityIndicatorProps {
  quality: AppraisalSetQuality;
  stats: AppraisalDescriptiveStats;
  className?: string;
}

export const SetQualityIndicator: React.FC<SetQualityIndicatorProps> = ({
  quality,
  stats,
  className = '',
}) => {
  const qualityConfig: Record<
    AppraisalSetQuality,
    { label: string; badge: string; bg: string; text: string; icon: any; desc: string }
  > = {
    ALTA: {
      label: 'CALIDAD ALTA',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bg: 'bg-emerald-50/70 border-emerald-200',
      text: 'text-emerald-900',
      icon: ShieldCheck,
      desc: 'Muestra representativa, alta cercanía geográfica y baja dispersión de precios.',
    },
    MEDIA: {
      label: 'CALIDAD MEDIA',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      bg: 'bg-amber-50/70 border-amber-200',
      text: 'text-amber-900',
      icon: AlertTriangle,
      desc: 'Muestra aceptable con dispersión moderada o distancia ampliada.',
    },
    BAJA: {
      label: 'CALIDAD BAJA',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      bg: 'bg-rose-50/70 border-rose-200',
      text: 'text-rose-900',
      icon: AlertTriangle,
      desc: 'Pocos comparables o alta disparidad. Se recomienda ampliar criterios de búsqueda.',
    },
  };

  const conf = qualityConfig[quality] || qualityConfig.MEDIA;
  const QualityIcon = conf.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Banner de Calidad del Set */}
      <div className={`p-4 rounded-2xl border ${conf.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <QualityIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${conf.badge}`}>
                {conf.label}
              </span>
              <span className="text-xs font-bold text-slate-700">
                Solidez de la Evidencia Inmobiliaria
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{conf.desc}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Comparables Seleccionados
          </span>
          <span className="text-xl font-black text-[#102d49]">
            {stats.selectedCount} <span className="text-xs font-medium text-slate-400">/ {stats.totalCandidates}</span>
          </span>
        </div>
      </div>

      {/* Grid de Estadísticas Descriptivas Previas (Sin tocar el motor) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        {/* Mediana USD */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Mediana de Precios
          </span>
          <span className="text-base font-extrabold text-[#102d49] mt-0.5 block">
            USD {stats.medianPriceUsd.toLocaleString('es-UY')}
          </span>
          <span className="text-[10px] text-slate-400">
            Rango: {stats.minPriceUsd.toLocaleString('es-UY')} — {stats.maxPriceUsd.toLocaleString('es-UY')}
          </span>
        </div>

        {/* Mediana USD/m² */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Mediana USD / m²
          </span>
          <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">
            USD {stats.medianPricePerM2Usd.toLocaleString('es-UY')}
          </span>
          <span className="text-[10px] text-slate-400">
            Rango: {stats.minPricePerM2Usd.toLocaleString('es-UY')} — {stats.maxPricePerM2Usd.toLocaleString('es-UY')}
          </span>
        </div>

        {/* Dispersión */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Dispersión Relativa
          </span>
          <span className={`text-base font-extrabold mt-0.5 block ${stats.dispersionPercentage > 25 ? 'text-amber-600' : 'text-slate-800'}`}>
            {stats.dispersionPercentage}%
          </span>
          <span className="text-[10px] text-slate-400">
            {stats.dispersionPercentage <= 15 ? 'Homogéneo' : stats.dispersionPercentage <= 25 ? 'Moderado' : 'Heterogéneo'}
          </span>
        </div>

        {/* Distancia Promedio */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Distancia Media
          </span>
          <span className="text-base font-extrabold text-[#102d49] mt-0.5 block">
            {stats.averageDistanceMeters >= 1000
              ? `${(stats.averageDistanceMeters / 1000).toFixed(1)} km`
              : `${stats.averageDistanceMeters} m`}
          </span>
          <span className="text-[10px] text-slate-400">
            Proximidad al inmueble
          </span>
        </div>
      </div>

      {/* Advertencias de Mercado si existen */}
      {stats.warnings && stats.warnings.length > 0 && (
        <div className="space-y-1.5 text-left">
          {stats.warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-800 flex items-center space-x-2 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
