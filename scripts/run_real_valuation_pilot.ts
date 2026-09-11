// ==============================================================================
// HIPOTECALY TASADOR IA - SCRIPT DE PILOTO REAL DE VALUACIÓN (FASES 3 + 4)
// Ejecuta Valuaciones Reales sobre Inmuebles de Montevideo y Maldonado
// ==============================================================================

import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { ValuationService } from '../src/lib/tasador/valuation/ValuationService';
import { AIAppraisalService } from '../src/lib/tasador/ai/AIAppraisalService';
import { AIUsageTracker } from '../src/lib/tasador/ai/AIUsageTracker';
import { TargetPropertyInput } from '../src/lib/tasador/valuation/valuationTypes';
import { ValuationBacktestEngine } from '../src/lib/tasador/valuation/ValuationBacktestEngine';

async function main() {
  console.log('======================================================================');
  console.log('HIPOTECALY TASADOR IA - PILOTO DE VALUACIÓN DETERMINÍSTICA & IA (FASES 3 + 4)');
  console.log('======================================================================');

  // 1. Ingesta Real Precondición
  console.log('\n[1/4] Verificando Base Inmobiliaria Global e Ingesta Real...');
  const engine = IngestionEngine.getInstance();
  const runResult = await engine.executeRun('infocasas', {
    limit: 120,
    department: 'montevideo',
  });
  console.log(`[OK] Ingesta Real completada: ${runResult.listingsDiscovered} publicaciones descubiertas.`);
  console.log(`[OK] Property Masters canónicos activos: ${engine.masterResolver.getAllMasters().length}`);

  // 2. Muestra de Propiedades Objetivo para Tasación Real
  const testProperties: TargetPropertyInput[] = [
    {
      propertyMasterId: 'pocitos_apto_2d',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 75,
      totalAreaM2: 80,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      constructionYear: 2018,
      latitude: -34.915,
      longitude: -56.148,
    },
    {
      propertyMasterId: 'punta_carretas_apto_3d',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      builtAreaM2: 110,
      totalAreaM2: 125,
      bedrooms: 3,
      bathrooms: 2,
      garages: 2,
      constructionYear: 2020,
      latitude: -34.922,
      longitude: -56.155,
    },
    {
      propertyMasterId: 'carrasco_casa_4d',
      propertyType: 'HOUSE',
      department: 'Montevideo',
      neighborhood: 'Carrasco',
      builtAreaM2: 280,
      totalAreaM2: 600,
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      constructionYear: 2012,
      latitude: -34.885,
      longitude: -56.055,
    },
    {
      propertyMasterId: 'cordon_monoambiente',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Cordón',
      builtAreaM2: 35,
      totalAreaM2: 38,
      bedrooms: 1,
      bathrooms: 1,
      garages: 0,
      constructionYear: 2022,
      latitude: -34.903,
      longitude: -56.175,
    },
    {
      propertyMasterId: 'buceo_apto_2d',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Buceo',
      builtAreaM2: 65,
      totalAreaM2: 70,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      constructionYear: 2015,
      latitude: -34.902,
      longitude: -56.132,
    },
  ];

  console.log(`\n[2/4] Ejecutando Tasaciones Determinísticas para ${testProperties.length} inmuebles...`);
  const valService = ValuationService.getInstance();
  const aiService = AIAppraisalService.getInstance();

  const valuationReports = [];

  for (const prop of testProperties) {
    const valuation = await valService.appraiseProperty(prop);

    const enrichment = await aiService.enrichValuation({
      valuation,
      rawTitle: `${prop.propertyType} en ${prop.neighborhood} (${prop.builtAreaM2} m²)`,
      rawDescription:
        'Excelente estado, reciclado a nuevo con finas terminaciones, vista despejada, construcción tradicional y parrillero.',
      photos: [
        { mediaId: `${prop.propertyMasterId}_1`, url: 'https://img.com/living.jpg', sha256Hash: `hash_${prop.propertyMasterId}_1` },
        { mediaId: `${prop.propertyMasterId}_2`, url: 'https://img.com/kitchen.jpg', sha256Hash: `hash_${prop.propertyMasterId}_2` },
      ],
    });

    valuationReports.push({ valuation, enrichment });

    console.log(`\n--- TASACIÓN: ${prop.propertyType} en ${prop.neighborhood} (${prop.builtAreaM2} m²) ---`);
    console.log(`> Valor Estimado de Mercado: USD ${valuation.estimatedMarketValue.toLocaleString('es-UY')}`);
    console.log(`> Rango Probable: USD ${valuation.estimatedRangeLow.toLocaleString('es-UY')} — USD ${valuation.estimatedRangeHigh.toLocaleString('es-UY')}`);
    console.log(`> Valor de Referencia Prudente: USD ${valuation.prudentReferenceValue.toLocaleString('es-UY')}`);
    console.log(`> Precio por m²: USD ${valuation.estimatedPricePerM2Usd.toLocaleString('es-UY')}/m²`);
    console.log(`> Comparables Usados: ${valuation.effectiveComparablesUsed} (Total candidatos: ${valuation.totalComparablesDiscovered})`);
    console.log(`> Confianza: ${valuation.confidence.confidenceScore}% (${valuation.confidence.confidenceLevel})`);
    console.log(`> Nivel Geográfico: ${valuation.geographicSearchLevel} (${valuation.geographicSearchRadiusMeters}m)`);
    console.log(`> Factor 12% aplicado a asking prices: ${valuation.askingPriceAdjustmentApplied} (${valuation.askingPriceAdjustmentPercentage}%)`);
    console.log(`> Features Cualitativos Extraídos (Shadow Mode): ${enrichment.qualitativeFeatures.length}`);
    console.log(`> Explicación IA generada: ${enrichment.reportSections?.executiveSummary.substring(0, 100)}...`);
  }

  // 3. Métricas Estadísticas Globales del Piloto
  console.log('\n[3/4] Agregando Métricas Globales del Piloto...');
  const totalValuations = valuationReports.length;
  const avgValue = Math.round(
    valuationReports.reduce((acc, r) => acc + r.valuation.estimatedMarketValue, 0) / totalValuations
  );
  const avgConfidence = Number(
    (
      valuationReports.reduce((acc, r) => acc + r.valuation.confidence.confidenceScore, 0) /
      totalValuations
    ).toFixed(1)
  );
  const avgComparables = Number(
    (
      valuationReports.reduce((acc, r) => acc + r.valuation.effectiveComparablesUsed, 0) /
      totalValuations
    ).toFixed(1)
  );

  const usageStats = AIUsageTracker.getInstance().getGlobalStats();

  console.log(`> Total Tasaciones Ejecutadas: ${totalValuations}`);
  console.log(`> Valor Promedio de Tasación: USD ${avgValue.toLocaleString('es-UY')}`);
  console.log(`> Confianza Promedio: ${avgConfidence}%`);
  console.log(`> Comparables Promedio por Tasación: ${avgComparables}`);
  console.log(`> Costo Total IA Consumido: $${usageStats.totalCostUsd} USD`);
  console.log(`> Tokens Totales Consumidos: ${usageStats.totalTokens}`);
  console.log(`> Costo Promedio por Tasación: $${usageStats.avgCostPerValuationUsd} USD`);

  // 4. Backtesting / Ground Truth Evaluation
  console.log('\n[4/4] Evaluando Backtesting contra Ground Truth...');
  const backtestResult = await ValuationBacktestEngine.runBacktest([], Array.from(engine.normalizedListings.values()));
  console.log(`> Estado Ground Truth: ${backtestResult.status}`);
  console.log(`> Observación: ${backtestResult.observations}`);

  console.log('\n======================================================================');
  console.log('PILOTO REAL FASE 3 + FASE 4 FINALIZADO EXITOSAMENTE');
  console.log('======================================================================');
}

main().catch(console.error);
