// ==============================================================================
// HIPOTECALY SUPER ADMIN - PESTAÑA DE VALUACIÓN Y TASADOR IA (FASES 3 + 4)
// Tasador en Vivo, Panel de Debug, Comparables, Visión en Shadow Mode y Costos
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Sliders,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ValuationService } from '../../lib/tasador/valuation/ValuationService';
import { ValuationResultReport, TargetPropertyInput } from '../../lib/tasador/valuation/valuationTypes';
import { AIAppraisalService } from '../../lib/tasador/ai/AIAppraisalService';
import { AIEnrichmentResult } from '../../lib/tasador/ai/aiTypes';
import { AIUsageTracker } from '../../lib/tasador/ai/AIUsageTracker';

export const SuperAdminTasadorValuationTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'appraiser' | 'debug' | 'ai_features' | 'costs'>('appraiser');
  const [isLoading, setIsLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<ValuationResultReport | null>(null);
  const [aiResult, setAiResult] = useState<AIEnrichmentResult | null>(null);

  // Formulario de Tasación
  const [formData, setFormData] = useState<TargetPropertyInput>({
    propertyType: 'APARTMENT',
    department: 'Montevideo',
    neighborhood: 'Pocitos',
    builtAreaM2: 75,
    totalAreaM2: 80,
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    constructionYear: 2015,
  });

  const [aiStats, setAiStats] = useState(AIUsageTracker.getInstance().getGlobalStats());

  useEffect(() => {
    // Si no hay listings en memoria, asegurar que el pool de ingesta esté disponible
    setAiStats(AIUsageTracker.getInstance().getGlobalStats());
  }, []);

  const handleRunValuation = async () => {
    setIsLoading(true);
    try {
      const valService = ValuationService.getInstance();
      const report = await valService.appraiseProperty(formData);
      setValuationResult(report);

      // Enriquecimiento IA (Fase 4)
      const aiService = AIAppraisalService.getInstance();
      const enrichment = await aiService.enrichValuation({
        valuation: report,
        rawTitle: `Apartamento ${formData.bedrooms} dormitorios en ${formData.neighborhood}`,
        rawDescription: 'Excelente apartamento reciclado a nuevo con vista despejada, construcción tradicional y parrillero propio.',
        photos: [
          { mediaId: 'photo_1', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', sha256Hash: 'hash_img_1' },
          { mediaId: 'photo_2', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', sha256Hash: 'hash_img_2' },
          { mediaId: 'photo_3', url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600', sha256Hash: 'hash_img_3' },
        ],
      });

      setAiResult(enrichment);
      setAiStats(AIUsageTracker.getInstance().getGlobalStats());
    } catch (err) {
      console.error('Error al ejecutar tasación:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Control de Sub-pestañas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Tasador IA — Core de Valuación & Comparables (Fases 3 + 4)
          </h2>
          <p className="text-xs text-slate-400">
            Valuación determinística multi-método, factor 12% controlado y Computer Vision en Shadow Mode.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('appraiser')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              subTab === 'appraiser' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tasador en Vivo
          </button>
          <button
            onClick={() => setSubTab('debug')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              subTab === 'debug' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Panel de Debug
          </button>
          <button
            onClick={() => setSubTab('ai_features')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              subTab === 'ai_features' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            IA & Visión (Shadow)
          </button>
          <button
            onClick={() => setSubTab('costs')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              subTab === 'costs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Costos & Tokens
          </button>
        </div>
      </div>

      {/* Banner de Garantía y Principios */}
      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Principio Fundamental:</strong> La IA no fija el precio monetario. El valor surge de comparables reales normalizados, deduplicación de masters y modelos estadísticos determinísticos.
          </span>
        </div>
        <span className="hidden md:inline-block bg-emerald-900/60 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-700/50">
          asking_price_adj = 0.1200
        </span>
      </div>

      {/* 1. SUB-PESTAÑA: TASADOR EN VIVO */}
      {subTab === 'appraiser' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Formulario */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Parámetros del Inmueble Objetivo
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tipo de Propiedad</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="APARTMENT">Apartamento</option>
                  <option value="HOUSE">Casa</option>
                  <option value="PH">Propiedad Horizontal (PH)</option>
                  <option value="LAND">Terreno</option>
                  <option value="COMMERCIAL">Local Comercial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Barrio</label>
                  <input
                    type="text"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Área Edificada (m²)</label>
                  <input
                    type="number"
                    value={formData.builtAreaM2}
                    onChange={(e) => setFormData({ ...formData, builtAreaM2: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Área Total (m²)</label>
                  <input
                    type="number"
                    value={formData.totalAreaM2 || ''}
                    onChange={(e) => setFormData({ ...formData, totalAreaM2: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Dormitorios</label>
                  <input
                    type="number"
                    value={formData.bedrooms || 0}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Baños</label>
                  <input
                    type="number"
                    value={formData.bathrooms || 0}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Garajes</label>
                  <input
                    type="number"
                    value={formData.garages || 0}
                    onChange={(e) => setFormData({ ...formData, garages: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleRunValuation}
                disabled={isLoading}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Ejecutando Modelos...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Ejecutar Tasación Determinística
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Columna Resultado Principal */}
          <div className="lg:col-span-2 space-y-4">
            {valuationResult ? (
              <div className="space-y-4">
                {/* Card Valor Principal */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">
                        Valor de Mercado Estimado (Estimated Market Value)
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                        USD {valuationResult.estimatedMarketValue.toLocaleString('es-UY')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>USD {valuationResult.estimatedPricePerM2Usd.toLocaleString('es-UY')}/m²</span>
                        <span>•</span>
                        <span>Rango: USD {valuationResult.estimatedRangeLow.toLocaleString('es-UY')} — {valuationResult.estimatedRangeHigh.toLocaleString('es-UY')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Confianza: {valuationResult.confidence.confidenceScore}% ({valuationResult.confidence.confidenceLevel})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {valuationResult.effectiveComparablesUsed} comparables utilizados
                      </div>
                    </div>
                  </div>

                  {/* Valor de Referencia Prudente */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      Valor de Referencia Prudente (Lower Bound Estadístico):
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      USD {valuationResult.prudentReferenceValue.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>

                {/* Grid 4 Métodos Estadísticos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {valuationResult.methods.map((m, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                      <div className="text-[10px] text-slate-400 uppercase truncate">
                        {m.method.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        ${m.estimatedValueUsd.toLocaleString('es-UY')}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Peso: {(m.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen de Explicación IA */}
                {aiResult?.reportSections && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Explicación Profesional del Dictamen
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiResult.reportSections.executiveSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-xl p-12 text-center text-slate-500 space-y-2">
                <Calculator className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Configure los parámetros del inmueble y haga clic en "Ejecutar Tasación Determinística".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SUB-PESTAÑA: PANEL DE DEBUG Y COMPARABLES */}
      {subTab === 'debug' && valuationResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Mostrando <strong>{valuationResult.selectedComparables.length}</strong> comparables aceptados y{' '}
              <strong>{valuationResult.excludedOutliers.length}</strong> outliers excluidos.
            </span>
            <span className="font-mono text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
              Nivel Geográfico: {valuationResult.geographicSearchLevel} (Radio: {valuationResult.geographicSearchRadiusMeters}m)
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">Fuente / ID</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">M² Edif</th>
                  <th className="p-3">Dorm / Baños</th>
                  <th className="p-3">Precio Publicado</th>
                  <th className="p-3">Precio Ajustado (12%)</th>
                  <th className="p-3">USD / M²</th>
                  <th className="p-3">Similitud</th>
                  <th className="p-3">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {valuationResult.selectedComparables.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className="font-medium text-white">{c.sourceCode}</span>
                      <div className="text-[10px] text-slate-500">{c.sourceListingId}</div>
                    </td>
                    <td className="p-3">
                      {c.neighborhood || c.department}
                      {c.distanceMeters && <div className="text-[10px] text-slate-500">{Math.round(c.distanceMeters)}m</div>}
                    </td>
                    <td className="p-3">{c.builtAreaM2} m²</td>
                    <td className="p-3">{c.bedrooms || '-'}d / {c.bathrooms || '-'}b</td>
                    <td className="p-3 font-mono">${c.rawAskingPriceUsd.toLocaleString('es-UY')}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">
                      ${c.effectivePriceUsd.toLocaleString('es-UY')}
                    </td>
                    <td className="p-3 font-mono">${c.pricePerM2Usd.toLocaleString('es-UY')}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-white">
                        {c.similarity.finalSimilarityScore}%
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{(c.weight * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUB-PESTAÑA: IA & VISIÓN EN SHADOW MODE */}
      {subTab === 'ai_features' && (
        <div className="space-y-4">
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Certificación Shadow Mode:</strong> Todas las características extraídas por Computer Vision y NLP en Fase 4 tienen <strong>peso = 0.00%</strong> en la tasación monetaria. Se emplean exclusivamente para enriquecimiento cualitativo y explicabilidad.
            </span>
          </div>

          {aiResult?.qualitativeFeatures && aiResult.qualitativeFeatures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiResult.qualitativeFeatures.map((f, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white uppercase">{f.featureName.replace(/_/g, ' ')}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
                      Confianza: {f.confidence}%
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300">{f.featureValue}</div>
                  <p className="text-xs text-slate-400">{f.observationalNotes}</p>
                  <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800/60">
                    <span>Origen: {f.evidenceSource}</span>
                    <span className="text-amber-400 font-mono">Impacto Monetario: 0.00% (Shadow)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              Ejecute una tasación para visualizar las características cualitativas extraídas.
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-PESTAÑA: COSTOS & TOKENS */}
      {subTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Gasto Total IA (Mes)</span>
              <div className="text-2xl font-bold text-white mt-1">${aiStats.monthCostUsd} USD</div>
              <div className="text-[11px] text-slate-500 mt-1">Hoy: ${aiStats.todayCostUsd} USD</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Costo Promedio por Tasación</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">${aiStats.avgCostPerValuationUsd} USD</div>
              <div className="text-[11px] text-slate-500 mt-1">Límite Budget Guard: $0.05 USD</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Tokens Totales Consumidos</span>
              <div className="text-2xl font-bold text-white mt-1">{aiStats.totalTokens.toLocaleString('es-UY')}</div>
              <div className="text-[11px] text-slate-500 mt-1">Eventos Auditados: {aiStats.totalEvents}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
