// ==============================================================================
// HIPOTECALY TASADOR IA - SCRIPT DE INGESTA PILOTO REAL E2E (FASE 1 + FASE 2)
// Ingesta Real de >= 100 Publicaciones de Uruguay, Normalización, Deduplicación,
// Property Masters, Precios Históricos, Medios, Calidad e Idempotencia
// ==============================================================================

import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { DataQualityEngine } from '../src/lib/tasador/quality/DataQualityEngine';
import { CadastralAdapter } from '../src/lib/tasador/cadastral/CadastralAdapter';

async function runPilot() {
  console.log('================================================================');
  console.log('HIPOTECALY TASADOR IA - INGESTA PILOTO REAL E2E (FASES 1 + 2)');
  console.log('================================================================\n');

  const engine = IngestionEngine.getInstance();
  const cadastralAdapter = CadastralAdapter.getInstance();

  // 1. Auditoría Oficial de Catastro
  console.log('--- 1. AUDITORÍA CATASTRAL OFICIAL ---');
  const catAudit = cadastralAdapter.getAuditReport();
  console.log(`Estado: ${catAudit.status}`);
  console.log(`Entidad: ${catAudit.officialEntity}`);
  console.log(`Resumen: ${catAudit.legalAndTechnicalSummary}`);
  console.log(`Datos preparados: ${catAudit.dataPointsReadyForIngestion.join(', ')}\n`);

  // 2. HealthChecks de Fuentes
  console.log('--- 2. AUDITORÍA Y HEALTHCHECK DE LAS 20 FUENTES ---');
  const healthResults = await engine.adapterRegistry.runHealthCheckAll();
  for (const h of healthResults) {
    const statusIcon = h.healthy ? '✓' : h.capability === 'BLOCKED' ? '🛑' : '⚠';
    console.log(`[${h.sourceCode.padEnd(20)}] ${statusIcon} Capability: ${h.capability.padEnd(28)} | ${h.message}`);
  }
  console.log('\n');

  // 3. Ejecución de Ingesta Real (Target >= 100 publicaciones reales)
  console.log('--- 3. EJECUTANDO INGESTA REAL DE MERCADO (InfoCasas Uruguay) ---');
  console.log('Descubriendo publicaciones en Montevideo, Maldonado, Canelones...');

  const runResult = await engine.executeRun('infocasas', {
    limit: 120, // Solicitamos hasta 120 para superar el piso de 100 publicaciones
    department: 'montevideo',
    runType: 'DISCOVERY',
  });

  console.log(`\nResultado de la Ejecución ${runResult.runId}:`);
  console.log(`- Estado: ${runResult.status}`);
  console.log(`- Duración: ${runResult.durationMs} ms`);
  console.log(`- Publicaciones Descubiertas: ${runResult.listingsDiscovered}`);
  console.log(`- Publicaciones Nuevas: ${runResult.listingsNew}`);
  console.log(`- Medios Descubiertos: ${runResult.mediaDiscovered}`);
  console.log(`- Property Masters Resueltos: ${runResult.propertyMastersResolved}`);
  console.log(`- Eventos de Precio Creados: ${runResult.priceEventsCreated}`);
  console.log(`- Errores: ${runResult.errorsCount}\n`);

  // 4. Muestra de Publicaciones Normalizadas y Evidencia
  console.log('--- 4. MUESTRA DE DATOS REALES NORMALIZADOS (3 Ejemplos) ---');
  const allListings = Array.from(engine.normalizedListings.values());
  const sample = allListings.slice(0, 3);

  sample.forEach((listing, idx) => {
    const quality = DataQualityEngine.evaluate(listing);
    console.log(`\n[Ejemplo #${idx + 1}] ID: ${listing.sourceListingKey}`);
    console.log(`  Título: ${listing.titleNormalized}`);
    console.log(`  Tipo: ${listing.propertyType} | Operación: ${listing.operationType}`);
    console.log(`  Ubicación: ${listing.normalizedAddress} (${listing.neighborhood || 'Sin barrio'}, ${listing.department})`);
    console.log(`  Precisión Ubicación: ${listing.locationPrecision}`);
    console.log(`  Precio: USD ${listing.priceUsd.toLocaleString()} (Raw: ${listing.currentPrice} ${listing.currentCurrency})`);
    if (listing.pricePerM2Usd) console.log(`  Precio/m²: USD ${listing.pricePerM2Usd}/m²`);
    console.log(`  Superficie: Total ${listing.totalAreaM2 || 'N/D'} m² | Edificada ${listing.builtAreaM2 || 'N/D'} m²`);
    console.log(`  Dormitorios: ${listing.bedrooms ?? 'N/D'} | Baños: ${listing.bathrooms ?? 'N/D'} | Garajes: ${listing.garages ?? 'N/D'}`);
    console.log(`  Fotos: ${listing.media.length} medios`);
    console.log(`  Data Quality Score: ${quality.qualityScore}/100 | Warnings: [${quality.warnings.join(', ')}]`);
    console.log(`  Es Outlier: ${quality.isOutlier ? 'SÍ' : 'NO'}`);
  });
  console.log('\n');

  // 5. Demostración de Idempotencia Estricta (Segunda Ejecución)
  console.log('--- 5. PRUEBA DE IDEMPOTENCIA ESTRICTA (Re-ejecución sobre los mismos datos) ---');
  const secondRunResult = await engine.executeRun('infocasas', {
    limit: 120,
    department: 'montevideo',
    runType: 'REFRESH',
  });

  console.log(`Resultado Segunda Ejecución ${secondRunResult.runId}:`);
  console.log(`- Publicaciones Descubiertas: ${secondRunResult.listingsDiscovered}`);
  console.log(`- Publicaciones Nuevas (Debe ser 0): ${secondRunResult.listingsNew}`);
  console.log(`- Publicaciones Sin Cambios (Unchanged): ${secondRunResult.listingsUnchanged}`);
  console.log(`- Eventos de Precio Nuevos (Debe ser 0): ${secondRunResult.priceEventsCreated}`);

  if (secondRunResult.listingsNew === 0 && secondRunResult.priceEventsCreated === 0) {
    console.log('>>> IDEMPOTENCIA CERTIFICADA: 0 duplicaciones de listings, masters o historial de precios. <<<\n');
  } else {
    console.error('>>> ERROR: Fallo en prueba de idempotencia. <<<\n');
  }

  // 6. Resumen Global del Pipeline
  const summary = engine.getPipelineSummary();
  console.log('================================================================');
  console.log('RESUMEN GLOBAL DEL PIPELINE PILOTO (FASE 1 + FASE 2)');
  console.log('================================================================');
  console.log(`- Total Publicaciones en Base: ${summary.totalListings}`);
  console.log(`- Total Property Masters Creados: ${summary.totalMasters}`);
  console.log(`- Total Snapshots Inmutables: ${summary.totalSnapshots}`);
  console.log(`- Total Medios Canónicos (Fotos): ${summary.totalMedia}`);
  console.log(`- Total Registros Historial de Precios: ${summary.totalPriceEvents}`);
  console.log(`- Total Evidencias Granulares por Campo: ${summary.totalFieldEvidences}`);
  console.log(`- Total Candidatos de Deduplicación: ${summary.totalDuplicateCandidates}`);
  console.log(`- Total Ejecuciones de Ingesta: ${summary.totalRuns}`);
  console.log('================================================================\n');
}

runPilot().catch(console.error);
