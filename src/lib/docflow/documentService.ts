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
  TemplateVersionHistoryItem,
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
  // 1. CÁLCULO DE USOS Y DEPENDENCIAS (FAIL-CLOSED)
  // --------------------------------------------------------------------------
  /**
   * Obtiene la cantidad de documentos generados a partir de una plantilla específica
   */
  static async getTemplateUsageCount(templateId: string): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        const { count, error } = await supabase
          .from('generated_documents')
          .select('id', { count: 'exact', head: true })
          .eq('template_id', templateId);

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch {
        // fallback to local
      }
    }

    const docs = getLocalDocs();
    return docs.filter((d) => d.template_id === templateId).length;
  }

  // --------------------------------------------------------------------------
  // 2. GESTIÓN Y CONSULTA DE PLANTILLAS (TEMPLATES)
  // --------------------------------------------------------------------------
  static async getTemplates(
    tenantId?: string,
    category?: string,
    includeArchived: boolean = false
  ): Promise<DocumentTemplate[]> {
    let templates: DocumentTemplate[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('document_templates')
          .select('*')
          .order('name');

        if (!includeArchived) {
          query = query.not('status', 'in', '("archived","retired")');
        }

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
          const rawTemplates = data as DocumentTemplate[];
          if (tenantId) {
            templates = rawTemplates.filter((t) => {
              if (!t.is_global && t.tenant_id === tenantId) return true;
              if (t.is_global) {
                const avail = t.availability || (t.available_tenant_ids && t.available_tenant_ids.length > 0 ? 'selected' : 'all');
                if (avail === 'disabled') return false;
                if (avail === 'all') return true;
                if (avail === 'selected') return Boolean(t.available_tenant_ids && t.available_tenant_ids.includes(tenantId));
              }
              return false;
            });
          } else {
            templates = rawTemplates;
          }
        }
      } catch (err) {
        console.warn('DocFlow: fallback a templates locales', err);
      }
    }

    if (!templates || templates.length === 0) {
      let local = getLocalTemplates();
      if (!includeArchived) {
        local = local.filter((t) => t.status !== 'archived' && t.status !== 'retired');
      }
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
      templates = local;
    }

    // Calcular el usage_count para cada plantilla
    const docs = getLocalDocs();
    return templates.map((t) => {
      const uses = docs.filter((d) => d.template_id === t.id).length;
      return {
        ...t,
        usage_count: t.usage_count !== undefined ? t.usage_count : uses,
      };
    });
  }

  static async getGlobalTemplates(
    tenantIdFilter?: string,
    category?: string,
    includeArchived: boolean = false
  ): Promise<DocumentTemplate[]> {
    const all = await this.getTemplates(undefined, category, includeArchived);
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
    category?: string,
    includeArchived: boolean = true
  ): Promise<DocumentTemplate[]> {
    const all = await this.getTemplates(tenantId, category, includeArchived);
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

        if (!error && data) {
          const tpl = data as DocumentTemplate;
          const uses = await this.getTemplateUsageCount(tpl.id);
          return { ...tpl, usage_count: uses };
        }
      } catch {
        // ignore
      }
    }

    const local = getLocalTemplates();
    const tpl = local.find((t) => t.id === id) || null;
    if (tpl) {
      const uses = await this.getTemplateUsageCount(tpl.id);
      return { ...tpl, usage_count: uses };
    }
    return null;
  }

  static async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    return this.getTemplate(id);
  }

  static async getAvailableTemplates(tenantId?: string, category?: string): Promise<DocumentTemplate[]> {
    return this.getTemplates(tenantId, category, false);
  }

  static async createTemplate(
    payload: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate> {
    const newTpl: DocumentTemplate = {
      ...payload,
      version: payload.version !== undefined ? payload.version : 1,
      status: payload.status || 'active',
      output_format: payload.output_format || 'pdf',
      requires_signature: payload.requires_signature !== undefined ? payload.requires_signature : false,
      required_fields: payload.required_fields || [],
      is_global: payload.is_global !== undefined ? payload.is_global : false,
      id: `tpl-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      scope: payload.scope || (payload.is_global ? 'global' : 'tenant'),
      origin_type: payload.origin_type || (payload.is_global ? 'global' : payload.parent_template_id ? 'derived' : 'custom'),
      created_by: userContext?.userId || payload.created_by,
      created_by_name: userContext?.userName || payload.created_by_name,
      usage_count: 0,
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
            userId: userContext?.userId || newTpl.created_by,
            userName: userContext?.userName,
            userRole: newTpl.is_global ? 'super_admin' : 'tenant_admin',
            action: newTpl.is_global ? 'GLOBAL_TEMPLATE_CREATED' : newTpl.parent_template_id ? 'TEMPLATE_DERIVED' : 'TEMPLATE_CREATED',
            module: 'DOCFLOW',
            recordIdentifier: data.id,
            metadata: { name: newTpl.name, version: newTpl.version, scope: newTpl.scope },
          }).catch(() => {});
          return { ...(data as DocumentTemplate), usage_count: 0 };
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
      userId: userContext?.userId || newTpl.created_by,
      userName: userContext?.userName,
      userRole: newTpl.is_global ? 'super_admin' : 'tenant_admin',
      action: newTpl.is_global ? 'GLOBAL_TEMPLATE_CREATED' : newTpl.parent_template_id ? 'TEMPLATE_DERIVED' : 'TEMPLATE_CREATED',
      module: 'DOCFLOW',
      recordIdentifier: newTpl.id,
      metadata: { name: newTpl.name, version: newTpl.version, scope: newTpl.scope },
    }).catch(() => {});

    return newTpl;
  }

  /**
   * Actualiza una plantilla existente directamente (permitido de forma segura cuando no tiene usos históricos)
   */
  static async updateTemplate(
    id: string,
    payload: Partial<DocumentTemplate>,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
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
          const uses = await this.getTemplateUsageCount(id);
          await logAuditEvent({
            organizationId: data.tenant_id || undefined,
            userId: userContext?.userId || data.created_by,
            userName: userContext?.userName,
            userRole: data.is_global ? 'super_admin' : 'tenant_admin',
            action: data.is_global ? 'GLOBAL_TEMPLATE_UPDATED' : 'TEMPLATE_UPDATED',
            module: 'DOCFLOW',
            recordIdentifier: id,
            metadata: { name: data.name, version: data.version, changes: Object.keys(payload) },
          }).catch(() => {});
          return { ...(data as DocumentTemplate), usage_count: uses };
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

    const uses = await this.getTemplateUsageCount(id);
    await logAuditEvent({
      organizationId: local[index].tenant_id || undefined,
      userId: userContext?.userId || local[index].created_by,
      userName: userContext?.userName,
      userRole: local[index].is_global ? 'super_admin' : 'tenant_admin',
      action: local[index].is_global ? 'GLOBAL_TEMPLATE_UPDATED' : 'TEMPLATE_UPDATED',
      module: 'DOCFLOW',
      recordIdentifier: id,
      metadata: { name: local[index].name, version: local[index].version, changes: Object.keys(payload) },
    }).catch(() => {});

    return { ...local[index], usage_count: uses };
  }

  /**
   * Crea una nueva versión inmutable de una plantilla (ej. v1 -> v2).
   * La versión anterior permanece intacta para dar soporte a los documentos históricos emitidos.
   */
  static async createNewTemplateVersion(
    currentTemplateId: string,
    updates: Partial<DocumentTemplate>,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate> {
    const existing = await this.getTemplate(currentTemplateId);
    if (!existing) {
      throw new Error(`Plantilla no encontrada (${currentTemplateId})`);
    }

    const nextVersion = (existing.version || 1) + 1;
    const newVersionName = updates.name || existing.name;

    const created = await this.createTemplate({
      name: newVersionName,
      slug: existing.slug,
      description: updates.description !== undefined ? updates.description : existing.description,
      category: updates.category || existing.category,
      document_type: existing.document_type,
      status: updates.status || 'active',
      version: nextVersion,
      template_content: updates.template_content !== undefined ? updates.template_content : existing.template_content,
      output_format: updates.output_format || existing.output_format,
      requires_signature: updates.requires_signature !== undefined ? updates.requires_signature : existing.requires_signature,
      signature_type: updates.signature_type || existing.signature_type,
      required_roles: updates.required_roles || existing.required_roles,
      required_fields: updates.required_fields || existing.required_fields,
      conditional_rules: updates.conditional_rules || existing.conditional_rules,
      signers_config: updates.signers_config || existing.signers_config,
      is_global: existing.is_global,
      scope: existing.scope,
      tenant_id: existing.tenant_id,
      parent_template_id: existing.id,
      parent_version: existing.version || 1,
      availability: existing.availability,
      available_tenant_ids: existing.available_tenant_ids,
      origin_type: existing.origin_type,
      created_by: userContext?.userId || existing.created_by,
      created_by_name: userContext?.userName || existing.created_by_name,
    }, userContext);

    await logAuditEvent({
      organizationId: existing.tenant_id || undefined,
      userId: userContext?.userId,
      userName: userContext?.userName,
      userRole: existing.is_global ? 'super_admin' : 'tenant_admin',
      action: 'TEMPLATE_VERSION_CREATED',
      module: 'DOCFLOW',
      recordIdentifier: created.id,
      metadata: {
        template_name: created.name,
        previous_version: existing.version,
        new_version: created.version,
        previous_template_id: existing.id,
      },
    }).catch(() => {});

    return created;
  }

  /**
   * Duplica una plantilla creando una entidad totalmente independiente que comienza en borrador (v1).
   */
  static async duplicateTemplate(
    templateId: string,
    targetTenantId?: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate> {
    const source = await this.getTemplate(templateId);
    if (!source) {
      throw new Error(`Plantilla origen no encontrada (${templateId})`);
    }

    const orgId = targetTenantId || source.tenant_id || userContext?.organizationId || null;
    const duplicatedName = `Copia de ${source.name}`;
    const duplicatedSlug = duplicatedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const created = await this.createTemplate({
      name: duplicatedName,
      slug: duplicatedSlug,
      description: source.description ? `Copia de ${source.name}. ${source.description}` : `Copia independiente de ${source.name}.`,
      category: source.category,
      document_type: source.document_type,
      status: 'draft',
      version: 1,
      template_content: source.template_content,
      output_format: source.output_format,
      requires_signature: source.requires_signature,
      signature_type: source.signature_type,
      required_roles: source.required_roles,
      required_fields: [...(source.required_fields || [])],
      conditional_rules: source.conditional_rules ? [...source.conditional_rules] : undefined,
      signers_config: source.signers_config ? [...source.signers_config] : undefined,
      is_global: false,
      scope: 'tenant',
      tenant_id: orgId,
      origin_type: 'custom',
      created_by: userContext?.userId,
      created_by_name: userContext?.userName,
    }, userContext);

    await logAuditEvent({
      organizationId: orgId || undefined,
      userId: userContext?.userId,
      userName: userContext?.userName,
      userRole: 'tenant_admin',
      action: 'TEMPLATE_DUPLICATED',
      module: 'DOCFLOW',
      recordIdentifier: created.id,
      metadata: { source_template_id: source.id, source_name: source.name, new_name: created.name },
    }).catch(() => {});

    return created;
  }

  /**
   * Deriva una plantilla global para una organización específica
   */
  static async deriveTemplate(
    globalTemplateId: string,
    tenantId: string,
    tenantName: string,
    customName?: string,
    userContext?: { userId?: string; userName?: string }
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
      created_by: userContext?.userId,
      created_by_name: userContext?.userName,
    }, { ...userContext, organizationId: tenantId });

    return created;
  }

  /**
   * Historial de versiones de una plantilla
   */
  static async getTemplateVersionHistory(
    templateIdOrSlug: string,
    tenantId?: string
  ): Promise<TemplateVersionHistoryItem[]> {
    const target = await this.getTemplate(templateIdOrSlug);
    const targetSlug = target?.slug || templateIdOrSlug;

    let all: DocumentTemplate[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('document_templates')
          .select('*')
          .eq('slug', targetSlug);

        if (tenantId) {
          query = query.or(`is_global.eq.true,tenant_id.eq.${tenantId}`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          all = data as DocumentTemplate[];
        }
      } catch {
        // fallback
      }
    }

    if (all.length === 0) {
      const local = getLocalTemplates();
      all = local.filter((t) => t.slug === targetSlug || t.id === templateIdOrSlug);
    }

    // Ordenar de mayor a menor versión
    all.sort((a, b) => (b.version || 1) - (a.version || 1));

    const historyItems: TemplateVersionHistoryItem[] = [];
    for (const t of all) {
      const count = await this.getTemplateUsageCount(t.id);
      historyItems.push({
        id: t.id,
        version: t.version || 1,
        name: t.name,
        status: t.status,
        created_at: t.created_at,
        created_by: t.created_by,
        created_by_name: t.created_by_name,
        description: t.description,
        usage_count: count,
        template_content: t.template_content,
        is_current: target ? target.id === t.id : historyItems.length === 0,
      });
    }

    return historyItems;
  }

  /**
   * Archiva una plantilla (status: 'archived')
   */
  static async archiveTemplate(
    id: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate | null> {
    const updated = await this.updateTemplate(id, {
      status: 'archived',
      archived_at: new Date().toISOString(),
    }, userContext);

    if (updated) {
      await logAuditEvent({
        organizationId: updated.tenant_id || userContext?.organizationId,
        userId: userContext?.userId,
        userName: userContext?.userName,
        userRole: updated.is_global ? 'super_admin' : 'tenant_admin',
        action: 'TEMPLATE_ARCHIVED',
        module: 'DOCFLOW',
        recordIdentifier: id,
        metadata: { name: updated.name, version: updated.version },
      }).catch(() => {});
      return updated;
    }
    return null;
  }

  /**
   * Restaura una plantilla archivada (status: 'active')
   */
  static async restoreTemplate(
    id: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate | null> {
    const updated = await this.updateTemplate(id, {
      status: 'active',
      archived_at: undefined,
    }, userContext);

    if (updated) {
      delete updated.archived_at;
      await logAuditEvent({
        organizationId: updated.tenant_id || userContext?.organizationId,
        userId: userContext?.userId,
        userName: userContext?.userName,
        userRole: updated.is_global ? 'super_admin' : 'tenant_admin',
        action: 'TEMPLATE_RESTORED',
        module: 'DOCFLOW',
        recordIdentifier: id,
        metadata: { name: updated.name, version: updated.version },
      }).catch(() => {});
      return updated;
    }
    return null;
  }

  /**
   * Retira una plantilla del catálogo activo (status: 'retired')
   */
  static async retireTemplate(
    id: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<DocumentTemplate | null> {
    const updated = await this.updateTemplate(id, {
      status: 'retired',
      archived_at: new Date().toISOString(),
    }, userContext);

    if (updated) {
      await logAuditEvent({
        organizationId: updated.tenant_id || userContext?.organizationId,
        userId: userContext?.userId,
        userName: userContext?.userName,
        userRole: updated.is_global ? 'super_admin' : 'tenant_admin',
        action: 'TEMPLATE_RETIRED',
        module: 'DOCFLOW',
        recordIdentifier: id,
        metadata: { name: updated.name, version: updated.version },
      }).catch(() => {});
      return updated;
    }
    return null;
  }

  /**
   * ELIMINACIÓN SEGURA & FAIL-CLOSED:
   * - Si usageCount === 0: Permite Hard Delete (eliminación definitiva).
   * - Si usageCount > 0: Rechaza el Hard Delete de forma estricta (fail-closed) para preservar la trazabilidad.
   */
  static async deleteTemplate(
    id: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string; isSuperAdmin?: boolean }
  ): Promise<{ success: boolean; action: 'hard_deleted' | 'cannot_hard_delete'; usageCount: number; message: string }> {
    const tpl = await this.getTemplate(id);
    if (!tpl) {
      throw new Error(`Plantilla con ID ${id} no encontrada.`);
    }

    // Regla de seguridad: plantillas globales solo pueden ser administradas por Super Admin
    if (tpl.is_global && !userContext?.isSuperAdmin) {
      throw new Error('Solo los Super Administradores pueden gestionar plantillas de la biblioteca global.');
    }

    // 1. Verificación de dependencias server-side / fail-closed
    const usageCount = await this.getTemplateUsageCount(id);

    if (usageCount > 0) {
      return {
        success: false,
        action: 'cannot_hard_delete',
        usageCount,
        message: `Esta plantilla fue utilizada en ${usageCount} documento(s) y no puede eliminarse definitivamente para mantener la trazabilidad documental y jurídica. Podés archivarla o retirarla de la biblioteca.`,
      };
    }

    // 2. Si tiene 0 usos: Hard Delete definitivo
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('document_templates')
          .delete()
          .eq('id', id);

        if (error) {
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('DocFlow: fallback al eliminar template local:', err);
      }
    }

    const local = getLocalTemplates();
    const filtered = local.filter((t) => t.id !== id);
    saveLocalTemplates(filtered);

    await logAuditEvent({
      organizationId: tpl.tenant_id || userContext?.organizationId,
      userId: userContext?.userId,
      userName: userContext?.userName,
      userRole: tpl.is_global ? 'super_admin' : 'tenant_admin',
      action: 'TEMPLATE_DELETED',
      module: 'DOCFLOW',
      recordIdentifier: id,
      metadata: { name: tpl.name, version: tpl.version, usage_count: 0 },
    }).catch(() => {});

    return {
      success: true,
      action: 'hard_deleted',
      usageCount: 0,
      message: 'La plantilla nunca fue utilizada y fue eliminada definitivamente del sistema.',
    };
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

  // --------------------------------------------------------------------------
  // 3. RESOLUCIÓN CENTRAL DE DATOS DEL EXPEDIENTE (NO DUPLICAR DATOS)
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

    // Default / Sanitized Structure (Strictly real data or undefined / calculated from real values)
    const requested = Number(app?.requested_amount) || 0;
    const estVal = Number(app?.property?.estimated_value) || 0;
    const appVal = Number(app?.valuation?.preliminary_value) || estVal;
    const ltv = estVal > 0 ? (requested / estVal) * 100 : 0;
    const term = Number(app?.term_months) || 0;
    const rate = Number(app?.interest_rate) || 11.5;
    const monthlyInt = requested > 0 && rate > 0 ? (requested * (rate / 100)) / 12 : 0;

    const createdAt = app?.created_at ? new Date(app.created_at) : new Date();
    const daysOpen = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    const now = new Date();
    const monthsEs = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const prop = app?.property;
    const prov = prop?.field_provenance || {};

    // Helper para extraer valor dando prioridad a registros con estado VERIFIED
    const getResolvedVal = (fieldName: string, directValue: any): any => {
      const record = prov[fieldName];
      if (record && record.verification_status === 'VERIFIED' && record.value !== null && record.value !== undefined) {
        return record.value;
      }
      return directValue ?? record?.value ?? undefined;
    };

    const resolvedPadron = getResolvedVal('padron', prop?.padron) || prop?.cadastral_number || undefined;
    const resolvedParentPadron = getResolvedVal('parent_padron', prop?.parent_padron) || undefined;
    const resolvedRegime = getResolvedVal('cadastral_regime', prop?.cadastral_regime) || undefined;
    const resolvedUnit = getResolvedVal('unit_or_apartment', prop?.unit_or_apartment) || prop?.unit_number || undefined;
    const resolvedFloor = getResolvedVal('floor', prop?.floor) || undefined;
    const resolvedBlock = getResolvedVal('tower_or_building', prop?.tower_or_building) || prop?.block || undefined;
    const resolvedCadastralUnit = getResolvedVal('cadastral_unit', prop?.cadastral_unit) || undefined;
    const resolvedCadastralBlock = getResolvedVal('cadastral_block', prop?.cadastral_block) || undefined;
    const resolvedCadastralLevel = getResolvedVal('cadastral_level', prop?.cadastral_level) || undefined;
    const resolvedCadastralSection = getResolvedVal('cadastral_section', prop?.cadastral_section) || undefined;
    const resolvedCadastralManzana = getResolvedVal('cadastral_manzana', prop?.cadastral_manzana) || undefined;
    const resolvedCadastralSolar = getResolvedVal('cadastral_solar', prop?.cadastral_solar) || undefined;
    const resolvedCadastralPlan = getResolvedVal('cadastral_plan', prop?.cadastral_plan) || undefined;

    const applicantFirstName = app?.borrower?.first_name || undefined;
    const applicantLastName = app?.borrower?.last_name || undefined;
    const applicantFullName = (applicantFirstName || applicantLastName)
      ? `${applicantFirstName || ''} ${applicantLastName || ''}`.trim()
      : undefined;

    return {
      case: {
        id: app?.id || (typeof caseIdOrApp === 'string' ? caseIdOrApp : ''),
        code: app?.public_id || '',
        created_at: app?.created_at || now.toISOString(),
        status: app?.status || 'evaluacion',
        days_open: daysOpen,
        source: app?.source || 'native_white_label',
        purpose: app?.purpose || undefined,
      },
      applicant: {
        first_name: applicantFirstName || '',
        last_name: applicantLastName || '',
        full_name: applicantFullName || '',
        document_id: app?.borrower?.document_id || app?.borrower?.id_number || '',
        id_type: 'CI',
        birth_date: app?.borrower?.birth_date || undefined,
        phone: app?.borrower?.phone || undefined,
        email: app?.borrower?.email || '',
        address: app?.borrower?.address || undefined,
        city: app?.borrower?.city || undefined,
        department: app?.borrower?.department || '',
        marital_status: app?.borrower?.civil_status || undefined,
        occupation: app?.borrower?.occupation || undefined,
        employer: app?.borrower?.employer || undefined,
        monthly_income: Number(app?.income?.declared_amount || app?.income?.monthly_amount) || 0,
        clearing_status: app?.borrower?.clearing_status || undefined,
      },
      spouse: app?.borrower?.spouse_full_name || app?.borrower?.spouse_document_id ? {
        full_name: app?.borrower?.spouse_full_name || undefined,
        document_id: app?.borrower?.spouse_document_id || undefined,
        email: app?.borrower?.spouse_email || undefined,
        phone: app?.borrower?.spouse_phone || undefined,
      } : undefined,
      property: {
        padron: resolvedPadron || '',
        parent_padron: resolvedParentPadron,
        department: app?.property?.department || '',
        city: app?.property?.city || app?.property?.locality || '',
        neighborhood: app?.property?.neighborhood || undefined,
        address: app?.property?.address || '',
        type: app?.property?.property_type || '',
        regime: resolvedRegime ? String(resolvedRegime).replace('_', ' ') : undefined,
        unit: resolvedUnit,
        floor: resolvedFloor,
        block: resolvedBlock,
        cadastral_unit: resolvedCadastralUnit,
        cadastral_block: resolvedCadastralBlock,
        cadastral_level: resolvedCadastralLevel,
        cadastral_section: resolvedCadastralSection,
        cadastral_manzana: resolvedCadastralManzana,
        cadastral_solar: resolvedCadastralSolar,
        cadastral_plan: resolvedCadastralPlan,
        cadastral_status: app?.property?.cadastral_status || 'declarado',
        area_m2: Number(app?.property?.built_surface_m2 || app?.property?.surface_m2) || 0,
        built_surface_m2: Number(app?.property?.built_surface_m2 || app?.property?.surface_m2) || undefined,
        land_surface_m2: Number(app?.property?.land_surface_m2) || undefined,
        bedrooms: Number(app?.property?.bedrooms) || 0,
        bathrooms: Number(app?.property?.bathrooms) || 0,
        estimated_value: estVal,
        appraised_value: appVal,
        guarantee_value: appVal > 0 ? appVal * 0.85 : 0,
        legal_status: app?.property?.legal_status ? String(app.property.legal_status).replace('_', ' ') : 'Libre de gravámenes',
      },
      loan: {
        requested_amount: requested,
        approved_amount: Number(app?.approved_amount) || requested,
        currency: app?.currency || 'USD',
        term_months: term,
        interest_rate: rate,
        monthly_payment: Math.round(monthlyInt),
        ltv: Math.round(ltv * 10) / 10,
        repayment_mode: app?.repayment_mode || 'Solo Intereses',
      },
      lender: app?.lender ? {
        name: app.lender.name || '',
        document_id: app.lender.document_id || undefined,
        contact_name: app.lender.contact_name || undefined,
        contact_email: app.lender.contact_email || undefined,
        contact_phone: app.lender.contact_phone || undefined,
      } : undefined,
      notary: app?.assigned_notary?.notary_profile ? {
        user_id: app?.assigned_notary?.notary_user_id || undefined,
        name: app.assigned_notary.notary_profile.full_name || '',
        full_name: app.assigned_notary.notary_profile.full_name || '',
        document_number: app.assigned_notary.notary_profile.document_number || undefined,
        notarial_fund_affiliate_number: app.assigned_notary.notary_profile.notarial_fund_affiliate_number || undefined,
        professional_address: app.assigned_notary.notary_profile.professional_address || undefined,
        professional_city: app.assigned_notary.notary_profile.professional_city || undefined,
        professional_department: app.assigned_notary.notary_profile.professional_department || undefined,
        electronic_domicile: app.assigned_notary.notary_profile.electronic_domicile || undefined,
        notary_office_name: app.assigned_notary.notary_profile.notary_office?.name || undefined,
        digital_certificate_identifier: app.assigned_notary.notary_profile.digital_certificate_identifier || undefined,
        email: app.assigned_notary.notary_profile.email || undefined,
        phone: app.assigned_notary.notary_profile.phone || undefined,
      } : undefined,
      tenant: {
        id: tenantDetails?.id || app?.organization_id || '',
        name: tenantDetails?.name || 'HIPOTECALY',
        legal_name: tenantDetails?.legal_name || undefined,
        legal_representative: tenantDetails?.legal_representative || undefined,
        legal_address: tenantDetails?.legal_address || undefined,
        logo_url: tenantDetails?.logo_url || undefined,
        support_email: tenantDetails?.support_email || undefined,
        support_phone: tenantDetails?.support_phone || undefined,
        footer_text: 'Documento generado por HIPOTECALY DOCFLOW.',
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
  // 4. VALIDACIÓN Y GENERACIÓN DOCUMENTAL INMUTABLE
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
    userContext?: { userId?: string; userName?: string; organizationId?: string },
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
      if (prev.status !== 'superseded' && prev.status !== 'archived' && prev.status !== 'voided') {
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
      template_name: template.name,
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
      content_html: html,
      snapshot_json: {
        ...resolvedData,
        content_html: html,
        template_name: template.name,
        template_version: template.version,
      },
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
          await logAuditEvent({
            organizationId: newDoc.tenant_id,
            userId: userContext?.userId,
            userName: userContext?.userName,
            userRole: 'operator',
            action: docVersion > 1 ? 'DOCUMENT_VERSION_CREATED' : 'DOCUMENT_CREATED',
            module: 'DOCFLOW',
            recordIdentifier: data.id,
            metadata: {
              title: newDoc.title,
              version: docVersion,
              template_id: template.id,
              hash: fileHash,
            },
          }).catch(() => {});
          return { document: data as GeneratedDocument, html, validation };
        }
      } catch {
        // ignore
      }
    }

    const localDocs = getLocalDocs();
    localDocs.push(newDoc);
    saveLocalDocs(localDocs);

    await logAuditEvent({
      organizationId: newDoc.tenant_id,
      userId: userContext?.userId,
      userName: userContext?.userName,
      userRole: 'operator',
      action: docVersion > 1 ? 'DOCUMENT_VERSION_CREATED' : 'DOCUMENT_CREATED',
      module: 'DOCFLOW',
      recordIdentifier: newDoc.id,
      metadata: {
        title: newDoc.title,
        version: docVersion,
        template_id: template.id,
        hash: fileHash,
      },
    }).catch(() => {});

    return { document: newDoc, html, validation };
  }

  // --------------------------------------------------------------------------
  // 5. CONSULTA Y ACCIONES SOBRE DOCUMENTOS GENERADOS
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

        if (filters?.status && filters.status !== 'todos') query = query.eq('status', filters.status);
        if (filters?.category && filters.category !== 'todos') query = query.eq('category', filters.category);

        const { data, error } = await query;
        if (!error && data) return data as GeneratedDocument[];
      } catch {
        // ignore
      }
    }

    let local = getLocalDocs().filter((d) => d.tenant_id === tenantId);
    if (filters?.status && filters.status !== 'todos') local = local.filter((d) => d.status === filters.status);
    if (filters?.category && filters.category !== 'todos') local = local.filter((d) => d.category === filters.category);
    return local;
  }

  static async getDocument(id: string): Promise<GeneratedDocument | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data as GeneratedDocument;
      } catch {
        // ignore
      }
    }

    const local = getLocalDocs();
    return local.find((d) => d.id === id) || null;
  }

  static async getDocumentById(id: string): Promise<GeneratedDocument | null> {
    return this.getDocument(id);
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

  static async approveDocument(documentId: string, userId?: string, userName?: string): Promise<GeneratedDocument | null> {
    const updated = await this.updateDocumentStatus(documentId, 'approved', { generated_by: userId });
    if (updated) {
      await logAuditEvent({
        organizationId: updated.tenant_id,
        userId,
        userName,
        userRole: 'analyst',
        action: 'DOCUMENT_APPROVED',
        module: 'DOCFLOW',
        recordIdentifier: documentId,
        metadata: { title: updated.title },
      }).catch(() => {});
    }
    return updated;
  }

  static async rejectDocument(documentId: string, reason: string, userId?: string, userName?: string): Promise<GeneratedDocument | null> {
    const updated = await this.updateDocumentStatus(documentId, 'rejected', { void_reason: reason });
    if (updated) {
      await logAuditEvent({
        organizationId: updated.tenant_id,
        userId,
        userName,
        userRole: 'analyst',
        action: 'DOCUMENT_REJECTED',
        module: 'DOCFLOW',
        recordIdentifier: documentId,
        metadata: { reason },
      }).catch(() => {});
    }
    return updated;
  }

  /**
   * Anula un documento de forma segura. Si el documento está firmado, su contenido y firmas originales
   * permanecen inmutables, pero su estado pasa a voided con motivo de anulación.
   */
  static async voidDocument(
    documentId: string,
    reason: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string }
  ): Promise<GeneratedDocument | null> {
    const doc = await this.getDocument(documentId);
    if (!doc) {
      throw new Error(`Documento con ID ${documentId} no encontrado.`);
    }

    const updated = await this.updateDocumentStatus(documentId, 'voided', {
      voided_at: new Date().toISOString(),
      void_reason: reason,
    });

    if (updated) {
      await logAuditEvent({
        organizationId: doc.tenant_id || userContext?.organizationId,
        userId: userContext?.userId,
        userName: userContext?.userName,
        userRole: 'tenant_admin',
        action: 'DOCUMENT_VOIDED',
        module: 'DOCFLOW',
        recordIdentifier: documentId,
        metadata: {
          title: doc.title,
          previous_status: doc.status,
          was_signed: doc.status === 'signed',
          reason,
        },
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Reemplaza un documento con una nueva versión generada a partir de los datos más recientes.
   */
  static async replaceDocument(
    documentId: string,
    templateId: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string },
    existingApp?: any
  ): Promise<{ newDocument: GeneratedDocument; html: string; validation: ValidationResult }> {
    const prevDoc = await this.getDocument(documentId);
    if (!prevDoc) {
      throw new Error(`Documento previo con ID ${documentId} no encontrado.`);
    }

    // Si ya está firmado, NO destruimos el firmado; generamos uno nuevo y marcamos el anterior como superseded
    await this.updateDocumentStatus(documentId, 'superseded');

    const result = await this.generateDocument(prevDoc.case_id, templateId, userContext, existingApp);

    await this.updateDocumentStatus(result.document.id, result.document.status, {
      replaces_document_id: documentId,
    });

    await logAuditEvent({
      organizationId: prevDoc.tenant_id || userContext?.organizationId,
      userId: userContext?.userId,
      userName: userContext?.userName,
      userRole: 'operator',
      action: 'DOCUMENT_REPLACED',
      module: 'DOCFLOW',
      recordIdentifier: result.document.id,
      metadata: {
        replaces_document_id: documentId,
        previous_version: prevDoc.document_version,
        new_version: result.document.document_version,
      },
    }).catch(() => {});

    return {
      newDocument: result.document,
      html: result.html,
      validation: result.validation,
    };
  }

  static async markSigned(
    documentId: string,
    signedUrl?: string,
    evidence?: Record<string, any>,
    userContext?: { userId?: string; userName?: string }
  ): Promise<GeneratedDocument | null> {
    const updated = await this.updateDocumentStatus(documentId, 'signed', {
      signed_file_url: signedUrl,
      signed_at: new Date().toISOString(),
      signature_evidence: evidence,
    });

    if (updated) {
      await logAuditEvent({
        organizationId: updated.tenant_id,
        userId: userContext?.userId,
        userName: userContext?.userName,
        userRole: 'notary',
        action: 'DOCUMENT_SIGNED',
        module: 'DOCFLOW',
        recordIdentifier: documentId,
        metadata: {
          title: updated.title,
          signed_at: updated.signed_at,
          hash: updated.file_hash,
        },
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Genera el paquete completo para escribano (Ficha, Resumen, Instrucciones, Checklist)
   */
  static async generateNotaryPack(
    caseId: string,
    userContext?: { userId?: string; userName?: string; organizationId?: string },
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
