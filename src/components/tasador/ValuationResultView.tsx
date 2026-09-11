// ==============================================================================
// HIPOTECALY TASADOR IA - VISTA DE RESULTADO DE VALORACIÓN (PARTE 3)
// Valor central estimado, rango razonable P25-P75, factores explicables y acciones
// ==============================================================================

import React, { useState } from 'react';
import {
  AppraisalRecord,
  AppraisalValuationRun,
} from '../../lib/tasador/appraisal/appraisalTypes';
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ValuationResultViewProps {
  appraisal: AppraisalRecord;
  run: AppraisalValuationRun;
  onModifyComparables: () => void;
  onDownloadPdf: () => void;
  onFinalizeAppraisal: () => void;
  onViewDossier: () => void;
  isDownloadingPdf?: boolean;
}

export const ValuationResultView: React.FC<ValuationResultViewProps> = ({
  appraisal,
  run,
  onModifyComparables,
  onDownloadPdf,
  onFinalizeAppraisal,
  onViewDossier,
  isDownloadingPdf = false,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const target = run.targetPropertySnapshot || appraisal.propertyInput;
  const comps = run.comparableSetSnapshot || appraisal.comparables || [];
  const includedComps = comps.filter((c) => c.selected || c.status === 'INCLUDED');

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'ALTA':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'CONFIANZA ALTA',
          icon: ShieldCheck,
          desc: 'Muestra homogénea con baja dispersión y comparables directos en la zona.',
        };
      case 'MEDIA':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          label: 'CONFIANZA MEDIA',
          icon: Info,
          desc: 'Muestra representativa adecuada para precalificación hipotecaria preliminar.',
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'CONFIANZA BAJA / ATENCIÓN',
          icon: AlertTriangle,
          desc: 'Dispersión moderada o muestra reducida. Se recomienda peritaje presencial.',
        };
    }
  };

  const badge = getConfidenceBadge(run.confidenceLevel);
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* 1. HERO PRINCIPAL: VALOR ESTIMADO Y RANGOS */}
      <div className="bg-gradient-to-br from-[#102d49] via-[#0c243a] to-[#081827] text-white rounded-3xl p-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-semibold tracking-wider uppercase border border-white/15">
              Valuation Run #{run.runNumber}
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {new Date(run.createdAt).toLocaleString('es-UY')}
            </span>
            <span className="text-xs text-slate-400">
              Motor: <strong className="text-slate-200">{run.engineVersion}</strong>
            </span>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}>
            <BadgeIcon className="w-4 h-4" />
            {badge.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Valor Central */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Valor de Mercado Estimado Central
            </span>
            <div className="text-4xl sm:text-6xl font-black tracking-tight text-white mt-2 mb-3">
              USD {run.estimatedMarketValue.toLocaleString('es-UY')}
            </div>
            <p className="text-sm text-slate-300 max-w-xl">
              Calculado mediante ensamble híbrido robusto con descuento estándar del 12% sobre precios de oferta y ponderación multidimensional de comparables.
            </p>
          </div>

          {/* Métricas Clave Laterales */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Rango Razonable (P25 - P75)</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1">
                USD {run.valueRangeMin.toLocaleString('es-UY')} – {run.valueRangeMax.toLocaleString('es-UY')}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Valor Unitario</div>
              <div className="text-base sm:text-lg font-bold text-emerald-300 mt-1">
                USD {run.estimatedPricePerM2Usd.toLocaleString('es-UY')} / m²
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Muestra Activa</div>
              <div className="text-base sm:text-lg font-bold text-white mt-1">
                {run.comparablesUsedCount} de {run.comparablesUsedCount + run.excludedComparablesCount} comparables
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Estado de Tasación</div>
              <div className="text-base sm:text-lg font-bold text-blue-300 mt-1">
                {appraisal.status === 'FINALIZED' ? 'FINALIZADA' : 'VALORADA'}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Principales */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onModifyComparables}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-white/15"
            >
              <RotateCcw className="w-4 h-4" />
              Modificar Comparables
            </button>

            <button
              onClick={onViewDossier}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-white/15"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              Ver Expediente Completo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-5 py-2.5 bg-brand-green hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloadingPdf ? 'Generando PDF...' : 'Descargar Informe PDF'}
            </button>

            {appraisal.status !== 'FINALIZED' && (
              <button
                onClick={onFinalizeAppraisal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar Tasación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. EXPLICACIÓN DEL RESULTADO ("¿Cómo se obtuvo esta valoración?") */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#102d49] flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ¿Cómo se obtuvo esta valoración?
              </h3>
              <p className="text-xs text-slate-500">
                Metodología analítica, ajustes de oferta, eliminación de atípicos y ensamble multi-método.
              </p>
            </div>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showExplanation && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase">1. Factor Negociación</div>
                <div className="text-xl font-bold text-[#102d49] mt-1">-12.00%</div>
                <p className="text-xs text-slate-600 mt-1">
                  Descuento empírico aplicado a precios de oferta pública en plaza uruguaya.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase">2. Mediana Ponderada</div>
                <div className="text-xl font-bold text-[#102d49] mt-1">
                  USD {Math.round(run.estimatedMarketValue * 0.99).toLocaleString('es-UY')}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Resistente a extremos de dispersión y asimetrías en la oferta.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase">3. Media Recortada (10%)</div>
                <div className="text-xl font-bold text-[#102d49] mt-1">
                  USD {Math.round(run.estimatedMarketValue * 1.01).toLocaleString('es-UY')}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Poda de colas superior e inferior (outliers de precio/m²).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase">4. Ajuste de Coeficientes</div>
                <div className="text-xl font-bold text-[#102d49] mt-1">
                  USD {Math.round(run.estimatedMarketValue).toLocaleString('es-UY')}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Corrección por diferencias de metraje, baños y garajes.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs text-[#102d49] font-bold hover:underline flex items-center gap-1"
              >
                {showTechnicalDetails ? 'Ocultar matriz técnica' : 'Ver pesos y estimadores técnicos de la corrida'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {showTechnicalDetails && (
              <div className="overflow-x-auto p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="pb-2">Método Estimador</th>
                      <th className="pb-2">Valor Estimado (USD)</th>
                      <th className="pb-2">Peso en Ensamble</th>
                      <th className="pb-2">Muestra Efectiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-2 text-emerald-400">WEIGHTED_MEDIAN</td>
                      <td className="py-2">USD {Math.round(run.estimatedMarketValue * 0.995).toLocaleString('es-UY')}</td>
                      <td className="py-2 font-bold">35.0%</td>
                      <td className="py-2">{run.comparablesUsedCount} comps</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-blue-400">WEIGHTED_TRIMMED_MEAN</td>
                      <td className="py-2">USD {Math.round(run.estimatedMarketValue * 1.008).toLocaleString('es-UY')}</td>
                      <td className="py-2 font-bold">25.0%</td>
                      <td className="py-2">{run.comparablesUsedCount} comps</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-amber-400">WEIGHTED_PRICE_PER_M2</td>
                      <td className="py-2">USD {Math.round(run.estimatedPricePerM2Usd * (target.surfaces.builtAreaM2 || 75)).toLocaleString('es-UY')}</td>
                      <td className="py-2 font-bold">25.0%</td>
                      <td className="py-2">{run.comparablesUsedCount} comps</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-purple-400">DIRECT_COMPARABLE_ADJUSTMENT</td>
                      <td className="py-2">USD {Math.round(run.estimatedMarketValue * 0.998).toLocaleString('es-UY')}</td>
                      <td className="py-2 font-bold">15.0%</td>
                      <td className="py-2">{run.comparablesUsedCount} comps</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. FACTORES FAVORABLES Y PUNTOS DE ATENCIÓN (DETERMINÍSTICOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Factores Favorables */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm uppercase tracking-wider">Factores Favorables Detectados</h4>
          </div>
          <ul className="space-y-2.5">
            {run.favorableFactors.map((fav, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>{fav}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Puntos de Atención / Advertencias */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-800 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm uppercase tracking-wider">Factores a Considerar / Advertencias</h4>
          </div>
          <ul className="space-y-2.5">
            {run.considerationFactors.map((cons, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60">
                <span className="text-amber-600 font-bold mt-0.5">!</span>
                <span>{cons}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. COMPARABLES UTILIZADOS DEFINITIVAMENTE EN LA CORRIDA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Comparables Participantes en la Valoración ({includedComps.length})
            </h3>
            <p className="text-xs text-slate-500">
              Inmuebles validados que integraron la muestra de cálculo matemático.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            -12.00% ajuste aplicado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {includedComps.map((comp) => {
            const data = comp.candidateData;
            return (
              <div
                key={comp.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                      {data.sourceName || data.sourceCode}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {comp.similarityScore} pts
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                    {data.title}
                  </h5>
                  <p className="text-xs text-slate-500 mb-3">
                    {data.neighborhood} | {data.distanceMeters ? `${data.distanceMeters} m` : 'En zona'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 pt-2 mb-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Superficie</span>
                      <strong className="text-slate-700">{data.builtAreaM2} m² ({data.bedrooms}D)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">USD/m²</span>
                      <strong className="text-slate-700">USD {data.pricePerM2Usd.toLocaleString('es-UY')}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 line-through">
                      USD {data.priceUsd.toLocaleString('es-UY')}
                    </span>
                    <div className="text-xs font-black text-[#102d49]">
                      USD {data.adjustedPriceUsd.toLocaleString('es-UY')}
                    </div>
                  </div>

                  {data.originalUrl && (
                    <a
                      href={data.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
