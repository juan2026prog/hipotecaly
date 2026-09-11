// ==============================================================================
// REPROCESAMIENTO CONSERVADOR Y AUDITORÍA DE DEDUPLICACIÓN — HIPOTECALY
// Re-procesa los 650 listings reales a partir de los snapshots brutos inmutables
// ==============================================================================

import { supabaseAdmin } from '../server/supabase';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';
import { PropertyMasterResolver } from '../src/lib/tasador/master/PropertyMasterResolver';
import { DataQualityEngine } from '../src/lib/tasador/quality/DataQualityEngine';
import { evaluateComparableEligibility } from '../src/lib/tasador/ingestion/ListingIngestionWorker';
import { computeListingFingerprints } from '../src/lib/tasador/ingestion/SourceDiscoveryService';

async function main() {
  console.log('=== INICIANDO REPROCESAMIENTO CONSERVADOR DE BASE INMOBILIARIA ===');

  // 1. Obtener los 650 snapshots inmutables de la base de datos
  const { data: snapshots, error: snapErr } = await supabaseAdmin
    .from('property_listing_snapshots')
    .select('id, listing_id, captured_at, structured_payload')
    .order('captured_at', { ascending: true });

  if (snapErr || !snapshots || snapshots.length === 0) {
    throw new Error(`Error cargando snapshots: ${snapErr?.message || 'No hay snapshots'}`);
  }

  console.log(`Cargados ${snapshots.length} snapshots inmutables para reprocesamiento.`);

  // 2. Instanciar resolver limpio
  const masterResolver = PropertyMasterResolver.getInstance();
  masterResolver.masters.clear();

  // Deduplicar snapshots únicos por listing_id (usar el más reciente por listing)
  const latestSnapshotByListing = new Map<string, any>();
  for (const s of snapshots) {
    latestSnapshotByListing.set(s.listing_id, s);
  }

  console.log(`Total listings únicos identificados en snapshots: ${latestSnapshotByListing.size}`);

  const reprocessedListings: Array<{
    listingId: string;
    normalized: any;
    master: any;
    fingerprints: any;
    qualityScore: number;
    comparableEligibility: string;
  }> = [];

  for (const [listingId, snap] of latestSnapshotByListing.entries()) {
    const rawPayload = snap.structured_payload;
    const rawJson = rawPayload?.rawJson || {};

    // Re-extraer con el parser corregido
    const departmentRaw =
      rawJson.locations?.state?.[0]?.name ||
      rawJson.estate?.name ||
      rawJson.estate_name ||
      rawPayload.departmentRaw ||
      'Montevideo';

    const neighborhoodRaw =
      rawJson.locations?.neighbourhood?.[0]?.name ||
      rawJson.neighborhood?.name ||
      rawJson.neighborhood_name ||
      null; // Preservar null si no existe barrio específico

    const streetNameRaw = rawJson.address || rawJson.street || rawPayload.streetNameRaw || null;
    const streetNumberRaw = rawJson.street_number || rawPayload.streetNumberRaw || null;

    const rawLat = rawJson.latitude ?? rawJson.lat ?? rawPayload.latitudeRaw;
    const rawLng = rawJson.longitude ?? rawJson.lng ?? rawPayload.longitudeRaw;
    const latitudeRaw = rawLat != null && rawLat !== '' ? parseFloat(rawLat) : null;
    const longitudeRaw = rawLng != null && rawLng !== '' ? parseFloat(rawLng) : null;

    // Actualizar rawPayload corregido
    const correctedRaw = {
      ...rawPayload,
      departmentRaw,
      neighborhoodRaw,
      streetNameRaw,
      streetNumberRaw,
      latitudeRaw: isNaN(latitudeRaw as number) ? null : latitudeRaw,
      longitudeRaw: isNaN(longitudeRaw as number) ? null : longitudeRaw,
    };

    // Normalización
    const normalized = NormalizationEngine.normalize(correctedRaw);

    // Fingerprints
    const fingerprints = computeListingFingerprints(correctedRaw);

    // Calidad y Elegibilidad
    const qualityReport = DataQualityEngine.evaluate(normalized);
    const qualityScore = qualityReport.qualityScore;
    const { eligibility } = evaluateComparableEligibility(normalized, qualityScore);

    // Resolución conservadora de Master
    const { master } = masterResolver.resolveMaster(normalized);

    reprocessedListings.push({
      listingId,
      normalized,
      master,
      fingerprints,
      qualityScore,
      comparableEligibility: eligibility,
    });
  }

  const uniqueMasters = masterResolver.getAllMasters();
  console.log(`\n--- RESULTADO DE DEDUPLICACIÓN CONSERVADORA ---`);
  console.log(`Total Listings: ${reprocessedListings.length}`);
  console.log(`Total Masters Únicos: ${uniqueMasters.length}`);
  console.log(`Tasa de Deduplicación Conservadora: ${((1 - uniqueMasters.length / reprocessedListings.length) * 100).toFixed(2)}%`);

  // 3. Reconstruir masters y actualizar listings en PostgreSQL en lotes
  console.log('\nActualizando base de datos PostgreSQL remota...');

  // A. Insertar/actualizar masters
  const masterBatches: any[][] = [];
  let currentMBatch: any[] = [];
  for (const m of uniqueMasters) {
    currentMBatch.push({
      id: m.id,
      canonical_address: m.canonicalAddress || 'Sin Dirección',
      department: m.department || 'Montevideo',
      city: m.city || 'Montevideo',
      neighborhood: m.neighborhood || null,
      property_type: m.propertyType || 'APARTMENT',
      total_area_m2: m.totalAreaM2 || null,
      built_area_m2: m.builtAreaM2 || null,
      bedrooms: m.bedrooms || null,
      bathrooms: m.bathrooms || null,
      parking_spaces: m.parkingSpaces || null,
      latitude: m.latitude || null,
      longitude: m.longitude || null,
      dedup_hash: m.dedupHash,
      canonical_status: m.canonicalStatus || 'ACTIVE',
      data_quality_score: 85.0,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    });
    if (currentMBatch.length >= 50) {
      masterBatches.push(currentMBatch);
      currentMBatch = [];
    }
  }
  if (currentMBatch.length > 0) masterBatches.push(currentMBatch);

  for (const batch of masterBatches) {
    const { error: upsertMErr } = await supabaseAdmin
      .from('property_master')
      .upsert(batch, { onConflict: 'id' });
    if (upsertMErr) {
      console.error('Error upserting masters batch:', upsertMErr.message);
    }
  }
  console.log(`Masters insertados/actualizados: ${uniqueMasters.length}`);

  // B. Actualizar cada listing con su master_id corregido y atributos geográficos
  let updatedListingsCount = 0;
  for (const item of reprocessedListings) {
    const { error: updErr } = await supabaseAdmin
      .from('property_listings')
      .update({
        master_id: item.master.id,
        department_raw: item.normalized.department,
        department_normalized: item.normalized.department,
        city_raw: item.normalized.city || item.normalized.department,
        city_normalized: item.normalized.city || item.normalized.department,
        neighborhood_raw: item.normalized.neighborhood || null,
        neighborhood_normalized: item.normalized.neighborhood || null,
        address_raw: item.normalized.normalizedAddress || null,
        address_normalized: item.normalized.normalizedAddress || null,
        street_name: item.normalized.streetName || null,
        street_number: item.normalized.streetNumber || null,
        unit: item.normalized.unit || null,
        floor: item.normalized.floor || null,
        latitude: item.normalized.latitude || null,
        longitude: item.normalized.longitude || null,
        data_quality_score: item.qualityScore,
        comparable_eligibility: item.comparableEligibility,
        identity_fingerprint: item.fingerprints.identityFingerprint,
        content_fingerprint: item.fingerprints.contentFingerprint,
        pricing_fingerprint: item.fingerprints.pricingFingerprint,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.listingId);

    if (!updErr) updatedListingsCount++;
    else console.warn(`Error updating listing ${item.listingId}:`, updErr.message);
  }

  console.log(`Listings actualizados en PostgreSQL: ${updatedListingsCount}`);

  // C. Limpiar masters huérfanos de la corrida anterior que ya no tienen ningún listing asociado
  const { data: activeMasterIds } = await supabaseAdmin
    .from('property_listings')
    .select('master_id');
  const validIds = new Set((activeMasterIds || []).map((r: any) => r.master_id));

  const { data: allDbMasters } = await supabaseAdmin
    .from('property_master')
    .select('id');

  const orphanIds = (allDbMasters || [])
    .map((m: any) => m.id)
    .filter((id: string) => !validIds.has(id));

  if (orphanIds.length > 0) {
    console.log(`Eliminando ${orphanIds.length} masters huérfanos de corridas anteriores...`);
    // Eliminar en lotes de 50
    for (let i = 0; i < orphanIds.length; i += 50) {
      const slice = orphanIds.slice(i, i + 50);
      await supabaseAdmin.from('property_master').delete().in('id', slice);
    }
  }

  // 4. Calcular métricas estadísticas de clusters
  const clusterCounts: number[] = [];
  for (const m of uniqueMasters) {
    clusterCounts.push(m.listingIds.length);
  }
  clusterCounts.sort((a, b) => a - b);

  const total = clusterCounts.length;
  const sum = clusterCounts.reduce((acc, v) => acc + v, 0);
  const avg = sum / total;
  const median = total % 2 === 0
    ? (clusterCounts[total / 2 - 1] + clusterCounts[total / 2]) / 2
    : clusterCounts[Math.floor(total / 2)];
  const p90 = clusterCounts[Math.floor(total * 0.9)];
  const p95 = clusterCounts[Math.floor(total * 0.95)];
  const max = clusterCounts[total - 1];
  const min = clusterCounts[0];

  console.log('\n=== MÉTRICAS ESTADÍSTICAS DE CLUSTERS (CONSERVADORA) ===');
  console.log(`- Total Listings: ${sum}`);
  console.log(`- Total Property Masters: ${total}`);
  console.log(`- Promedio listings/master: ${avg.toFixed(2)}`);
  console.log(`- Mediana: ${median}`);
  console.log(`- P90: ${p90}`);
  console.log(`- P95: ${p95}`);
  console.log(`- Mínimo: ${min}`);
  console.log(`- Máximo: ${max}`);

  // Distribución de tamaños
  const sizeDist: Record<string, number> = {
    '1 (Unico)': 0,
    '2': 0,
    '3-5': 0,
    '6-10': 0,
    '>10': 0,
  };
  for (const c of clusterCounts) {
    if (c === 1) sizeDist['1 (Unico)']++;
    else if (c === 2) sizeDist['2']++;
    else if (c >= 3 && c <= 5) sizeDist['3-5']++;
    else if (c >= 6 && c <= 10) sizeDist['6-10']++;
    else sizeDist['>10']++;
  }
  console.log('\nDistribución de tamaños de cluster:', sizeDist);

  console.log('\n=== REPROCESAMIENTO CONSERVADOR COMPLETADO CON ÉXITO ===');
}

main().catch((err) => {
  console.error('Error fatal en reprocesamiento:', err);
  process.exit(1);
});
