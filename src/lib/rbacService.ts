// ==============================================================================
// HIPOTECALY: Servicio RBAC de Autorización y Permisos Granulares
// ==============================================================================

export type BackofficeRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'tenant_owner'
  | 'admin'
  | 'analyst'
  | 'notary'
  | 'valuer'
  | 'operator'
  | 'auditor'
  | 'viewer';

export type BackofficeAction =
  | 'manage_users'
  | 'publish_policy'
  | 'modify_credit_policy'
  | 'manage_costs'
  | 'manage_legal_terms'
  | 'view_applications'
  | 'edit_application'
  | 'change_app_status'
  | 'review_documents'
  | 'approve_document'
  | 'view_valuations'
  | 'edit_valuations'
  | 'manage_tasks'
  | 'send_communications'
  | 'sign_document'
  | 'view_audit_logs'
  | 'export_data'
  | 'view_consents';

/**
 * Matriz de Permisos por Rol
 */
const ROLE_PERMISSIONS: Record<BackofficeRole, BackofficeAction[]> = {
  super_admin: [
    'manage_users',
    'publish_policy',
    'modify_credit_policy',
    'manage_costs',
    'manage_legal_terms',
    'view_applications',
    'edit_application',
    'change_app_status',
    'review_documents',
    'approve_document',
    'view_valuations',
    'edit_valuations',
    'manage_tasks',
    'send_communications',
    'sign_document',
    'view_audit_logs',
    'export_data',
    'view_consents',
  ],
  tenant_admin: [
    'manage_users',
    'publish_policy',
    'modify_credit_policy',
    'manage_costs',
    'manage_legal_terms',
    'view_applications',
    'edit_application',
    'change_app_status',
    'review_documents',
    'approve_document',
    'view_valuations',
    'edit_valuations',
    'manage_tasks',
    'send_communications',
    'sign_document',
    'view_audit_logs',
    'export_data',
    'view_consents',
  ],
  tenant_owner: [
    'manage_users',
    'publish_policy',
    'modify_credit_policy',
    'manage_costs',
    'manage_legal_terms',
    'view_applications',
    'edit_application',
    'change_app_status',
    'review_documents',
    'approve_document',
    'view_valuations',
    'edit_valuations',
    'manage_tasks',
    'send_communications',
    'sign_document',
    'view_audit_logs',
    'export_data',
    'view_consents',
  ],
  admin: [
    'manage_users',
    'publish_policy',
    'modify_credit_policy',
    'manage_costs',
    'manage_legal_terms',
    'view_applications',
    'edit_application',
    'change_app_status',
    'review_documents',
    'approve_document',
    'view_valuations',
    'edit_valuations',
    'manage_tasks',
    'send_communications',
    'sign_document',
    'view_audit_logs',
    'export_data',
    'view_consents',
  ],
  analyst: [
    'view_applications',
    'edit_application',
    'change_app_status',
    'review_documents',
    'approve_document',
    'view_valuations',
    'manage_tasks',
    'send_communications',
    'view_consents',
  ],
  notary: [
    'view_applications',
    'review_documents',
    'sign_document',
    'manage_tasks',
    'view_consents',
  ],
  valuer: [
    'view_applications',
    'view_valuations',
    'edit_valuations',
    'manage_tasks',
  ],
  operator: [
    'view_applications',
    'manage_tasks',
    'send_communications',
  ],
  auditor: [
    'view_applications',
    'view_audit_logs',
    'view_consents',
    'export_data',
  ],
  viewer: [
    'view_applications',
  ],
};

/**
 * Verifica si un rol tiene permiso para ejecutar una acción
 */
export function canUserPerform(role: string | undefined | null, action: BackofficeAction): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as BackofficeRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(action);
}

/**
 * Valida la autorización y arroja error si el usuario no tiene permisos
 */
export function assertPermission(role: string | undefined | null, action: BackofficeAction, message?: string): void {
  if (!canUserPerform(role, action)) {
    throw new Error(
      message || `Acceso denegado: El rol '${role || 'desconocido'}' no tiene permiso para '${action}'.`
    );
  }
}
