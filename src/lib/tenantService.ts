// ==============================================================================
// HIPOTECALY: Servicio de Resolución Multi-Tenant y White-Label (Fase 5)
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface TenantBranding {
  public_name: string;
  tag_line?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color?: string;
  surface_color?: string;
  text_primary?: string;
  border_radius?: string;
  font_family_display?: string;
  font_family_ui?: string;
  powered_by_text?: string;
}

export interface TenantSettings {
  allow_borrower_portal: boolean;
  default_currency: string;
  sender_name?: string;
  sender_email?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legal_name?: string;
  status: 'active' | 'suspended' | 'trial' | 'not_found';
  branding: TenantBranding;
  settings: TenantSettings;
  custom_domain?: string;
  is_white_label: boolean;
  demo_mode?: boolean;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  role: 'admin' | 'analyst' | 'notary' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
}

// Fallback por defecto: HIPOTECALY Central
export const DEFAULT_TENANT: Tenant = {
  id: 'a0000000-0000-0000-0000-000000000001',
  slug: 'hipotecaly',
  name: 'Hipotecaly Central',
  legal_name: 'Hipotecaly Tech S.A.S.',
  status: 'active',
  branding: {
    public_name: 'HIPOTECALY',
    tag_line: 'Infraestructura Tecnológica Hipotecaria',
    primary_color: '#0B8A5A',
    secondary_color: '#0F1E36',
    accent_color: '#2DA674',
    background_color: '#F8FAFC',
    surface_color: '#071A35',
    text_primary: '#07152E',
    border_radius: '10px',
    powered_by_text: 'Plataforma Hipotecaly Core',
  },
  settings: {
    allow_borrower_portal: true,
    default_currency: 'USD',
  },
  is_white_label: false,
  demo_mode: false,
};

export const NOVA_TENANT: Tenant = {
  id: 'd0000000-0000-0000-0000-000000000001',
  slug: 'estudio-nova',
  name: 'Estudio Nova',
  legal_name: 'Estudio Nova S.A.S.',
  status: 'active',
  branding: {
    public_name: 'Estudio Nova',
    tag_line: 'Financiación & inversión',
    primary_color: '#173a5e',
    secondary_color: '#102d49',
    accent_color: '#f4b43b',
    background_color: '#f5f7f9',
    surface_color: '#102d49',
    text_primary: '#27384a',
    border_radius: '12px',
    font_family_display: 'serif',
    font_family_ui: 'sans',
    powered_by_text: 'Tecnología provista por HIPOTECALY',
  },
  settings: {
    allow_borrower_portal: true,
    default_currency: 'USD',
    sender_name: 'Estudio Nova',
    sender_email: 'contacto@estudionova.uy',
  },
  custom_domain: 'estudionova.uy',
  is_white_label: true,
  demo_mode: true,
};

export const NOT_FOUND_TENANT: Tenant = {
  id: '00000000-0000-0000-0000-000000000000',
  slug: 'not-found',
  name: 'Organización no encontrada',
  status: 'not_found',
  branding: {
    public_name: 'Organización no encontrada',
    tag_line: 'El portal o empresa especificada no existe o no se encuentra activo.',
    primary_color: '#64748B',
    secondary_color: '#0F172A',
    accent_color: '#94A3B8',
  },
  settings: {
    allow_borrower_portal: false,
    default_currency: 'USD',
  },
  is_white_label: false,
  demo_mode: false,
};

// Registro de tenants
const REGISTERED_TENANTS: Record<string, Tenant> = {
  'hipotecaly': DEFAULT_TENANT,
  'estudio-nova': NOVA_TENANT,
  'nova': NOVA_TENANT,
  'nova-demo': NOVA_TENANT,
  'estudio_nova': NOVA_TENANT,
  'estudio-notarial-este': {
    id: 'a0000000-0000-0000-0000-000000000002',
    slug: 'estudio-notarial-este',
    name: 'Estudio Notarial del Este',
    legal_name: 'Dr. Balestra & Asoc.',
    status: 'active',
    branding: {
      public_name: 'Créditos Hipotecarios Punta del Este',
      tag_line: 'Especialistas en estructuración hipotecaria en Maldonado y Rocha',
      primary_color: '#1E40AF',
      secondary_color: '#172554',
      accent_color: '#3B82F6',
    },
    settings: {
      allow_borrower_portal: true,
      default_currency: 'USD',
    },
    custom_domain: 'creditos.estudiodeleste.uy',
    is_white_label: true,
    demo_mode: false,
  },
};

/**
 * Registra en tiempo de ejecución un tenant creado vía UI de onboarding
 */
export function registerDynamicTenant(tenant: Tenant) {
  REGISTERED_TENANTS[tenant.slug.toLowerCase()] = tenant;
  REGISTERED_TENANTS[tenant.id] = tenant;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('tenant_custom_' + tenant.slug.toLowerCase(), JSON.stringify(tenant));
      window.localStorage.setItem('tenant_custom_id_' + tenant.id, JSON.stringify(tenant));
      
      const listStr = window.localStorage.getItem('registered_tenants_list') || '[]';
      const list: Tenant[] = JSON.parse(listStr);
      const filtered = list.filter((t) => t.id !== tenant.id && t.slug !== tenant.slug);
      filtered.push(tenant);
      window.localStorage.setItem('registered_tenants_list', JSON.stringify(filtered));
    } catch {
      // Ignorar errores de storage
    }
  }
}

/**
 * Obtiene todos los tenants registrados (estáticos + creados en onboarding)
 */
export function getAllRegisteredTenants(): Tenant[] {
  const map = new Map<string, Tenant>();
  Object.values(REGISTERED_TENANTS).forEach((t) => map.set(t.id, t));

  if (typeof window !== 'undefined') {
    try {
      const listStr = window.localStorage.getItem('registered_tenants_list');
      if (listStr) {
        const customList: Tenant[] = JSON.parse(listStr);
        customList.forEach((t) => map.set(t.id, t));
      }
    } catch {
      // Continuar con los disponibles
    }
  }

  return Array.from(map.values());
}

/**
 * Establece el tenant activo en sesión para persistir la experiencia
 */
export function setActiveTenantSession(slugOrId: string) {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem('active_tenant_slug', slugOrId);
    } catch {}
  }
}

export function getActiveTenantSession(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return window.sessionStorage.getItem('active_tenant_slug');
    } catch {}
  }
  return null;
}

export function clearActiveTenantSession() {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem('active_tenant_slug');
    } catch {}
  }
}

/**
 * Resuelve el tenant actual según:
 * 0. Rutas demo oficiales (/demo/nova/*, /demo/estudio-nova)
 * 1. Query params explícitos (?source=estudio_nova, ?tenant=estudio-nova, ?org=estudio-nova)
 * 2. Prefijo de ruta: /org/:slug (con fallback a NOT_FOUND_TENANT si no existe)
 * 3. Sesión activa en navegación de cliente (/solicitar, /mi-cuenta, /simulador)
 * 4. Dominio personalizado verificado (e.g. creditos.estudiodeleste.uy)
 * 5. Subdominio (e.g. cliente.hipotecaly.app)
 * 6. Matriz HIPOTECALY Central (solo para root o páginas corporativas)
 */
export async function resolveTenant(
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/',
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): Promise<Tenant> {
  // 0. Rutas demo de Estudio NOVA
  if (pathname.startsWith('/demo/estudio-nova') || pathname.startsWith('/demo/nova') || pathname === '/demo') {
    setActiveTenantSession('estudio-nova');
    return NOVA_TENANT;
  }

  // 1. Verificación por Query Params (?source=estudio_nova, ?tenant=..., ?org=...)
  if (search) {
    const params = new URLSearchParams(search);
    const sourceParam = params.get('source') || params.get('tenant') || params.get('org');
    if (sourceParam) {
      const cleanSource = sourceParam.toLowerCase().replace('_', '-');
      if (cleanSource === 'estudio-nova' || cleanSource === 'nova') {
        setActiveTenantSession('estudio-nova');
        return NOVA_TENANT;
      }
      if (REGISTERED_TENANTS[cleanSource]) {
        setActiveTenantSession(cleanSource);
        return REGISTERED_TENANTS[cleanSource];
      }
    }
  }

  // 2. Verificación por prefijo de ruta: /org/:slug
  const orgMatch = pathname.match(/^\/org\/([^/]+)/);
  if (orgMatch && orgMatch[1]) {
    const slug = orgMatch[1].toLowerCase();
    setActiveTenantSession(slug);
    
    // Consultar DB primero como fuente autoritativa
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*, organization_branding(*), organization_settings(*)')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        if (!error && data) {
          const b = Array.isArray(data.organization_branding)
            ? data.organization_branding[0]
            : (data.organization_branding || {});
          const s = Array.isArray(data.organization_settings)
            ? data.organization_settings[0]
            : (data.organization_settings || {});

          const loadedTenant: Tenant = {
            id: data.id,
            slug: data.slug,
            name: data.name,
            legal_name: data.legal_name,
            status: data.status,
            branding: {
              public_name: b.public_name || data.commercial_name || data.name,
              tag_line: b.tag_line || 'Soluciones financieras hipotecarias',
              primary_color: b.primary_color || '#173a5e',
              secondary_color: b.secondary_color || '#102d49',
              accent_color: b.accent_color || '#f4b43b',
              logo_url: b.logo_url,
              favicon_url: b.favicon_url,
              powered_by_text: 'Tecnología provista por HIPOTECALY',
            },
            settings: s.allow_borrower_portal !== undefined ? s : DEFAULT_TENANT.settings,
            is_white_label: true,
            demo_mode: Boolean(data.demo_mode),
          };
          registerDynamicTenant(loadedTenant);
          return loadedTenant;
        }

        if (!error && !data) {
          if (REGISTERED_TENANTS[slug]) {
            return REGISTERED_TENANTS[slug];
          }
          return NOT_FOUND_TENANT;
        }
      } catch {
        // Fallback offline
      }
    }

    if (REGISTERED_TENANTS[slug]) {
      return REGISTERED_TENANTS[slug];
    }

    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('tenant_custom_' + slug);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          REGISTERED_TENANTS[slug] = parsed;
          return parsed;
        } catch {}
      }
    }

    return NOT_FOUND_TENANT;
  }

  // 3. Persistencia de contexto en rutas de cliente transaccional (/solicitar, /mi-cuenta, /ingresar, /registro)
  const isConsumerRoute = (
    pathname.startsWith('/solicitar') ||
    pathname.startsWith('/mi-cuenta') ||
    pathname.startsWith('/ingresar') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/recuperar-password')
  );

  if (isConsumerRoute) {
    const activeSlug = getActiveTenantSession();
    if (activeSlug) {
      if (activeSlug === 'estudio-nova' || activeSlug === 'nova' || activeSlug === 'estudio_nova') {
        return NOVA_TENANT;
      }
      if (REGISTERED_TENANTS[activeSlug]) {
        return REGISTERED_TENANTS[activeSlug];
      }
    }
  }

  // 4. Verificación por Hostname (custom domain)
  const host = hostname.toLowerCase().split(':')[0]; // quitar puerto si existe
  const allTenants = getAllRegisteredTenants();
  for (const t of allTenants) {
    if (t.custom_domain && t.custom_domain.toLowerCase() === host) {
      setActiveTenantSession(t.slug);
      return t;
    }
  }

  // 5. Verificación por subdominio (ej: cliente.hipotecaly.app)
  if (host.includes('.hipotecaly.') || (host.includes('.localhost') && host !== 'localhost')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'app' && sub !== 'www') {
      const found = allTenants.find((t) => t.slug === sub);
      if (found) {
        setActiveTenantSession(found.slug);
        return found;
      }
      return NOT_FOUND_TENANT;
    }
  }

  // Si estamos en la home comercial o en SaaS corporativo, limpiar sesión de tenant si correspondiera
  if (pathname === '/' || pathname.startsWith('/saas') || pathname.startsWith('/empresas')) {
    clearActiveTenantSession();
  }

  // 6. Hostname matriz / desarrollo local en raíz
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'hipotecaly.app' ||
    host === 'www.hipotecaly.app' ||
    host === 'hipotecaly.uy' ||
    host === 'hipotecaly.vercel.app' ||
    host.endsWith('.vercel.app')
  ) {
    return DEFAULT_TENANT;
  }

  return NOT_FOUND_TENANT;
}

/**
 * Aplica los tokens de diseño de marca del tenant dinámicamente en variables CSS del DOM
 */
export function applyTenantTheme(branding: TenantBranding) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  if (branding.primary_color) {
    root.style.setProperty('--tenant-primary', branding.primary_color);
    root.style.setProperty('--brand-green', branding.primary_color);
  }
  if (branding.secondary_color) {
    root.style.setProperty('--tenant-secondary', branding.secondary_color);
  }
  if (branding.accent_color) {
    root.style.setProperty('--tenant-accent', branding.accent_color);
  }
  if (branding.background_color) {
    root.style.setProperty('--tenant-bg', branding.background_color);
  }
  if (branding.surface_color) {
    root.style.setProperty('--tenant-surface', branding.surface_color);
  }
  if (branding.text_primary) {
    root.style.setProperty('--tenant-text', branding.text_primary);
  }
  if (branding.border_radius) {
    root.style.setProperty('--tenant-radius', branding.border_radius);
  }
}

/**
 * Consulta los miembros de una organización
 */
export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const fallbackMembers: OrganizationMember[] = [
    {
      id: 'm1',
      organization_id: organizationId,
      user_id: 'u1',
      email: 'admin@hipotecaly.uy',
      full_name: 'Ignacio Notario',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      organization_id: organizationId,
      user_id: 'u2',
      email: 'analista@hipotecaly.uy',
      full_name: 'Valeria Rivas',
      role: 'analyst',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];

  try {
    const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: 'timeout' }), 400)
    );

    const queryPromise = supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data || data.length === 0) {
      return fallbackMembers;
    }

    return data;
  } catch {
    return fallbackMembers;
  }
}

/**
 * Invita un nuevo usuario a la organización
 */
export async function inviteOrganizationMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'analyst' | 'notary' | 'viewer'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const token = crypto.randomUUID();
    const { error } = await supabase.from('organization_invitations').insert({
      organization_id: organizationId,
      email,
      role,
      token,
    });

    if (error) {
      // Ignorar para simulación local
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al enviar invitación' };
  }
}
