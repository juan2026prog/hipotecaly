// ==============================================================================
// HIPOTECALY TASADOR IA - AUDITOR DE SALUD DE FUENTES (SourceHealthCheck)
// Evaluación objetiva de conectividad, estructura, robots, rate limit y WAF
// Regla estricta: Si se detecta CAPTCHA o WAF, NUNCA intentar evasión ni bypass.
// ==============================================================================

import { AdapterRegistry } from '../adapters/AdapterRegistry';
import { HealthCheckResult } from '../types/tasadorPipelineTypes';
import { supabaseAdmin } from '../../../../server/supabase';

export interface SourceHealthReport {
  sourceCode: string;
  sourceName: string;
  domain: string;
  healthy: boolean;
  status: number | string;
  responseTimeMs: number;
  capability: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'PAUSED' | 'BLOCKED' | 'TOS_RESTRICTED' | 'MANUAL_ONLY' | 'ERROR';
  wafOrCaptchaDetected: boolean;
  message: string;
  testedAt: string;
}

export class SourceHealthCheck {
  private static instance: SourceHealthCheck;
  private adapterRegistry: AdapterRegistry;

  private constructor() {
    this.adapterRegistry = AdapterRegistry.getInstance();
  }

  public static getInstance(): SourceHealthCheck {
    if (!SourceHealthCheck.instance) {
      SourceHealthCheck.instance = new SourceHealthCheck();
    }
    return SourceHealthCheck.instance;
  }

  /**
   * Ejecuta auditoría de salud sobre una fuente específica y sincroniza con BD
   */
  public async checkSource(sourceCode: string): Promise<SourceHealthReport> {
    const adapter = this.adapterRegistry.getAdapter(sourceCode);
    if (!adapter) {
      return {
        sourceCode,
        sourceName: sourceCode,
        domain: '',
        healthy: false,
        status: 404,
        responseTimeMs: 0,
        capability: 'NOT_SUPPORTED',
        healthStatus: 'ERROR',
        wafOrCaptchaDetected: false,
        message: `Adaptador no encontrado para ${sourceCode}`,
        testedAt: new Date().toISOString(),
      };
    }

    const rawResult: HealthCheckResult = await adapter.healthCheck();

    // Detección honesta de WAF o CAPTCHA
    const isWafOrCaptcha =
      rawResult.status === 403 ||
      rawResult.capability === 'BLOCKED' ||
      (typeof rawResult.message === 'string' &&
        (rawResult.message.toLowerCase().includes('cloudflare') ||
          rawResult.message.toLowerCase().includes('waf') ||
          rawResult.message.toLowerCase().includes('captcha') ||
          rawResult.message.toLowerCase().includes('bot management') ||
          rawResult.message.toLowerCase().includes('bloque')));

    let healthStatus: SourceHealthReport['healthStatus'] = 'HEALTHY';
    if (isWafOrCaptcha) {
      healthStatus = 'BLOCKED';
    } else if (!rawResult.healthy) {
      if (rawResult.status === 429) {
        healthStatus = 'DEGRADED';
      } else if (adapter.capability === 'REQUIRES_AUTHORIZATION') {
        healthStatus = 'TOS_RESTRICTED';
      } else if (adapter.capability === 'NOT_SUPPORTED') {
        healthStatus = 'MANUAL_ONLY';
      } else {
        healthStatus = 'ERROR';
      }
    }

    const report: SourceHealthReport = {
      sourceCode: adapter.sourceCode,
      sourceName: adapter.sourceName,
      domain: adapter.domain,
      healthy: rawResult.healthy && !isWafOrCaptcha,
      status: rawResult.status,
      responseTimeMs: rawResult.responseTimeMs,
      capability: adapter.capability,
      healthStatus,
      wafOrCaptchaDetected: isWafOrCaptcha,
      message: rawResult.message || (rawResult.healthy ? 'Fuente operativa' : 'Fallo en comprobación'),
      testedAt: rawResult.testedAt || new Date().toISOString(),
    };

    // Actualizar estado en PostgreSQL server-side vía RPC autorizada
    try {
      await supabaseAdmin.rpc('fn_pipeline_update_source_health', {
        p_source_code: sourceCode,
        p_status: report.healthStatus,
        p_latency_ms: report.responseTimeMs,
        p_message: report.healthy ? null : report.message,
        p_parser_version: 'v2.0-deterministic',
      });
    } catch (dbErr) {
      // Continuar sin interrumpir si la base remota no es accesible en pruebas locales
      console.warn(`[SourceHealthCheck] Warning actualizando BD para ${sourceCode}:`, dbErr);
    }

    return report;
  }

  /**
   * Ejecuta auditoría sobre las 20 fuentes maestras
   */
  public async checkAllSources(): Promise<SourceHealthReport[]> {
    const adapters = this.adapterRegistry.getAllAdapters();
    const reports: SourceHealthReport[] = [];

    for (const adapter of adapters) {
      const report = await this.checkSource(adapter.sourceCode);
      reports.push(report);
    }

    return reports;
  }
}

export const sourceHealthCheck = SourceHealthCheck.getInstance();
