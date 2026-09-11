// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE CALIDAD DE DATOS Y OUTLIERS
// Cálculo de Data Quality Score (0-100), Detección de Anomalías y Preservación de Datos
// ==============================================================================

import { test, expect } from '@playwright/test';
import { DataQualityEngine } from '../src/lib/tasador/quality/DataQualityEngine';
import { OutlierDetector } from '../src/lib/tasador/quality/OutlierDetector';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';
import { RawListingPayload } from '../src/lib/tasador/types/tasadorPipelineTypes';

test.describe('TASADOR IA - CALIDAD DE DATOS Y DETECCIÓN DE OUTLIERS', () => {

  const completeRaw: RawListingPayload = {
    sourceCode: 'infocasas',
    sourceListingId: 'quality_01',
    originalUrl: 'https://infocasas.com.uy/prop/quality_01',
    titleRaw: 'Apartamento impecable en Pocitos',
    currentPriceRaw: 250000,
    currencyRaw: 'USD',
    departmentRaw: 'Montevideo',
    neighborhoodRaw: 'Pocitos',
    streetNameRaw: 'Calle Benito Blanco',
    streetNumberRaw: '1000',
    latitudeRaw: -34.915000,
    longitudeRaw: -56.148000,
    propertyTypeRaw: 'Apartamento',
    totalAreaM2Raw: 80,
    builtAreaM2Raw: 75,
    bedroomsRaw: 2,
    bathroomsRaw: 1,
    constructionYearRaw: 2018,
    mediaRaw: [
      { sourceUrl: 'https://img.com/1.jpg', mediaType: 'IMAGE', position: 0 },
      { sourceUrl: 'https://img.com/2.jpg', mediaType: 'IMAGE', position: 1 },
      { sourceUrl: 'https://img.com/3.jpg', mediaType: 'IMAGE', position: 2 },
      { sourceUrl: 'https://img.com/4.jpg', mediaType: 'IMAGE', position: 3 },
      { sourceUrl: 'https://img.com/5.jpg', mediaType: 'IMAGE', position: 4 },
    ],
  };

  test('Req 01: Publicación completa obtiene Data Quality Score elevado (>= 85)', () => {
    const listing = NormalizationEngine.normalize(completeRaw);
    const report = DataQualityEngine.evaluate(listing);

    expect(report.qualityScore).toBeGreaterThanOrEqual(85);
    expect(report.isOutlier).toBe(false);
    expect(report.warnings.length).toBe(0);
    expect(report.completeness.location).toBe(100);
    expect(report.completeness.price).toBe(100);
  });

  test('Req 02: Falta de superficie genera warning MISSING_AREA', () => {
    const listing = NormalizationEngine.normalize({
      ...completeRaw,
      totalAreaM2Raw: null,
      builtAreaM2Raw: null,
    });
    const report = DataQualityEngine.evaluate(listing);

    expect(report.warnings).toContain('MISSING_AREA');
    expect(report.qualityScore).toBeLessThanOrEqual(80);
  });

  test('Req 03: Inconsistencia de superficies (Edificada > Total) genera AREA_INCONSISTENCY', () => {
    const listing = NormalizationEngine.normalize({
      ...completeRaw,
      totalAreaM2Raw: 50,
      builtAreaM2Raw: 120, // Imposible en semántica estándar
    });
    const report = DataQualityEngine.evaluate(listing);

    expect(report.warnings).toContain('AREA_INCONSISTENCY');
  });

  test('Req 04: Valores negativos en dormitorios o baños generan NEGATIVE_ROOMS_OR_BATHS', () => {
    const listing = NormalizationEngine.normalize({
      ...completeRaw,
      bedroomsRaw: -2,
    });
    const report = DataQualityEngine.evaluate(listing);

    expect(report.warnings).toContain('NEGATIVE_ROOMS_OR_BATHS');
  });

  test('Req 05: Coordenadas fuera de Uruguay generan COORDINATES_OUT_OF_BOUNDS', () => {
    const listing = NormalizationEngine.normalize({
      ...completeRaw,
      latitudeRaw: 40.7128, // Nueva York
      longitudeRaw: -74.0060,
    });
    const report = DataQualityEngine.evaluate(listing);

    expect(report.warnings).toContain('COORDINATES_OUT_OF_BOUNDS');
    expect(report.isOutlier).toBe(true);
  });

  test('Req 06: Precios irrisorios o absurdos generan OUTLIER_VALUE sin borrar el registro', () => {
    const listing = NormalizationEngine.normalize({
      ...completeRaw,
      currentPriceRaw: 10, // USD 10 por un apartamento
    });
    const report = DataQualityEngine.evaluate(listing);

    expect(report.warnings).toContain('OUTLIER_VALUE');
    expect(report.isOutlier).toBe(true);
  });
});
