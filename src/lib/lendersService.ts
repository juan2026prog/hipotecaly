// ==============================================================================
// HIPOTECALY: Servicio de Catálogo de Prestamistas y Reglas (Fase 4)
// ==============================================================================

import { supabase } from './supabase';
import { PropertyType } from './types';

export type LenderStatus = 'draft' | 'active' | 'paused' | 'inactive' | 'blocked';

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
  created_at: string;
  updated_at: string;
  rules?: LenderRules;
}

export interface LenderRules {
  id: string;
  lender_id: string;
  max_ltv: number;
  min_loan: number;
  max_loan: number;
  min_term_months: number;
  max_term_months: number;
  accepts_clearing: boolean;
  accepted_property_types: PropertyType[];
  accepted_departments: string[];
  accepted_currencies: string[];
  requires_income_proof: boolean;
  is_active: boolean;
}

export async function getLendersList(): Promise<{ lenders: Lender[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('lenders')
      .select('*, lender_rules(*)');

    if (error || !data || data.length === 0) {
      return getFallbackLenders();
    }

    const lenders: Lender[] = data.map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name || row.display_name,
      display_name: row.display_name || row.name,
      legal_name: row.legal_name,
      lender_type: row.lender_type || 'Inversor privado',
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      status: row.status || 'active',
      notes: row.notes,
      available_capital: row.available_capital,
      currency: row.currency || 'USD',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      rules: row.lender_rules?.[0]
        ? {
            id: row.lender_rules[0].id,
            lender_id: row.lender_rules[0].lender_id,
            max_ltv: row.lender_rules[0].max_ltv,
            min_loan: row.lender_rules[0].min_loan,
            max_loan: row.lender_rules[0].max_loan,
            min_term_months: row.lender_rules[0].min_term_months,
            max_term_months: row.lender_rules[0].max_term_months,
            accepts_clearing: row.lender_rules[0].accepts_clearing,
            accepted_property_types: row.lender_rules[0].accepted_property_types,
            accepted_departments: row.lender_rules[0].accepted_departments,
            accepted_currencies: row.lender_rules[0].accepted_currencies || ['USD'],
            requires_income_proof: row.lender_rules[0].requires_income_proof,
            is_active: row.lender_rules[0].is_active,
          }
        : undefined,
    }));

    return { lenders, error: null };
  } catch (err: unknown) {
    return getFallbackLenders();
  }
}

export async function getLenderById(id: string): Promise<{ lender: Lender | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('lenders')
      .select('*, lender_rules(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      const all = await getFallbackLenders();
      const found = all.lenders.find((l) => l.id === id) || null;
      return { lender: found, error: null };
    }

    const lender: Lender = {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name || data.display_name,
      display_name: data.display_name || data.name,
      legal_name: data.legal_name,
      lender_type: data.lender_type,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      status: data.status || 'active',
      notes: data.notes,
      available_capital: data.available_capital,
      currency: data.currency || 'USD',
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      rules: data.lender_rules?.[0],
    };

    return { lender, error: null };
  } catch (err: unknown) {
    return { lender: null, error: err instanceof Error ? err.message : 'Error al consultar prestamista' };
  }
}

export async function saveLenderRules(
  lenderId: string,
  rules: Partial<LenderRules>,
  userId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('lender_rules')
      .upsert({
        lender_id: lenderId,
        ...rules,
        updated_at: now,
      });

    if (error) throw new Error(error.message);

    // Registro inmutable en audit_logs
    await supabase.from('audit_logs').insert({
      action: 'LENDER_RULES_UPDATED',
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

function getFallbackLenders(): { lenders: Lender[]; error: string | null } {
  const mock: Lender[] = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Prestamista Piloto Hipotecaly',
      display_name: 'Hipotecaly Capital',
      legal_name: 'Hipotecaly Capital S.A.',
      lender_type: 'private_investor_network',
      contact_name: 'Ignacio Notario',
      contact_email: 'creditos@hipotecaly.uy',
      contact_phone: '+598 99 123 456',
      status: 'active',
      available_capital: 1500000,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rules: {
        id: 'r1',
        lender_id: 'c0000000-0000-0000-0000-000000000001',
        max_ltv: 0.40,
        min_loan: 10000,
        max_loan: 200000,
        min_term_months: 12,
        max_term_months: 60,
        accepts_clearing: true,
        accepted_property_types: ['casa', 'apartamento', 'terreno', 'local_comercial', 'campo'],
        accepted_departments: ['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José', 'Rocha'],
        accepted_currencies: ['USD'],
        requires_income_proof: true,
        is_active: true,
      },
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Fondo Inversor del Este',
      display_name: 'Fondo Punta del Este Capital',
      legal_name: 'Inversiones Este S.A.S.',
      lender_type: 'family_office',
      contact_name: 'Federico Balestra',
      contact_email: 'fbalestra@inversionesdeleste.com',
      contact_phone: '+598 98 654 321',
      status: 'active',
      available_capital: 800000,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rules: {
        id: 'r2',
        lender_id: 'c0000000-0000-0000-0000-000000000002',
        max_ltv: 0.30,
        min_loan: 30000,
        max_loan: 150000,
        min_term_months: 12,
        max_term_months: 36,
        accepts_clearing: false,
        accepted_property_types: ['casa', 'apartamento'],
        accepted_departments: ['Maldonado', 'Rocha', 'Montevideo'],
        accepted_currencies: ['USD'],
        requires_income_proof: true,
        is_active: true,
      },
    },
  ];

  return { lenders: mock, error: null };
}
