// ==============================================================================
// HIPOTECALY TASADOR IA - PRUEBA END-TO-END PILOTO REAL (FASES 3 + 4)
// Tasación E2E sobre Inmuebles Reales de Montevideo y Maldonado
// ==============================================================================

import { test, expect } from '@playwright/test';
import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { ValuationService } from '../src/lib/tasador/valuation/ValuationService';
import { AIAppraisalService } from '../src/lib/tasador/ai/AIAppraisalService';
import { TargetPropertyInput } from '../src/lib/tasador/valuation/valuationTypes';

test.describe.serial('TASADOR IA - PRUEBA PILOTO REAL E2E DE VALUACIÓN (FASES 3 + 4)', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    // Asegurar que el motor tenga publicaciones reales cargadas en memoria
    const engine = IngestionEngine.getInstance();
    if (engine.normalizedListings.size < 50) {
      await engine.executeRun('infocasas', {
        limit: 120,
        department: 'montevideo',
      });
    }
  });

  test('Req 01: Tasación Real E2E de Apartamento en Pocitos con Enriquecimiento IA', async () => {
    const valService = ValuationService.getInstance();
    const aiService = AIAppraisalService.getInstance();

    const targetPocitos: TargetPropertyInput = {
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 80,
      totalAreaM2: 85,
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      latitude: -34.915,
      longitude: -56.148,
    };

    // 1. Ejecución de Valuación Determinística
    const valuation = await valService.appraiseProperty(targetPocitos);

    expect(valuation.estimatedMarketValue).toBeGreaterThan(100000);
    expect(valuation.estimatedRangeLow).toBeLessThan(valuation.estimatedMarketValue);
    expect(valuation.estimatedRangeHigh).toBeGreaterThan(valuation.estimatedMarketValue);
    expect(valuation.effectiveComparablesUsed).toBeGreaterThanOrEqual(1);
    expect(valuation.confidence.confidenceScore).toBeGreaterThan(0);
    expect(valuation.methods.length).toBe(4);
    expect(valuation.askingPriceAdjustmentApplied).toBe(true);
    expect(valuation.askingPriceAdjustmentPercentage).toBe(12.0);

    // 2. Ejecución de Enriquecimiento IA (Shadow Mode)
    const enrichment = await aiService.enrichValuation({
      valuation,
      rawTitle: 'Apartamento de 2 dormitorios en Pocitos con garaje',
      rawDescription:
        'Excelente planta reciclada con materiales de primera calidad. Living comedor luminoso con vista despejada, cocina definida y parrillero.',
      photos: [
        { mediaId: 'pocitos_img_1', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', sha256Hash: 'hash_pocitos_living' },
        { mediaId: 'pocitos_img_2', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', sha256Hash: 'hash_pocitos_kitchen' },
      ],
    });

    expect(enrichment.status).toBe('COMPLETED');
    expect(enrichment.isShadowMode).toBe(true);
    expect(enrichment.reportSections).toBeDefined();
    expect(enrichment.reportSections?.executiveSummary).toContain('Pocitos');
    expect(enrichment.reportSections?.legalDisclaimer).toContain('AVISO LEGAL');
    expect(enrichment.qualitativeFeatures.length).toBeGreaterThanOrEqual(2);
  });

  test('Req 02: Tasación Real E2E de Casa / Chalet en Carrasco con Ampliación Geográfica Controlada', async () => {
    const valService = ValuationService.getInstance();
    const targetCarrasco: TargetPropertyInput = {
      propertyType: 'HOUSE',
      department: 'Montevideo',
      neighborhood: 'Carrasco',
      builtAreaM2: 250,
      totalAreaM2: 500,
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      latitude: -34.885,
      longitude: -56.055,
    };

    const valuation = await valService.appraiseProperty(targetCarrasco);

    expect(valuation.estimatedMarketValue).toBeGreaterThan(200000);
    expect(valuation.targetProperty.propertyType).toBe('HOUSE');
    expect(valuation.currency).toBe('USD');
    expect(['IMMEDIATE', 'NEIGHBORHOOD', 'ADJACENT_NEIGHBORHOODS', 'LOCALITY', 'DEPARTMENT']).toContain(
      valuation.geographicSearchLevel
    );
  });
});
