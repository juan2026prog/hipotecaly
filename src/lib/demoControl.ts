// ==============================================================================
// HIPOTECALY: Control Centralizado de Modo Demo (Single Source of Truth)
// Reglas: Separación estricta entre Modo Demo (Estudio Nova) y Modo Real / Producción
// ==============================================================================

export const DEMO_ORGANIZATION_SLUG = 'estudio-nova';
export const DEMO_ORGANIZATION_ID = 'd0000000-0000-0000-0000-000000000001';

export function isProduction(): boolean {
  if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'production' || process.env?.VERCEL_ENV === 'production')) {
    return true;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return true;
  }
  return false;
}

export function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true;
  }
  return false;
}

export function isTest(): boolean {
  if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST === 'true' || process.env?.PLAYWRIGHT === '1')) {
    return true;
  }
  return false;
}

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
 * Determina si una organización es la organización de demostración (Estudio Nova o flag is_demo)
 */
export function isDemoOrganization(
  orgOrSlugOrId?: { id?: string; slug?: string; is_demo?: boolean; demo_mode?: boolean } | string | null
): boolean {
  if (!orgOrSlugOrId) return false;

  if (typeof orgOrSlugOrId === 'string') {
    const clean = orgOrSlugOrId.trim().toLowerCase();
    return (
      clean === DEMO_ORGANIZATION_SLUG ||
      clean === 'nova' ||
      clean === 'nova-demo' ||
      clean === DEMO_ORGANIZATION_ID
    );
  }

  if (typeof orgOrSlugOrId === 'object') {
    if (orgOrSlugOrId.is_demo === true || orgOrSlugOrId.demo_mode === true) return true;
    if (orgOrSlugOrId.slug && isDemoOrganization(orgOrSlugOrId.slug)) return true;
    if (orgOrSlugOrId.id && isDemoOrganization(orgOrSlugOrId.id)) return true;
  }

  return false;
}

/**
 * Fuente única de verdad para verificar si una operación se ejecuta en Modo Demo.
 * Regla de Oro: Las organizaciones reales JAMÁS ejecutan datos simulados,
 * independientemente de la URL o pathname.
 */
export function isDemoMode(options?: DemoContextCheckOptions): boolean {
  // 1. Si se pasa un flag explícito, respetarlo
  if (options?.isDemoMode !== undefined && options?.isDemoMode !== null) {
    return options.isDemoMode;
  }

  // 2. Si se proporciona organización o slug, la organización persistida es la única fuente de verdad
  if (options?.organizationId) {
    return isDemoOrganization(options.organizationId);
  }

  if (options?.organizationSlug) {
    return isDemoOrganization(options.organizationSlug);
  }

  // 3. Si NO hay contexto de organización, evaluar si estamos en una vista de preview/landing demo pública
  if (isDemoRoute(options?.pathname)) {
    return true;
  }

  // Comprobar parámetros de URL si estamos en frontend sin organización vinculada
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (isDemoRoute(path)) return true;
    if (!isProduction() && window.location.search.includes('demo=true')) return true;
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
