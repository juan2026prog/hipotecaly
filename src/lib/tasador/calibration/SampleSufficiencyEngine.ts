// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE SUFICIENCIA Y MADUREZ ESTADÍSTICA
// Gobernanza de muestras, bootstrap de incertidumbre y validación adaptativa
// ==============================================================================

import {
  SampleMaturityLevel,
  ValidationStrategyType,
  ProposalStrength,
  MaturityThresholdsConfig,
  DEFAULT_MATURITY_THRESHOLDS,
  SegmentSufficiencyEvaluation,
  GlobalSufficiencyReport,
  BootstrapConfidenceInterval,
  ConfirmedTransaction,
} from './calibrationTypes';

export class SampleSufficiencyEngine {
  private static instance: SampleSufficiencyEngine;

  private thresholdsConfig: MaturityThresholdsConfig = DEFAULT_MATURITY_THRESHOLDS;

  private constructor() {}

  public static getInstance(): SampleSufficiencyEngine {
    if (!SampleSufficiencyEngine.instance) {
      SampleSufficiencyEngine.instance = new SampleSufficiencyEngine();
    }
    return SampleSufficiencyEngine.instance;
  }

  public getThresholdsConfig(): MaturityThresholdsConfig {
    return { ...this.thresholdsConfig };
  }

  public updateThresholdsConfig(newConfig: Partial<MaturityThresholdsConfig>): MaturityThresholdsConfig {
    this.thresholdsConfig = {
      ...this.thresholdsConfig,
      ...newConfig,
      version: this.thresholdsConfig.version + 1,
    };
    return { ...this.thresholdsConfig };
  }

  /**
   * Clasifica el nivel de madurez estadística en función del tamaño de muestra
   * NUNCA utiliza términos como 'OPTIMAL', 'ACCURATE' o 'PRECISE'
   */
  public classifyMaturity(
    sampleSize: number,
    config: MaturityThresholdsConfig = this.thresholdsConfig
  ): SampleMaturityLevel {
    if (sampleSize <= config.noDataMax) return 'NO_DATA';
    if (sampleSize <= config.insufficientMax) return 'INSUFFICIENT';
    if (sampleSize <= config.earlySignalMax) return 'EARLY_SIGNAL';
    if (sampleSize <= config.usableWithCautionMax) return 'USABLE_WITH_CAUTION';
    if (sampleSize <= config.statisticallyUsefulMax) return 'STATISTICALLY_USEFUL';
    return 'STRONG_EVIDENCE';
  }

  /**
   * Determina la estrategia de validación adaptativa según el tamaño de muestra
   */
  public determineValidationStrategy(
    sampleSize: number,
    config: MaturityThresholdsConfig = this.thresholdsConfig
  ): ValidationStrategyType {
    if (sampleSize < config.minMetricSample) {
      return 'INSUFFICIENT_FOR_SPLIT';
    }
    if (sampleSize < config.minHoldoutSample) {
      return 'LEAVE_ONE_OUT_CV';
    }
    return 'TRADITIONAL_HOLDOUT';
  }

  /**
   * Clasifica la solidez de una propuesta de calibración
   * EXPLORATORY (n < 30) -> Bloqueada estrictamente para activación en prod
   */
  public determineProposalStrength(
    sampleSize: number,
    config: MaturityThresholdsConfig = this.thresholdsConfig
  ): ProposalStrength {
    if (sampleSize < config.minGlobalCalibrationSample) return 'EXPLORATORY';
    if (sampleSize < config.minActivationSample) return 'PRELIMINARY';
    if (sampleSize < 200) return 'ACTIONABLE';
    return 'STRONG';
  }

  /**
   * Evalúa la suficiencia de un segmento específico
   */
  public evaluateSegmentSufficiency(
    segmentKey: string,
    segmentType: 'GLOBAL' | 'DEPARTMENT' | 'CITY' | 'NEIGHBORHOOD' | 'PROPERTY_TYPE' | 'PRICE_BAND' | 'SURFACE_BAND',
    sampleSize: number,
    config: MaturityThresholdsConfig = this.thresholdsConfig
  ): SegmentSufficiencyEvaluation {
    const maturityLevel = this.classifyMaturity(sampleSize, config);
    const usableForReporting = sampleSize >= config.minMetricSample;
    const usableForCalibration = sampleSize >= (segmentType === 'GLOBAL' ? config.minGlobalCalibrationSample : config.minSegmentCalibrationSample);
    const usableForActivation = sampleSize >= config.minActivationSample;

    const warnings: string[] = [];
    if (sampleSize === 0) {
      warnings.push(`Sin observaciones para el segmento ${segmentKey}.`);
    } else if (sampleSize < config.minMetricSample) {
      warnings.push(`Muestra insuficiente (N=${sampleSize} < ${config.minMetricSample}). No confiable para reportes estadísticos.`);
    } else if (sampleSize <= config.earlySignalMax) {
      warnings.push(`Evidencia temprana (N=${sampleSize}). No apto para calibración automatizada ni activación.`);
    } else if (sampleSize <= config.usableWithCautionMax) {
      warnings.push(`Muestra moderada (N=${sampleSize}). Usar con precaución en análisis exploratorio.`);
    }

    return {
      segmentKey,
      segmentType,
      sampleSize,
      maturityLevel,
      usableForCalibration,
      usableForReporting,
      usableForActivation,
      warnings,
    };
  }

  /**
   * Genera el reporte global de suficiencia y madurez sobre todas las transacciones verificadas
   */
  public generateGlobalSufficiencyReport(
    transactions: ConfirmedTransaction[],
    config: MaturityThresholdsConfig = this.thresholdsConfig
  ): GlobalSufficiencyReport {
    const totalSampleSize = transactions.length;
    const globalMaturity = this.classifyMaturity(totalSampleSize, config);
    const validationStrategy = this.determineValidationStrategy(totalSampleSize, config);
    const usableForGlobalCalibration = totalSampleSize >= config.minGlobalCalibrationSample;
    const usableForGlobalActivation = totalSampleSize >= config.minActivationSample;

    const segments: Record<string, SegmentSufficiencyEvaluation> = {};

    // 1. Global
    segments['GLOBAL'] = this.evaluateSegmentSufficiency('GLOBAL', 'GLOBAL', totalSampleSize, config);

    // 2. Por Departamento
    const deptMap: Record<string, number> = {};
    for (const tx of transactions) {
      const d = tx.department || 'Desconocido';
      deptMap[d] = (deptMap[d] || 0) + 1;
    }
    for (const [dept, count] of Object.entries(deptMap)) {
      segments[`DEP_${dept}`] = this.evaluateSegmentSufficiency(dept, 'DEPARTMENT', count, config);
    }

    // 3. Por Barrio
    const neighMap: Record<string, number> = {};
    for (const tx of transactions) {
      const n = tx.neighborhood || 'Desconocido';
      neighMap[n] = (neighMap[n] || 0) + 1;
    }
    for (const [neigh, count] of Object.entries(neighMap)) {
      segments[`NEIGH_${neigh}`] = this.evaluateSegmentSufficiency(neigh, 'NEIGHBORHOOD', count, config);
    }

    // 4. Por Tipo de Propiedad
    const typeMap: Record<string, number> = {};
    for (const tx of transactions) {
      const t = tx.propertyType || 'Desconocido';
      typeMap[t] = (typeMap[t] || 0) + 1;
    }
    for (const [ptype, count] of Object.entries(typeMap)) {
      segments[`TYPE_${ptype}`] = this.evaluateSegmentSufficiency(ptype, 'PROPERTY_TYPE', count, config);
    }

    // 5. Por Banda de Precio
    const priceMap: Record<string, number> = {
      '<150k': 0,
      '150k-300k': 0,
      '300k-500k': 0,
      '>500k': 0,
    };
    for (const tx of transactions) {
      const p = tx.transactionPriceUsd;
      if (p < 150000) priceMap['<150k']++;
      else if (p <= 300000) priceMap['150k-300k']++;
      else if (p <= 500000) priceMap['300k-500k']++;
      else priceMap['>500k']++;
    }
    for (const [band, count] of Object.entries(priceMap)) {
      segments[`PRICE_${band}`] = this.evaluateSegmentSufficiency(band, 'PRICE_BAND', count, config);
    }

    const warnings: string[] = [];
    if (!usableForGlobalCalibration) {
      warnings.push(`Muestra global (N=${totalSampleSize}) clasificada como ${globalMaturity}. Se requieren al menos ${config.minGlobalCalibrationSample} transacciones para calibración formal.`);
    }
    if (!usableForGlobalActivation) {
      warnings.push(`Activación de nueva versión de parámetros bloqueada (N=${totalSampleSize} < ${config.minActivationSample}).`);
    }

    return {
      totalSampleSize,
      globalMaturity,
      thresholdsVersion: config.version,
      validationStrategy,
      usableForGlobalCalibration,
      usableForGlobalActivation,
      segments,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Estima intervalos de incertidumbre mediante Bootstrap (Percentil 2.5% y 97.5%)
   * Requiere N >= 10. Si N < 10 retorna UNCERTAINTY_NOT_RELIABLE sin inventar datos.
   */
  public computeBootstrapIntervals(
    observations: Array<{ actual: number; predicted: number; withinRange: boolean }>,
    iterations: number = 500
  ): {
    mape: BootstrapConfidenceInterval;
    mdape: BootstrapConfidenceInterval;
    bias: BootstrapConfidenceInterval;
    coverage: BootstrapConfidenceInterval;
  } {
    const n = observations.length;

    const createEmptyInterval = (metricName: string, pointEstimate: number): BootstrapConfidenceInterval => ({
      metricName,
      pointEstimate,
      ciLow: null,
      ciHigh: null,
      confidenceLevel: 0.95,
      iterations: 0,
      status: 'UNCERTAINTY_NOT_RELIABLE',
    });

    if (n < 10) {
      const pointMape = n > 0 ? (observations.reduce((acc, o) => acc + Math.abs(o.predicted - o.actual) / o.actual, 0) / n) * 100 : 0;
      const pointBias = n > 0 ? (observations.reduce((acc, o) => acc + (o.predicted - o.actual) / o.actual, 0) / n) * 100 : 0;
      const pointCoverage = n > 0 ? (observations.filter((o) => o.withinRange).length / n) * 100 : 0;

      return {
        mape: createEmptyInterval('MAPE', Number(pointMape.toFixed(2))),
        mdape: createEmptyInterval('Median APE', Number(pointMape.toFixed(2))),
        bias: createEmptyInterval('Bias (MSPE)', Number(pointBias.toFixed(2))),
        coverage: createEmptyInterval('Range Coverage', Number(pointCoverage.toFixed(2))),
      };
    }

    // Ejecución de Bootstrap
    const bootMapes: number[] = [];
    const bootMdapes: number[] = [];
    const bootBiases: number[] = [];
    const bootCoverages: number[] = [];

    // Seed pseudo-aleatorio reproducible
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let b = 0; b < iterations; b++) {
      const resampled: Array<{ actual: number; predicted: number; withinRange: boolean }> = [];
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(pseudoRandom() * n);
        resampled.push(observations[idx]);
      }

      const pcts = resampled.map((o) => Math.abs(o.predicted - o.actual) / o.actual);
      const signedPcts = resampled.map((o) => (o.predicted - o.actual) / o.actual);
      const covCount = resampled.filter((o) => o.withinRange).length;

      const bMape = (pcts.reduce((a, b) => a + b, 0) / n) * 100;
      const bBias = (signedPcts.reduce((a, b) => a + b, 0) / n) * 100;
      const bCov = (covCount / n) * 100;

      const sortedPcts = [...pcts].sort((a, b) => a - b);
      const bMdape =
        n % 2 === 0
          ? ((sortedPcts[n / 2 - 1] + sortedPcts[n / 2]) / 2) * 100
          : sortedPcts[Math.floor(n / 2)] * 100;

      bootMapes.push(bMape);
      bootMdapes.push(bMdape);
      bootBiases.push(bBias);
      bootCoverages.push(bCov);
    }

    bootMapes.sort((a, b) => a - b);
    bootMdapes.sort((a, b) => a - b);
    bootBiases.sort((a, b) => a - b);
    bootCoverages.sort((a, b) => a - b);

    const lowIdx = Math.floor(iterations * 0.025);
    const highIdx = Math.floor(iterations * 0.975);

    const pointMape = (observations.reduce((acc, o) => acc + Math.abs(o.predicted - o.actual) / o.actual, 0) / n) * 100;
    const pointBias = (observations.reduce((acc, o) => acc + (o.predicted - o.actual) / o.actual, 0) / n) * 100;
    const pointCoverage = (observations.filter((o) => o.withinRange).length / n) * 100;

    const sortedObsPcts = observations.map((o) => Math.abs(o.predicted - o.actual) / o.actual).sort((a, b) => a - b);
    const pointMdape =
      n % 2 === 0
        ? ((sortedObsPcts[n / 2 - 1] + sortedObsPcts[n / 2]) / 2) * 100
        : sortedObsPcts[Math.floor(n / 2)] * 100;

    return {
      mape: {
        metricName: 'MAPE',
        pointEstimate: Number(pointMape.toFixed(2)),
        ciLow: Number(bootMapes[lowIdx].toFixed(2)),
        ciHigh: Number(bootMapes[highIdx].toFixed(2)),
        confidenceLevel: 0.95,
        iterations,
        status: 'RELIABLE',
      },
      mdape: {
        metricName: 'Median APE',
        pointEstimate: Number(pointMdape.toFixed(2)),
        ciLow: Number(bootMdapes[lowIdx].toFixed(2)),
        ciHigh: Number(bootMdapes[highIdx].toFixed(2)),
        confidenceLevel: 0.95,
        iterations,
        status: 'RELIABLE',
      },
      bias: {
        metricName: 'Bias (Mean Signed % Error)',
        pointEstimate: Number(pointBias.toFixed(2)),
        ciLow: Number(bootBiases[lowIdx].toFixed(2)),
        ciHigh: Number(bootBiases[highIdx].toFixed(2)),
        confidenceLevel: 0.95,
        iterations,
        status: 'RELIABLE',
      },
      coverage: {
        metricName: 'Range Coverage',
        pointEstimate: Number(pointCoverage.toFixed(2)),
        ciLow: Number(bootCoverages[lowIdx].toFixed(2)),
        ciHigh: Number(bootCoverages[highIdx].toFixed(2)),
        confidenceLevel: 0.95,
        iterations,
        status: 'RELIABLE',
      },
    };
  }
}