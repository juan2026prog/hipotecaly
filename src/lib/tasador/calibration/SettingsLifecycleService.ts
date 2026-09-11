// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE CICLO DE VIDA DE CONFIGURACIONES (FASE 6)
// Versionado inmutable, aprobación exclusiva Super Admin y soporte de Rollback
// ==============================================================================

import { AppraisalSettingsManager } from '../valuation/AppraisalSettingsManager';
import { AppraisalSettingsV1 } from '../valuation/valuationTypes';
import { SettingsVersionRecord } from './calibrationTypes';
import { CalibrationEngine } from './CalibrationEngine';

export class SettingsLifecycleService {
  private static instance: SettingsLifecycleService;

  public versionHistory: SettingsVersionRecord[] = [];

  private constructor() {
    this.initVersionHistory();
  }

  public static getInstance(): SettingsLifecycleService {
    if (!SettingsLifecycleService.instance) {
      SettingsLifecycleService.instance = new SettingsLifecycleService();
    }
    return SettingsLifecycleService.instance;
  }

  private initVersionHistory(): void {
    const currentSettings = AppraisalSettingsManager.getInstance().getSettings();
    this.versionHistory.push({
      version: 1,
      settings: currentSettings,
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      effectiveTo: null,
      approvedBy: 'system-init',
      approvedAt: '2026-01-01T00:00:00.000Z',
      changeSummary: 'Versión inicial V1 con baseline asking_price_adjustment = 0.1200 (12.00%).',
      calibrationRunId: null,
    });
  }

  /**
   * Obtiene la versión actualmente activa
   */
  public getActiveVersion(): SettingsVersionRecord {
    const active = this.versionHistory.find((v) => v.status === 'ACTIVE');
    return active || this.versionHistory[this.versionHistory.length - 1];
  }

  /**
   * Aprueba una propuesta de calibración y la promueve a nueva versión ACTIVA
   * EXCLUSIVO SUPER ADMIN
   */
  public approveAndPromoteProposal(params: {
    proposalId: string;
    superAdminUserId: string;
    notes?: string;
  }): SettingsVersionRecord {
    const calibrationEngine = CalibrationEngine.getInstance();
    const proposal = calibrationEngine.proposals.get(params.proposalId);

    if (!proposal) {
      throw new Error(`Propuesta de calibración no encontrada: ${params.proposalId}`);
    }

    if (proposal.status !== 'PENDING_REVIEW') {
      throw new Error(`La propuesta ya fue procesada con estado: ${proposal.status}`);
    }

    // 1. Marcar propuesta como aprobada
    proposal.status = 'APPROVED';
    proposal.reviewedBy = params.superAdminUserId;
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewNotes = params.notes || 'Aprobada por Super Admin tras validación de métricas de backtesting.';

    // 2. Marcar la versión actual como DEPRECATED
    const currentActive = this.getActiveVersion();
    currentActive.status = 'DEPRECATED';
    currentActive.effectiveTo = new Date().toISOString();

    // 3. Crear nueva versión con los parámetros propuestos
    const nextVersionNumber = this.versionHistory.length + 1;
    const newSettings: AppraisalSettingsV1 = {
      ...currentActive.settings,
      version: nextVersionNumber,
      askingPriceAdjustment: proposal.proposedValue.askingPriceAdjustment ?? currentActive.settings.askingPriceAdjustment,
      weights: proposal.proposedValue.weights ?? currentActive.settings.weights,
    };

    const newVersionRecord: SettingsVersionRecord = {
      version: nextVersionNumber,
      settings: newSettings,
      status: 'ACTIVE',
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      approvedBy: params.superAdminUserId,
      approvedAt: new Date().toISOString(),
      changeSummary: `Versión V${nextVersionNumber} promovida a partir de la propuesta ${proposal.id}. ${proposal.expectedImpact}`,
      calibrationRunId: proposal.runId,
    };

    this.versionHistory.push(newVersionRecord);

    // 4. Actualizar el gestor de configuración activo
    AppraisalSettingsManager.getInstance().updateSettings(newSettings);

    return newVersionRecord;
  }

  /**
   * Realiza un rollback inmediato a una versión anterior
   * EXCLUSIVO SUPER ADMIN
   */
  public rollbackToVersion(params: {
    targetVersion: number;
    superAdminUserId: string;
    reason: string;
  }): SettingsVersionRecord {
    const targetRecord = this.versionHistory.find((v) => v.version === params.targetVersion);
    if (!targetRecord) {
      throw new Error(`Versión objetivo no encontrada: V${params.targetVersion}`);
    }

    const currentActive = this.getActiveVersion();
    if (currentActive.version === params.targetVersion) {
      throw new Error(`La versión V${params.targetVersion} ya es la versión activa.`);
    }

    // Marcar la activa actual como ROLLED_BACK
    currentActive.status = 'ROLLED_BACK';
    currentActive.effectiveTo = new Date().toISOString();

    // Crear un nuevo registro de versión reactivando los settings anteriores
    const nextVersionNumber = this.versionHistory.length + 1;
    const restoredSettings: AppraisalSettingsV1 = {
      ...targetRecord.settings,
      version: nextVersionNumber,
    };

    const newRecord: SettingsVersionRecord = {
      version: nextVersionNumber,
      settings: restoredSettings,
      status: 'ACTIVE',
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      approvedBy: params.superAdminUserId,
      approvedAt: new Date().toISOString(),
      changeSummary: `Rollback a los parámetros de V${params.targetVersion}. Motivo: ${params.reason}`,
      calibrationRunId: null,
    };

    this.versionHistory.push(newRecord);
    AppraisalSettingsManager.getInstance().updateSettings(restoredSettings);

    return newRecord;
  }

  /**
   * Retorna el historial completo de versiones de configuración
   */
  public getVersionHistory(): SettingsVersionRecord[] {
    return [...this.versionHistory];
  }
}
