// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE TASACIONES PROFESIONALES EXTERNAS (FASE 5)
// Registro pericial/notarial, cálculo de desvío y cumplimiento de regla sin 12%
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../supabase';
import {
  ProfessionalAppraisal,
  ProfessionalAppraisalInput,
} from './casePropertyTypes';

export class ProfessionalAppraisalService {
  private static instance: ProfessionalAppraisalService;

  // Repositorio en memoria aislado por organization_id y case_id
  public appraisals: Map<string, ProfessionalAppraisal> = new Map();

  private constructor() {}

  public static getInstance(): ProfessionalAppraisalService {
    if (!ProfessionalAppraisalService.instance) {
      ProfessionalAppraisalService.instance = new ProfessionalAppraisalService();
    }
    return ProfessionalAppraisalService.instance;
  }

  /**
   * Registra una tasación pericial/profesional externa.
   * REGLA ESTRICTA: NO se le aplica asking_price_adjustment (12%), pues ya es valor pericial.
   */
  public async registerAppraisal(
    input: ProfessionalAppraisalInput
  ): Promise<ProfessionalAppraisal> {
    if (!input.appraisedValue || input.appraisedValue <= 0) {
      throw new Error('El valor tasado debe ser un monto positivo mayor a cero.');
    }

    let deviationVsAiPercentage: number | null = null;
    if (input.currentAiValuationUsd && input.currentAiValuationUsd > 0) {
      // Desvío porcentual: ((IA - Perito) / Perito) * 100
      deviationVsAiPercentage = Number(
        (
          ((input.currentAiValuationUsd - input.appraisedValue) / input.appraisedValue) *
          100
        ).toFixed(2)
      );
    }

    const appraisalId = `prof-${input.caseId || 'gen'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const record: ProfessionalAppraisal = {
      id: appraisalId,
      organizationId: input.organizationId,
      caseId: input.caseId || null,
      propertyMasterId: input.propertyMasterId || null,
      professionalName: input.professionalName.trim(),
      professionalType: input.professionalType || 'PERITO_TASADOR',
      registrationNumber: input.registrationNumber?.trim() || null,
      appraisalDate: input.appraisalDate || new Date().toISOString().split('T')[0],
      appraisedValue: Number(input.appraisedValue),
      currency: input.currency || 'USD',
      methodology: input.methodology || 'COMPARATIVO_MERCADO',
      documentUrl: input.documentUrl || null,
      deviationVsAiPercentage,
      verificationStatus: 'VERIFIED',
      notes: input.notes || null,
      enteredBy: input.enteredBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.appraisals.set(appraisalId, record);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('professional_appraisals').insert({
          id: appraisalId.startsWith('prof-') && appraisalId.length === 36 ? appraisalId : undefined,
          organization_id: input.organizationId,
          case_id: input.caseId,
          property_master_id: input.propertyMasterId,
          professional_name: record.professionalName,
          professional_type: record.professionalType,
          registration_number: record.registrationNumber,
          appraisal_date: record.appraisalDate,
          appraised_value: record.appraisedValue,
          currency: record.currency,
          methodology: record.methodology,
          document_url: record.documentUrl,
          deviation_vs_ai_percentage: deviationVsAiPercentage,
          verification_status: record.verificationStatus,
          notes: record.notes,
          entered_by: record.enteredBy,
        });
      } catch (err) {
        console.warn('Persistencia en Supabase de professional_appraisals omitida:', err);
      }
    }

    return record;
  }

  /**
   * Obtiene todas las tasaciones profesionales de un expediente
   */
  public getForCase(caseId: string, organizationId: string): ProfessionalAppraisal[] {
    return Array.from(this.appraisals.values()).filter(
      (a) => a.caseId === caseId && a.organizationId === organizationId
    );
  }

  /**
   * Obtiene la última tasación profesional de un expediente
   */
  public getLatestForCase(caseId: string, organizationId: string): ProfessionalAppraisal | null {
    const list = this.getForCase(caseId, organizationId);
    if (list.length === 0) return null;
    return list.sort((a, b) => new Date(b.appraisalDate).getTime() - new Date(a.appraisalDate).getTime())[0];
  }
}
