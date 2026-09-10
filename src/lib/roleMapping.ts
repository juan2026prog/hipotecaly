// ==============================================================================
// HIPOTECALY: Capa Centralizada de Mapeo de Roles (Comercial <-> Técnico)
// ==============================================================================

export type CommercialRole =
  | 'Administrador'
  | 'Operador'
  | 'Cliente'
  | 'Inversor'
  | 'Escribano';

export type StaffCommercialRole = 'Administrador' | 'Operador' | 'Escribano';

/**
 * Mapeo de roles técnicos a nombres comerciales simplificados.
 * Mantiene compatibilidad total con roles legacy de base de datos y RBAC.
 */
export const ROLE_DISPLAY_MAP: Record<string, CommercialRole> = {
  // Administrador
  tenant_owner: 'Administrador',
  tenant_admin: 'Administrador',
  admin: 'Administrador',

  // Operador
  analyst: 'Operador',
  operator: 'Operador',
  appraiser: 'Operador',
  valuer: 'Operador',
  operations: 'Operador',
  auditor: 'Operador',
  viewer: 'Operador',

  // Cliente
  borrower: 'Cliente',

  // Inversor
  lender: 'Inversor',

  // Escribano
  notary: 'Escribano',
};

/**
 * Obtiene el nombre comercial de un rol a partir de su identificador técnico.
 */
export function getCommercialRoleLabel(technicalOrCommercialRole: string | undefined | null): CommercialRole {
  if (!technicalOrCommercialRole) return 'Operador';

  const cleanRole = technicalOrCommercialRole.trim().toLowerCase();

  // Si ya viene en formato comercial
  if (['administrador', 'admin'].includes(cleanRole) && !['tenant_admin', 'tenant_owner'].includes(cleanRole)) {
    if (cleanRole === 'administrador') return 'Administrador';
  }
  if (cleanRole === 'operador') return 'Operador';
  if (cleanRole === 'cliente') return 'Cliente';
  if (cleanRole === 'inversor') return 'Inversor';
  if (cleanRole === 'escribano') return 'Escribano';

  return ROLE_DISPLAY_MAP[cleanRole] || 'Operador';
}

/**
 * Retorna el rol técnico representativo para persistencia de backend a partir del nombre comercial.
 */
export function getTechnicalRoleFromCommercial(commercialRole: string): string {
  switch (commercialRole) {
    case 'Administrador':
      return 'tenant_admin';
    case 'Operador':
      return 'analyst';
    case 'Escribano':
      return 'notary';
    case 'Cliente':
      return 'borrower';
    case 'Inversor':
      return 'lender';
    default:
      return 'analyst';
  }
}

/**
 * Descripción dinámica por rol comercial visible en modal de invitación y tarjetas
 */
export const COMMERCIAL_ROLE_DESCRIPTIONS: Record<CommercialRole, string> = {
  Administrador: 'Administra la organización y puede operar todas las áreas del sistema.',
  Operador: 'Trabaja la operación diaria y los expedientes, sin administrar la configuración de la organización.',
  Cliente: 'Persona que solicita financiación y gestiona exclusivamente su propia solicitud.',
  Inversor: 'Prestamista o inversor que participa en oportunidades habilitadas por la organización.',
  Escribano: 'Profesional responsable de la revisión jurídica y de la coordinación de la formalización de los expedientes asignados.',
};

/**
 * Opciones elegibles para invitar personal interno en la organización.
 * EXCLUYE explícitamente Cliente e Inversor.
 */
export const STAFF_INVITATION_OPTIONS: Array<{
  value: StaffCommercialRole;
  technicalRole: string;
  label: string;
  description: string;
}> = [
  {
    value: 'Administrador',
    technicalRole: 'tenant_admin',
    label: 'Administrador',
    description: COMMERCIAL_ROLE_DESCRIPTIONS.Administrador,
  },
  {
    value: 'Operador',
    technicalRole: 'analyst',
    label: 'Operador',
    description: COMMERCIAL_ROLE_DESCRIPTIONS.Operador,
  },
  {
    value: 'Escribano',
    technicalRole: 'notary',
    label: 'Escribano',
    description: COMMERCIAL_ROLE_DESCRIPTIONS.Escribano,
  },
];

/**
 * Retorna las propiedades de diseño de badges UI para cada rol comercial
 */
export function getRoleBadgeStyle(role: string): { label: CommercialRole; bgClass: string; textClass: string } {
  const commercialLabel = getCommercialRoleLabel(role);

  switch (commercialLabel) {
    case 'Administrador':
      return {
        label: 'Administrador',
        bgClass: 'bg-purple-100 border border-purple-200',
        textClass: 'text-purple-800',
      };
    case 'Operador':
      return {
        label: 'Operador',
        bgClass: 'bg-blue-100 border border-blue-200',
        textClass: 'text-blue-800',
      };
    case 'Escribano':
      return {
        label: 'Escribano',
        bgClass: 'bg-amber-100 border border-amber-200',
        textClass: 'text-amber-800',
      };
    case 'Cliente':
      return {
        label: 'Cliente',
        bgClass: 'bg-emerald-100 border border-emerald-200',
        textClass: 'text-emerald-800',
      };
    case 'Inversor':
      return {
        label: 'Inversor',
        bgClass: 'bg-indigo-100 border border-indigo-200',
        textClass: 'text-indigo-800',
      };
    default:
      return {
        label: 'Operador',
        bgClass: 'bg-slate-100 border border-slate-200',
        textClass: 'text-slate-700',
      };
  }
}
