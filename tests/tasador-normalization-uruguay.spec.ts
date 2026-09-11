// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE NORMALIZACIÓN URUGUAY
// Verificación de Departamentos, Barrios MVD, Monedas, Superficies, Tipos y Regla NULL != FALSE
// ==============================================================================

import { test, expect } from '@playwright/test';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';
import {
  normalizeDepartment,
  normalizeNeighborhood,
  normalizeStreetName,
  determineLocationPrecision,
} from '../src/lib/tasador/normalization/UruguayLocationDictionary';
import {
  normalizePropertyType,
  normalizeOperationType,
} from '../src/lib/tasador/normalization/PropertyTypeNormalizer';
import { normalizeCurrency, normalizePrice } from '../src/lib/tasador/normalization/CurrencyNormalizer';
import { normalizeSurfaces } from '../src/lib/tasador/normalization/SurfaceNormalizer';
import { normalizeAmenities } from '../src/lib/tasador/normalization/AmenityNormalizer';
import { RawListingPayload } from '../src/lib/tasador/types/tasadorPipelineTypes';

test.describe('TASADOR IA - NORMALIZACIÓN URUGUAY', () => {

  test('Req 01: Normalización de los 19 departamentos y alias comunes', () => {
    expect(normalizeDepartment('MVD').normalized).toBe('Montevideo');
    expect(normalizeDepartment('montevideo').normalized).toBe('Montevideo');
    expect(normalizeDepartment('Maldonado').normalized).toBe('Maldonado');
    expect(normalizeDepartment('canelones').normalized).toBe('Canelones');
    expect(normalizeDepartment('San Jose').normalized).toBe('San José');
    expect(normalizeDepartment('Rio Negro').normalized).toBe('Río Negro');
    expect(normalizeDepartment('Paysandu').normalized).toBe('Paysandú');
    expect(normalizeDepartment('Tacuarembo').normalized).toBe('Tacuarembó');
  });

  test('Req 02: Normalización de barrios de Montevideo y zonas costeras', () => {
    expect(normalizeNeighborhood('Pta Carretas', 'Montevideo').normalized).toBe('Punta Carretas');
    expect(normalizeNeighborhood('pta. carretas', 'Montevideo').normalized).toBe('Punta Carretas');
    expect(normalizeNeighborhood('pocitos nuevo', 'Montevideo').normalized).toBe('Pocitos');
    expect(normalizeNeighborhood('carrasco sur', 'Montevideo').normalized).toBe('Carrasco');
    expect(normalizeNeighborhood('puerto buceo', 'Montevideo').normalized).toBe('Buceo');
    expect(normalizeNeighborhood('cordon soho', 'Montevideo').normalized).toBe('Cordón');
    expect(normalizeNeighborhood('parque rodo', 'Montevideo').normalized).toBe('Parque Rodó');

    // Maldonado
    expect(normalizeNeighborhood('pde', 'Maldonado').normalized).toBe('Punta del Este');
    expect(normalizeNeighborhood('punta del este', 'Maldonado').normalized).toBe('Punta del Este');
    expect(normalizeNeighborhood('la barra', 'Maldonado').normalized).toBe('La Barra');
  });

  test('Req 03: Normalización de prefijos de calles uruguayas', () => {
    expect(normalizeStreetName('Av. Brasil').normalized).toBe('Avenida Brasil');
    expect(normalizeStreetName('bvr. artigas').normalized).toBe('Bulevar Artigas');
    expect(normalizeStreetName('bv artigas').normalized).toBe('Bulevar Artigas');
    expect(normalizeStreetName('dr. manuel albo').normalized).toBe('Doctor Manuel Albo');
    expect(normalizeStreetName('rbla. republica de chile').normalized).toBe('Rambla Republica de Chile');
  });

  test('Req 04: Determinación rigurosa de location_precision', () => {
    expect(
      determineLocationPrecision({
        streetName: 'Avenida Brasil',
        streetNumber: '2540',
        latitude: -34.91,
        longitude: -56.15,
      })
    ).toBe('EXACT');

    expect(
      determineLocationPrecision({
        streetName: 'Avenida Brasil',
        streetNumber: null,
        latitude: -34.91,
        longitude: -56.15,
      })
    ).toBe('STREET');

    expect(
      determineLocationPrecision({
        streetName: null,
        streetNumber: null,
        neighborhood: 'Pocitos',
        department: 'Montevideo',
      })
    ).toBe('NEIGHBORHOOD');

    expect(
      determineLocationPrecision({
        streetName: null,
        streetNumber: null,
        neighborhood: null,
        department: 'Montevideo',
      })
    ).toBe('DEPARTMENT');
  });

  test('Req 05: Normalización de tipos de propiedad y operación', () => {
    expect(normalizePropertyType('Apartamento', 'Apto en Pocitos').normalized).toBe('APARTMENT');
    expect(normalizePropertyType('Casa', 'Chalet con parque').normalized).toBe('HOUSE');
    expect(normalizePropertyType('PH', 'Casa en propiedad horizontal').normalized).toBe('PH');
    expect(normalizePropertyType('Terreno', 'Solar en Solymar').normalized).toBe('LAND');
    expect(normalizePropertyType('Oficina', 'Consultorio céntrico').normalized).toBe('OFFICE');
    expect(normalizePropertyType('Chacra', 'Fracción de campo 5 has').normalized).toBe('RURAL');

    expect(normalizeOperationType('Venta').normalized).toBe('SALE');
    expect(normalizeOperationType('Alquiler').normalized).toBe('RENT');
    expect(normalizeOperationType('Alquiler Temporal').normalized).toBe('TEMPORARY_RENT');
  });

  test('Req 06: Normalización monetaria y precios sin conversiones arbitrarias', () => {
    expect(normalizeCurrency('U$S')).toBe('USD');
    expect(normalizeCurrency('USD')).toBe('USD');
    expect(normalizeCurrency('$U')).toBe('UYU');
    expect(normalizeCurrency('UI')).toBe('UI');

    const priceResult = normalizePrice({
      priceRaw: 200000,
      currencyRaw: 'USD',
      builtAreaM2: 100,
    });
    expect(priceResult.priceUsd).toBe(200000);
    expect(priceResult.currentCurrency).toBe('USD');
    expect(priceResult.pricePerM2Usd).toBe(2000);
    expect(priceResult.priceUyu).toBe(8100000); // 200000 * 40.50
  });

  test('Req 07: Normalización de superficies con extracción de texto y cálculo de remanente', () => {
    const surf = normalizeSurfaces({
      totalAreaM2Raw: 120,
      builtAreaM2Raw: 90,
      landAreaM2Raw: null,
    });
    expect(surf.totalAreaM2).toBe(120);
    expect(surf.builtAreaM2).toBe(90);
    expect(surf.uncoveredAreaM2).toBe(30); // 120 - 90
  });

  test('Req 08: Regla de Oro: NULL = DESCONOCIDO (Nunca convertir NULL en false o 0)', () => {
    const amenities = normalizeAmenities({
      rawAmenities: { piscina: true },
      descriptionRaw: 'Excelente estado con parrillero.',
      titleRaw: 'Apartamento',
    });

    expect(amenities.pool).toBe(true);
    expect(amenities.barbecue).toBe(true);
    // Campos no mencionados deben ser estrictamente null
    expect(amenities.elevator).toBeNull();
    expect(amenities.gym).toBeNull();
    expect(amenities.doorman).toBeNull();
    expect(amenities.seaView).toBeNull();
  });

  test('Req 09: NormalizationEngine unificado con trazabilidad completa de evidencia', () => {
    const raw: RawListingPayload = {
      sourceCode: 'infocasas',
      sourceListingId: 'test_norm_01',
      originalUrl: 'https://infocasas.com.uy/prop/test_norm_01',
      titleRaw: 'PENTHOUSE EN POCITOS CON PARRILLERO',
      descriptionRaw: 'Hermoso apartamento con vista despejada y losa radiante.',
      currentPriceRaw: 350000,
      currencyRaw: 'USD',
      departmentRaw: 'MVD',
      neighborhoodRaw: 'Pocitos',
      streetNameRaw: 'Av. Brasil',
      streetNumberRaw: '2800',
      totalAreaM2Raw: 150,
      builtAreaM2Raw: 110,
      bedroomsRaw: 3,
      bathroomsRaw: 2,
    };

    const normalized = NormalizationEngine.normalize(raw);

    expect(normalized.department).toBe('Montevideo');
    expect(normalized.neighborhood).toBe('Pocitos');
    expect(normalized.streetName).toBe('Avenida Brasil');
    expect(normalized.normalizedAddress).toBe('Avenida Brasil 2800');
    expect(normalized.locationPrecision).toBe('EXACT');
    expect(normalized.propertyType).toBe('APARTMENT');
    expect(normalized.priceUsd).toBe(350000);
    expect(normalized.pricePerM2Usd).toBe(3181.82);
    expect(normalized.amenities.barbecue).toBe(true);
    expect(normalized.amenities.underfloorHeating).toBe(true);
    expect(normalized.amenities.pool).toBeNull(); // NULL preservado

    // Trazabilidad de evidencia
    expect(normalized.fieldEvidence['department']).toBeDefined();
    expect(normalized.fieldEvidence['department'].normalizedValue).toBe('Montevideo');
    expect(normalized.fieldEvidence['department'].confidence).toBe(100);
    expect(normalized.fieldEvidence['priceUsd'].normalizedValue).toBe(350000);
  });
});
