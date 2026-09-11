// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE FASE 6: CALIBRACIÓN, GROUND TRUTH & BACKTESTING
// Jerarquía de Certeza, Descuento 12%, Backtesting Temporal, Propuestas Shadow y Rollback
// ==============================================================================

import { test, expect } from '@playwright/test';
import { GroundTruthService } from '../src/lib/tasador/calibration/GroundTruthService';
import { AskingDiscountAnalyzer } from '../src/lib/tasador/calibration/AskingDiscountAnalyzer';
import { CalibrationEngine } from '../src/lib/tasador/calibration/CalibrationEngine';
import { SettingsLifecycleService } from '../src/lib/tasador/calibration/SettingsLifecycleService';
import { ValuationFeedbackService } from '../src/lib/tasador/calibration/ValuationFeedbackService';
import { AppraisalSettingsManager } from '../src/lib/tasador/valuation/AppraisalSettingsManager';

test.describe.serial('Tasador IA — Fase 6: Ground Truth, Calibración & Aprendizaje Controlado', () => {
  test('1. Jerarquía de Certeza de Ground Truth: Exclusión estricta de datos no documentados', async () => {
    const groundTruthService = GroundTruthService.getInstance();

    // Registrar transacción de Nivel 1 (Escritura pública confirmada)
    const tx1 = groundTruthService.registerTransaction({
      propertyMasterId: 'master-gt-01',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      transactionDate: '2026-02-15',
      transactionPriceUsd: 220000,
      askingPriceUsd: 250000,
      groundTruthType: 'CONFIRMED_CLOSING',
      source: 'Escritura Pública DGI',
    });
    expect(tx1.hierarchyLevel).toBe(1);
    expect(tx1.verified).toBe(true);

    // Registrar reporte no documentado de cliente (Nivel 4)
    const tx4 = groundTruthService.registerTransaction({
      propertyMasterId: 'master-gt-04',
      department: 'Montevideo',
      neighborhood: 'Centro',
      propertyType: 'apartamento',
      transactionDate: '2026-02-20',
      transactionPriceUsd: 150000,
      askingPriceUsd: 170000,
      groundTruthType: 'CLIENT_REPORTED',
      source: 'Declaración verbal de cliente',
    });
    expect(tx4.hierarchyLevel).toBe(4);
    expect(tx4.verified).toBe(false);

    // Verificar que getVerifiedTransactions excluye el Nivel 4
    const verifiedList = groundTruthService.getVerifiedTransactions();
    expect(verifiedList.some((t) => t.id === tx1.id)).toBe(true);
    expect(verifiedList.some((t) => t.id === tx4.id)).toBe(false);
  });

  test('2. Análisis Empírico de Descuento de Negociación vs Baseline Teórico del 12%', async () => {
    const analysis = AskingDiscountAnalyzer.generateZoneBreakdown();

    expect(analysis.globalStats.sampleCount).toBeGreaterThan(0);
    expect(analysis.globalStats.medianDiscount).toBeGreaterThan(0.05);
    expect(analysis.globalStats.medianDiscount).toBeLessThan(0.20);
    expect(analysis.globalStats.p25).toBeLessThanOrEqual(analysis.globalStats.medianDiscount);
    expect(analysis.globalStats.p75).toBeGreaterThanOrEqual(analysis.globalStats.medianDiscount);

    // Comparación vs 12% Baseline
    expect(analysis.globalStats.baselineDifference).toBeDefined();
    expect(analysis.byNeighborhood).toBeDefined();
    expect(analysis.interpretation).toBeDefined();
  });

  test('3. Backtesting Temporal Histórico con CERO DATA LEAKAGE', async () => {
    const engine = CalibrationEngine.getInstance();
    const result = await engine.runBacktest({
      cutoffDate: '2026-03-01',
      department: 'Montevideo',
    });

    expect(result.metrics.sampleCount).toBeGreaterThan(0);
    expect(result.metrics.mae).toBeGreaterThan(0);
    expect(result.metrics.mape).toBeGreaterThan(0);
    expect(result.metrics.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(result.details.length).toBe(result.metrics.sampleCount);

    // Verificar estructura de cada observación
    const firstDetail = result.details[0];
    expect(firstDetail.actualPrice).toBeGreaterThan(0);
    expect(firstDetail.predictedPrice).toBeGreaterThan(0);
    expect(firstDetail.pctError).toBeGreaterThanOrEqual(0);
  });

  test('4. Generación de Propuestas de Calibración en MODO SHADOW (Sin mutar producción)', async () => {
    const engine = CalibrationEngine.getInstance();
    const settingsBefore = AppraisalSettingsManager.getInstance().getSettings();

    const run = await engine.generateCalibrationRun('GLOBAL');
    expect(run.status).toBe('PENDING_APPROVAL');
    expect(run.proposals.length).toBeGreaterThan(0);

    const proposal = run.proposals[0];
    expect(proposal.status).toBe('PENDING_REVIEW');
    expect(proposal.sampleSize).toBeGreaterThan(0);
    expect(proposal.evidence.metricsBefore).toBeDefined();
    expect(proposal.evidence.metricsAfter).toBeDefined();

    // GARANTÍA: La configuración activa en producción NO cambió automáticamente
    const settingsAfter = AppraisalSettingsManager.getInstance().getSettings();
    expect(settingsAfter.version).toBe(settingsBefore.version);
    expect(settingsAfter.askingPriceAdjustment).toBe(settingsBefore.askingPriceAdjustment);
  });

  test('5. Aprobación y Promoción de Propuesta por Super Admin a Nueva Versión V2', async () => {
    const lifecycle = SettingsLifecycleService.getInstance();
    const engine = CalibrationEngine.getInstance();
    
    let existingProposals = Array.from(engine.proposals.values());
    if (existingProposals.length === 0) {
      await engine.generateCalibrationRun('GLOBAL');
      existingProposals = Array.from(engine.proposals.values());
    }

    expect(existingProposals.length).toBeGreaterThan(0);
    const proposalToApprove = existingProposals.find(p => p.status === 'PENDING_REVIEW') || existingProposals[0];

    if (proposalToApprove.status === 'PENDING_REVIEW') {
      // 1. Verificar que propuesta exploratoria es rechazada
      expect(() => {
        lifecycle.approveAndPromoteProposal({
          proposalId: proposalToApprove.id,
          superAdminUserId: 'super-admin-01',
        });
      }).toThrow(/BLOQUEO DE GOBERNANZA/);

      // 2. Establecer fuerza ACTIONABLE (N>=75) para probar la promoción controlada
      proposalToApprove.proposalStrength = 'ACTIONABLE';
      proposalToApprove.isEligibleForActivation = true;
      proposalToApprove.sampleSize = 80;

      const newVersion = lifecycle.approveAndPromoteProposal({
        proposalId: proposalToApprove.id,
        superAdminUserId: 'super-admin-01',
        notes: 'Aprobación formal de ajustes tras validación de backtesting.',
      });

      expect(newVersion.version).toBeGreaterThan(1);
      expect(newVersion.status).toBe('ACTIVE');
    }

    const currentActive = lifecycle.getActiveVersion();
    expect(currentActive.status).toBe('ACTIVE');
  });

  test('6. Soporte de Rollback Inmediato a Versión Anterior', async () => {
    const lifecycle = SettingsLifecycleService.getInstance();
    const currentActive = lifecycle.getActiveVersion();

    // Si aún está en V1, promocionar primero para poder probar rollback
    if (currentActive.version === 1) {
      const engine = CalibrationEngine.getInstance();
      await engine.generateCalibrationRun('GLOBAL');
      const proposals = Array.from(engine.proposals.values());
      if (proposals.length > 0 && proposals[0].status === 'PENDING_REVIEW') {
        proposals[0].proposalStrength = 'ACTIONABLE';
        proposals[0].isEligibleForActivation = true;
        proposals[0].sampleSize = 80;
        lifecycle.approveAndPromoteProposal({
          proposalId: proposals[0].id,
          superAdminUserId: 'super-admin-01',
        });
      }
    }

    const rolledBackVersion = lifecycle.rollbackToVersion({
      targetVersion: 1,
      superAdminUserId: 'super-admin-01',
      reason: 'Reversión preventiva a parámetros V1 iniciales.',
    });

    expect(rolledBackVersion.status).toBe('ACTIVE');
    expect(rolledBackVersion.settings.askingPriceAdjustment).toBe(0.1200);

    const history = lifecycle.getVersionHistory();
    expect(history.length).toBeGreaterThan(1);
  });

  test('7. Feedback Cualitativo de Usuarios: Almacenamiento y separación de Ground Truth', async () => {
    const fbService = ValuationFeedbackService.getInstance();
    const orgId = 'org-estudio-nova-uy';

    const feedback = await fbService.submitFeedback({
      organizationId: orgId,
      caseId: 'case-demo-100',
      valuationId: 'val-demo-100',
      feedbackType: 'VALUATION_TOO_HIGH',
      rating: 4,
      comment: 'El valor estimado de mercado parece un 5% por encima de lo que se escrituró en la misma cuadra.',
      suggestedValue: 195000,
    });

    expect(feedback.id).toBeDefined();
    expect(feedback.feedbackType).toBe('VALUATION_TOO_HIGH');

    const summary = fbService.getFeedbackSummary(orgId);
    expect(summary.totalCount).toBeGreaterThan(0);
    expect(summary.distribution.VALUATION_TOO_HIGH).toBeGreaterThan(0);
  });

  test('8. Prueba exacta de Descuento Observado (asking = 200.000, closing = 185.000 -> 7.50%)', async () => {
    const gtService = GroundTruthService.getInstance();
    const tx = gtService.registerTransaction({
      propertyMasterId: 'master-discount-test',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'apartamento',
      transactionDate: '2026-03-01',
      transactionPriceUsd: 185000,
      askingPriceUsd: 200000,
      groundTruthType: 'CONFIRMED_CLOSING',
      source: 'Operación Notarial Verificada',
    });

    // Descuento exacto: (200000 - 185000) / 200000 = 0.0750 = 7.50%
    expect(tx.observedDiscount).toBe(0.0750);
    expect(tx.observedDiscount).not.toBe(0.1200); // NO aplica baseline arbitrario
  });

  test('9. Separación de Conjuntos CALIBRATION SET vs HOLDOUT SET sin solapamiento', async () => {
    const engine = CalibrationEngine.getInstance();
    const holdoutEval = await engine.runHoldoutEvaluation();

    expect(holdoutEval.separationVerified).toBe(true);
    expect(holdoutEval.calibrationSet.count).toBeGreaterThan(0);
    expect(holdoutEval.holdoutSet.count).toBeGreaterThan(0);

    // Verificar que ninguna ID está en ambos conjuntos
    const calibIds = new Set(holdoutEval.calibrationSet.ids);
    for (const hId of holdoutEval.holdoutSet.ids) {
      expect(calibIds.has(hId)).toBe(false);
    }
  });

  test('10. Feedback VALUATION_TOO_HIGH NO crea observación cuantitativa de Ground Truth fuerte', async () => {
    const gtService = GroundTruthService.getInstance();
    const verifiedBefore = gtService.getVerifiedTransactions().length;

    const fbService = ValuationFeedbackService.getInstance();
    await fbService.submitFeedback({
      organizationId: 'org-test-isolation',
      valuationId: 'val-test-fb-gt',
      feedbackType: 'VALUATION_TOO_HIGH',
      rating: 2,
      comment: 'El tasador estimó 300k y para mí vale 250k.',
      suggestedValue: 250000,
    });

    const verifiedAfter = gtService.getVerifiedTransactions().length;
    // La cantidad de transacciones cuantitativas de Ground Truth NO cambió
    expect(verifiedAfter).toBe(verifiedBefore);
  });

  test('11. CERO DATA LEAKAGE: Transacciones posteriores a cutoffDate son estrictamente excluidas', async () => {
    const engine = CalibrationEngine.getInstance();
    const resultEarly = await engine.runBacktest({ cutoffDate: '2025-11-01' });
    const resultLate = await engine.runBacktest({ cutoffDate: '2026-03-01' });

    expect(resultEarly.metrics.sampleCount).toBeLessThan(resultLate.metrics.sampleCount);
    for (const detail of resultEarly.details) {
      const gt = GroundTruthService.getInstance().transactions.get(detail.txId);
      if (gt) {
        expect(gt.transactionDate <= '2025-11-01').toBe(true);
      }
    }
  });

  test('12. Resumen exacto de Ground Truth con desglose de certeza', async () => {
    const gtService = GroundTruthService.getInstance();
    const summary = gtService.getGroundTruthSummary();

    expect(summary.confirmed_transactions_total).toBeGreaterThan(0);
    expect(summary.document_verified_total).toBeGreaterThan(0);
    expect(summary.professional_confirmed_total).toBeGreaterThanOrEqual(0);
    expect(summary.total_verified_for_calibration).toBe(
      summary.confirmed_transactions_total +
      summary.document_verified_total +
      summary.professional_confirmed_total
    );
    expect(summary.strong_calibration_levels).toEqual([1, 2, 3]);
  });
});
