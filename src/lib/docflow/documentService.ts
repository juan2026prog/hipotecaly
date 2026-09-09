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
  TemplateAvailability,
} from './types';
import { INITIAL_TEMPLATES } from './initialTemplates';
import {
  renderTemplate,
  validateRequiredFields,
  calculateSha256,
} from './templateEngine';

import { logAuditEvent } from '../auditService';

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
    is_global: true,
    scope: 'global' as const,
    origin_type: 'global' as const,
    availability: 'all' as const,
    available_tenant_ids: null,
    created_at: new Date('2026-09-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-09-01T10:00:00Z').toISOString(),
  }));
}

function getLocalTemplates(): DocumentTemplate[] {
  let list: DocumentTemplate[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
      if (raw) {
        list = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }

  if ((!list || list.length === 0) && memoryTemplates && memoryTemplates.length > 0) {
    list = memoryTemplates;
  }

  if (!list || list.length === 0) {
    list = getInitialSeeds();
    saveLocalTemplates(list);
  }

  // Sanitizar y normalizar campos para garantizar compatibilidad completa
  return list.map((t) => {
    const isGlobal = t.is_global !== undefined ? t.is_global : (t.scope === 'global' || !t.tenant_id);
    const availability = t.availability || (t.available_tenant_ids && t.available_tenant_ids.length > 0 ? 'selected' : 'all');
    return {
      ...t,
      is_global: isGlobal,
      scope: t.scope || (isGlobal ? 'global' : 'tenant'),
      origin_type: t.origin_type || (isGlobal ? 'global' : t.parent_template_id ? 'derived' : 'custom'),
      availability: isGlobal ? availability : undefined,
    };
  });
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
          const templates = data as DocumentTemplate[];
          if (tenantId) {
            return templates.filter((t) => {
              if (!t.is_global && t.tenant_id === tenantId) return true;
              if (t.is_global) {
                const avail = t.availability || (t.available_tenant_ids && t.available_tenant_ids.length > 0 ? 'selected' : 'all');
                if (avail === 'disabled') return false;
                if (avail === 'all') return true;
                if (avail === 'selected') return Boolean(t.available_tenant_ids && t.available_tenant_ids.includes(tenantId));
              }
              return false;
            });
          }
          return templates;
        }
      } catch (err) {
        console.warn('DocFlow: fallback a templates locales', err);
      }
    }

    let local = getLocalTemplates().filter((t) => t.status !== 'archived');
    if (tenantId) {
      local = local.filter((t) => {
        if (!t.is_global && t.tenant_id === tenantId) return true;
        if (t.is_global) {
          const avail = t.availability || (t.available_tenant_ids && t.available_tenant_ids.length > 0 ? 'selected' : 'all');
          if (avail === 'disabled') return false;
          if (avail === 'all') return true;
          if (avail === 'selected') return Boolean(t.available_tenant_ids && t.available_tenant_ids.includes(tenantId));
        }
        return false;
      });
    }
    if (category) {
      local = local.filter((t) => t.category === category);
    }
    return local;
  }

  static async getGlobalTemplates(
    tenantIdFilter?: string,
    category?: string
  ): Promise<DocumentTemplate[]> {
    const all = await this.getTemplates(undefined, category);
    const globals = all.filter((t) => t.is_global || t.scope === 'global');
    if (!tenantIdFilter) return globals;
    return globals.filter((t) => {
      const avail = t.availability || (t.available_tenant_ids && t.available_tenant_ids.length > 0 ? 'selected' : 'all');
      if (avail === 'disabled') return false;
      if (avail === 'all') return true;
      if (avail === 'selected') return Boolean(t.available_tenant_ids && t.available_tenant_ids.includes(tenantIdFilter));
      return false;
    });
  }

  static async getTenantTemplates(
    tenantId: string,
    category?: string
  ): Promise<DocumentTemplate[]> {
    const all = await this.getTemplates(tenantId, category);
    return all.filter((t) => !t.is_global && t.tenant_id === tenantId);
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
      id: `tpl-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      scope: payload.scope || (payload.is_global ? 'global' : 'tenant'),
      origin_type: payload.origin_type || (payload.is_global ? 'global' : payload.parent_template_id ? 'derived' : 'custom'),
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

        if (!error && data) {
          await logAuditEvent({
            organizationId: newTpl.tenant_id || undefined,
            userId: newTpl.created_by,
            userRole: newTpl.is_global ? 'super_admin' : 'tenant_admin',
            action: newTpl.is_global ? 'GLOBAL_TEMPLATE_CREATED' : newTpl.parent_template_id ? 'TEMPLATE_DERIVED' : 'TEMPLATE_CREATED',
            module: 'DOCFLOW',
            recordIdentifier: data.id,
            metadata: { name: newTpl.name, version: newTpl.version, scope: newTpl.scope },
          }).catch(() => {});
          return data as DocumentTemplate;
        }
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    local.push(newTpl);
    saveLocalTemplates(local);

    await logAuditEvent({
      organizationId: newTpl.tenant_id || undefined,
      userId: newTpl.created_by,
      userRole: newTpl.is_global ? 'super_admin' : 'tenant_admin',
      action: newTpl.is_global ? 'GLOBAL_TEMPLATE_CREATED' : newTpl.parent_template_id ? 'TEMPLATE_DERIVED' : 'TEMPLATE_CREATED',
      module: 'DOCFLOW',
      recordIdentifier: newTpl.id,
      metadata: { name: newTpl.name, version: newTpl.version, scope: newTpl.scope },
    }).catch(() => {});

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

        if (!error && data) {
          await logAuditEvent({
            organizationId: data.tenant_id || undefined,
            userId: data.created_by,
            userRole: data.is_global ? 'super_admin' : 'tenant_admin',
            action: data.is_global ? 'GLOBAL_TEMPLATE_UPDATED' : 'TEMPLATE_UPDATED',
            module: 'DOCFLOW',
            recordIdentifier: id,
            metadata: { name: data.name, version: data.version },
          }).catch(() => {});
          return data as DocumentTemplate;
        }
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    const index = local.findIndex((t) => t.id === id);
    if (index === -1) return null;

    local[index] = { ...local[index], ...updatedFields };
    saveLocalTemplates(local);

    await logAuditEvent({
      organizationId: local[index].tenant_id || undefined,
      userId: local[index].created_by,
      userRole: local[index].is_global ? 'super_admin' : 'tenant_admin',
      action: local[index].is_global ? 'GLOBAL_TEMPLATE_UPDATED' : 'TEMPLATE_UPDATED',
      module: 'DOCFLOW',
      recordIdentifier: id,
      metadata: { name: local[index].name, version: local[index].version },
    }).catch(() => {});

    return local[index];
  }

  static async deriveTemplate(
    globalTemplateId: string,
    tenantId: string,
    tenantName: string,
    customName?: string
  ): Promise<DocumentTemplate> {
    const parentTpl = await this.getTemplate(globalTemplateId);
    if (!parentTpl) {
      throw new Error(`Plantilla global con ID ${globalTemplateId} no encontrada.`);
    }

    const derivedName = customName || `${parentTpl.name} — ${tenantName} v1`;
    const derivedSlug = derivedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const created = await this.createTemplate({
      name: derivedName,
      slug: derivedSlug,
      description: parentTpl.description ? `Derivada de ${parentTpl.name} (Global v${parentTpl.version}). ${parentTpl.description}` : `Derivada de ${parentTpl.name} (Global v${parentTpl.version}).`,
      category: parentTpl.category,
      document_type: parentTpl.document_type,
      status: 'active',
      version: 1,
      template_content: parentTpl.template_content,
      output_format: parentTpl.output_format,
      requires_signature: parentTpl.requires_signature,
      signature_type: parentTpl.signature_type,
      required_roles: parentTpl.required_roles,
      required_fields: [...(parentTpl.required_fields || [])],
      conditional_rules: parentTpl.conditional_rules ? [...parentTpl.conditional_rules] : undefined,
      signers_config: parentTpl.signers_config ? [...parentTpl.signers_config] : undefined,
      is_global: false,
      scope: 'tenant',
      tenant_id: tenantId,
      parent_template_id: parentTpl.id,
      parent_version: parentTpl.version,
      origin_type: 'derived',
    });

    return created;
  }

  static async setGlobalAvailability(
    templateId: string,
    availabilityOrTenantIds: TemplateAvailability | string[] | null,
    tenantIds?: string[] | null
  ): Promise<DocumentTemplate | null> {
    let targetAvailability: TemplateAvailability = 'all';
    let targetTenantIds: string[] | null = null;

    if (typeof availabilityOrTenantIds === 'string') {
      targetAvailability = availabilityOrTenantIds;
      targetTenantIds = tenantIds || null;
    } else if (Array.isArray(availabilityOrTenantIds)) {
      targetAvailability = availabilityOrTenantIds.length > 0 ? 'selected' : 'all';
      targetTenantIds = availabilityOrTenantIds.length > 0 ? availabilityOrTenantIds : null;
    } else {
      targetAvailability = 'all';
      targetTenantIds = null;
    }

    return this.updateTemplate(templateId, {
      availability: targetAvailability,
      available_tenant_ids: targetTenantIds,
    });
  }

  static async checkForGlobalUpdates(
    derivedTemplate: DocumentTemplate
  ): Promise<{ hasUpdate: boolean; latestGlobalVersion: number; globalName: string } | null> {
    if (!derivedTemplate.parent_template_id) return null;
    const globalTpl = await this.getTemplate(derivedTemplate.parent_template_id);
    if (!globalTpl) return null;

    const parentVer = derivedTemplate.parent_version || 1;
    const hasUpdate = globalTpl.version > parentVer;
    return {
      hasUpdate,
      latestGlobalVersion: globalTpl.version,
      globalName: globalTpl.name,
    };
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
        code: app?.public_id || 'HIP-2026-0001',
        created_at: app?.created_at || now.toISOString(),
        status: app?.status || 'evaluacion',
        days_open: daysOpen,
        source: app?.source || 'native_white_label',
        purpose: app?.purpose || 'Préstamo Hipotecario',
      },
      applicant: {
        first_name: app?.borrower?.first_name || 'Rodrigo',
        last_name: app?.borrower?.last_name || 'Larrañaga',
        full_name: `${app?.borrower?.first_name || 'Rodrigo'} ${app?.borrower?.last_name || 'Larrañaga'}`,
        document_id: app?.borrower?.document_id || '3.987.654-2',
        id_type: 'CI',
        birth_date: app?.borrower?.birth_date || '1984-06-15',
        phone: app?.borrower?.phone || '+598 99 123 456',
        email: app?.borrower?.email || 'rodrigo.larranaga@ejemplo.com',
        address: app?.borrower?.address || 'Av. Brasil 2890 Apt 402',
        city: app?.borrower?.city || 'Montevideo',
        department: app?.borrower?.department || 'Montevideo',
        marital_status: app?.borrower?.civil_status || 'Casado',
        occupation: 'Ingeniero',
        employer: 'Empresa S.A.',
        monthly_income: Number(app?.income?.declared_amount) || 120000,
        clearing_status: 'Normal',
      },
      spouse: {
        full_name: 'Mariana Silva Gómez',
        document_id: '4.123.456-7',
        email: 'mariana.silva@ejemplo.com',
        phone: '+598 99 654 321',
      },
      property: {
        padron: app?.property?.cadastral_number || '142.890',
        department: app?.property?.department || 'Montevideo',
        city: app?.property?.locality || 'Montevideo',
        neighborhood: 'Pocitos',
        address: app?.property?.address || 'Benito Blanco 1240 Apt 801',
        type: app?.property?.property_type || 'Apartamento',
        area_m2: Number(app?.property?.surface_m2) || 85,
        bedrooms: Number(app?.property?.bedrooms) || 2,
        bathrooms: Number(app?.property?.bathrooms) || 1,
        estimated_value: estVal,
        appraised_value: appVal,
        guarantee_value: appVal * 0.85,
        legal_status: 'Libre de gravámenes',
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
      parent_template_id: template.parent_template_id || null,
      parent_template_version: template.parent_version || null,
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
