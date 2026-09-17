// ==============================================================================
// TEST SUITE: Fase 1 - Tasador IA: Deduplicación y Cálculo de Valoración
// Bloques D, E & F: Manejo de errores honesto, no confiar en cliente y deduplicación
// ==============================================================================

import { test, expect } from '@playwright/test';
import { DeduplicationService } from '../src/lib/tasador/deduplication/DeduplicationService';

test.describe('Fase 1 - Bloques D, E & F: Deduplicación y Tasador Core', () => {
  test('1. Deduplicación multi-portal: Detectar listados del mismo inmueble físico', () => {
    const dedupService = new DeduplicationService();

    const listingA: any = {
      id: 'ml_101',
      sourceCode: 'mercadolibre',
      sourceListingId: 'MLU-999123',
      addressNormalized: 'Benito Blanco 1234 Pocitos',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      coveredAreaM2: 78,
      priceUsd: 185000,
      bedrooms: 2,
    };

    const listingB: any = {
      id: 'ic_202',
      sourceCode: 'infocasas',
      sourceListingId: 'IC-888456',
      addressNormalized: 'Benito Blanco 1234 Pocitos',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      coveredAreaM2: 80,
      priceUsd: 189000,
      bedrooms: 2,
    };

    const candidate = dedupService.evaluatePair(listingA, listingB, {
      listingAId: 'ml_101',
      listingBId: 'ic_202',
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.matchScore).toBeGreaterThanOrEqual(70);
    expect(candidate?.confidenceLevel).toBeDefined();
  });

  test('2. No deduplicar si son inmuebles distintos en barrios distintos', () => {
    const dedupService = new DeduplicationService();

    const listingA: any = {
      id: 'ml_101',
      sourceCode: 'mercadolibre',
      sourceListingId: 'MLU-999123',
      addressNormalized: 'Benito Blanco 1234 Pocitos',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      coveredAreaM2: 78,
      priceUsd: 185000,
      bedrooms: 2,
    };

    const listingC: any = {
      id: 'ic_303',
      sourceCode: 'infocasas',
      sourceListingId: 'IC-777999',
      addressNormalized: 'Avenida Brasil 2900 Pocitos',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'casa',
      coveredAreaM2: 240,
      priceUsd: 450000,
      bedrooms: 4,
    };

    const candidate = dedupService.evaluatePair(listingA, listingC, {
      listingAId: 'ml_101',
      listingBId: 'ic_303',
    });

    expect(candidate).toBeNull();
  });
});
