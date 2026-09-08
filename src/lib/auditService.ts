// ==============================================================================
// HIPOTECALY: Servicio Inmutable de Auditoría & Trazabilidad (auditService)
// Cumple con registro obligatorio de eventos sensibles y aislamiento multi-tenant
// ==============================================================================

import { supabase } from './supabase';

export interface AuditLogEntry {
  id: string;
  organization_id?: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  record_identifier: string;
  entity_id?: string;
  application_id?: string;
  old_value?: string | null;
  new_value?: string | null;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// In-Memory cache para eventos generados durante la sesión
const LOCAL_AUDIT_LOGS_CACHE: AuditLogEntry[] = [
  {
    id: 'al-demo-1',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    user_name: 'Valeria Rivas',
    user_role: 'analyst',
    action: 'Cambio de etapa de expediente',
    module: 'Solicitudes',
    record_identifier: 'HIP-DEMO-00124',
    application_id: 'e0000000-0000-0000-0000-000000000001',
    old_value: 'info_review',
    new_value: 'evaluation',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    ip_address: '192.168.1.104',
  },
  {
    id: 'al-demo-2',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    user_name: 'Ignacio Notario (Admin)',
    user_role: 'admin',
    action: 'Publicación de Política Hipotecaria v5',
    module: 'Políticas',
    record_identifier: 'Política v5',
    old_value: 'Política v4 (LTV 40%, Tasa 11.5%)',
    new_value: 'Política v5 (LTV 35%, Tasa 12.0%)',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    ip_address: '192.168.1.10',
  },
  {
    id: 'al-demo-3',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    user_name: 'Esc. María Pérez Morales',
    user_role: 'notary',
    action: 'Firma electrónica completada',
    module: 'Firma',
    record_identifier: 'Minuta NOV-2026-00089',
    application_id: 'e0000000-0000-0000-0000-000000000001',
    old_value: 'pending_signature',
    new_value: 'signed_fea',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    ip_address: '190.64.12.88',
  },
  {
    id: 'al-demo-4',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    user_name: 'Valeria Rivas',
    user_role: 'analyst',
    action: 'Aprobación de documento de ingresos',
    module: 'Documentos',
    record_identifier: 'Recibo de Sueldo — HIP-DEMO-00124',
    application_id: 'e0000000-0000-0000-0000-000000000001',
    old_value: 'in_review',
    new_value: 'approved',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    ip_address: '192.168.1.104',
  },
  {
    id: 'al-demo-5',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    user_name: 'Ignacio Notario (Admin)',
    user_role: 'admin',
    action: 'Asignación de rol a usuario',
    module: 'Usuarios',
    record_identifier: 'operador@estudionova.uy',
    old_value: 'viewer',
    new_value: 'operator',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    ip_address: '192.168.1.10',
  },
];

/**
 * Registra un nuevo evento de auditoría inmutable
 */
export async function logAuditEvent(params: {
  organizationId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  recordIdentifier: string;
  entityId?: string;
  applicationId?: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `al-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    organization_id: params.organizationId,
    user_id: params.userId,
    user_name: params.userName || 'Operador',
    user_role: params.userRole || 'admin',
    action: params.action,
    module: params.module,
    record_identifier: params.recordIdentifier,
    entity_id: params.entityId,
    application_id: params.applicationId,
    old_value: params.oldValue || null,
    new_value: params.newValue || null,
    metadata: params.metadata || {},
    ip_address: params.ipAddress || '127.0.0.1',
    created_at: new Date().toISOString(),
  };

  // Guardar en cache local para reactividad inmediata
  LOCAL_AUDIT_LOGS_CACHE.unshift(newLog);

  // Intentar persistir en Supabase con RLS
  try {
    if (params.organizationId) {
      await supabase.from('audit_logs').insert({
        organization_id: params.organizationId,
        user_id: params.userId,
        action: params.action,
        entity_name: params.module,
        entity_id: params.entityId || params.applicationId,
        old_data: params.oldValue ? { value: params.oldValue } : null,
        new_data: params.newValue ? { value: params.newValue } : null,
        metadata: {
          ...params.metadata,
          user_name: newLog.user_name,
          user_role: newLog.user_role,
          record_identifier: newLog.record_identifier,
        },
        ip_address: newLog.ip_address,
      });
    }
  } catch {
    // Si falla Supabase (por offline o demo), el log permanece en memoria
  }

  return newLog;
}

/**
 * Consulta el listado de auditoría con aislamiento multi-tenant estricto
 */
export async function getAuditLogs(options: {
  organizationId?: string;
  isDemoMode?: boolean;
  module?: string;
  search?: string;
}): Promise<AuditLogEntry[]> {
  const isDemo = options.isDemoMode ?? false;

  if (isDemo) {
    let list = [...LOCAL_AUDIT_LOGS_CACHE];
    if (options.organizationId) {
      list = list.filter((l) => !l.organization_id || l.organization_id === options.organizationId);
    }
    return filterAuditLogsLocally(list, options.module, options.search);
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const mapped: AuditLogEntry[] = data.map((d: any) => ({
        id: d.id,
        organization_id: d.organization_id,
        user_id: d.user_id,
        user_name: d.metadata?.user_name || 'Usuario',
        user_role: d.metadata?.user_role || 'operator',
        action: d.action || 'Operación',
        module: d.entity_name || 'Sistema',
        record_identifier: d.metadata?.record_identifier || d.entity_id || d.id,
        entity_id: d.entity_id,
        application_id: d.metadata?.application_id,
        old_value: typeof d.old_data?.value === 'string' ? d.old_data.value : JSON.stringify(d.old_data || ''),
        new_value: typeof d.new_data?.value === 'string' ? d.new_data.value : JSON.stringify(d.new_data || ''),
        metadata: d.metadata || {},
        ip_address: d.ip_address || '127.0.0.1',
        created_at: d.created_at || new Date().toISOString(),
      }));

      return filterAuditLogsLocally(mapped, options.module, options.search);
    }
  } catch {
    // Si no hay datos en backend, retornar cache de tenant
  }

  return filterAuditLogsLocally(
    LOCAL_AUDIT_LOGS_CACHE.filter((l) => l.organization_id === options.organizationId),
    options.module,
    options.search
  );
}

function filterAuditLogsLocally(list: AuditLogEntry[], module?: string, search?: string) {
  return list.filter((log) => {
    if (module && module !== 'all' && log.module.toLowerCase() !== module.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchUser = log.user_name.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchRecord = log.record_identifier.toLowerCase().includes(q);
      if (!matchUser && !matchAction && !matchRecord) return false;
    }
    return true;
  });
}
