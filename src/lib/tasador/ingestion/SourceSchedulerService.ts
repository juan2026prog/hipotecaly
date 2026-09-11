// ==============================================================================
// HIPOTECALY TASADOR IA - PLANIFICADOR Y COORDINADOR CONTINUO (SourceSchedulerService)
// Control de periodicidad configurable por fuente, protección anti-solapamiento,
// validación de Kill Switch server-side y orquestación Discovery -> Ingestion
// ==============================================================================

import { SourceHealthCheck } from './SourceHealthCheck';
import { SourceDiscoveryService } from './SourceDiscoveryService';
import { ListingIngestionWorker } from './ListingIngestionWorker';
import { supabaseAdmin } from '../../../../server/supabase.js';

export interface SchedulerRunSummary {
  cycleId: string;
  sourcesEvaluated: number;
  sourcesExecuted: number;
  sourcesSkipped: number;
  totalDiscovered: number;
  totalNew: number;
  totalModified: number;
  totalUnchanged: number;
  jobsProcessed: number;
  killSwitchTriggered: boolean;
  errors: string[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export class SourceSchedulerService {
  private static instance: SourceSchedulerService;
  private isRunningCycle: boolean = false;
  private activeLocks: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): SourceSchedulerService {
    if (!SourceSchedulerService.instance) {
      SourceSchedulerService.instance = new SourceSchedulerService();
    }
    return SourceSchedulerService.instance;
  }

  /**
   * Ejecuta un ciclo completo de scheduler sobre las fuentes que correspondan
   */
  public async executeScheduledCycle(options?: {
    forceAll?: boolean;
    limitPerSource?: number;
    sourcesFilter?: string[];
    runType?: 'SCHEDULED' | 'MANUAL';
  }): Promise<SchedulerRunSummary> {
    const startTime = Date.now();
    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();

    if (this.isRunningCycle) {
      return {
        cycleId,
        sourcesEvaluated: 0,
        sourcesExecuted: 0,
        sourcesSkipped: 0,
        totalDiscovered: 0,
        totalNew: 0,
        totalModified: 0,
        totalUnchanged: 0,
        jobsProcessed: 0,
        killSwitchTriggered: false,
        errors: ['Un ciclo de scheduler ya se encuentra en ejecución.'],
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }

    this.isRunningCycle = true;

    let sourcesEvaluated = 0;
    let sourcesExecuted = 0;
    let sourcesSkipped = 0;
    let totalDiscovered = 0;
    let totalNew = 0;
    let totalModified = 0;
    let totalUnchanged = 0;
    let jobsProcessed = 0;
    let killSwitchTriggered = false;
    const errors: string[] = [];

    try {
      // 1. Validar Kill Switch Global
      const { data: switches } = await supabaseAdmin
        .from('property_system_switches')
        .select('kill_switch_active, scheduler_active, global_discovery_enabled')
        .maybeSingle();

      if (switches?.kill_switch_active || switches?.scheduler_active === false) {
        killSwitchTriggered = true;
        return {
          cycleId,
          sourcesEvaluated: 0,
          sourcesExecuted: 0,
          sourcesSkipped: 0,
          totalDiscovered: 0,
          totalNew: 0,
          totalModified: 0,
          totalUnchanged: 0,
          jobsProcessed: 0,
          killSwitchTriggered: true,
          errors: ['Ejecución detenida: Kill switch global o scheduler desactivado.'],
          startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        };
      }

      // 2. Obtener fuentes configuradas
      const { data: sources } = await supabaseAdmin
        .from('property_sources')
        .select('*')
        .order('priority', { ascending: true });

      const targetSources = (sources || []).filter((s) => {
        if (options?.sourcesFilter && options.sourcesFilter.length > 0) {
          return options.sourcesFilter.includes(s.code);
        }
        return s.enabled && s.discovery_enabled && s.is_active;
      });

      sourcesEvaluated = targetSources.length;

      const healthChecker = SourceHealthCheck.getInstance();
      const discoveryService = SourceDiscoveryService.getInstance();
      const ingestionWorker = ListingIngestionWorker.getInstance();

      // 3. Procesar fuentes habilitadas secuencialmente respetando rate limits y locks
      for (const source of targetSources) {
        // Protección anti-solapamiento por fuente
        if (this.activeLocks.has(source.code)) {
          sourcesSkipped++;
          continue;
        }

        this.activeLocks.add(source.code);

        try {
          // A. Health Check Previo Obligatorio
          const health = await healthChecker.checkSource(source.code);
          if (!health.healthy || health.wafOrCaptchaDetected || health.healthStatus === 'BLOCKED') {
            sourcesSkipped++;
            continue;
          }

          // B. Discovery Incremental
          const discResult = await discoveryService.runDiscovery(source.code, {
            limit: options?.limitPerSource || 50,
            runType: options?.runType || 'SCHEDULED',
          });

          sourcesExecuted++;
          totalDiscovered += discResult.listingsFound;
          totalNew += discResult.listingsNew;
          totalModified += discResult.listingsModified;
          totalUnchanged += discResult.listingsUnchanged;

          // C. Consumo de Jobs de Ingesta generados
          if (discResult.jobsQueued > 0 && source.ingestion_enabled) {
            const workerResult = await ingestionWorker.processBatch(discResult.jobsQueued);
            jobsProcessed += workerResult.jobsSucceeded;
          }
        } catch (srcErr: any) {
          errors.push(`Error en fuente ${source.code}: ${srcErr.message}`);
        } finally {
          this.activeLocks.delete(source.code);
        }
      }
    } catch (cycleErr: any) {
      errors.push(`Error fatal en ciclo: ${cycleErr.message}`);
    } finally {
      this.isRunningCycle = false;
    }

    return {
      cycleId,
      sourcesEvaluated,
      sourcesExecuted,
      sourcesSkipped,
      totalDiscovered,
      totalNew,
      totalModified,
      totalUnchanged,
      jobsProcessed,
      killSwitchTriggered,
      errors,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }
}

export const sourceSchedulerService = SourceSchedulerService.getInstance();
