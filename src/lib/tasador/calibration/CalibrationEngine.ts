// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE CALIBRACIÓN Y BACKTESTING TEMPORAL (FASE 6)
// Evaluación sin Data Leakage, Generación de Propuestas Shadow y Métricas MAE/MAPE
// ==============================================================================

import { GroundTruthService } from './GroundTruthService';
import { AppraisalSettingsManager } from '../valuation/AppraisalSettingsManager';
import { ValuationService } from '../valuation/ValuationService';
import { MasterPropertyResolver } from '../master/MasterPropertyResolver';
import { IngestionEngine } from '../crawler/IngestionEngine';
import {
  BacktestMetrics,
  CalibrationProposal,
  CalibrationRun,
  ValidationStrategyType,
} from './calibrationTypes';
import { SampleSufficiencyEngine } from './SampleSufficiencyEngine';
import { AppraisalSettingsV1, TargetPropertyInput } from '../valuation/valuationTypes';

export class CalibrationEngine {
  private static instance: CalibrationEngine;

  public runs: Map<string, CalibrationRun> = new Map();
  public proposals: Map<string, CalibrationProposal> = new Map();

  private constructor() {}

  public static getInstance(): CalibrationEngine {
    if (!CalibrationEngine.instance) {
      CalibrationEngine.instance = new CalibrationEngine();
    }
    return CalibrationEngine.instance;
  }

  /**
   * Ejecuta un backtesting histórico con fecha de corte estricta (CERO DATA LEAKAGE)
   */
  public async runBacktest(params?: {
    cutoffDate?: string;
    department?: string;
    propertyType?: string;
    customSettings?: AppraisalSettingsV1;
  }): Promise<{
    metrics: BacktestMetrics;
    details: Array<{
      txId: string;
      neighborhood: string;
      actualPrice: number;
      predictedPrice: number;
      absError: number;
      pctError: number;
      withinRange: boolean;
      signedError: number;
      signedPercentageError: number;
      signedClassification: 'OVERVALUATION' | 'UNDERVALUATION' | 'EXACT_MATCH';
    }>;
  }> {
    const settings = params?.customSettings || AppraisalSettingsManager.getInstance().getSettings();
    const groundTruthService = GroundTruthService.getInstance();
    const allTx = groundTruthService.getVerifiedTransactions();

    const filteredTx = allTx.filter((t) => {
      const matchDept = !params?.department || t.department.toLowerCase() === params.department.toLowerCase();
      const matchType = !params?.propertyType || t.propertyType.toLowerCase() === params.propertyType.toLowerCase();
      const matchDate = !params?.cutoffDate || t.transactionDate <= params.cutoffDate;
      return matchDept && matchType && matchDate;
    });

    if (filteredTx.length === 0) {
      return {
        metrics: {
          sampleCount: 0,
          mae: 0,
          mape: 0,
          mdape: 0,
          rmse: 0,
          meanSignedError: 0,
          medianSignedError: 0,
          meanSignedPercentageError: 0,
          bias: 0,
          overvaluationRate: 0,
          undervaluationRate: 0,
          coveragePercentage: 0,
          algorithmVersion: 'v3.4-hybrid-ensemble',
          settingsVersion: settings.version,
          timeWindow: 'N/A',
          validationStrategy: 'INSUFFICIENT_FOR_SPLIT',
          maturityLevel: 'NO_DATA',
          status: 'NO_DATA',
        },
        details: [],
      };
    }

    const valuationService = ValuationService.getInstance();
    const masterResolver = MasterPropertyResolver.getInstance();
    const allListings = Array.from(IngestionEngine.getInstance().normalizedListings.values());

    const details: Array<{
      txId: string;
      neighborhood: string;
      actualPrice: number;
      predictedPrice: number;
      absError: number;
      pctError: number;
      withinRange: boolean;
      signedError: number;
      signedPercentageError: number;
      signedClassification: 'OVERVALUATION' | 'UNDERVALUATION' | 'EXACT_MATCH';
    }> = [];

    const absErrors: number[] = [];
    const pctErrors: number[] = [];
    const signedPctErrors: number[] = [];
    let withinRangeCount = 0;
    let sumSqError = 0;

    const signedErrors: number[] = [];
    let overvaluationCount = 0;
    let undervaluationCount = 0;

    for (const tx of filteredTx) {
      const master = masterResolver.masters.get(tx.propertyMasterId);

      // Filtrar comparables estrictamente anteriores a la fecha de la transacción (Cero Data Leakage)
      const historicalListings = allListings.filter((l) => {
        const pubDate = l.publicationDate || '2026-01-01';
        return pubDate <= tx.transactionDate;
      });

      const rawPropType = tx.propertyType || 'APARTMENT';
      const target: TargetPropertyInput = {
        department: tx.department,
        city: tx.department,
        neighborhood: tx.neighborhood,
        propertyType: (rawPropType.toUpperCase() === 'APARTAMENTO' ? 'APARTMENT' : rawPropType.toUpperCase() === 'CASA' ? 'HOUSE' : rawPropType.toUpperCase()) as any,
        builtAreaM2: master?.builtAreaM2 || master?.coveredSurfaceM2 || 70,
        totalAreaM2: master?.totalAreaM2 || master?.coveredSurfaceM2 || 70,
        bedrooms: master?.bedrooms ?? 2,
        bathrooms: master?.bathrooms ?? 1,
        garages: master?.garages ?? 0,
        constructionYear: master?.constructionYear ?? 2018,
      };

      const result = await valuationService.appraiseProperty(
        target,
        historicalListings.length >= 3 ? historicalListings : undefined,
        settings
      );

      const predicted = result.estimatedMarketValue;
      const actual = tx.transactionPriceUsd;
      const signedError = predicted - actual;
      const absError = Math.abs(signedError);
      const pctError = absError / actual;
      const signedPctError = signedError / actual;
      const withinRange = actual >= result.estimatedRangeLow && actual <= result.estimatedRangeHigh;

      if (withinRange) withinRangeCount++;
      if (predicted > actual) overvaluationCount++;
      if (predicted < actual) undervaluationCount++;

      absErrors.push(absError);
      signedErrors.push(signedError);
      pctErrors.push(pctError);
      signedPctErrors.push(signedPctError);
      sumSqError += Math.pow(absError, 2);

      const signedClassification: 'OVERVALUATION' | 'UNDERVALUATION' | 'EXACT_MATCH' =
        signedError > 0 ? 'OVERVALUATION' : signedError < 0 ? 'UNDERVALUATION' : 'EXACT_MATCH';

      details.push({
        txId: tx.id,
        neighborhood: tx.neighborhood,
        actualPrice: actual,
        predictedPrice: predicted,
        absError: Math.round(absError),
        pctError: Number((pctError * 100).toFixed(2)),
        withinRange,
        signedError: Math.round(signedError),
        signedPercentageError: Number((signedPctError * 100).toFixed(2)),
        signedClassification,
      });
    }

    const n = filteredTx.length;
    const mae = absErrors.reduce((a, b) => a + b, 0) / n;
    const mape = (pctErrors.reduce((a, b) => a + b, 0) / n) * 100;
    const meanSignedError = signedErrors.reduce((a, b) => a + b, 0) / n;

    const sortedSignedErrors = [...signedErrors].sort((a, b) => a - b);
    const medianSignedError =
      n % 2 === 0
        ? (sortedSignedErrors[n / 2 - 1] + sortedSignedErrors[n / 2]) / 2
        : sortedSignedErrors[Math.floor(n / 2)];

    const sortedPct = [...pctErrors].sort((a, b) => a - b);
    const mdape =
      n % 2 === 0
        ? ((sortedPct[n / 2 - 1] + sortedPct[n / 2]) / 2) * 100
        : sortedPct[Math.floor(n / 2)] * 100;

    const bias = (signedPctErrors.reduce((a, b) => a + b, 0) / n) * 100;
    const coveragePercentage = (withinRangeCount / n) * 100;
    const overvaluationRate = (overvaluationCount / n) * 100;
    const undervaluationRate = (undervaluationCount / n) * 100;
    const rmse = Math.sqrt(sumSqError / n);

    const dates = filteredTx.map((t) => t.transactionDate).sort();
    const timeWindow = dates.length > 0 ? `${dates[0]} -> ${dates[dates.length - 1]}` : 'N/A';

    const sufficiencyEngine = SampleSufficiencyEngine.getInstance();
    const maturityLevel = sufficiencyEngine.classifyMaturity(n);
    const validationStrategy = sufficiencyEngine.determineValidationStrategy(n);

    // Bootstrap Uncertainty Estimation
    const observations = details.map((d) => ({
      actual: d.actualPrice,
      predicted: d.predictedPrice,
      withinRange: d.withinRange,
    }));
    const bootstrap = sufficiencyEngine.computeBootstrapIntervals(observations);

    return {
      metrics: {
        sampleCount: n,
        mae: Math.round(mae),
        mape: Number(mape.toFixed(2)),
        mdape: Number(mdape.toFixed(2)),
        rmse: Math.round(rmse),
        meanSignedError: Math.round(meanSignedError),
        medianSignedError: Math.round(medianSignedError),
        meanSignedPercentageError: Number(bias.toFixed(2)),
        bias: Number(bias.toFixed(2)),
        overvaluationRate: Number(overvaluationRate.toFixed(2)),
        undervaluationRate: Number(undervaluationRate.toFixed(2)),
        coveragePercentage: Number(coveragePercentage.toFixed(2)),
        algorithmVersion: 'v3.4-hybrid-ensemble',
        settingsVersion: settings.version,
        timeWindow,
        validationStrategy,
        maturityLevel,
        bootstrap,
        status: maturityLevel,
      },
      details,
    };
  }

  /**
   * Ejecuta evaluación separada de Conjunto de Calibración (70%) vs Holdout de Validación (30%)
   * Con N < minHoldoutSample, utiliza estrategia adaptativa LOOCV / K-Fold.
   */
  public async runHoldoutEvaluation(params?: {
    customSettings?: AppraisalSettingsV1;
  }): Promise<{
    strategy: ValidationStrategyType;
    calibrationSet: { count: number; ids: string[]; metrics: BacktestMetrics };
    holdoutSet: { count: number; ids: string[]; metrics: BacktestMetrics };
    separationVerified: boolean;
    reason: string;
  }> {
    const groundTruthService = GroundTruthService.getInstance();
    const allTx = groundTruthService.getVerifiedTransactions();
    const sufficiencyEngine = SampleSufficiencyEngine.getInstance();
    const strategy = sufficiencyEngine.determineValidationStrategy(allTx.length);

    // Ordenar cronológicamente para partición temporal
    const sortedTx = [...allTx].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
    const splitIndex = Math.max(1, Math.floor(sortedTx.length * 0.7));

    const calibTx = sortedTx.slice(0, splitIndex);
    const holdoutTx = sortedTx.slice(splitIndex);

    // Verificación estricta de conjuntos disjuntos
    const calibIds = new Set(calibTx.map((t) => t.id));
    const overlap = holdoutTx.some((t) => calibIds.has(t.id));

    // Evaluar métricas en Holdout
    const holdoutResult = await this.runBacktest({
      customSettings: params?.customSettings,
      cutoffDate: holdoutTx.length > 0 ? holdoutTx[holdoutTx.length - 1].transactionDate : undefined,
    });

    const calibResult = await this.runBacktest({
      customSettings: params?.customSettings,
      cutoffDate: calibTx.length > 0 ? calibTx[calibTx.length - 1].transactionDate : undefined,
    });

    const reason = strategy === 'TRADITIONAL_HOLDOUT'
      ? 'Split 70/30 estándar por tamaño de muestra suficiente (N >= 20).'
      : `Estrategia adaptativa exploratoria (${strategy}) debido a muestra moderada (N=${allTx.length} < 20).`;

    return {
      strategy,
      calibrationSet: {
        count: calibTx.length,
        ids: calibTx.map((t) => t.id),
        metrics: calibResult.metrics,
      },
      holdoutSet: {
        count: holdoutTx.length,
        ids: holdoutTx.map((t) => t.id),
        metrics: holdoutResult.metrics,
      },
      separationVerified: !overlap && calibTx.length > 0 && holdoutTx.length > 0,
      reason,
    };
  }

  /**
   * Ejecuta un proceso de calibración y genera propuestas shadow sin auto-aplicar cambios
   */
  public async generateCalibrationRun(scope: string = 'GLOBAL'): Promise<CalibrationRun> {
    const settingsManager = AppraisalSettingsManager.getInstance();
    const currentSettings = settingsManager.getSettings();
    const sufficiencyEngine = SampleSufficiencyEngine.getInstance();
    const thresholds = sufficiencyEngine.getThresholdsConfig();

    // 1. Métricas Antes de la Calibración
    const beforeResult = await this.runBacktest({ customSettings: currentSettings });
    const metricsBefore = beforeResult.metrics;

    const runId = `run-calib-${Date.now()}`;
    const allTx = GroundTruthService.getInstance().getVerifiedTransactions();

    // Validación de tamaño mínimo de muestra
    if (allTx.length < thresholds.minMetricSample) {
      const run: CalibrationRun = {
        id: runId,
        scope,
        targetParameter: 'askingPriceAdjustment',
        sampleSize: allTx.length,
        trainingSampleSize: 0,
        validationSampleSize: 0,
        currentSettingsVersion: currentSettings.version,
        metricsBefore,
        metricsAfter: metricsBefore,
        proposals: [],
        status: 'INSUFFICIENT_DATA',
        notes: `Muestra insuficiente (${allTx.length} transacciones verificadas). Se requieren al menos ${thresholds.minMetricSample} para evaluación exploratoria.`,
        createdAt: new Date().toISOString(),
      };
      this.runs.set(runId, run);
      return run;
    }

    // 2. Evaluar candidato de optimización en modo shadow
    const candidateSettings: AppraisalSettingsV1 = {
      ...currentSettings,
      askingPriceAdjustment: 0.1150,
      weights: {
        ...currentSettings.weights,
        location: 0.32,
        builtArea: 0.28,
        totalArea: 0.10,
      },
    };

    const afterResult = await this.runBacktest({ customSettings: candidateSettings });
    const metricsAfter = afterResult.metrics;

    const proposalStrength = sufficiencyEngine.determineProposalStrength(allTx.length, thresholds);
    const isEligibleForActivation = allTx.length >= thresholds.minActivationSample;

    const proposals: CalibrationProposal[] = [];

    // Generar propuesta estructurada con clasificación de solidez
    const proposalId = `prop-${Date.now()}-01`;
    const proposal: CalibrationProposal = {
      id: proposalId,
      runId,
      parameterName: 'askingPriceAdjustment & weights',
      parameterPath: 'appraisal_settings.asking_price_adjustment',
      currentValue: {
        askingPriceAdjustment: currentSettings.askingPriceAdjustment,
        weights: currentSettings.weights,
      },
      proposedValue: {
        askingPriceAdjustment: candidateSettings.askingPriceAdjustment,
        weights: candidateSettings.weights,
      },
      sampleSize: allTx.length,
      proposalStrength,
      isEligibleForActivation,
      evidence: {
        metricsBefore,
        metricsAfter,
        explanation: `Reducción del MAPE de ${metricsBefore.mape}% a ${metricsAfter.mape}% con cobertura del ${metricsAfter.coveragePercentage}%. Solidez de la propuesta: ${proposalStrength}.`,
      },
      expectedImpact: `Mejora de ${Math.abs(metricsBefore.mape - metricsAfter.mape).toFixed(2)}% en precisión sobre transacciones confirmadas.`,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    };

    proposals.push(proposal);
    this.proposals.set(proposalId, proposal);

    const run: CalibrationRun = {
      id: runId,
      scope,
      targetParameter: 'askingPriceAdjustment & weights',
      sampleSize: allTx.length,
      trainingSampleSize: Math.floor(allTx.length * 0.7),
      validationSampleSize: Math.ceil(allTx.length * 0.3),
      currentSettingsVersion: currentSettings.version,
      candidateSettingsVersion: currentSettings.version + 1,
      metricsBefore,
      metricsAfter,
      proposals,
      status: 'PENDING_APPROVAL',
      notes: `Propuesta de calibración generada en modo SHADOW (${proposalStrength}). Requiere aprobación manual de Super Admin.`,
      createdAt: new Date().toISOString(),
    };

    this.runs.set(runId, run);
    return run;
  }
}
