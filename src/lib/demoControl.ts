// ==============================================================================
// HIPOTECALY: Control Centralizado de Modo Demo (Single Source of Truth)
// Reglas: Separación estricta entre Modo Demo (Estudio Nova) y Modo Real / Producción
// ==============================================================================

export const DEMO_ORGANIZATION_SLUG = 'estudio-nova';
export const DEMO_ORGANIZATION_ID = 'd0000000-0000-0000-0000-000000000001';
export const DEMO_ORGANIZATION_ALT_ID = 'a0000000-0000-0000-0000-000000000001';

export interface DemoContextCheckOptions {
  pathname?: string;
  organizationId?: string | null;
  organizationSlug?: string | null;
  isDemoMode?: boolean | null;
}

/**
 * Determina si una ruta corresponde a una vista o portal demostrativo
 */
export function isDemoRoute(pathname?: string): boolean {
  if (!pathname && typeof window !== 'undefined') {
    pathname = window.location.pathname;
  }
  if (!pathname) return false;
  return (
    pathname.startsWith('/demo/') ||
    pathname === '/demo' ||
    pathname.startsWith('/demo')
  );
}

/**
 * Determina si una organización es la organización de demostración (Estudio Nova)
 */
export function isDemoOrganization(
  orgOrSlugOrId?: { id?: string; slug?: string; demo_mode?: boolean } | string | null
): boolean {
  if (!orgOrSlugOrId) return false;

  if (typeof orgOrSlugOrId === 'string') {
    const clean = orgOrSlugOrId.trim().toLowerCase();
    return (
      clean === DEMO_ORGANIZATION_SLUG ||
      clean === 'nova' ||
      clean === 'nova-demo' ||
      clean === DEMO_ORGANIZATION_ID ||
      clean === DEMO_ORGANIZATION_ALT_ID
    );
  }

  if (typeof orgOrSlugOrId === 'object') {
    if (orgOrSlugOrId.demo_mode === true) return true;
    if (orgOrSlugOrId.slug && isDemoOrganization(orgOrSlugOrId.slug)) return true;
    if (orgOrSlugOrId.id && isDemoOrganization(orgOrSlugOrId.id)) return true;
  }

  return false;
}

/**
 * Fuente única de verdad para verificar si una operación se ejecuta en Modo Demo
 */
export function isDemoMode(options?: DemoContextCheckOptions): boolean {
  if (options?.isDemoMode === true) return true;

  if (options?.organizationSlug && isDemoOrganization(options.organizationSlug)) {
    return true;
  }

  if (options?.organizationId && isDemoOrganization(options.organizationId)) {
    return true;
  }

  if (isDemoRoute(options?.pathname)) {
    return true;
  }

  // Comprobar parámetros de URL si estamos en frontend
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (isDemoRoute(path)) return true;
    if (window.location.search.includes('demo=true')) return true;
  }

  return false;
}

export type DataSourceType = 'demo' | 'database';

/**
 * Agrega metadatos de origen de datos para auditoría y trazabilidad
 */
export function tagDataSource<T extends Record<string, any>>(data: T, isDemo: boolean): T & { _source: DataSourceType } {
  return {
    ...data,
    _source: isDemo ? 'demo' : 'database',
  };
}

/**
 * Taggea una lista de elementos con metadatos de origen
 */
export function tagDataList<T extends Record<string, any>>(list: T[], isDemo: boolean): Array<T & { _source: DataSourceType }> {
  return list.map((item) => tagDataSource(item, isDemo));
}
