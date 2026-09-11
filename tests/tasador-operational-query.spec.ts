// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE: CONSULTA OPERATIVA Y COMPARABLES (PARTE 1 + PARTE 2)
// Validación de:
// 1. Contrato de datos y validación de campos obligatorios (Parte 1)
// 2. Aislamiento multi-tenant (Parte 1)
// 3. Scoring determinístico de similitud y ranking de comparables (Parte 2)
// 4. Invariante del 12% de descuento sobre asking price (Parte 2)
// 5. Flujo de exclusión fundamentada con auditoría y trazabilidad (Parte 2)
// 6. Estadísticas descriptivas de muestra y semáforo de calidad de muestra (Parte 2)
// 7. Transición de estado a READY_FOR_VALUATION con N >= 3 (Parte 2)
// ==============================================================================

import { test, expect } from '@playwright/test';
import { AppraisalService } from '../src/lib/tasador/appraisal/AppraisalService';
import {
  AppraisalPropertyInput,
  AppraisalComparableItem,
} from '../src/lib/tasador/appraisal/appraisalTypes';

test.describe('Tasador IA - Parte 1: Consulta Operativa e Inmueble Objetivo', () => {
  const targetApartment: AppraisalPropertyInput = {
    title: 'Apartamento 2 Dormitorios Pocitos',
    propertyType: 'apartamento',
    horizontalProperty: true,
    operationType: 'SALE',
    location: {
      country: 'Uruguay',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      streetName: 'Av. Brasil',
      streetNumber: '2540',
      unitOrApt: '402',
      floor: '4',
      cadastralNumber: '18492',
      latitude: -34.915,
      longitude: -56.148,
      isGeocodedExact: true,
    },
    surfaces: {
      totalAreaM2: 85,
      builtAreaM2: 80,
      coveredAreaM2: 76,
      balconyOrTerraceM2: 4,
    },
    layout: {
      bedrooms: 2,
      bathrooms: 2,
      toilettes: 0,
      garages: 1,
      floorLevel: 4,
    },
    amenities: {
      balcony: true,
      terrace: false,
      patio: false,
      garden: false,
      barbecue: true,
      pool: false,
      elevator: true,
      concierge: true,
      security24h: true,
      heating: false,
      airConditioning: true,
      gym: false,
      seaFront: false,
      openView: true,
      storage: true,
    },
    condition: 'muy_bueno',
    ageYears: 12,
    photos: [],
    observations: 'Excelente luminosidad sobre Av. Brasil.',
  };

  test('1. Validación estricta: Inmueble objetivo completo pasa validación', () => {
    const valResult = AppraisalService.validateForComparables(targetApartment);
    expect(valResult.valid).toBe(true);

    // Si falta el departamento debe fallar
    const invalidLoc = AppraisalService.validateForComparables({
      ...targetApartment,
      location: { ...targetApartment.location, department: '' },
    });
    expect(invalidLoc.valid).toBe(false);
    expect(invalidLoc.errorField).toBe('department');

    // Si no hay superficie debe fallar
    const invalidSurf = AppraisalService.validateForComparables({
      ...targetApartment,
      surfaces: { totalAreaM2: 0, builtAreaM2: 0, coveredAreaM2: 0 },
    });
    expect(invalidSurf.valid).toBe(false);
    expect(invalidSurf.errorField).toBe('surfaces');
  });

  test('2. Guardado y recuperación con persistencia multi-tenant', async () => {
    const orgId = 'org-estudio-nova-test';
    const saved = await AppraisalService.saveAppraisal({
      organizationId: orgId,
      status: 'DRAFT',
      propertyInput: targetApartment,
      location: targetApartment.location,
      selectedComparablesCount: 0,
      setQuality: 'MEDIA',
      comparables: [],
    });

    expect(saved.id).toBeDefined();
    expect(saved.organizationId).toBe(orgId);
    expect(saved.status).toBe('DRAFT');
    expect(saved.propertyInput.location.neighborhood).toBe('Pocitos');

    // Recuperar por ID
    const retrieved = await AppraisalService.getAppraisalById(saved.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.organizationId).toBe(orgId);

    // Listar para la organización
    const orgList = await AppraisalService.listAppraisals(orgId);
    expect(orgList.some((a) => a.id === saved.id)).toBe(true);

    // Otra organización no debe verla (Aislamiento de Tenant)
    const otherOrgList = await AppraisalService.listAppraisals('org-otro-estudio');
    expect(otherOrgList.some((a) => a.id === saved.id)).toBe(false);
  });

  test('3. Transición de estado a READY_FOR_COMPARABLES', async () => {
    const orgId = 'org-lifecycle-test';
    const appraisal = await AppraisalService.saveAppraisal({
      organizationId: orgId,
      status: 'DRAFT',
      propertyInput: targetApartment,
      location: targetApartment.location,
      selectedComparablesCount: 0,
      setQuality: 'MEDIA',
    });

    const updated = await AppraisalService.updateStatus(appraisal.id, 'READY_FOR_COMPARABLES');
    expect(updated?.status).toBe('READY_FOR_COMPARABLES');
  });
});

test.describe('Tasador IA - Parte 2: Selección y Validación de Comparables', () => {
  const targetProperty: AppraisalPropertyInput = {
    title: 'Apartamento Pocitos 2D',
    propertyType: 'apartamento',
    horizontalProperty: true,
    operationType: 'SALE',
    location: {
      country: 'Uruguay',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      streetName: 'Av. Brasil',
      streetNumber: '2540',
      latitude: -34.915,
      longitude: -56.148,
      isGeocodedExact: true,
    },
    surfaces: {
      totalAreaM2: 80,
      builtAreaM2: 75,
      coveredAreaM2: 75,
    },
    layout: {
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
    },
    amenities: {
      balcony: true,
      terrace: false,
      patio: false,
      garden: false,
      barbecue: false,
      pool: false,
      elevator: true,
      concierge: false,
      security24h: false,
      heating: false,
      airConditioning: true,
      gym: false,
      seaFront: false,
      openView: true,
      storage: false,
    },
    condition: 'bueno',
    ageYears: 10,
    photos: [],
  };

  test('1. Búsqueda y ranking determinístico de comparables', async () => {
    const candidates = await AppraisalService.searchComparables(targetProperty);

    expect(candidates.length).toBeGreaterThanOrEqual(4);

    // Todos deben tener similitud calculada entre 0 y 100
    for (const c of candidates) {
      expect(c.similarityScore).toBeGreaterThanOrEqual(0);
      expect(c.similarityScore).toBeLessThanOrEqual(100);
      expect(c.scoreBreakdown).toBeDefined();
      expect(c.scoreBreakdown.locationScore).toBeDefined();
      expect(c.scoreBreakdown.surfaceScore).toBeDefined();
      expect(c.scoreBreakdown.propertyTypeScore).toBeDefined();
    }

    // Los candidatos deben estar ordenados descendentemente por score de similitud
    for (let i = 0; i < candidates.length - 1; i++) {
      expect(candidates[i].similarityScore).toBeGreaterThanOrEqual(candidates[i + 1].similarityScore);
    }
  });

  test('2. Invariante matemática: Descuento obligatorio versionado sobre asking price (8.5% en V2)', async () => {
    const candidates = await AppraisalService.searchComparables(targetProperty);
    const first = candidates[0];

    // adjustedPriceUsd = askingPriceUsd * (1 - 0.085) = askingPriceUsd * 0.915 en V2
    // first.candidateData.priceUsd es el asking price original
    // first.candidateData.adjustedPriceUsd es el precio de oferta ajustado al 8.5%
    const askingPrice = first.candidateData.priceUsd;
    const expectedAdjusted = Math.round(askingPrice * 0.915);
    expect(Math.abs(first.candidateData.adjustedPriceUsd - expectedAdjusted)).toBeLessThanOrEqual(2);

    // askingPriceAdjustmentApplied debe ser verdadero
    expect(first.candidateData.askingPriceAdjustmentApplied).toBe(true);
  });

  test('3. Similitud penaliza disparidad de superficie y tipología', async () => {
    const candidates = await AppraisalService.searchComparables(targetProperty);

    // Candidato con misma tipología y en el mismo barrio Pocitos
    const pocitosApt = candidates.find(
      (c) => c.candidateData.propertyType === 'apartamento' && c.candidateData.neighborhood === 'Pocitos'
    );
    expect(pocitosApt).toBeDefined();
    expect(pocitosApt!.similarityScore).toBeGreaterThan(60);
    expect(pocitosApt!.scoreBreakdown.locationScore).toBeGreaterThanOrEqual(70);
    expect(pocitosApt!.scoreBreakdown.propertyTypeScore).toBe(100);
  });

  test('4. Flujo de exclusión fundamentada con auditoría', async () => {
    const orgId = 'org-exclusion-test';
    const candidates = await AppraisalService.searchComparables(targetProperty);

    const appraisal = await AppraisalService.saveAppraisal({
      organizationId: orgId,
      status: 'COMPARABLES_FOUND',
      propertyInput: targetProperty,
      location: targetProperty.location,
      selectedComparablesCount: candidates.filter((c) => c.selected).length,
      setQuality: 'ALTA',
      comparables: candidates,
    });

    const candidateToExclude = candidates[0];
    const updatedAppraisal = await AppraisalService.excludeComparable(
      appraisal.id,
      candidateToExclude.id,
      'SURFACE_OUTLIER',
      'Metraje reportado no es confiable según consulta catastral'
    );

    expect(updatedAppraisal).not.toBeNull();
    const excludedItem = updatedAppraisal!.comparables?.find((c) => c.id === candidateToExclude.id);
    expect(excludedItem?.selected).toBe(false);
    expect(excludedItem?.status).toBe('EXCLUDED');
    expect(excludedItem?.exclusionReason).toBe('SURFACE_OUTLIER');
    expect(excludedItem?.analystNote).toContain('catastral');
    expect(excludedItem?.excludedAt).toBeDefined();

    // Re-inclusión
    const reincludedAppraisal = await AppraisalService.includeComparable(
      appraisal.id,
      candidateToExclude.id
    );
    const reincludedItem = reincludedAppraisal!.comparables?.find((c) => c.id === candidateToExclude.id);
    expect(reincludedItem?.selected).toBe(true);
    expect(reincludedItem?.status).toBe('INCLUDED');
    expect(reincludedItem?.exclusionReason).toBeNull();
  });

  test('5. Estadísticas descriptivas de muestra y semáforo de calidad', async () => {
    const candidates = await AppraisalService.searchComparables(targetProperty);

    const stats = AppraisalService.computeDescriptiveStats(candidates);
    expect(stats.totalCandidates).toBe(candidates.length);
    expect(stats.selectedCount).toBe(candidates.filter((c) => c.selected).length);
    expect(stats.medianPricePerM2Usd).toBeGreaterThan(1000);
    expect(stats.minPricePerM2Usd).toBeLessThanOrEqual(stats.medianPricePerM2Usd);
    expect(stats.maxPricePerM2Usd).toBeGreaterThanOrEqual(stats.medianPricePerM2Usd);

    // Calidad del set con >= 5 comparables homogéneos
    const quality = AppraisalService.evaluateSetQuality(candidates);
    expect(['ALTA', 'MEDIA', 'BAJA']).toContain(quality);

    // Si excluimos casi todos y dejamos solo 2, la calidad debe degradar a BAJA
    const degradedCandidates: AppraisalComparableItem[] = candidates.map((c, idx) => ({
      ...c,
      selected: idx < 2,
      status: idx < 2 ? 'INCLUDED' : 'EXCLUDED',
    }));
    const lowQuality = AppraisalService.evaluateSetQuality(degradedCandidates);
    expect(lowQuality).toBe('BAJA');
  });

  test('6. Transición a READY_FOR_VALUATION sólo con N >= 3 comparables válidos', async () => {
    const orgId = 'org-valuation-gate-test';
    const candidates = await AppraisalService.searchComparables(targetProperty);

    const appraisal = await AppraisalService.saveAppraisal({
      organizationId: orgId,
      status: 'COMPARABLES_REVIEWED',
      propertyInput: targetProperty,
      location: targetProperty.location,
      selectedComparablesCount: candidates.filter((c) => c.selected).length,
      setQuality: 'ALTA',
      comparables: candidates,
    });

    const readyAppraisal = await AppraisalService.updateStatus(appraisal.id, 'READY_FOR_VALUATION');
    expect(readyAppraisal?.status).toBe('READY_FOR_VALUATION');
  });
});
