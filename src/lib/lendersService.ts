import { supabase } from './supabase';
import { PropertyType } from './types';

export type LenderStatus = 'draft' | 'active' | 'paused' | 'inactive' | 'blocked';
export type PaymentModalityOption = 'solo_intereses' | 'capital_e_intereses';

export interface LenderRules {
  id?: string;
  lender_id?: string;
  max_ltv: number;
  min_loan: number;
  max_loan: number;
  min_rate?: number;
  min_term_months: number;
  max_term_months: number;
  accepts_clearing: boolean;
  accepted_property_types: PropertyType[] | string[];
  accepted_departments: string[];
  accepted_modalities?: string[];
  accepted_currencies: string[];
  requires_income_proof?: boolean;
  is_active?: boolean;
  updated_at?: string;
}

export interface Lender {
  id: string;
  organization_id: string;
  name: string;
  display_name: string;
  legal_name?: string;
  lender_type: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: LenderStatus;
  notes?: string;
  available_capital?: number;
  currency: string;
  is_active: boolean;
  source?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  rules?: LenderRules;
  _source?: 'database' | 'demo';
}

export interface InvestorLead {
  id: string;
  organization_id: string;
  full_name: string;
  investor_type: string;
  contact_name?: string;
  email: string;
  phone?: string;
  available_capital?: number;
  currency: string;
  preferred_min_amount?: number;
  preferred_max_amount?: number;
  max_ltv?: number;
  notes?: string;
  status: 'new' | 'contacted' | 'approved' | 'discarded' | 'converted';
  converted_lender_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestorInterest {
  id: string;
  organization_id: string;
  opportunity_id: string;
  lender_id: string;
  indicated_amount?: number;
  currency: string;
  message?: string;
  non_binding: boolean;
  status: 'interested' | 'contact_requested' | 'connected' | 'withdrawn' | 'discarded' | 'completed';
  connected_at?: string;
  connected_by?: string;
  outcome_status?: 'in_negotiation' | 'discarded' | 'completed';
  outcome_amount?: number;
  outcome_date?: string;
  outcome_notes?: string;
  created_at: string;
  updated_at: string;
  lender?: {
    id: string;
    display_name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    lender_type?: string;
  };
  opportunity?: {
    id: string;
    application_id?: string;
    application?: {
      public_id?: string;
      requested_amount?: number;
      currency?: string;
    };
  };
}

// -----------------------------------------------------------------------------
// 1. OBTENER LISTADO DE INVERSORES DE LA ORGANIZACIÓN
// -----------------------------------------------------------------------------
export async function getLendersList(options?: {
  organizationId?: string;
}): Promise<{ lenders: Lender[]; error: string | null }> {
  try {
    let query = supabase.from('lenders').select('*, lender_rules(*)').order('created_at', { ascending: false });
    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      return { lenders: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { lenders: [], error: null };
    }

    const lenders: Lender[] = data.map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name || row.display_name || 'Inversor',
      display_name: row.display_name || row.name || 'Inversor',
      legal_name: row.legal_name,
      lender_type: row.lender_type || row.investor_type || 'Persona',
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      status: row.status || (row.is_active ? 'active' : 'paused'),
      notes: row.notes,
      available_capital: row.available_capital,
      currency: row.currency || 'USD',
      is_active: Boolean(row.is_active),
      source: row.source || 'manual',
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      _source: 'database',
      rules: row.lender_rules?.[0]
        ? {
            id: row.lender_rules[0].id,
            lender_id: row.lender_rules[0].lender_id,
            max_ltv: Number(row.lender_rules[0].max_ltv) || 0.40,
            min_loan: Number(row.lender_rules[0].min_loan) || 10000,
            max_loan: Number(row.lender_rules[0].max_loan) || 200000,
            min_rate: Number(row.lender_rules[0].min_rate) || 11.0,
            min_term_months: Number(row.lender_rules[0].min_term_months) || 12,
            max_term_months: Number(row.lender_rules[0].max_term_months) || 60,
            accepts_clearing: Boolean(row.lender_rules[0].accepts_clearing),
            accepted_property_types: row.lender_rules[0].accepted_property_types || ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
            accepted_departments: row.lender_rules[0].accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
            accepted_modalities: row.lender_rules[0].accepted_modalities || ['solo_intereses', 'capital_e_intereses'],
            accepted_currencies: row.lender_rules[0].accepted_currencies || ['USD'],
            requires_income_proof: Boolean(row.lender_rules[0].requires_income_proof),
            is_active: Boolean(row.lender_rules[0].is_active),
          }
        : undefined,
    }));

    return { lenders, error: null };
  } catch (err: unknown) {
    return { lenders: [], error: err instanceof Error ? err.message : 'Error al consultar inversores' };
  }
}

// -----------------------------------------------------------------------------
// 2. OBTENER UN INVERSOR POR ID
// -----------------------------------------------------------------------------
export async function getLenderById(
  id: string,
  options?: { organizationId?: string }
): Promise<{ lender: Lender | null; error: string | null }> {
  try {
    let query = supabase.from('lenders').select('*, lender_rules(*)').eq('id', id);
    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return { lender: null, error: error ? error.message : null };
    }

    const lender: Lender = {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name || data.display_name || 'Inversor',
      display_name: data.display_name || data.name || 'Inversor',
      legal_name: data.legal_name,
      lender_type: data.lender_type || data.investor_type || 'Persona',
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      status: data.status || (data.is_active ? 'active' : 'paused'),
      notes: data.notes,
      available_capital: data.available_capital,
      currency: data.currency || 'USD',
      is_active: Boolean(data.is_active),
      source: data.source || 'manual',
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      _source: 'database',
      rules: data.lender_rules?.[0]
        ? {
            id: data.lender_rules[0].id,
            lender_id: data.lender_rules[0].lender_id,
            max_ltv: Number(data.lender_rules[0].max_ltv) || 0.40,
            min_loan: Number(data.lender_rules[0].min_loan) || 10000,
            max_loan: Number(data.lender_rules[0].max_loan) || 200000,
            min_rate: Number(data.lender_rules[0].min_rate) || 11.0,
            min_term_months: Number(data.lender_rules[0].min_term_months) || 12,
            max_term_months: Number(data.lender_rules[0].max_term_months) || 60,
            accepts_clearing: Boolean(data.lender_rules[0].accepts_clearing),
            accepted_property_types: data.lender_rules[0].accepted_property_types || ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
            accepted_departments: data.lender_rules[0].accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
            accepted_modalities: data.lender_rules[0].accepted_modalities || ['solo_intereses', 'capital_e_intereses'],
            accepted_currencies: data.lender_rules[0].accepted_currencies || ['USD'],
            requires_income_proof: Boolean(data.lender_rules[0].requires_income_proof),
            is_active: Boolean(data.lender_rules[0].is_active),
          }
        : undefined,
    };

    return { lender, error: null };
  } catch (err: unknown) {
    return { lender: null, error: err instanceof Error ? err.message : 'Error al consultar inversor' };
  }
}

// -----------------------------------------------------------------------------
// 3. CREAR INVERSOR (ALTA MANUAL) + SUS REGLAS CANÓNICAS
// -----------------------------------------------------------------------------
export async function createLenderWithRules(params: {
  organizationId: string;
  name: string;
  displayName?: string;
  legalName?: string;
  lenderType: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  availableCapital?: number;
  currency?: string;
  status?: LenderStatus;
  notes?: string;
  source?: string;
  rules?: Partial<LenderRules>;
}): Promise<{ lender: Lender | null; error: string | null }> {
  try {
    const orgId = params.organizationId;
    if (!orgId) throw new Error('organization_id es requerido y no puede ser nulo.');

    const { data: lenderData, error: lenderError } = await supabase
      .from('lenders')
      .insert({
        organization_id: orgId,
        name: params.name,
        display_name: params.displayName || params.name,
        legal_name: params.legalName,
        lender_type: params.lenderType,
        investor_type: params.lenderType,
        contact_name: params.contactName,
        contact_email: params.contactEmail,
        contact_phone: params.contactPhone,
        available_capital: params.availableCapital,
        currency: params.currency || 'USD',
        status: params.status || 'active',
        is_active: params.status !== 'paused' && params.status !== 'inactive',
        notes: params.notes,
        source: params.source || 'manual',
      })
      .select()
      .single();

    if (lenderError || !lenderData) {
      throw new Error(lenderError?.message || 'Error al crear el registro del inversor.');
    }

    const lenderId = lenderData.id;

    // Crear reglas asociadas
    const rulesToInsert = {
      lender_id: lenderId,
      max_ltv: params.rules?.max_ltv !== undefined ? params.rules.max_ltv : 0.40,
      min_loan: params.rules?.min_loan !== undefined ? params.rules.min_loan : 10000,
      max_loan: params.rules?.max_loan !== undefined ? params.rules.max_loan : 200000,
      min_rate: params.rules?.min_rate !== undefined ? params.rules.min_rate : 11.0,
      min_term_months: params.rules?.min_term_months !== undefined ? params.rules.min_term_months : 12,
      max_term_months: params.rules?.max_term_months !== undefined ? params.rules.max_term_months : 60,
      accepts_clearing: params.rules?.accepts_clearing !== undefined ? params.rules.accepts_clearing : true,
      accepted_property_types: params.rules?.accepted_property_types || ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
      accepted_departments: params.rules?.accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
      accepted_modalities: params.rules?.accepted_modalities || ['solo_intereses', 'capital_e_intereses'],
      accepted_currencies: params.rules?.accepted_currencies || ['USD'],
      is_active: true,
    };

    const { data: rulesData, error: rulesError } = await supabase
      .from('lender_rules')
      .insert(rulesToInsert)
      .select()
      .single();

    if (rulesError) {
      console.warn('Advertencia al insertar lender_rules:', rulesError.message);
    }

    // Registrar en auditoría
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      action: 'INVESTOR_CREATED',
      entity: 'lenders',
      entity_id: lenderId,
      details: {
        name: params.name,
        source: params.source || 'manual',
        available_capital: params.availableCapital,
      },
    });

    return {
      lender: {
        ...lenderData,
        rules: rulesData || rulesToInsert,
      },
      error: null,
    };
  } catch (err: unknown) {
    return { lender: null, error: err instanceof Error ? err.message : 'Error al crear inversor' };
  }
}

// -----------------------------------------------------------------------------
// 4. GUARDAR O ACTUALIZAR CRITERIOS DE INVERSIÓN (lender_rules)
// -----------------------------------------------------------------------------
export async function saveLenderRules(
  lenderId: string,
  rules: Partial<LenderRules>,
  userId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    
    // Verificar si ya existe regla
    const { data: existingRule } = await supabase
      .from('lender_rules')
      .select('id')
      .eq('lender_id', lenderId)
      .maybeSingle();

    let error: any = null;
    if (existingRule) {
      const res = await supabase
        .from('lender_rules')
        .update({
          ...rules,
          updated_at: now,
        })
        .eq('id', existingRule.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('lender_rules')
        .insert({
          lender_id: lenderId,
          ...rules,
          updated_at: now,
        });
      error = res.error;
    }

    if (error) throw new Error(error.message);

    // Registro inmutable en audit_logs
    await supabase.from('audit_logs').insert({
      action: 'INVESTOR_UPDATED',
      entity: 'lender_rules',
      entity_id: lenderId,
      user_id: userId,
      details: {
        updated_rules: rules,
        updated_at: now,
      },
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al guardar reglas' };
  }
}

// -----------------------------------------------------------------------------
// 5. ACTUALIZAR DATOS GENERALES DEL INVERSOR
// -----------------------------------------------------------------------------
export async function updateLenderData(
  lenderId: string,
  data: Partial<Lender>,
  userId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: any = {
      updated_at: now,
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.display_name !== undefined) updatePayload.display_name = data.display_name;
    if (data.legal_name !== undefined) updatePayload.legal_name = data.legal_name;
    if (data.lender_type !== undefined) updatePayload.lender_type = data.lender_type;
    if (data.contact_name !== undefined) updatePayload.contact_name = data.contact_name;
    if (data.contact_email !== undefined) updatePayload.contact_email = data.contact_email;
    if (data.contact_phone !== undefined) updatePayload.contact_phone = data.contact_phone;
    if (data.available_capital !== undefined) updatePayload.available_capital = data.available_capital;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      updatePayload.is_active = data.status === 'active';
    }
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const { error } = await supabase.from('lenders').update(updatePayload).eq('id', lenderId);

    if (error) throw new Error(error.message);

    await supabase.from('audit_logs').insert({
      action: 'INVESTOR_UPDATED',
      entity: 'lenders',
      entity_id: lenderId,
      user_id: userId,
      details: {
        updated_data: updatePayload,
      },
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar inversor' };
  }
}

export async function submitWhiteLabelInvestorLead(params: {
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  investorType: string;
  indicativeCapital?: number;
  currency?: string;
  preferredDepartments?: string[];
  preferredPropertyTypes?: string[];
  preferredModality?: string;
  notes?: string;
}): Promise<{ leadId: string | null; error: string | null }> {
  try {
    const notesArr = [
      params.notes,
      params.preferredDepartments?.length ? `Departamentos: ${params.preferredDepartments.join(', ')}` : null,
      params.preferredPropertyTypes?.length ? `Garantías: ${params.preferredPropertyTypes.join(', ')}` : null,
      params.preferredModality ? `Modalidad: ${params.preferredModality}` : null,
    ].filter(Boolean);

    const payload = {
      organization_id: params.organizationId,
      full_name: params.name,
      contact_name: params.name,
      email: params.email,
      phone: params.phone,
      investor_type: params.investorType,
      available_capital: params.indicativeCapital,
      currency: params.currency || 'USD',
      notes: notesArr.join(' | ') || null,
      status: 'new',
    };

    const { data, error } = await supabase.from('investor_leads').insert(payload).select('id').single();
    if (error) throw new Error(error.message);
    return { leadId: data?.id || null, error: null };
  } catch (err: unknown) {
    return { leadId: null, error: err instanceof Error ? err.message : 'Error al enviar solicitud de inversor' };
  }
}

export async function getInvestorLeads(options: {
  organizationId: string;
}): Promise<{ leads: InvestorLead[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('investor_leads')
      .select('*')
      .eq('organization_id', options.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { leads: [], error: error.message };
    }

    return { leads: data || [], error: null };
  } catch (err: unknown) {
    return { leads: [], error: err instanceof Error ? err.message : 'Error al consultar leads' };
  }
}

export async function updateInvestorLeadStatus(
  leadId: string,
  status: InvestorLead['status'],
  userId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('investor_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw new Error(error.message);

    await supabase.from('audit_logs').insert({
      action: 'INVESTOR_LEAD_APPROVED',
      entity: 'investor_leads',
      entity_id: leadId,
      user_id: userId,
      details: { status },
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar lead' };
  }
}

export async function convertLeadToInvestor(
  lead: InvestorLead,
  userId?: string
): Promise<{ lender: Lender | null; error: string | null }> {
  try {
    const res = await createLenderWithRules({
      organizationId: lead.organization_id,
      name: lead.full_name,
      displayName: lead.full_name,
      lenderType: lead.investor_type || 'Persona',
      contactName: lead.contact_name || lead.full_name,
      contactEmail: lead.email,
      contactPhone: lead.phone,
      availableCapital: lead.available_capital,
      currency: lead.currency || 'USD',
      notes: lead.notes ? `Lead convertido desde White Label. Notas: ${lead.notes}` : 'Origen: White Label',
      source: 'white_label',
      rules: {
        min_loan: lead.preferred_min_amount || 10000,
        max_loan: lead.preferred_max_amount || 200000,
        max_ltv: lead.max_ltv || 0.40,
      },
    });

    if (res.error || !res.lender) {
      throw new Error(res.error || 'Error al convertir lead a inversor.');
    }

    // Marcar lead como convertido
    await supabase
      .from('investor_leads')
      .update({
        status: 'converted',
        converted_lender_id: res.lender.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    await supabase.from('audit_logs').insert({
      organization_id: lead.organization_id,
      action: 'INVESTOR_LEAD_CONVERTED',
      entity: 'investor_leads',
      entity_id: lead.id,
      user_id: userId,
      details: {
        converted_lender_id: res.lender.id,
        lead_id: lead.id,
      },
    });

    return { lender: res.lender, error: null };
  } catch (err: unknown) {
    return { lender: null, error: err instanceof Error ? err.message : 'Error al convertir lead' };
  }
}

// -----------------------------------------------------------------------------
// 7. MANIFESTACIONES DE INTERÉS (investor_interests)
// -----------------------------------------------------------------------------
export async function getInvestorInterests(options: {
  organizationId?: string;
  lenderId?: string;
}): Promise<{ interests: InvestorInterest[]; error: string | null }> {
  try {
    let query = supabase.from('investor_interests').select(`
      *,
      lender:lenders(id, display_name, contact_name, contact_email, contact_phone, lender_type),
      opportunity:opportunities(id, application:applications(public_id, requested_amount, currency))
    `).order('created_at', { ascending: false });

    if (options.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }
    if (options.lenderId) {
      query = query.eq('lender_id', options.lenderId);
    }

    const { data, error } = await query;

    if (error) {
      return { interests: [], error: error.message };
    }

    return { interests: data || [], error: null };
  } catch (err: unknown) {
    return { interests: [], error: err instanceof Error ? err.message : 'Error al consultar intereses' };
  }
}

export async function submitInvestorInterest(params: {
  organizationId: string;
  opportunityId: string;
  lenderId: string;
  indicatedAmount?: number;
  currency?: string;
  message?: string;
}): Promise<{ interest: InvestorInterest | null; error: string | null }> {
  try {
    const payload = {
      organization_id: params.organizationId,
      opportunity_id: params.opportunityId,
      lender_id: params.lenderId,
      indicated_amount: params.indicatedAmount,
      currency: params.currency || 'USD',
      message: params.message,
      non_binding: true,
      status: 'interested',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('investor_interests')
      .upsert(payload, { onConflict: 'opportunity_id,lender_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from('audit_logs').insert({
      organization_id: params.organizationId,
      action: 'INVESTOR_INTEREST_CREATED',
      entity: 'investor_interests',
      entity_id: data.id,
      details: {
        opportunity_id: params.opportunityId,
        lender_id: params.lenderId,
        indicated_amount: params.indicatedAmount,
        non_binding: true,
      },
    });

    return { interest: data, error: null };
  } catch (err: unknown) {
    return { interest: null, error: err instanceof Error ? err.message : 'Error al registrar interés' };
  }
}

export async function connectInvestorParties(
  interestId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('investor_interests')
      .update({
        status: 'connected',
        connected_at: now,
        connected_by: userId,
        updated_at: now,
      })
      .eq('id', interestId)
      .select('organization_id, opportunity_id, lender_id')
      .single();

    if (error || !updated) throw new Error(error?.message || 'No se pudo conectar las partes');

    await supabase.from('audit_logs').insert({
      organization_id: updated.organization_id,
      action: 'PARTIES_CONNECTED',
      entity: 'investor_interests',
      entity_id: interestId,
      user_id: userId,
      details: {
        opportunity_id: updated.opportunity_id,
        lender_id: updated.lender_id,
        connected_at: now,
        disclaimer: 'Hipotecaly registra la conexión pero no interviene en la formalización ni administración de fondos.',
      },
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al conectar partes' };
  }
}

export async function updateInvestorInterestOutcome(
  interestId: string,
  outcome: {
    outcome_status: 'in_negotiation' | 'discarded' | 'completed';
    outcome_amount?: number;
    outcome_date?: string;
    outcome_notes?: string;
  },
  userId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('investor_interests')
      .update({
        ...outcome,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interestId);

    if (error) throw new Error(error.message);

    await supabase.from('audit_logs').insert({
      action: 'INVESTOR_OUTCOME_UPDATED',
      entity: 'investor_interests',
      entity_id: interestId,
      user_id: userId,
      details: outcome,
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al actualizar resultado' };
  }
}

// -----------------------------------------------------------------------------
// 8. MOTOR CANÓNICO DE MATCHING DE CRITERIOS DE INVERSIÓN (7 CRITERIOS)
// -----------------------------------------------------------------------------
export interface InvestorMatchingCriteria {
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minTermMonths?: number;
  maxTermMonths?: number;
  maxFinancingRatio?: number; // LTV % (ej. 40 o 50)
  minRate?: number;
  acceptedPropertyTypes?: string[];
  acceptedDepartments?: string[];
  acceptedModalities?: string[];
}

export interface MatchOpportunityData {
  requested_amount: number;
  financing_ratio: number; // LTV %
  term_months: number;
  suggested_rate?: number;
  property_type: string;
  department: string;
  zone?: string;
  modality?: string;
}

export interface MatchEvaluationResult {
  total: number;
  passedCount: number;
  isPerfect: boolean;
  score: number; // Porcentaje 0 a 100
  checks: Array<{
    label: string;
    passed: boolean;
    reason: string;
  }>;
}

export function evaluateInvestorOpportunityMatch(
  criteria: InvestorMatchingCriteria,
  opp: MatchOpportunityData
): MatchEvaluationResult {
  const minLoan = criteria.minLoanAmount !== undefined ? criteria.minLoanAmount : 0;
  const maxLoan = criteria.maxLoanAmount !== undefined ? criteria.maxLoanAmount : Infinity;
  const checkAmount = opp.requested_amount >= minLoan && opp.requested_amount <= maxLoan;

  const minTerm = criteria.minTermMonths !== undefined ? criteria.minTermMonths : 0;
  const maxTerm = criteria.maxTermMonths !== undefined ? criteria.maxTermMonths : Infinity;
  const checkTerm = opp.term_months >= minTerm && opp.term_months <= maxTerm;

  const maxLtv = criteria.maxFinancingRatio !== undefined ? criteria.maxFinancingRatio : 100;
  const checkLtv = opp.financing_ratio <= maxLtv;

  const minRate = criteria.minRate !== undefined ? criteria.minRate : 0;
  const checkRate = (opp.suggested_rate ?? 11.5) >= minRate;

  const acceptedTypes = criteria.acceptedPropertyTypes && criteria.acceptedPropertyTypes.length > 0
    ? criteria.acceptedPropertyTypes
    : ['Apartamento', 'Casa', 'Local Comercial', 'Campo', 'Oficina', 'Terreno'];
  const checkType = acceptedTypes.some((t) =>
    opp.property_type.toLowerCase().includes(t.toLowerCase()) ||
    t.toLowerCase().includes(opp.property_type.toLowerCase())
  );

  const acceptedDepts = criteria.acceptedDepartments && criteria.acceptedDepartments.length > 0
    ? criteria.acceptedDepartments
    : ['Montevideo', 'Canelones', 'Maldonado', 'Colonia'];
  const oppZone = (opp.zone || '').toLowerCase();
  const oppDept = (opp.department || '').toLowerCase();
  const checkDept = acceptedDepts.some((d) => {
    const dLower = d.toLowerCase();
    return oppDept.includes(dLower) || oppZone.includes(dLower);
  });

  const acceptedMods = criteria.acceptedModalities && criteria.acceptedModalities.length > 0
    ? criteria.acceptedModalities
    : ['solo_intereses', 'capital_e_intereses'];
  const oppMod = opp.modality || 'solo_intereses';
  const checkModality = acceptedMods.includes(oppMod);

  const checks = [
    {
      label: 'Monto solicitado',
      passed: checkAmount,
      reason: checkAmount
        ? `USD ${opp.requested_amount.toLocaleString('es-UY')} dentro de rango (USD ${minLoan.toLocaleString('es-UY')} - ${maxLoan === Infinity ? 'Sin límite' : maxLoan.toLocaleString('es-UY')})`
        : `Monto USD ${opp.requested_amount.toLocaleString('es-UY')} fuera del rango configurado`,
    },
    {
      label: 'Plazo solicitado',
      passed: checkTerm,
      reason: checkTerm
        ? `${opp.term_months} meses dentro del rango (${minTerm} - ${maxTerm === Infinity ? 'Sin límite' : maxTerm} meses)`
        : `Plazo de ${opp.term_months} meses fuera del rango configurado`,
    },
    {
      label: 'Financiación máxima (LTV)',
      passed: checkLtv,
      reason: checkLtv
        ? `${opp.financing_ratio}% ≤ ${maxLtv}% máx`
        : `Financiación de ${opp.financing_ratio}% supera el máximo de ${maxLtv}%`,
    },
    {
      label: 'Tasa objetivo',
      passed: checkRate,
      reason: checkRate
        ? `${opp.suggested_rate ?? 11.5}% ≥ ${minRate}% mín`
        : `Tasa propuesta inferior al mínimo de ${minRate}%`,
    },
    {
      label: 'Tipo de inmueble / garantía',
      passed: checkType,
      reason: checkType
        ? `${opp.property_type} aceptado`
        : `Tipo ${opp.property_type} no incluido en preferencias`,
    },
    {
      label: 'Zona geográfica',
      passed: checkDept,
      reason: checkDept
        ? `${opp.department || 'Zona'} aceptada`
        : `Ubicación fuera de departamentos de interés`,
    },
    {
      label: 'Modalidad de amortización',
      passed: checkModality,
      reason: checkModality
        ? 'Modalidad compatible'
        : 'Modalidad de pago no aceptada',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    total: checks.length,
    passedCount,
    isPerfect: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
  };
}
