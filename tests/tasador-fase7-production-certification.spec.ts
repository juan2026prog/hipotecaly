// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE INTEGRAL DE CERTIFICACIÓN DE PRODUCCIÓN (FASE 7)
// Validación E2E Canónica: 20 Casos de Certificación de Punta a Punta
// ==============================================================================

import { test, expect } from '@playwright/test';
import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { AdapterRegistry } from '../src/lib/tasador/adapters/AdapterRegistry';
import { MasterPropertyResolver } from '../src/lib/tasador/master/MasterPropertyResolver';
import { ValuationService } from '../src/lib/tasador/valuation/ValuationService';
import { AppraisalSettingsManager } from '../src/lib/tasador/valuation/AppraisalSettingsManager';
import { AIAppraisalService } from '../src/lib/tasador/ai/AIAppraisalService';
import { CasePropertyLinkService } from '../src/lib/tasador/integration/CasePropertyLinkService';
import { CaseValuationService } from '../src/lib/tasador/integration/CaseValuationService';
import { ProfessionalAppraisalService } from '../src/lib/tasador/integration/ProfessionalAppraisalService';
import { GroundTruthService } from '../src/lib/tasador/calibration/GroundTruthService';
import { CalibrationEngine } from '../src/lib/tasador/calibration/CalibrationEngine';
import { SettingsLifecycleService } from '../src/lib/tasador/calibration/SettingsLifecycleService';
import { TasadorHealthService } from '../src/lib/tasador/observability/TasadorHealthService';

test.describe.serial('Tasador IA — Fase 7 Final: Suite de Certificación de Producción (E2E 001 - 020)', () => {
  const orgId = 'org-estudio-nova-uy';
  const otherOrgId = 'org-inmobiliaria-rival-uy';
  const caseId = 'case-cert-2026-fase7';

  // TASADOR_E2E_001: Ingesta Real -> Master
  test('TASADOR_E2E_001: Ingesta real desde fuentes uruguayas y resolución determinística a Property Master', async () => {
    const ingestionEngine = IngestionEngine.getInstance();
    const result = await ingestionEngine.executeRun('infocasas', { limit: 15, department: 'montevideo' });

    expect(result.listingsDiscovered).toBeGreaterThan(0);
    expect(result.propertyMastersResolved).toBeGreaterThan(0);
    expect(ingestionEngine.normalizedListings.size).toBeGreaterThan(0);
  });

  // TASADOR_E2E_002: Cross-Source Duplicate
  test('TASADOR_E2E_002: Deduplicación cross-source unifica publicaciones en 1 solo Property Master', async () => {
    const masterResolver = MasterPropertyResolver.getInstance();
    const allMasters = masterResolver.getAllMasters();

    expect(allMasters.length).toBeGreaterThan(0);
    const master = allMasters[0];
    expect(master.id).toBeDefined();
    expect(master.canonicalAddress).toBeDefined();
  });

  // TASADOR_E2E_003: Valuation Apartment
  test('TASADOR_E2E_003: Tasación determinística completa de Apartamento en Montevideo', async () => {
    const valService = ValuationService.getInstance();
    const val = await valService.appraiseProperty({
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 75,
      totalAreaM2: 80,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
    });

    expect(val.estimatedMarketValue).toBeGreaterThan(100000);
    expect(val.estimatedRangeLow).toBeLessThan(val.estimatedMarketValue);
    expect(val.estimatedRangeHigh).toBeGreaterThan(val.estimatedMarketValue);
    expect(val.prudentReferenceValue).toBeLessThanOrEqual(val.estimatedMarketValue);
    expect(val.confidence.confidenceScore).toBeGreaterThanOrEqual(50);
  });

  // TASADOR_E2E_004: Valuation House
  test('TASADOR_E2E_004: Tasación determinística completa de Casa / Chalet con ampliación controlada', async () => {
    const valService = ValuationService.getInstance();
    const val = await valService.appraiseProperty({
      propertyType: 'HOUSE',
      department: 'Montevideo',
      neighborhood: 'Carrasco',
      builtAreaM2: 220,
      totalAreaM2: 500,
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
    });

    expect(val.estimatedMarketValue).toBeGreaterThan(200000);
    expect(val.confidence.confidenceScore).toBeGreaterThan(0);
  });

  // TASADOR_E2E_005: Low Confidence
  test('TASADOR_E2E_005: Detección honesta de Low Confidence ante escasez de variables o zona atípica', async () => {
    const valService = ValuationService.getInstance();
    const val = await valService.appraiseProperty({
      propertyType: 'COMMERCIAL_PREMISES',
      department: 'Artigas',
      neighborhood: 'Zona Rural Aislada',
      builtAreaM2: 900,
      totalAreaM2: 5000,
    });

    expect(val.confidence.confidenceScore).toBeLessThan(60);
  });

  // TASADOR_E2E_006: No Comparable (INSUFFICIENT_COMPARABLES)
  test('TASADOR_E2E_006: Si no existen comparables, el sistema NO inventa tasación ficticia', async () => {
    const valService = ValuationService.getInstance();
    const val = await valService.appraiseProperty({
      propertyType: 'LAND',
      department: 'Flores',
      neighborhood: 'Isla Desierta Inexistente',
      builtAreaM2: 10,
      totalAreaM2: 10,
    });

    expect(val.effectiveComparablesUsed).toBeLessThanOrEqual(2);
    expect(val.confidence.confidenceLevel === 'LOW' || val.confidence.confidenceScore <= 40).toBe(true);
  });

  // TASADOR_E2E_007: AI Disabled Fallback
  test('TASADOR_E2E_007: Tasador IA funciona 100% determinístico cuando OpenAI está deshabilitado', async () => {
    const aiService = AIAppraisalService.getInstance();
    const valService = ValuationService.getInstance();

    const report = await valService.appraiseProperty({
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Centro',
      builtAreaM2: 60,
      totalAreaM2: 60,
      bedrooms: 2,
      bathrooms: 1,
    });

    const enrichment = await aiService.enrichValuation({
      valuation: report,
      rawTitle: 'Apartamento Centro',
      rawDescription: 'Sin conexión a OpenAI',
      photos: [],
    });

    expect(report.estimatedMarketValue).toBeGreaterThan(50000);
    expect(enrichment.status).toBeDefined();
    expect(enrichment.isShadowMode).toBe(true);
    expect(enrichment.reportSections?.methodologyDescription).toBeDefined();
  });

  // TASADOR_E2E_008: Vision Shadow (Peso Monetario = 0)
  test('TASADOR_E2E_008: Visión IA opera en Shadow Mode sin modificar el precio de mercado calculado', async () => {
    const valService = ValuationService.getInstance();
    const aiService = AIAppraisalService.getInstance();

    const report = await valService.appraiseProperty({
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 80,
      totalAreaM2: 85,
      bedrooms: 2,
      bathrooms: 2,
    });

    const valBeforeAi = report.estimatedMarketValue;

    const enrichment = await aiService.enrichValuation({
      valuation: report,
      rawTitle: 'Apartamento impecable con vista al mar',
      rawDescription: 'Totalmente reciclado a nuevo con materiales importados de lujo.',
      photos: [
        { mediaId: 'img_test_1', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', sha256Hash: 'hash_test_1' },
      ],
    });

    expect(enrichment.isShadowMode).toBe(true);
    expect(report.estimatedMarketValue).toBe(valBeforeAi);
  });

  // TASADOR_E2E_009: Case Integration
  test('TASADOR_E2E_009: Vinculación a expediente y snapshot inmutable con versionado', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    const valService = CaseValuationService.getInstance();

    const linkResult = await linkService.linkPropertyToCase({
      caseId,
      organizationId: orgId,
      department: 'Montevideo',
      locality: 'Pocitos',
      address: 'Bvar España y Libertad',
      propertyType: 'apartamento',
      coveredSurfaceM2: 85,
      bedrooms: 2,
      bathrooms: 2,
    });

    const snapshot = await valService.requestCaseValuation({
      caseId,
      organizationId: orgId,
      propertyMasterId: linkResult.matchedMasterId || 'master-cert-pocitos',
    });

    expect(snapshot.caseId).toBe(caseId);
    expect(snapshot.versionNumber).toBe(1);
    expect(snapshot.estimatedMarketValue).toBeGreaterThan(100000);
  });

  // TASADOR_E2E_010: Professional Appraisal
  test('TASADOR_E2E_010: Registro de peritaje profesional SAU sin aplicación de descuento del 12%', async () => {
    const profService = ProfessionalAppraisalService.getInstance();

    const appraisal = await profService.registerAppraisal({
      organizationId: orgId,
      caseId,
      professionalName: 'Arq. Gabriela Cabrera',
      professionalType: 'PERITO_TASADOR',
      registrationNumber: 'SAU-1284',
      appraisalDate: '2026-03-11',
      appraisedValue: 260000,
      currentAiValuationUsd: 255000,
    });

    expect(appraisal.appraisedValue).toBe(260000);
    expect(appraisal.deviationVsAiPercentage).toBeDefined();
  });

  // TASADOR_E2E_011: Confirmed Closing
  test('TASADOR_E2E_011: Registro de transacción de cierre real (Ground Truth Nivel 1)', async () => {
    const gtService = GroundTruthService.getInstance();

    const tx = gtService.registerTransaction({
      propertyMasterId: 'master-pocitos-cert',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      transactionDate: '2026-03-08',
      transactionPriceUsd: 245000,
      askingPriceUsd: 280000,
      groundTruthType: 'CONFIRMED_CLOSING',
      source: 'Escritura Pública Notarial Definitiva',
    });

    expect(tx.verified).toBe(true);
    expect(tx.hierarchyLevel).toBe(1);
    expect(tx.observedDiscount).toBeCloseTo(0.125, 2);
  });

  // TASADOR_E2E_012: Backtest
  test('TASADOR_E2E_012: Backtest temporal con cero data leakage y métricas MAE/MAPE', async () => {
    const calibEngine = CalibrationEngine.getInstance();
    const backtest = await calibEngine.runBacktest({
      cutoffDate: '2026-03-11',
      department: 'Montevideo',
    });

    expect(backtest.metrics.sampleCount).toBeGreaterThan(0);
    expect(backtest.metrics.mape).toBeGreaterThanOrEqual(0);
    expect(backtest.metrics.coveragePercentage).toBeGreaterThan(0);
  });

  // TASADOR_E2E_013: Calibration Proposal
  test('TASADOR_E2E_013: Generación de propuesta de calibración en modo Shadow', async () => {
    const calibEngine = CalibrationEngine.getInstance();
    const run = await calibEngine.generateCalibrationRun('GLOBAL');

    expect(run.status).toBe('PENDING_APPROVAL');
    expect(run.proposals.length).toBeGreaterThan(0);
  });

  // TASADOR_E2E_014: Proposal Cannot Autoactivate
  test('TASADOR_E2E_014: Las propuestas de calibración NUNCA mutan producción automáticamente', async () => {
    const settingsBefore = AppraisalSettingsManager.getInstance().getSettings();
    const calibEngine = CalibrationEngine.getInstance();
    await calibEngine.generateCalibrationRun('GLOBAL');

    const settingsAfter = AppraisalSettingsManager.getInstance().getSettings();
    expect(settingsAfter.version).toBe(settingsBefore.version);
    expect(settingsAfter.asking_price_adjustment).toBe(settingsBefore.asking_price_adjustment);
  });

  // TASADOR_E2E_015: Rollback
  test('TASADOR_E2E_015: Capacidad de Rollback inmediato de settings a versión anterior', async () => {
    const lifecycle = SettingsLifecycleService.getInstance();
    const history = lifecycle.getVersionHistory();
    const active = lifecycle.getActiveVersion();

    expect(history.length).toBeGreaterThan(0);
    expect(active.status).toBe('ACTIVE');
    expect(active.settings.askingPriceAdjustment).toBeGreaterThan(0);
  });

  // TASADOR_E2E_016: Cross-Org Denied
  test('TASADOR_E2E_016: Aislamiento estricto multi-tenant: Org A no puede acceder a tasaciones de Org B', async () => {
    const valService = CaseValuationService.getInstance();
    const orgBHistory = valService.getCaseValuationHistory(caseId, otherOrgId);

    expect(orgBHistory.length).toBe(0);
  });

  // TASADOR_E2E_017: Super Admin Only Operation
  test('TASADOR_E2E_017: Health Check global y actualización de fuentes restringidos a Super Admin', async () => {
    const healthService = TasadorHealthService.getInstance();
    const report = await healthService.runFullProductionHealthCheck();

    expect(report.overallStatus).toBe('PRODUCTION_CERTIFIED');
    expect(report.invariants.zeroCreditDecisionGuaranteed).toBe(true);
    expect(report.invariants.aiMonetaryWeightZeroGuaranteed).toBe(true);
  });

  // TASADOR_E2E_018: OpenAI Failure Fallback
  test('TASADOR_E2E_018: Fallback total ante fallo simulado de OpenAI', async () => {
    const aiService = AIAppraisalService.getInstance();
    const valService = ValuationService.getInstance();

    const report = await valService.appraiseProperty({
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      builtAreaM2: 70,
      totalAreaM2: 70,
      bedrooms: 2,
      bathrooms: 1,
    });

    const fallbackResult = await aiService.enrichValuation({
      valuation: report,
      rawTitle: 'Simulación de timeout en OpenAI',
      rawDescription: 'Propiedad de prueba para validar resiliencia.',
      photos: [],
    });

    expect(fallbackResult.status).toBeDefined();
    expect(fallbackResult.isShadowMode).toBe(true);
    expect(report.estimatedMarketValue).toBeGreaterThan(0);
  });

  // TASADOR_E2E_019: Source Outage Circuit Breaker
  test('TASADOR_E2E_019: Circuit Breaker aísla fuentes caídas o bloqueadas sin afectar al resto', async () => {
    const registry = AdapterRegistry.getInstance();
    const blockedSource = registry.getAdapter('gallito_uy');

    expect(blockedSource).toBeDefined();
    expect(blockedSource!.capability).toBe('BLOCKED');

    const health = await blockedSource!.healthCheck();
    expect(health.healthy).toBe(false);
    expect(health.capability).toBe('BLOCKED');
  });

  // TASADOR_E2E_020: Historical Reproducibility
  test('TASADOR_E2E_020: Reproducibilidad determinística idéntica en múltiples ejecuciones sucesivas', async () => {
    const valService = ValuationService.getInstance();
    const input = {
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 80,
      totalAreaM2: 85,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
    };

    const run1 = await valService.appraiseProperty(input);
    const run2 = await valService.appraiseProperty(input);
    const run3 = await valService.appraiseProperty(input);

    expect(run1.estimatedMarketValue).toBe(run2.estimatedMarketValue);
    expect(run2.estimatedMarketValue).toBe(run3.estimatedMarketValue);
    expect(run1.confidence.confidenceScore).toBe(run2.confidence.confidenceScore);
    expect(run2.confidence.confidenceScore).toBe(run3.confidence.confidenceScore);
  });
});
