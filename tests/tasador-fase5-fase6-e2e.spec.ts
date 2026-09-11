// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE E2E: FASE 5 + FASE 6 INTEGRACIÓN COMPLETA
// Flujo Completo: Expediente -> Tasación IA -> Revisión -> Ground Truth -> Calibración
// ==============================================================================

import { test, expect } from '@playwright/test';
import { CasePropertyLinkService } from '../src/lib/tasador/integration/CasePropertyLinkService';
import { CaseValuationService } from '../src/lib/tasador/integration/CaseValuationService';
import { ProfessionalAppraisalService } from '../src/lib/tasador/integration/ProfessionalAppraisalService';
import { GroundTruthService } from '../src/lib/tasador/calibration/GroundTruthService';
import { AskingDiscountAnalyzer } from '../src/lib/tasador/calibration/AskingDiscountAnalyzer';
import { CalibrationEngine } from '../src/lib/tasador/calibration/CalibrationEngine';
import { SettingsLifecycleService } from '../src/lib/tasador/calibration/SettingsLifecycleService';
import { MasterPropertyResolver } from '../src/lib/tasador/master/MasterPropertyResolver';

test.describe.serial('Tasador IA — E2E Fases 5 + 6: Flujo Integral de Operación y Aprendizaje', () => {
  const orgId = 'org-estudio-nova-uy';
  const caseId = 'case-e2e-real-flow-2026';
  let linkedMasterId: string = 'master-pocitos-demo';

  test('1. Paso 1: Vinculación de Inmueble en Garantía al Expediente', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    const result = await linkService.linkPropertyToCase({
      caseId,
      organizationId: orgId,
      department: 'Montevideo',
      locality: 'Pocitos',
      address: '26 de Marzo y Benito Blanco',
      cadastralNumber: '112233',
      propertyType: 'apartamento',
      coveredSurfaceM2: 80,
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
    });

    expect(result.link.caseId).toBe(caseId);
    expect(result.link.organizationId).toBe(orgId);
    expect(result.link.isPrimaryCollateral).toBe(true);
    expect(result.matchedMasterId).toBeDefined();
    linkedMasterId = result.matchedMasterId!;
  });

  test('2. Paso 2: Ejecución de Tasación IA a Demanda con Snapshot Inmutable', async () => {
    const valService = CaseValuationService.getInstance();
    const snapshot = await valService.requestCaseValuation({
      caseId,
      organizationId: orgId,
      propertyMasterId: linkedMasterId,
    });

    expect(snapshot.valuationId).toBeDefined();
    expect(snapshot.versionNumber).toBe(1);
    expect(snapshot.estimatedMarketValue).toBeGreaterThan(100000);
    expect(snapshot.currency).toBe('USD');
    expect(snapshot.reviewStatus).toBe('PENDING');
    expect(snapshot.confidenceScore).toBeGreaterThan(0);
    expect(snapshot.report.effectiveComparablesUsed).toBeGreaterThan(0);
  });

  test('3. Paso 3: Revisión Humana y Registro de Peritaje Profesional Oficial', async () => {
    const valService = CaseValuationService.getInstance();
    const profService = ProfessionalAppraisalService.getInstance();

    const latestVal = valService.getLatestCaseValuation(caseId, orgId);
    expect(latestVal).not.toBeNull();

    // Registrar peritaje oficial del Arq. Tasador
    const profAppraisal = await profService.registerAppraisal({
      organizationId: orgId,
      caseId,
      propertyMasterId: linkedMasterId,
      professionalName: 'Arq. Lucía Fernández',
      professionalType: 'PERITO_TASADOR',
      registrationNumber: 'SAU-9921',
      appraisalDate: '2026-03-05',
      appraisedValue: 245000,
      currentAiValuationUsd: latestVal!.estimatedMarketValue,
    });

    expect(profAppraisal.appraisedValue).toBe(245000);
    expect(profAppraisal.deviationVsAiPercentage).toBeDefined();

    // Analista acepta tasación oficial
    const reviewed = valService.applyReviewAction({
      caseId,
      organizationId: orgId,
      valuationId: latestVal!.valuationId,
      action: 'ACCEPT_REFERENCE',
      userId: 'notary-lead',
      notes: 'Concordancia validada con peritaje SAU.',
    });

    expect(reviewed?.reviewStatus).toBe('ACCEPTED_REFERENCE');
  });

  test('4. Paso 4: Cierre de Operación Real -> Incorporación al Ground Truth', async () => {
    const groundTruthService = GroundTruthService.getInstance();

    const closingTx = groundTruthService.registerTransaction({
      propertyMasterId: linkedMasterId,
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      transactionDate: '2026-03-10',
      transactionPriceUsd: 242000,
      askingPriceUsd: 275000,
      groundTruthType: 'CONFIRMED_CLOSING',
      source: 'Escritura Pública Notarial Compraventa con Hipoteca',
    });

    expect(closingTx.verified).toBe(true);
    expect(closingTx.hierarchyLevel).toBe(1);
    expect(closingTx.observedDiscount).toBeCloseTo(0.12, 1);
  });

  test('5. Paso 5: Backtesting Temporal y Generación de Propuesta de Calibración Shadow', async () => {
    const calibEngine = CalibrationEngine.getInstance();
    const backtest = await calibEngine.runBacktest({
      cutoffDate: '2026-03-11',
      department: 'Montevideo',
    });

    expect(backtest.metrics.sampleCount).toBeGreaterThan(0);
    expect(backtest.metrics.mape).toBeLessThan(25.0); // Margen de error controlado

    const calibRun = await calibEngine.generateCalibrationRun('GLOBAL');
    expect(calibRun.status).toBe('PENDING_APPROVAL');
    expect(calibRun.proposals.length).toBeGreaterThan(0);
  });

  test('6. Paso 6: Aprobación Super Admin y Garantía de Inmutabilidad Histórica', async () => {
    const lifecycle = SettingsLifecycleService.getInstance();
    const valService = CaseValuationService.getInstance();
    const calibEngine = CalibrationEngine.getInstance();

    const historicalValuationsBefore = valService.getCaseValuationHistory(caseId, orgId);
    const historicalVal = historicalValuationsBefore[0];
    const originalEstimatedValue = historicalVal.estimatedMarketValue;
    const originalSettingsVersion = historicalVal.settingsVersion;

    const proposals = Array.from(calibEngine.proposals.values());
    const proposal = proposals[proposals.length - 1];

    if (proposal && proposal.status === 'PENDING_REVIEW') {
      // 1. Verificar que propuesta exploratoria es bloqueada por gobernanza
      expect(() => {
        lifecycle.approveAndPromoteProposal({
          proposalId: proposal.id,
          superAdminUserId: 'super-admin-master',
        });
      }).toThrow(/BLOQUEO DE GOBERNANZA/);

      // 2. Simular madurez de muestra N>=75 para validar la promoción y la inmutabilidad histórica
      proposal.proposalStrength = 'ACTIONABLE';
      proposal.isEligibleForActivation = true;
      proposal.sampleSize = 85;

      lifecycle.approveAndPromoteProposal({
        proposalId: proposal.id,
        superAdminUserId: 'super-admin-master',
      });
    }

    // Comprobar que la tasación histórica NO mutó su valor original ni su settings_version
    const historicalValuationsAfter = valService.getCaseValuationHistory(caseId, orgId);
    expect(historicalValuationsAfter[0].estimatedMarketValue).toBe(originalEstimatedValue);
    expect(historicalValuationsAfter[0].settingsVersion).toBe(originalSettingsVersion);
  });

  test('7. Paso 7: Verificación de Principio Rector: Cero decisiones de crédito automáticas', async () => {
    const valService = CaseValuationService.getInstance();
    const latestVal = valService.getLatestCaseValuation(caseId, orgId);

    // El Tasador solo provee estimación y rango, nunca una decisión crediticia vinculante
    expect(latestVal?.estimatedMarketValue).toBeGreaterThan(0);
    expect((latestVal as any)?.creditApproval).toBeUndefined();
    expect((latestVal as any)?.approvedLtv).toBeUndefined();
  });
});
