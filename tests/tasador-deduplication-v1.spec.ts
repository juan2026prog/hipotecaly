// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE DEDUPLICACIÓN MULTI-FUENTE V1
// Scoring Multi-Señal, Umbrales Configurables, Reversibilidad y No-Destructividad
// ==============================================================================

import { test, expect } from '@playwright/test';
import { DedupScoringEngine } from '../src/lib/tasador/deduplication/DedupScoringEngine';
import { DeduplicationService } from '../src/lib/tasador/deduplication/DeduplicationService';
import { PropertyMasterResolver } from '../src/lib/tasador/master/PropertyMasterResolver';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';
import { RawListingPayload } from '../src/lib/tasador/types/tasadorPipelineTypes';

test.describe('TASADOR IA - DEDUPLICACIÓN MULTI-FUENTE V1 & PROPERTY MASTER', () => {

  const rawBaseA: RawListingPayload = {
    sourceCode: 'infocasas',
    sourceListingId: 'info_101',
    originalUrl: 'https://infocasas.com.uy/prop/101',
    titleRaw: 'Apartamento de 2 dormitorios en Pocitos',
    currentPriceRaw: 220000,
    currencyRaw: 'USD',
    departmentRaw: 'Montevideo',
    neighborhoodRaw: 'Pocitos',
    streetNameRaw: 'Calle Benito Blanco',
    streetNumberRaw: '1250',
    unitRaw: '402',
    totalAreaM2Raw: 75,
    builtAreaM2Raw: 70,
    bedroomsRaw: 2,
    bathroomsRaw: 1,
    latitudeRaw: -34.915000,
    longitudeRaw: -56.148000,
    mediaRaw: [
      { sourceUrl: 'https://img.com/a1.jpg', mediaType: 'IMAGE', position: 0, sha256Hash: 'hash_photo_1' },
      { sourceUrl: 'https://img.com/a2.jpg', mediaType: 'IMAGE', position: 1, sha256Hash: 'hash_photo_2' },
    ],
  };

  test('Req 01: Señal Exacta: Coincidencia de Padrón Catastral asigna máxima confianza', () => {
    const listA = NormalizationEngine.normalize({ ...rawBaseA, cadastralNumberRaw: '124589' });
    const listB = NormalizationEngine.normalize({
      ...rawBaseA,
      sourceCode: 'remax_uy',
      sourceListingId: 'rmx_99',
      cadastralNumberRaw: '124589',
    });

    const breakdown = DedupScoringEngine.compareListings(listA, listB);
    expect(breakdown.cadastralScore).toBe(100);
    expect(breakdown.totalScore).toBeGreaterThanOrEqual(95);
    expect(breakdown.confidenceLevel).toBe('VERY_HIGH_CONFIDENCE');
  });

  test('Req 02: Señal de Dirección Exacta + Superficie + Dormitorios asigna alta confianza', () => {
    const listA = NormalizationEngine.normalize(rawBaseA);
    const listB = NormalizationEngine.normalize({
      ...rawBaseA,
      sourceCode: 'mercadolibre_uy',
      sourceListingId: 'meli_77',
      titleRaw: 'Venta apartamento Benito Blanco y Guayaqui',
      currentPriceRaw: 225000, // Pequeña variación de precio de agencia
    });

    const breakdown = DedupScoringEngine.compareListings(listA, listB);
    expect(breakdown.addressScore).toBe(100);
    expect(breakdown.totalScore).toBeGreaterThanOrEqual(95);
    expect(breakdown.confidenceLevel).toBe('VERY_HIGH_CONFIDENCE');
  });

  test('Req 03: Cálculo preciso de distancia GPS con fórmula de Haversine', () => {
    // Coordenadas con diferencia de ~15 metros
    const distMeters = DedupScoringEngine.calculateHaversineDistanceMeters(
      -34.915000,
      -56.148000,
      -34.915100,
      -56.148100
    );
    expect(distMeters).toBeLessThan(25);
    expect(distMeters).toBeGreaterThan(0);
  });

  test('Req 04: Señal Visual: Fotos idénticas compartidas aportan puntaje significativo', () => {
    const listA = NormalizationEngine.normalize(rawBaseA);
    const listB = NormalizationEngine.normalize({
      ...rawBaseA,
      sourceCode: 'acs_uy',
      sourceListingId: 'acs_44',
      streetNumberRaw: null, // Sin número de puerta
      unitRaw: null,
      mediaRaw: [
        { sourceUrl: 'https://img.com/a1.jpg', mediaType: 'IMAGE', position: 0, sha256Hash: 'hash_photo_1' },
        { sourceUrl: 'https://img.com/a2.jpg', mediaType: 'IMAGE', position: 1, sha256Hash: 'hash_photo_2' },
      ],
    });

    const breakdown = DedupScoringEngine.compareListings(listA, listB);
    expect(breakdown.photoScore).toBe(100);
    expect(breakdown.totalScore).toBeGreaterThanOrEqual(85);
  });

  test('Req 05: Propiedades en el mismo barrio con diferente superficie o dormitorios no se confunden', () => {
    const listA = NormalizationEngine.normalize(rawBaseA);
    const listB = NormalizationEngine.normalize({
      sourceCode: 'gallito_uy',
      sourceListingId: 'gal_11',
      originalUrl: 'https://gallito.com.uy/11',
      titleRaw: 'Apartamento grande en Pocitos',
      currentPriceRaw: 450000,
      currencyRaw: 'USD',
      departmentRaw: 'Montevideo',
      neighborhoodRaw: 'Pocitos',
      totalAreaM2Raw: 180,
      builtAreaM2Raw: 160,
      bedroomsRaw: 4,
      bathroomsRaw: 3,
    });

    const breakdown = DedupScoringEngine.compareListings(listA, listB);
    expect(breakdown.totalScore).toBeLessThan(70);
    expect(breakdown.confidenceLevel).toBe('LOW_CONFIDENCE');
  });

  test('Req 06: Generación de candidatos no destructivos en DeduplicationService', () => {
    const service = new DeduplicationService();
    const listA = NormalizationEngine.normalize(rawBaseA);
    const listB = NormalizationEngine.normalize({
      ...rawBaseA,
      sourceCode: 'century21_uy',
      sourceListingId: 'c21_55',
    });

    const candidate = service.evaluatePair(listA, listB);
    expect(candidate).not.toBeNull();
    expect(candidate?.matchScore).toBeGreaterThanOrEqual(95);
    expect(candidate?.decision).toBe('MATCH');
    expect(candidate?.decisionSource).toBe('AUTOMATED');

    // Revisión manual reversible
    const reviewed = service.reviewCandidate(candidate!.id, 'UNCERTAIN', 'user_notary_1');
    expect(reviewed?.decision).toBe('UNCERTAIN');
    expect(reviewed?.decisionSource).toBe('MANUAL_REVIEW');
  });

  test('Req 07: PropertyMasterResolver vincula N listings a 1 Master de forma canónica', () => {
    const resolver = new PropertyMasterResolver();
    const listA = NormalizationEngine.normalize(rawBaseA);
    const listB = NormalizationEngine.normalize({
      ...rawBaseA,
      sourceCode: 'kosak_uy',
      sourceListingId: 'ksk_90',
    });

    const resA = resolver.resolveMaster(listA);
    expect(resA.isNew).toBe(true);
    expect(resA.master.listingIds.length).toBe(1);

    const resB = resolver.resolveMaster(listB);
    expect(resB.isNew).toBe(false);
    expect(resB.master.id).toBe(resA.master.id);
    expect(resB.master.listingIds.length).toBe(2);
  });
});
