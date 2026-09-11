// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE OBSERVABILIDAD PARA SUPER ADMIN
// Monitoreo de 20 Fuentes, Crawler Runs, Calidad, Deduplicación y Métricas Globales
// ==============================================================================

import { IngestionEngine } from '../crawler/IngestionEngine';
import { AdapterRegistry, SourceRuntimeState } from '../adapters/AdapterRegistry';
import { IngestionRunResult, HealthCheckResult } from '../types/tasadorPipelineTypes';
import { CadastralAdapter, CadastralAuditReport } from '../cadastral/CadastralAdapter';

export interface TasadorObservabilitySummary {
  sources: SourceRuntimeState[];
  pipelineSummary: {
    totalListings: number;
    totalMasters: number;
    totalSnapshots: number;
    totalMedia: number;
    totalPriceEvents: number;
    totalFieldEvidences: number;
    totalDuplicateCandidates: number;
    totalRuns: number;
  };
  recentRuns: IngestionRunResult[];
  cadastralAudit: CadastralAuditReport;
  lastUpdated: string;
}

export class TasadorObservabilityService {
  private static instance: TasadorObservabilityService;
  private ingestionEngine: IngestionEngine;
  private adapterRegistry: AdapterRegistry;
  private cadastralAdapter: CadastralAdapter;

  private constructor() {
    this.ingestionEngine = IngestionEngine.getInstance();
    this.adapterRegistry = AdapterRegistry.getInstance();
    this.cadastralAdapter = CadastralAdapter.getInstance();
  }

  public static getInstance(): TasadorObservabilityService {
    if (!TasadorObservabilityService.instance) {
      TasadorObservabilityService.instance = new TasadorObservabilityService();
    }
    return TasadorObservabilityService.instance;
  }

  public async getSummary(): Promise<TasadorObservabilitySummary> {
    const sources = this.adapterRegistry.getSourcesState();
    const pipelineSummary = this.ingestionEngine.getPipelineSummary();
    const recentRuns = this.ingestionEngine.runHistory.slice(-20).reverse();
    const cadastralAudit = this.cadastralAdapter.getAuditReport();

    return {
      sources,
      pipelineSummary,
      recentRuns,
      cadastralAudit,
      lastUpdated: new Date().toISOString(),
    };
  }

  public async runHealthCheckAll(): Promise<HealthCheckResult[]> {
    return this.adapterRegistry.runHealthCheckAll();
  }

  public async triggerIngestionRun(
    sourceCode: string,
    options?: { limit?: number; department?: string; dryRun?: boolean }
  ): Promise<IngestionRunResult> {
    return this.ingestionEngine.executeRun(sourceCode, {
      limit: options?.limit || 20,
      department: options?.department || 'montevideo',
      runType: options?.dryRun ? 'MANUAL' : 'ON_DEMAND',
    });
  }

  public updateSourceFlags(
    sourceCode: string,
    flags: {
      enabled?: boolean;
      ingestionEnabled?: boolean;
      dryRun?: boolean;
      scheduleEnabled?: boolean;
    }
  ) {
    this.adapterRegistry.updateFlags(sourceCode, flags);
  }
}

export const tasadorObservabilityService = TasadorObservabilityService.getInstance();
