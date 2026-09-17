// ==============================================================================
// HIPOTECALY: Roles comerciales y compatibilidad legacy
// ==============================================================================
// IMPORTANTE:
// Los roles técnicos legacy se conservan por compatibilidad con flujos existentes.
// La autorización nueva de la organización se resuelve por permisos explícitos
// (organization_roles + organization_role_permissions + assignments).
// ==============================================================================

export type CommercialRole =
  | 'Propietario'
  | 'Administrador'
  | 'Operaciones'
  | 'Solo lectura'
  | 'Cliente'
  | 'Inversor'
  | 'Escribano';

export type StaffCommercialRole = 'Administrador' | 'Operaciones' | 'Solo lectura' | 'Escribano';

export const ROLE_DISPLAY_MAP: Record<string, CommercialRole> = {
  tenant_owner: 'Propietario',
  tenant_admin: 'Administrador',
  admin: 'Administrador',
  analyst: 'Operaciones',
  operator: 'Operaciones',
  appraiser: 'Operaciones',
  valuer: 'Operaciones',
  operations: 'Operaciones',
  auditor: 'Solo lectura',
  viewer: 'Solo lectura',
  borrower: 'Cliente',
  lender: 'Inversor',
  notary: 'Escribano',
};

export function getCommercialRoleLabel(technicalOrCommercialRole: string | undefined | null): CommercialRole {
  if (!technicalOrCommercialRole) return 'Solo lectura';
  const cleanRole = technicalOrCommercialRole.trim().toLowerCase();
  if (cleanRole === 'propietario') return 'Propietario';
  if (['administrador', 'admin'].includes(cleanRole)) return 'Administrador';
  if (['operaciones', 'operador'].includes(cleanRole)) return 'Operaciones';
  if (['solo lectura', 'solo_lectura', 'viewer'].includes(cleanRole)) return 'Solo lectura';
  if (cleanRole === 'cliente') return 'Cliente';
  if (cleanRole === 'inversor') return 'Inversor';
  if (cleanRole === 'escribano') return 'Escribano';
  return ROLE_DISPLAY_MAP[cleanRole] || 'Solo lectura';
}

/**
 * Compatibilidad únicamente. Los roles personalizados no deben transformarse a
 * tenant_role; se persisten en organization_roles y assignments.
 */
export function getTechnicalRoleFromCommercial(commercialRole: string): string {
  switch (commercialRole) {
    case 'Propietario': return 'tenant_owner';
    case 'Administrador': return 'tenant_admin';
    case 'Operaciones': return 'operator';
    case 'Solo lectura': return 'viewer';
    case 'Escribano': return 'notary';
    case 'Cliente': return 'borrower';
    case 'Inversor': return 'lender';
    default: return 'viewer';
  }
}

export const COMMERCIAL_ROLE_DESCRIPTIONS: Record<CommercialRole, string> = {
  Propietario: 'Control último de la organización. Es un rol protegido y no se asigna desde la gestión común.',
  Administrador: 'Plantilla con acceso administrativo completo. La organización puede tener uno, varios o ningún administrador adicional al propietario.',
  Operaciones: 'Plantilla para trabajo diario con expedientes, clientes, garantías, documentos y tasaciones.',
  'Solo lectura': 'Plantilla de consulta sin permisos de administración ni mutaciones sensibles.',
  Cliente: 'Persona que solicita financiación y gestiona exclusivamente su propia solicitud.',
  Inversor: 'Prestamista o inversor que participa en oportunidades habilitadas por la organización.',
  Escribano: 'Plantilla especializada para revisión jurídica, checklist y formalización de expedientes asignados.',
};

/**
 * Estas opciones son plantillas iniciales. El administrador puede crear roles
 * personalizados y combinar múltiples roles por usuario.
 */
export const STAFF_INVITATION_OPTIONS: Array<{
  value: StaffCommercialRole;
  technicalRole: string;
  label: string;
  description: string;
}> = [
  { value: 'Administrador', technicalRole: 'tenant_admin', label: 'Administrador', description: COMMERCIAL_ROLE_DESCRIPTIONS.Administrador },
  { value: 'Operaciones', technicalRole: 'operator', label: 'Operaciones', description: COMMERCIAL_ROLE_DESCRIPTIONS.Operaciones },
  { value: 'Solo lectura', technicalRole: 'viewer', label: 'Solo lectura', description: COMMERCIAL_ROLE_DESCRIPTIONS['Solo lectura'] },
  { value: 'Escribano', technicalRole: 'notary', label: 'Escribano', description: COMMERCIAL_ROLE_DESCRIPTIONS.Escribano },
];

export function getRoleBadgeStyle(role: string): { label: CommercialRole; bgClass: string; textClass: string } {
  const label = getCommercialRoleLabel(role);
  switch (label) {
    case 'Propietario': return { label, bgClass: 'bg-amber-100 border border-amber-200', textClass: 'text-amber-900' };
    case 'Administrador': return { label, bgClass: 'bg-purple-100 border border-purple-200', textClass: 'text-purple-800' };
    case 'Operaciones': return { label, bgClass: 'bg-blue-100 border border-blue-200', textClass: 'text-blue-800' };
    case 'Solo lectura': return { label, bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' };
    case 'Escribano': return { label, bgClass: 'bg-amber-50 border border-amber-200', textClass: 'text-amber-800' };
    case 'Cliente': return { label, bgClass: 'bg-emerald-100 border border-emerald-200', textClass: 'text-emerald-800' };
    case 'Inversor': return { label, bgClass: 'bg-indigo-100 border border-indigo-200', textClass: 'text-indigo-800' };
    default: return { label: 'Solo lectura', bgClass: 'bg-slate-100 border border-slate-200', textClass: 'text-slate-700' };
  }
}
