// ==============================================================================
// HIPOTECALY: Servicio de Captación y Gestión de Leads Comerciales B2B
// ==============================================================================

import { supabase } from './supabase';

export interface SaaSLead {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  company_name: string;
  job_title?: string;
  organization_type?: string;
  message?: string;
  source?: string;
  page?: string;
  tenant_id?: string;
  referrer?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'demo' | 'proposal' | 'won' | 'lost';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const leadsService = {
  /**
   * Persiste un lead comercial B2B en Supabase e inserta una notificación interna
   * Garantiza que si la notificación falla, el lead ya queda registrado (Fail-Safe)
   */
  async createLead(data: SaaSLead): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        company_name: data.company_name.trim(),
        job_title: data.job_title?.trim() || null,
        organization_type: data.organization_type || 'financiera',
        message: data.message?.trim() || null,
        source: data.source || 'saas_contact_form',
        page: data.page || (typeof window !== 'undefined' ? window.location.pathname : '/contacto'),
        tenant_id: data.tenant_id || null,
        referrer: data.referrer || (typeof document !== 'undefined' ? document.referrer : null),
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Persistencia primaria del Lead en la base de datos
      const { data: inserted, error } = await supabase
        .from('saas_leads')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('Error al persistir lead SaaS en Supabase:', error);
        return { success: false, error: error.message };
      }

      const leadId = inserted?.id;

      // 2. Notificación interna (asíncrona y no bloqueante)
      try {
        await supabase.from('notifications').insert({
          user_id: 'a1111111-1111-1111-1111-111111111111', // Notificar a administración matriz
          organization_id: data.tenant_id || 'a0000000-0000-0000-0000-000000000001',
          type: 'saas_lead_received',
          title: `Nuevo Lead SaaS: ${data.company_name}`,
          message: `${data.full_name} (${data.email}) solicitó información/demo para ${data.company_name}.`,
          link: '/app/leads',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch (notifErr) {
        // El fallo de la notificación no debe perjudicar la confirmación al cliente
        console.warn('Advertencia: No se pudo despachar la notificación del lead:', notifErr);
      }

      return { success: true, leadId };
    } catch (err: any) {
      console.error('Excepción al registrar lead:', err);
      return { success: false, error: err.message || 'Error inesperado al enviar consulta' };
    }
  },

  /**
   * Obtiene la lista de prospectos comerciales para el Backoffice
   */
  async getLeads(): Promise<SaaSLead[]> {
    try {
      const { data, error } = await supabase
        .from('saas_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as SaaSLead[]) || [];
    } catch (err) {
      console.error('Error al consultar leads:', err);
      return [];
    }
  },

  /**
   * Actualiza el estado comercial de un lead
   */
  async updateLeadStatus(leadId: string, status: SaaSLead['status'], notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saas_leads')
        .update({
          status,
          notes: notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      return !error;
    } catch {
      return false;
    }
  },
};
