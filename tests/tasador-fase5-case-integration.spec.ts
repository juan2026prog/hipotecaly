// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE FASE 5: INTEGRACIÓN OPERATIVA CON EXPEDIENTES
// Colaterales, Aislamiento Multi-Org, Versionado Inmutable, Human-in-the-Loop y Fallback
// ==============================================================================

import { test, expect } from '@playwright/test';
import { CasePropertyLinkService } from '../src/lib/tasador/integration/CasePropertyLinkService';
import { CaseValuationService } from '../src/lib/tasador/integration/CaseValuationService';
import { ProfessionalAppraisalService } from '../src/lib/tasador/integration/ProfessionalAppraisalService';
import { MasterPropertyResolver } from '../src/lib/tasador/master/MasterPropertyResolver';
import { BudgetGuard } from '../src/lib/tasador/ai/BudgetGuard';

test.describe.serial('Tasador IA — Fase 5: Integración Operativa con Expedientes', () => {
  const orgA = 'org-estudio-nova-uy';
  const orgB = 'org-capital-montevideo';
  const caseId1 = 'case-expediente-001';
  const caseId2 = 'case-expediente-002';

  test.beforeAll(async () => {
    // Inicializar datos base
    const masterResolver = MasterPropertyResolver.getInstance();
    masterResolver.masters.set('master-pocitos-demo', {
      id: 'master-pocitos-demo',
      canonicalAddress: 'Av. Brasil 2850, Pocitos, Montevideo',
      normalizedAddress: 'Av. Brasil 2850, Pocitos, Montevideo',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      latitude: -34.9145,
      longitude: -56.1528,
      propertyType: 'apartamento',
      coveredSurfaceM2: 75,
      uncoveredSurfaceM2: 0,
      totalSurfaceM2: 75,
      rooms: 3,
      bathrooms: 2,
      garages: 1,
      yearBuilt: 2018,
      buildingCondition: 'muy_bueno',
      cadastralNumber: '34892',
      canonicalStatus: 'ACTIVE',
      dataQualityScore: 95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  test('1. Resolución y vinculación de colateral por Padrón Catastral exacto', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    const result = await linkService.linkPropertyToCase({
      caseId: caseId1,
      organizationId: orgA,
      department: 'Montevideo',
      cadastralNumber: '34892',
      propertyType: 'apartamento',
      coveredSurfaceM2: 75,
    });

    expect(result.matchType).toBe('EXACT_CADASTRAL');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(95);
    expect(result.link.resolutionStatus).toBe('MATCHED');
    expect(result.matchedMasterId).toBe('master-pocitos-demo');
    expect(result.link.isPrimaryCollateral).toBe(true);
  });

  test('2. Creación automática de Maestro Provisional cuando el inmueble no existe previamente', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    const result = await linkService.linkPropertyToCase({
      caseId: caseId2,
      organizationId: orgA,
      department: 'Maldonado',
      locality: 'Punta del Este',
      address: 'Rambla Lorenzo Batlle Pacheco Parada 8',
      cadastralNumber: '999888',
      propertyType: 'apartamento',
      coveredSurfaceM2: 120,
    });

    expect(result.matchType).toBe('PROVISIONAL_CREATED');
    expect(result.link.resolutionStatus).toBe('PROVISIONAL');
    expect(result.matchedMasterId).toContain('master-prov-');
  });

  test('3. Aislamiento Multi-Organización estricto de expedientes y colaterales', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    
    // Org A tiene colaterales vinculados
    const collateralsOrgA = linkService.getCaseCollaterals(caseId1, orgA);
    expect(collateralsOrgA.length).toBeGreaterThan(0);

    // Org B NO puede ver los colaterales del expediente de Org A
    const collateralsOrgB = linkService.getCaseCollaterals(caseId1, orgB);
    expect(collateralsOrgB.length).toBe(0);
  });

  test('4. Tasación a demanda con versionado inmutable (V1, V2) e Idempotencia', async () => {
    const valService = CaseValuationService.getInstance();

    // Primera tasación (V1)
    const valV1 = await valService.requestCaseValuation({
      caseId: caseId1,
      organizationId: orgA,
      propertyMasterId: 'master-pocitos-demo',
      forceNewVersion: false,
    });

    expect(valV1.versionNumber).toBe(1);
    expect(valV1.estimatedMarketValue).toBeGreaterThan(0);
    expect(valV1.estimatedRangeLow).toBeLessThan(valV1.estimatedMarketValue);
    expect(valV1.estimatedRangeHigh).toBeGreaterThan(valV1.estimatedMarketValue);
    expect(valV1.prudentReferenceValue).toBeLessThanOrEqual(valV1.estimatedMarketValue);

    // Llamada idempotente sin forzar nueva versión -> Devuelve la misma V1
    const valIdempotent = await valService.requestCaseValuation({
      caseId: caseId1,
      organizationId: orgA,
      propertyMasterId: 'master-pocitos-demo',
      forceNewVersion: false,
    });
    expect(valIdempotent.versionNumber).toBe(1);
    expect(valIdempotent.valuationId).toBe(valV1.valuationId);

    // Re-tasación forzada (V2) -> Genera versión 2 preservando V1 inmutable
    const valV2 = await valService.requestCaseValuation({
      caseId: caseId1,
      organizationId: orgA,
      propertyMasterId: 'master-pocitos-demo',
      forceNewVersion: true,
    });
    expect(valV2.versionNumber).toBe(2);

    const history = valService.getCaseValuationHistory(caseId1, orgA);
    expect(history.length).toBe(2);
    expect(history[0].versionNumber).toBe(1);
    expect(history[1].versionNumber).toBe(2);
  });

  test('5. Flujo de Revisión Humana (Human-in-the-Loop)', async () => {
    const valService = CaseValuationService.getInstance();
    const latest = valService.getLatestCaseValuation(caseId1, orgA);
    expect(latest).not.toBeNull();

    // Acción 1: Aceptar como Referencia
    const accepted = valService.applyReviewAction({
      caseId: caseId1,
      organizationId: orgA,
      valuationId: latest!.valuationId,
      action: 'ACCEPT_REFERENCE',
      userId: 'analyst-valeria',
      notes: 'Valores y comparables concordantes con el mercado de Pocitos.',
    });
    expect(accepted?.reviewStatus).toBe('ACCEPTED_REFERENCE');
    expect(accepted?.reviewedBy).toBe('analyst-valeria');

    // Acción 2: Solicitar Tasación Presencial
    const reviewReq = valService.applyReviewAction({
      caseId: caseId1,
      organizationId: orgA,
      valuationId: latest!.valuationId,
      action: 'REQUEST_HUMAN_REVIEW',
      userId: 'notary-perez',
      notes: 'Se requiere inspección de terminaciones por perito SAU.',
    });
    expect(reviewReq?.reviewStatus).toBe('HUMAN_REVIEW_REQUESTED');
  });

  test('6. Registro de Tasación Profesional Externa sin aplicar 12% y cálculo de desvío', async () => {
    const profService = ProfessionalAppraisalService.getInstance();
    const valService = CaseValuationService.getInstance();
    const latestVal = valService.getLatestCaseValuation(caseId1, orgA);

    const prof = await profService.registerAppraisal({
      organizationId: orgA,
      caseId: caseId1,
      propertyMasterId: 'master-pocitos-demo',
      professionalName: 'Arq. Martín Sosa',
      professionalType: 'PERITO_TASADOR',
      registrationNumber: 'SAU-4512',
      appraisalDate: '2026-03-01',
      appraisedValue: 235000,
      currency: 'USD',
      currentAiValuationUsd: latestVal?.estimatedMarketValue || 240000,
    });

    expect(prof.appraisedValue).toBe(235000);
    expect(prof.verificationStatus).toBe('VERIFIED');
    expect(prof.deviationVsAiPercentage).toBeDefined();

    // Verificar que getLatestForCase devuelve el registro
    const latestProf = profService.getLatestForCase(caseId1, orgA);
    expect(latestProf?.professionalName).toBe('Arq. Martín Sosa');
    expect(latestProf?.appraisedValue).toBe(235000);
  });

  test('7. Resiliencia y Fallback Total cuando IA está deshabilitada o inaccesible', async () => {
    // Deshabilitar IA temporalmente en BudgetGuard
    const budgetGuard = BudgetGuard.getInstance();
    budgetGuard.updateConfig({ aiEnabled: false });

    const valService = CaseValuationService.getInstance();
    const fallbackVal = await valService.requestCaseValuation({
      caseId: caseId1,
      organizationId: orgA,
      propertyMasterId: 'master-pocitos-demo',
      forceNewVersion: true,
    });

    // La tasación determinística finaliza con éxito absoluto
    expect(fallbackVal.estimatedMarketValue).toBeGreaterThan(0);
    expect(fallbackVal.aiStatus).toBe('UNAVAILABLE');
    expect(fallbackVal.confidenceScore).toBeGreaterThan(0);

    // Restaurar IA
    budgetGuard.updateConfig({ aiEnabled: true });
  });
});
