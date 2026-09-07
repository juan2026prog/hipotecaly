// ==============================================================================
// HIPOTECALY DOCFLOW: Servicio Central de Documentos (DocumentService)
// Capa unificada para plantillas, autollenado, snapshots, hashes y versionado inmutable.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../supabase';
import {
  DocumentTemplate,
  GeneratedDocument,
  ResolvedCaseData,
  ValidationResult,
  DocFlowStatus,
} from './types';
import { INITIAL_TEMPLATES } from './initialTemplates';
import {
  renderTemplate,
  validateRequiredFields,
  calculateSha256,
} from './templateEngine';

// Claves de persistencia de respaldo
const LOCAL_TEMPLATES_KEY = 'hipotecaly_docflow_templates_v1';
const LOCAL_DOCS_KEY = 'hipotecaly_docflow_generated_docs_v1';

// Fallback in-memory para entorno Node / SSR / Test runner
let memoryTemplates: DocumentTemplate[] | null = null;
let memoryDocs: GeneratedDocument[] = [];

function getInitialSeeds(): DocumentTemplate[] {
  return INITIAL_TEMPLATES.map((t, idx) => ({
    ...t,
    id: `tpl-seed-${idx + 1}`,
    created_at: new Date('2026-09-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T10:00:00Z').toISOString(),
  }));
}

function getLocalTemplates(): DocumentTemplate[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  if (memoryTemplates) return memoryTemplates;

  const seeds = getInitialSeeds();
  memoryTemplates = seeds;
  saveLocalTemplates(seeds);
  return seeds;
}

function saveLocalTemplates(templates: DocumentTemplate[]) {
  memoryTemplates = templates;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
    } catch {
      // ignore
    }
  }
}

function getLocalDocs(): GeneratedDocument[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return memoryDocs;
}

function saveLocalDocs(docs: GeneratedDocument[]) {
  memoryDocs = docs;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
    } catch {
      // ignore
    }
  }
}

export class DocumentService {
  // --------------------------------------------------------------------------
  // 1. GESTIÓN DE PLANTILLAS (TEMPLATES)
  // --------------------------------------------------------------------------
  static async getTemplates(
    tenantId?: string,
    category?: string
  ): Promise<DocumentTemplate[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('document_templates')
          .select('*')
          .neq('status', 'archived')
          .order('name');

        if (tenantId) {
          query = query.or(`is_global.eq.true,tenant_id.eq.${tenantId}`);
        } else {
          query = query.eq('is_global', true);
        }

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as DocumentTemplate[];
        }
      } catch (err) {
        console.warn('DocFlow: fallback a templates locales', err);
      }
    }

    let local = getLocalTemplates().filter((t) => t.status !== 'archived');
    if (tenantId) {
      local = local.filter((t) => t.is_global || t.tenant_id === tenantId);
    }
    if (category) {
      local = local.filter((t) => t.category === category);
    }
    return local;
  }

  static async getTemplate(id: string): Promise<DocumentTemplate | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data as DocumentTemplate;
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    return local.find((t) => t.id === id) || null;
  }

  static async createTemplate(
    payload: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DocumentTemplate> {
    const newTpl: DocumentTemplate = {
      ...payload,
      id: `tpl-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .insert([newTpl])
          .select()
          .single();

        if (!error && data) return data as DocumentTemplate;
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    local.push(newTpl);
    saveLocalTemplates(local);
    return newTpl;
  }

  static async updateTemplate(
    id: string,
    payload: Partial<DocumentTemplate>
  ): Promise<DocumentTemplate | null> {
    const updatedFields = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .update(updatedFields)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return data as DocumentTemplate;
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    const index = local.findIndex((t) => t.id === id);
    if (index === -1) return null;

    local[index] = { ...local[index], ...updatedFields };
    saveLocalTemplates(local);
    return local[index];
  }

  static async archiveTemplate(id: string): Promise<boolean> {
    return (await this.updateTemplate(id, { status: 'archived', archived_at: new Date().toISOString() })) !== null;
  }

  // --------------------------------------------------------------------------
  // 2. RESOLUCIÓN CENTRAL DE DATOS DEL EXPEDIENTE (NO DUPLICAR DATOS)
  // --------------------------------------------------------------------------
  static async resolveCaseData(
    caseIdOrApp: string | any,
    tenantDetails?: any
  ): Promise<ResolvedCaseData> {
    let app: any = null;

    if (typeof caseIdOrApp === 'object' && caseIdOrApp !== null) {
      app = caseIdOrApp;
    } else if (isSupabaseConfigured && typeof caseIdOrApp === 'string') {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            borrower:borrowers(*),
            property:properties(*),
            valuation:property_valuations(*),
            income:borrower_income(*)
          `)
          .eq('id', caseIdOrApp)
          .maybeSingle();

        if (!error && data) {
          app = data;
        }
      } catch {
        // fallback
      }
    }

    // Default / Sanitized Structure
    const requested = Number(app?.requested_amount) || 60000;
    const estVal = Number(app?.property?.estimated_value) || 180000;
    const appVal = Number(app?.valuation?.preliminary_value) || estVal;
    const ltv = estVal > 0 ? (requested / estVal) * 100 : 33.3;
    const term = Number(app?.term_months) || 36;
    const rate = 11.5;
    const monthlyInt = (requested * (rate / 100)) / 12;

    const createdAt = app?.created_at ? new Date(app.created_at) : new Date();
    const daysOpen = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    const now = new Date();
    const monthsEs = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return {
      case: {
        id: app?.id || (typeof caseIdOrApp === 'string' ? caseIdOrApp : 'e0000000-0000-0000-0000-000000000001'),
        code: app?.public_id || 'HPT-2026-00124',
        created_at: createdAt.toLocaleDateString('es-UY'),
        status: app?.status || 'info_review',
        days_open: daysOpen,
        source: app?.source || 'native_white_label',
        purpose: app?.purpose || 'Refacción y consolidación',
      },
      applicant: {
        first_name: app?.borrower?.first_name || 'Ignacio',
        last_name: app?.borrower?.last_name || 'Silva Gómez',
        full_name: app?.borrower
          ? `${app.borrower.first_name || ''} ${app.borrower.last_name || ''}`.trim()
          : 'Ignacio Silva Gómez',
        document_id: app?.borrower?.id_number || '4.182.930-1',
        id_type: app?.borrower?.id_type || 'CI',
        birth_date: '1985-05-14',
        phone: app?.borrower?.phone || '099 123 456',
        email: app?.borrower?.email || 'ignacio@ejemplo.com',
        address: app?.borrower?.address || 'Benito Blanco 1245 Apto 402',
        city: app?.borrower?.city || 'Montevideo',
        department: app?.borrower?.department || 'Montevideo',
        marital_status: 'Casado/a',
        occupation: 'Ingeniero de Software / Dependiente',
        employer: 'Tecnologías del Plata S.A.',
        monthly_income: app?.income?.monthly_amount || 95000,
        clearing_status: app?.borrower?.clearing_status || 'Sin antecedentes adversos',
      },
      spouse: {
        full_name: 'María Elena Larrosa',
        document_id: '3.987.654-2',
        phone: '099 654 321',
        email: 'maria.larrosa@ejemplo.com',
        occupation: 'Arquitecta',
      },
      property: {
        padron: app?.property?.cadastral_number || '48.912',
        department: app?.property?.department || 'Montevideo',
        city: app?.property?.city || 'Montevideo',
        neighborhood: app?.property?.neighborhood || 'Pocitos',
        address: app?.property?.address || 'Av. Brasil 2840',
        type: app?.property?.property_type || 'Apartamento',
        area_m2: Number(app?.property?.surface_m2) || 120,
        bedrooms: Number(app?.property?.bedrooms) || 3,
        bathrooms: Number(app?.property?.bathrooms) || 2,
        estimated_value: estVal,
        appraised_value: appVal,
        guarantee_value: appVal * 0.85,
        legal_status: (app?.property?.legal_status || 'libre_gravamenes').replace('_', ' '),
      },
      loan: {
        requested_amount: requested,
        approved_amount: requested,
        currency: app?.currency || 'USD',
        term_months: term,
        interest_rate: rate,
        monthly_payment: Math.round(monthlyInt),
        ltv: Math.round(ltv * 10) / 10,
        repayment_mode: app?.repayment_mode || 'Solo Intereses',
      },
      lender: {
        name: 'Fondo Inmobiliario del Este',
        document_id: 'RUT 219876540018',
        contact_name: 'Lic. Roberto Valdés',
        contact_email: 'inversiones@fondodeleste.com.uy',
        contact_phone: '+598 2900 1234',
      },
      notary: {
        user_id: app?.assigned_notary?.notary_user_id || 'u-test-notary',
        name: app?.assigned_notary?.notary_profile?.full_name || 'Esc. María Pérez Morales',
        full_name: app?.assigned_notary?.notary_profile?.full_name || 'Esc. María Pérez Morales',
        document_number: app?.assigned_notary?.notary_profile?.document_number || '3.892.415-8',
        notarial_fund_affiliate_number: app?.assigned_notary?.notary_profile?.notarial_fund_affiliate_number || '48.291',
        professional_address: app?.assigned_notary?.notary_profile?.professional_address || 'Rincón 487 Piso 3 Esc. 302',
        professional_city: app?.assigned_notary?.notary_profile?.professional_city || 'Montevideo',
        professional_department: app?.assigned_notary?.notary_profile?.professional_department || 'Montevideo',
        electronic_domicile: app?.assigned_notary?.notary_profile?.electronic_domicile || 'maria.perez@notarios.org.uy',
        notary_office_name: app?.assigned_notary?.notary_profile?.notary_office?.name || 'Estudio Fernández & Asociados',
        digital_certificate_identifier: app?.assigned_notary?.notary_profile?.digital_certificate_identifier || 'UY-CA-ABITAB-48291-MP',
        email: app?.assigned_notary?.notary_profile?.email || 'escribania@estudiofernandez.uy',
        phone: app?.assigned_notary?.notary_profile?.phone || '099 876 543',
      },
      tenant: {
        id: tenantDetails?.id || app?.organization_id || 'a0000000-0000-0000-0000-000000000001',
        name: tenantDetails?.name || 'HIPOTECALY Uruguay',
        legal_name: tenantDetails?.legal_name || 'HIPOTECALY S.A.S.',
        legal_representative: tenantDetails?.legal_representative || 'Dr. Alejandro Méndez',
        legal_address: tenantDetails?.legal_address || 'Plaza Independencia 848, Montevideo',
        logo_url: tenantDetails?.logo_url,
        support_email: tenantDetails?.support_email || 'soporte@hipotecaly.com.uy',
        support_phone: tenantDetails?.support_phone || '0800 4476',
        footer_text: 'Documento oficial generado por HIPOTECALY DOCFLOW. Validez legal según Ley N° 18.600.',
      },
      dates: {
        today_iso: now.toISOString(),
        today_formatted: `${now.getDate()} de ${monthsEs[now.getMonth()]} de ${now.getFullYear()}`,
        current_year: now.getFullYear(),
        current_month_name: monthsEs[now.getMonth()],
      },
    };
  }

  // --------------------------------------------------------------------------
  // 3. VALIDACIÓN Y GENERACIÓN DOCUMENTAL INMUTABLE
  // --------------------------------------------------------------------------
  static async validateTemplateForCase(
    template: DocumentTemplate,
    caseData: ResolvedCaseData
  ): Promise<ValidationResult> {
    return validateRequiredFields(template.required_fields, caseData);
  }

  static async generateDocument(
    caseId: string,
    templateId: string,
    userContext?: { userId?: string; organizationId?: string },
    existingApp?: any
  ): Promise<{ document: GeneratedDocument; html: string; validation: ValidationResult }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Plantilla no encontrada (${templateId})`);
    }

    const resolvedData = await this.resolveCaseData(existingApp || caseId);
    const validation = await this.validateTemplateForCase(template, resolvedData);

    const html = renderTemplate(template.template_content, resolvedData);
    const fileHash = await calculateSha256(html);

    // Calcular versión del documento para este template en este caso
    const existingCaseDocs = await this.getDocumentsByCase(caseId);
    const sameTplDocs = existingCaseDocs.filter((d) => d.template_id === templateId);
    const docVersion = sameTplDocs.length + 1;

    // Si existen versiones previas, marcarlas como superseded
    for (const prev of sameTplDocs) {
      if (prev.status !== 'superseded' && prev.status !== 'archived') {
        await this.updateDocumentStatus(prev.id, 'superseded');
      }
    }

    const status: DocFlowStatus = validation.isValid
      ? template.requires_signature
        ? 'ready_for_signature'
        : 'generated'
      : 'data_missing';

    const newDoc: GeneratedDocument = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: userContext?.organizationId || resolvedData.tenant.id,
      case_id: caseId,
      template_id: template.id,
      template_version: template.version,
      document_version: docVersion,
      title: `${template.name} (v${docVersion})`,
      category: template.category,
      document_type: template.document_type,
      status,
      generated_by: userContext?.userId,
      generated_at: new Date().toISOString(),
      file_hash: fileHash,
      file_size: html.length,
      mime_type: 'application/pdf',
      snapshot_json: resolvedData as any,
      missing_fields: validation.missingRequiredFields.map((f) => f.key),
      change_detected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('generated_documents')
          .insert([newDoc])
          .select()
          .single();

        if (!error && data) {
          return { document: data as GeneratedDocument, html, validation };
        }
      } catch {
        // ignore
      }
    }

    const localDocs = getLocalDocs();
    localDocs.push(newDoc);
    saveLocalDocs(localDocs);

    return { document: newDoc, html, validation };
  }

  // --------------------------------------------------------------------------
  // 4. CONSULTA Y ACCIONES SOBRE DOCUMENTOS GENERADOS
  // --------------------------------------------------------------------------
  static async getDocumentsByCase(caseId: string): Promise<GeneratedDocument[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as GeneratedDocument[];
        }
      } catch {
        // ignore
      }
    }

    const local = getLocalDocs();
    return local.filter((d) => d.case_id === caseId);
  }

  static async getDocumentsByTenant(
    tenantId: string,
    filters?: { status?: string; category?: string }
  ): Promise<GeneratedDocument[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('generated_documents')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);

        const { data, error } = await query;
        if (!error && data) return data as GeneratedDocument[];
      } catch {
        // ignore
      }
    }

    let local = getLocalDocs().filter((d) => d.tenant_id === tenantId);
    if (filters?.status) local = local.filter((d) => d.status === filters.status);
    if (filters?.category) local = local.filter((d) => d.category === filters.category);
    return local;
  }

  static async updateDocumentStatus(
    documentId: string,
    status: DocFlowStatus,
    extraFields?: Partial<GeneratedDocument>
  ): Promise<GeneratedDocument | null> {
    const updates = {
      status,
      ...extraFields,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('generated_documents')
          .update(updates)
          .eq('id', documentId)
          .select()
          .single();

        if (!error && data) return data as GeneratedDocument;
      } catch {
        // ignore
      }
    }

    const local = getLocalDocs();
    const idx = local.findIndex((d) => d.id === documentId);
    if (idx === -1) return null;

    local[idx] = { ...local[idx], ...updates };
    saveLocalDocs(local);
    return local[idx];
  }

  static async approveDocument(documentId: string, userId?: string): Promise<GeneratedDocument | null> {
    return this.updateDocumentStatus(documentId, 'approved', { generated_by: userId });
  }

  static async rejectDocument(documentId: string, _reason: string): Promise<GeneratedDocument | null> {
    return this.updateDocumentStatus(documentId, 'rejected');
  }

  static async markSigned(
    documentId: string,
    signedUrl?: string,
    evidence?: Record<string, any>
  ): Promise<GeneratedDocument | null> {
    return this.updateDocumentStatus(documentId, 'signed', {
      signed_file_url: signedUrl,
      signed_at: new Date().toISOString(),
      signature_evidence: evidence,
    });
  }

  /**
   * Genera el paquete completo para escribano (Ficha, Resumen, Instrucciones, Checklist)
   */
  static async generateNotaryPack(
    caseId: string,
    userContext?: { userId?: string; organizationId?: string },
    existingApp?: any
  ): Promise<GeneratedDocument[]> {
    const templates = await this.getTemplates(userContext?.organizationId);
    const notarySlugs = ['ficha-solicitante', 'ficha-inmueble', 'instrucciones-escribano', 'checklist-documental'];
    const selectedTpls = templates.filter((t) => notarySlugs.includes(t.slug));

    const results: GeneratedDocument[] = [];
    for (const tpl of selectedTpls) {
      const { document } = await this.generateDocument(caseId, tpl.id, userContext, existingApp);
      results.push(document);
    }
    return results;
  }
}
