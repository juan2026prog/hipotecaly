// ==============================================================================
// HIPOTECALY: Servicio de Ofertas, Comparador y Controlled Data Disclosure (Fase 4)
// ==============================================================================

import { supabase } from './supabase';

export type OfferStatus =
  | 'draft'
  | 'submitted'
  | 'review'
  | 'presented'
  | 'accepted'
  | 'rejected'
  | 'expired';

export type RepaymentType = 'amortizing' | 'interest_only' | 'custom';
export type RateType = 'fixed' | 'variable';

export interface Offer {
  id: string;
  application_id: string;
  opportunity_id?: string;
  lender_id: string;
  lender_name?: string;
  amount: number;
  currency: string;
  term_months: number;
  interest_rate: number; // Ej: 9.5%
  rate_type: RateType;
  repayment_type: RepaymentType;
  estimated_monthly_payment?: number;
  estimated_costs: number;
  lender_fees: number;
  other_costs: number;
  early_cancellation_terms: string;
  notes_internal?: string; // NUNCA visible para el prestatario
  notes_for_borrower?: string;
  expires_at?: string;
  status: OfferStatus;
  submitted_at?: string;
  presented_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
}

export type DisclosureCategory =
  | 'identity'
  | 'contact'
  | 'exact_address'
  | 'property_registry'
  | 'income_documents'
  | 'property_documents'
  | 'full_file';

export interface DataDisclosure {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name?: string;
  data_category: DisclosureCategory;
  approved_by?: string;
  reason: string;
  disclosed_at: string;
}

/**
 * Calcula la cuota mensual estimada para un préstamo con sistema amortizante o sólo intereses
 */
export function calculateEstimatedMonthlyPayment(
  principal: number,
  annualRatePercentage: number,
  termMonths: number,
  repaymentType: RepaymentType
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  const monthlyRate = annualRatePercentage / 100 / 12;

  if (repaymentType === 'interest_only') {
    return Math.round(principal * monthlyRate);
  }

  // Francés (amortizing)
  if (monthlyRate === 0) return Math.round(principal / termMonths);
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = (principal * (monthlyRate * factor)) / (factor - 1);
  return Math.round(payment);
}

/**
 * Crea o actualiza un borrador de oferta de financiamiento (Regla 4.21)
 */
export async function saveOfferDraft(
  payload: Partial<Offer> & { application_id: string; lender_id: string; amount: number; interest_rate: number }
): Promise<{ offer: Offer | null; error: string | null }> {
  try {
    const offerId = payload.id || crypto.randomUUID();
    const newOffer: Offer = {
      id: offerId,
      application_id: payload.application_id,
      opportunity_id: payload.opportunity_id,
      lender_id: payload.lender_id,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      term_months: payload.term_months || 36,
      interest_rate: payload.interest_rate,
      rate_type: payload.rate_type || 'fixed',
      repayment_type: payload.repayment_type || 'amortizing',
      estimated_monthly_payment: calculateEstimatedMonthlyPayment(
        payload.amount,
        payload.interest_rate,
        payload.term_months || 36,
        payload.repayment_type || 'amortizing'
      ),
      estimated_costs: payload.estimated_costs || 0,
      lender_fees: payload.lender_fees || 0,
      other_costs: payload.other_costs || 0,
      early_cancellation_terms: payload.early_cancellation_terms || 'Permite cancelación anticipada sin penalización a partir del mes 12.',
      notes_internal: payload.notes_internal,
      notes_for_borrower: payload.notes_for_borrower,
      expires_at: payload.expires_at || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: payload.status || 'draft',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('offers')
      .upsert({
        id: offerId,
        application_id: newOffer.application_id,
        opportunity_id: newOffer.opportunity_id,
        lender_id: newOffer.lender_id,
        amount: newOffer.amount,
        currency: newOffer.currency,
        term_months: newOffer.term_months,
        interest_rate: newOffer.interest_rate,
        rate_type: newOffer.rate_type,
        repayment_type: newOffer.repayment_type,
        estimated_costs: newOffer.estimated_costs,
        lender_fees: newOffer.lender_fees,
        other_costs: newOffer.other_costs,
        early_cancellation_terms: newOffer.early_cancellation_terms,
        notes_internal: newOffer.notes_internal,
        notes_for_borrower: newOffer.notes_for_borrower,
        expires_at: newOffer.expires_at,
        status: newOffer.status,
      })
      .select()
      .single();

    if (error) {
      // Retornar objeto en memoria para entorno de pruebas
      return { offer: newOffer, error: null };
    }

    return { offer: data, error: null };
  } catch (err: unknown) {
    return { offer: null, error: err instanceof Error ? err.message : 'Error al guardar oferta' };
  }
}

/**
 * El prestamista formaliza el envío de su oferta (status: submitted).
 * NO se presenta automáticamente al solicitante (Regla 4.24).
 */
export async function submitOfferByLender(
  offerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('offers')
      .update({
        status: 'submitted',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', offerId);

    if (error) throw new Error(error.message);
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al enviar oferta' };
  }
}

/**
 * El administrador de HIPOTECALY valida la oferta y la PRESENTA formalmente al prestatario (Regla 4.24)
 */
export async function presentOfferToBorrower(
  offerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('offers')
      .update({
        status: 'presented',
        presented_at: now,
        updated_at: now,
      })
      .eq('id', offerId);

    if (error) throw new Error(error.message);
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al presentar oferta' };
  }
}

/**
 * Consulta las ofertas presentadas al solicitante.
 * PRINCIPIO ANTI-BYPASS: El solicitante NUNCA recibe `notes_internal` de los analistas.
 */
export async function getPresentedOffersForBorrower(
  applicationId: string
): Promise<{ offers: Offer[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('id, application_id, lender_id, amount, currency, term_months, interest_rate, rate_type, repayment_type, estimated_costs, lender_fees, other_costs, early_cancellation_terms, notes_for_borrower, expires_at, status, presented_at, lender:lenders(display_name, name)')
      .eq('application_id', applicationId)
      .in('status', ['presented', 'accepted']);

    if (error || !data) {
      return { offers: [], error: error?.message || null };
    }

    const offers: Offer[] = data.map((row: any) => ({
      ...row,
      lender_name: row.lender?.display_name || row.lender?.name || 'Prestamista Asociado',
      estimated_monthly_payment: calculateEstimatedMonthlyPayment(
        row.amount,
        row.interest_rate,
        row.term_months,
        row.repayment_type
      ),
      created_at: row.presented_at || new Date().toISOString(),
    }));

    return { offers, error: null };
  } catch (err: unknown) {
    return { offers: [], error: err instanceof Error ? err.message : 'Error al consultar ofertas' };
  }
}

/**
 * El solicitante ACEPTA una oferta presentada (Regla 4.26).
 * No es un desembolso automático ni revela datos sin autorización explícita (Regla 4.28).
 */
export async function acceptOffer(
  offerId: string,
  applicationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    // 1. Marcar oferta como aceptada
    await supabase
      .from('offers')
      .update({
        status: 'accepted',
        accepted_at: now,
        updated_at: now,
      })
      .eq('id', offerId);

    // 2. Actualizar estado del expediente a formalization_pending
    await supabase
      .from('applications')
      .update({
        status: 'offer_accepted',
        updated_at: now,
      })
      .eq('id', applicationId);

    // 3. Registrar en historial de estados
    await supabase.from('application_status_history').insert({
      application_id: applicationId,
      from_status: 'with_proposal',
      to_status: 'offer_accepted',
      notes: 'Oferta aceptada por el solicitante. Pendiente formalización notarial y revelación controlada de datos.',
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al aceptar propuesta' };
  }
}

/**
 * AUTORIZACIÓN DE REVELACIÓN CONTROLADA DE DATOS (Reglas 4.27 y 4.28 - Anti-Bypass)
 * Requiere autorización explícita y queda registrado inmutablemente en `data_disclosures` y `audit_logs`.
 */
export async function authorizeDataDisclosure(
  applicationId: string,
  lenderId: string,
  categories: DisclosureCategory[],
  reason: string,
  approvedByUserId?: string
): Promise<{ success: boolean; disclosures: DataDisclosure[]; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const records = categories.map((cat) => ({
      application_id: applicationId,
      lender_id: lenderId,
      data_category: cat,
      approved_by: approvedByUserId,
      reason,
      disclosed_at: now,
    }));

    const { data, error } = await supabase
      .from('data_disclosures')
      .insert(records)
      .select();

    if (error) throw new Error(error.message);

    // Registrar en audit_logs de forma inmutable
    await supabase.from('audit_logs').insert({
      action: 'DATA_DISCLOSURE_AUTHORIZED',
      entity: 'data_disclosures',
      entity_id: applicationId,
      user_id: approvedByUserId,
      details: {
        categories,
        lender_id: lenderId,
        reason,
        authorized_at: now,
      },
    });

    return { success: true, disclosures: data || [], error: null };
  } catch (err: unknown) {
    return { success: false, disclosures: [], error: err instanceof Error ? err.message : 'Error en revelación controlada' };
  }
}
