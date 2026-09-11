// ==============================================================================
// HIPOTECALY TASADOR IA - GESTOR DE CONFIGURACIÓN VERSIONADA (FASE 3 & RECALIBRACIÓN)
// Configuración de Pesos, Factores y Parámetro Versionado (asking_price_adjustment)
// V1 = 12.00% (Histórico Preservado) | V2 = 8.50% (Activo Certificado)
// ==============================================================================

import { AppraisalSettingsV1 } from './valuationTypes';

export const DEFAULT_APPRAISAL_SETTINGS_V1: AppraisalSettingsV1 = {
  version: 1,
  askingPriceAdjustment: 0.1200, // 12.00% exacto histórico para V1
  minComparables: 3,
  targetComparables: 10,
  maxComparables: 30,
  maxAgeDays: 365,
  outlierIqrMultiplier: 1.5,
  outlierMadThreshold: 2.5,
  recencyBuckets: [
    { name: '0-30 días', minDays: 0, maxDays: 30, decayFactor: 1.00 },
    { name: '31-90 días', minDays: 31, maxDays: 90, decayFactor: 0.90 },
    { name: '91-180 días', minDays: 91, maxDays: 180, decayFactor: 0.75 },
    { name: '181-365 días', minDays: 181, maxDays: 365, decayFactor: 0.50 },
    { name: '>365 días', minDays: 366, maxDays: 9999, decayFactor: 0.25 },
  ],
  weights: {
    location: 0.25,
    propertyType: 0.15,
    totalArea: 0.10,
    builtArea: 0.15,
    bedrooms: 0.10,
    bathrooms: 0.05,
    garage: 0.05,
    age: 0.05,
    condition: 0.03,
    recency: 0.04,
    dataQuality: 0.03,
  },
  methodWeights: {
    weightedMedian: 0.35,
    weightedTrimmedMean: 0.30,
    weightedPricePerM2: 0.25,
    directAdjustment: 0.10,
  },
  confidenceThresholds: {
    veryHigh: 90.0,
    high: 75.0,
    medium: 60.0,
    low: 40.0,
  },
};

export const DEFAULT_APPRAISAL_SETTINGS_V2: AppraisalSettingsV1 = {
  ...DEFAULT_APPRAISAL_SETTINGS_V1,
  version: 2,
  askingPriceAdjustment: 0.0850, // 8.50% exacto para V2 (Ajuste certificado)
};

export class AppraisalSettingsManager {
  private static instance: AppraisalSettingsManager;
  private currentSettings: AppraisalSettingsV1 = { ...DEFAULT_APPRAISAL_SETTINGS_V2 };

  private constructor() {}

  public static getInstance(): AppraisalSettingsManager {
    if (!AppraisalSettingsManager.instance) {
      AppraisalSettingsManager.instance = new AppraisalSettingsManager();
    }
    return AppraisalSettingsManager.instance;
  }

  public getSettings(): AppraisalSettingsV1 {
    return { ...this.currentSettings };
  }

  public updateSettings(partial: Partial<AppraisalSettingsV1>): AppraisalSettingsV1 {
    this.currentSettings = {
      ...this.currentSettings,
      ...partial,
      version: this.currentSettings.version + 1, // Nuevo versionado ante cualquier cambio
    };
    return this.getSettings();
  }

  public resetToDefault(): void {
    this.currentSettings = { ...DEFAULT_APPRAISAL_SETTINGS_V2 };
  }

  public resetToVersion(version: 1 | 2): void {
    if (version === 1) {
      this.currentSettings = { ...DEFAULT_APPRAISAL_SETTINGS_V1 };
    } else {
      this.currentSettings = { ...DEFAULT_APPRAISAL_SETTINGS_V2 };
    }
  }
}
