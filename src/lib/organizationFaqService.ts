// ==============================================================================
// HIPOTECALY: Servicio de Gestión de Preguntas Frecuentes (FAQ) por Organización
// Soporta CRUD, ordenamiento (sort_order), activación/desactivación y RLS
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface OrganizationFaqItem {
  id: string;
  organizationId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_ESTUDIO_NOVA_FAQS: OrganizationFaqItem[] = [
  {
    id: 'nova-faq-1',
    organizationId: 'd0000000-0000-0000-0000-000000000001',
    sortOrder: 1,
    question: '¿Qué porcentaje del inmueble se puede financiar?',
    answer:
      'Como referencia inicial hasta el {maxFinancedPercentage}%, sujeto a la evaluación técnica del inmueble y capacidad de pago.',
    isActive: true,
  },
  {
    id: 'nova-faq-2',
    organizationId: 'd0000000-0000-0000-0000-000000000001',
    sortOrder: 2,
    question: '¿Qué propiedades pueden utilizarse como garantía?',
    answer:
      'Viviendas, locales comerciales y campos situados en el territorio nacional con títulos en condiciones de escrituración.',
    isActive: true,
  },
  {
    id: 'nova-faq-3',
    organizationId: 'd0000000-0000-0000-0000-000000000001',
    sortOrder: 3,
    question: '¿Puedo iniciar una solicitud si estoy en Clearing?',
    answer:
      'Sí. El Clearing no bloquea automáticamente el inicio de la evaluación; se analiza el contexto global de la operación y el activo de garantía.',
    isActive: true,
  },
  {
    id: 'nova-faq-4',
    organizationId: 'd0000000-0000-0000-0000-000000000001',
    sortOrder: 4,
    question: '¿Qué documentación de ingresos se solicita?',
    answer:
      'Recibo de sueldo o certificado de contador según corresponda a la actividad del solicitante (dependiente o independiente).',
    isActive: true,
  },
  {
    id: 'nova-faq-5',
    organizationId: 'd0000000-0000-0000-0000-000000000001',
    sortOrder: 5,
    question: '¿Cómo funciona el proceso para inversionistas?',
    answer:
      'Presentación de la operación estructurada, tasación de la garantía y antecedentes legales para su debido análisis previo.',
    isActive: true,
  },
];

// Caché reactiva
const faqCache = new Map<string, OrganizationFaqItem[]>();
const faqListeners = new Set<(orgId: string, faqs: OrganizationFaqItem[]) => void>();

export function subscribeToOrganizationFaqs(
  callback: (orgId: string, faqs: OrganizationFaqItem[]) => void
): () => void {
  faqListeners.add(callback);
  return () => {
    faqListeners.delete(callback);
  };
}

function notifyFaqListeners(orgId: string, faqs: OrganizationFaqItem[]) {
  faqListeners.forEach((cb) => {
    try {
      cb(orgId, faqs);
    } catch {
      // Ignorar errores
    }
  });
}

function mapDbToFaq(data: any): OrganizationFaqItem {
  return {
    id: data.id,
    organizationId: data.organization_id,
    question: data.question,
    answer: data.answer,
    sortOrder: Number(data.sort_order ?? 0),
    isActive: Boolean(data.is_active ?? true),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Obtiene las FAQs de una organización ordenadas por sort_order
 */
export async function getOrganizationFaqs(
  orgId: string,
  onlyActive: boolean = true
): Promise<OrganizationFaqItem[]> {
  if (!orgId) return DEFAULT_ESTUDIO_NOVA_FAQS;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('organization_faqs')
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order', { ascending: true });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbToFaq);
        faqCache.set(orgId, mapped);
        return mapped;
      }
    } catch {
      // Fallback
    }
  }

  if (faqCache.has(orgId)) {
    const cached = faqCache.get(orgId)!;
    return onlyActive ? cached.filter((f) => f.isActive) : cached;
  }

  return DEFAULT_ESTUDIO_NOVA_FAQS;
}

/**
 * Crea una nueva FAQ para la organización
 */
export async function createOrganizationFaq(
  orgId: string,
  faq: Omit<OrganizationFaqItem, 'id' | 'organizationId'>
): Promise<{ success: boolean; data?: OrganizationFaqItem; error?: string }> {
  const newFaq: OrganizationFaqItem = {
    id: crypto.randomUUID(),
    organizationId: orgId,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
    isActive: faq.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_faqs')
        .insert({
          id: newFaq.id,
          organization_id: orgId,
          question: newFaq.question,
          answer: newFaq.answer,
          sort_order: newFaq.sortOrder,
          is_active: newFaq.isActive,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      if (data) {
        const created = mapDbToFaq(data);
        const existing = faqCache.get(orgId) || [];
        const updated = [...existing, created].sort((a, b) => a.sortOrder - b.sortOrder);
        faqCache.set(orgId, updated);
        notifyFaqListeners(orgId, updated);
        return { success: true, data: created };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
    }
  }

  const existing = faqCache.get(orgId) || [...DEFAULT_ESTUDIO_NOVA_FAQS];
  const updated = [...existing, newFaq].sort((a, b) => a.sortOrder - b.sortOrder);
  faqCache.set(orgId, updated);
  notifyFaqListeners(orgId, updated);
  return { success: true, data: newFaq };
}

/**
 * Actualiza una FAQ existente
 */
export async function updateOrganizationFaq(
  orgId: string,
  faqId: string,
  updates: Partial<OrganizationFaqItem>
): Promise<{ success: boolean; data?: OrganizationFaqItem; error?: string }> {
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.question !== undefined) dbUpdates.question = updates.question;
  if (updates.answer !== undefined) dbUpdates.answer = updates.answer;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_faqs')
        .update(dbUpdates)
        .eq('id', faqId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      if (data) {
        const updatedItem = mapDbToFaq(data);
        const existing = faqCache.get(orgId) || [];
        const updated = existing.map((f) => (f.id === faqId ? updatedItem : f));
        faqCache.set(orgId, updated);
        notifyFaqListeners(orgId, updated);
        return { success: true, data: updatedItem };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
    }
  }

  const existing = faqCache.get(orgId) || [...DEFAULT_ESTUDIO_NOVA_FAQS];
  const updated = existing.map((f) => (f.id === faqId ? { ...f, ...updates } : f));
  faqCache.set(orgId, updated);
  notifyFaqListeners(orgId, updated);
  return { success: true };
}

/**
 * Elimina una FAQ
 */
export async function deleteOrganizationFaq(
  orgId: string,
  faqId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('organization_faqs')
        .delete()
        .eq('id', faqId)
        .eq('organization_id', orgId);

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
    }
  }

  const existing = faqCache.get(orgId) || [];
  const updated = existing.filter((f) => f.id !== faqId);
  faqCache.set(orgId, updated);
  notifyFaqListeners(orgId, updated);
  return { success: true };
}

/**
 * Reordena las FAQs ajustando los sort_order
 */
export async function reorderOrganizationFaqs(
  orgId: string,
  orderedFaqIds: string[]
): Promise<{ success: boolean }> {
  const existing = faqCache.get(orgId) || [];
  const updated = [...existing];

  for (let i = 0; i < orderedFaqIds.length; i++) {
    const id = orderedFaqIds[i];
    const item = updated.find((f) => f.id === id);
    if (item) {
      item.sortOrder = i + 1;
      if (isSupabaseConfigured) {
        await supabase
          .from('organization_faqs')
          .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', orgId);
      }
    }
  }

  updated.sort((a, b) => a.sortOrder - b.sortOrder);
  faqCache.set(orgId, updated);
  notifyFaqListeners(orgId, updated);
  return { success: true };
}

/**
 * Interpola variables dinámicas como {maxFinancedPercentage} en las respuestas de las FAQs
 */
export function interpolateFaqAnswer(
  answer: string,
  variables: { maxFinancedPercentage?: number; minLoanAmount?: number; maxLoanAmount?: number; defaultRate?: number }
): string {
  let result = answer;
  if (variables.maxFinancedPercentage !== undefined) {
    result = result.replace(/\{maxFinancedPercentage\}/g, String(variables.maxFinancedPercentage));
  }
  if (variables.minLoanAmount !== undefined) {
    result = result.replace(/\{minLoanAmount\}/g, variables.minLoanAmount.toLocaleString());
  }
  if (variables.maxLoanAmount !== undefined) {
    result = result.replace(/\{maxLoanAmount\}/g, variables.maxLoanAmount.toLocaleString());
  }
  if (variables.defaultRate !== undefined) {
    result = result.replace(/\{defaultRate\}/g, String(variables.defaultRate));
  }
  return result;
}
