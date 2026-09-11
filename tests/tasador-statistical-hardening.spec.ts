// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE: HARDENING ESTADÍSTICO Y DE GOBERNANZA
// Validación de Madurez de Muestra, Errores con Signo, Bootstrap y Safeguards Super Admin
// ==============================================================================

import { test, expect } from '@playwright/test';
import { SampleSufficiencyEngine } from '../src/lib/tasador/calibration/SampleSufficiencyEngine';
import { CalibrationEngine } from '../src/lib/tasador/calibration/CalibrationEngine';
import { SettingsLifecycleService } from '../src/lib/tasador/calibration/SettingsLifecycleService';
import { GroundTruthService } from '../src/lib/tasador/calibration/GroundTruthService';
import { DEFAULT_MATURITY_THRESHOLDS } from '../src/lib/tasador/calibration/calibrationTypes';

test.describe('Tasador IA - Hardening Estadístico y de Gobernanza Pre-Fase 7', () => {

  test('1. Clasificación de Madurez Estadística por Tamaño de Muestra (Sin "OPTIMAL" falso)', () => {
    const engine = SampleSufficiencyEngine.getInstance();

    expect(engine.classifyMaturity(0)).toBe('NO_DATA');
    expect(engine.classifyMaturity(1)).toBe('INSUFFICIENT');
    expect(engine.classifyMaturity(9)).toBe('INSUFFICIENT');
    expect(engine.classifyMaturity(10)).toBe('EARLY_SIGNAL');
    expect(engine.classifyMaturity(11)).toBe('EARLY_SIGNAL'); // Muestra actual de 11 casos
    expect(engine.classifyMaturity(29)).toBe('EARLY_SIGNAL');
    expect(engine.classifyMaturity(30)).toBe('USABLE_WITH_CAUTION');
    expect(engine.classifyMaturity(74)).toBe('USABLE_WITH_CAUTION');
    expect(engine.classifyMaturity(75)).toBe('STATISTICALLY_USEFUL');
    expect(engine.classifyMaturity(199)).toBe('STATISTICALLY_USEFUL');
    expect(engine.classifyMaturity(200)).toBe('STRONG_EVIDENCE');
    expect(engine.classifyMaturity(500)).toBe('STRONG_EVIDENCE');
  });

  test('2. Definición y Signo Matemático Estricto de Errores (signed_error = predicted - actual)', () => {
    // Caso A: Sobrevaluación (+10.000)
    const predOver = 210000;
    const actualOver = 200000;
    const signedErrorOver = predOver - actualOver;
    const signedPctOver = ((predOver - actualOver) / actualOver) * 100;
    expect(signedErrorOver).toBe(10000);
    expect(signedPctOver).toBe(5);
    expect(signedErrorOver > 0).toBe(true); // Positivo = Sobrevaluación

    // Caso B: Subvaluación (-10.000)
    const predUnder = 190000;
    const actualUnder = 200000;
    const signedErrorUnder = predUnder - actualUnder;
    const signedPctUnder = ((predUnder - actualUnder) / actualUnder) * 100;
    expect(signedErrorUnder).toBe(-10000);
    expect(signedPctUnder).toBe(-5);
    expect(signedErrorUnder < 0).toBe(true); // Negativo = Subvaluación

    // Caso C: Coincidencia Exacta (0)
    const predExact = 200000;
    const actualExact = 200000;
    const signedErrorExact = predExact - actualExact;
    expect(signedErrorExact).toBe(0);
  });

  test('3. Estrategia de Validación Adaptativa según Tamaño de Muestra', () => {
    const engine = SampleSufficiencyEngine.getInstance();

    expect(engine.determineValidationStrategy(2)).toBe('INSUFFICIENT_FOR_SPLIT');
    expect(engine.determineValidationStrategy(3)).toBe('LEAVE_ONE_OUT_CV');
    expect(engine.determineValidationStrategy(11)).toBe('LEAVE_ONE_OUT_CV'); // Muestra actual N=11
    expect(engine.determineValidationStrategy(19)).toBe('LEAVE_ONE_OUT_CV');
    expect(engine.determineValidationStrategy(20)).toBe('TRADITIONAL_HOLDOUT');
    expect(engine.determineValidationStrategy(100)).toBe('TRADITIONAL_HOLDOUT');
  });

  test('4. Clasificación de Fuerza de Propuestas (ProposalStrength)', () => {
    const engine = SampleSufficiencyEngine.getInstance();

    expect(engine.determineProposalStrength(11)).toBe('EXPLORATORY'); // Bloqueada para prod
    expect(engine.determineProposalStrength(29)).toBe('EXPLORATORY');
    expect(engine.determineProposalStrength(30)).toBe('PRELIMINARY');
    expect(engine.determineProposalStrength(74)).toBe('PRELIMINARY');
    expect(engine.determineProposalStrength(75)).toBe('ACTIONABLE'); // Elegible para activación
    expect(engine.determineProposalStrength(200)).toBe('STRONG');
  });

  test('5. Bootstrap de Incertidumbre: Reliable sólo con N >= 10', () => {
    const engine = SampleSufficiencyEngine.getInstance();

    // Muestra pequeña N=5 -> UNCERTAINTY_NOT_RELIABLE
    const smallObs = [
      { actual: 200000, predicted: 205000, withinRange: true },
      { actual: 180000, predicted: 182000, withinRange: true },
      { actual: 300000, predicted: 290000, withinRange: true },
      { actual: 150000, predicted: 160000, withinRange: true },
      { actual: 220000, predicted: 215000, withinRange: true },
    ];
    const smallBoot = engine.computeBootstrapIntervals(smallObs);
    expect(smallBoot.mape.status).toBe('UNCERTAINTY_NOT_RELIABLE');
    expect(smallBoot.mape.ciLow).toBeNull();
    expect(smallBoot.mape.ciHigh).toBeNull();

    // Muestra N=11 (Ground Truth real verificado) -> RELIABLE con intervalos 95%
    const currentObs = [
      { actual: 195000, predicted: 198000, withinRange: true },
      { actual: 320000, predicted: 315000, withinRange: true },
      { actual: 110000, predicted: 112000, withinRange: true },
      { actual: 245000, predicted: 240000, withinRange: true },
      { actual: 175000, predicted: 170000, withinRange: true },
      { actual: 280000, predicted: 285000, withinRange: true },
      { actual: 140000, predicted: 138000, withinRange: true },
      { actual: 220000, predicted: 225000, withinRange: true },
      { actual: 260000, predicted: 255000, withinRange: true },
      { actual: 190000, predicted: 192000, withinRange: true },
      { actual: 165000, predicted: 168000, withinRange: true },
    ];
    const matureBoot = engine.computeBootstrapIntervals(currentObs, 500);
    expect(matureBoot.mape.status).toBe('RELIABLE');
    expect(matureBoot.mape.ciLow).not.toBeNull();
    expect(matureBoot.mape.ciHigh).not.toBeNull();
    expect(matureBoot.mape.ciLow!).toBeLessThanOrEqual(matureBoot.mape.ciHigh!);
    expect(matureBoot.bias.status).toBe('RELIABLE');
    expect(matureBoot.coverage.status).toBe('RELIABLE');
  });

  test('6. Evaluación de Suficiencia por Segmento y Advertencias de Muestra', () => {
    const engine = SampleSufficiencyEngine.getInstance();

    // Segmento con N=1
    const seg1 = engine.evaluateSegmentSufficiency('Maldonado', 'DEPARTMENT', 1);
    expect(seg1.maturityLevel).toBe('INSUFFICIENT');
    expect(seg1.usableForReporting).toBe(false);
    expect(seg1.usableForCalibration).toBe(false);
    expect(seg1.usableForActivation).toBe(false);
    expect(seg1.warnings.length).toBeGreaterThan(0);

    // Segmento con N=5
    const seg5 = engine.evaluateSegmentSufficiency('Pocitos', 'NEIGHBORHOOD', 5);
    expect(seg5.maturityLevel).toBe('INSUFFICIENT');
    expect(seg5.usableForReporting).toBe(true); // N >= 3 permite reporte descriptivo
    expect(seg5.usableForCalibration).toBe(false); // N < 15 bloquea calibración de barrio

    // Segmento con N=100
    const seg100 = engine.evaluateSegmentSufficiency('Montevideo', 'DEPARTMENT', 100);
    expect(seg100.maturityLevel).toBe('STATISTICALLY_USEFUL');
    expect(seg100.usableForReporting).toBe(true);
    expect(seg100.usableForCalibration).toBe(true);
    expect(seg100.usableForActivation).toBe(true);
  });

  test('7. Reporte Global de Suficiencia sobre Transacciones Reales (Muestra Temprana)', () => {
    const engine = SampleSufficiencyEngine.getInstance();
    const gt = GroundTruthService.getInstance().getVerifiedTransactions();
    const report = engine.generateGlobalSufficiencyReport(gt);

    expect(report.totalSampleSize).toBe(gt.length);
    expect(report.totalSampleSize).toBeGreaterThanOrEqual(10);
    expect(report.globalMaturity).toBe('EARLY_SIGNAL');
    expect(report.validationStrategy).toBe('LEAVE_ONE_OUT_CV');
    expect(report.usableForGlobalCalibration).toBe(false); // Requiere N >= 30
    expect(report.usableForGlobalActivation).toBe(false); // Requiere N >= 75
    expect(report.warnings.some(w => w.includes('EARLY_SIGNAL'))).toBe(true);
  });

  test('8. Backtest con Métricas Completas y Clasificación de Sesgo', async () => {
    const calibEngine = CalibrationEngine.getInstance();
    const result = await calibEngine.runBacktest({ department: 'Montevideo' });

    expect(result.metrics.sampleCount).toBeGreaterThanOrEqual(10);
    expect(result.metrics.maturityLevel).toBe('EARLY_SIGNAL');
    expect(result.metrics.validationStrategy).toBe('LEAVE_ONE_OUT_CV');
    expect(result.metrics.mae).toBeGreaterThan(0);
    expect(result.metrics.mape).toBeGreaterThan(0);
    expect(result.metrics.mdape).toBeGreaterThan(0);
    expect(typeof result.metrics.meanSignedError).toBe('number');
    expect(typeof result.metrics.bias).toBe('number');
    expect(result.metrics.overvaluationRate + result.metrics.undervaluationRate).toBeLessThanOrEqual(100);

    // Verificar que los detalles contienen errores con signo y clasificación
    for (const detail of result.details) {
      expect(detail).toHaveProperty('signedError');
      expect(detail).toHaveProperty('signedPercentageError');
      expect(['OVERVALUATION', 'UNDERVALUATION', 'EXACT_MATCH']).toContain(detail.signedClassification);
      expect(detail.signedError).toBe(detail.predictedPrice - detail.actualPrice);
    }
  });

  test('9. Bloqueo de Gobernanza: Prohibida la Activación de Propuestas Exploratorias (N < 75)', async () => {
    const calibEngine = CalibrationEngine.getInstance();
    const lifecycle = SettingsLifecycleService.getInstance();
    const activeVersionBefore = lifecycle.getActiveVersion();

    // Generar propuesta shadow sobre muestra actual
    const run = await calibEngine.generateCalibrationRun('GLOBAL');
    expect(run.proposals.length).toBeGreaterThan(0);

    const proposal = run.proposals[0];
    expect(proposal.proposalStrength).toBe('EXPLORATORY');
    expect(proposal.isEligibleForActivation).toBe(false);

    // Intentar activar la propuesta en producción debe fallar con error explícito de gobernanza
    expect(() => {
      lifecycle.approveAndPromoteProposal({
        proposalId: proposal.id,
        superAdminUserId: 'super-admin-root',
      });
    }).toThrow(/BLOQUEO DE GOBERNANZA/);

    // Verificar que la configuración activa se mantiene inalterada
    const activeVersionAfter = lifecycle.getActiveVersion();
    expect(activeVersionAfter.version).toBe(activeVersionBefore.version);
    expect(activeVersionAfter.settings.askingPriceAdjustment).toBe(activeVersionBefore.settings.askingPriceAdjustment);
  });

  test('10. Parámetros de Madurez Configurables y Versionados', () => {
    const engine = SampleSufficiencyEngine.getInstance();
    const initialConfig = engine.getThresholdsConfig();
    expect(initialConfig.version).toBe(1);
    expect(initialConfig.minActivationSample).toBe(75);

    // Modificación de prueba y verificación de incremento de versión
    const updated = engine.updateThresholdsConfig({ minActivationSample: 80 });
    expect(updated.version).toBe(2);
    expect(updated.minActivationSample).toBe(80);

    // Restaurar configuración predeterminada
    engine.updateThresholdsConfig({ ...DEFAULT_MATURITY_THRESHOLDS, version: 1 });
  });

});
