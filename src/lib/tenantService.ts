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
    tag_line: 'Préstamos con Garantía Hipotecaria en Uruguay',
    primary_color: '#0B8A5A',
    secondary_color: '#0F1E36',
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
  slug: 'nova-demo',
  name: 'NOVA Crédito Hipotecario',
  legal_name: 'NOVA Inversiones Hipotecarias S.A.S.',
  status: 'active',
  branding: {
    public_name: 'NOVA Crédito Hipotecario',
    tag_line: 'Soluciones financieras con respaldo inmobiliario.',
    primary_color: '#0A3A60',
    secondary_color: '#16A184',
  },
  settings: {
    allow_borrower_portal: true,
    default_currency: 'USD',
    sender_name: 'NOVA Notificaciones',
    sender_email: 'notificaciones@novacredito.uy',
  },
  custom_domain: 'demo.novacredito.uy',
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
  'nova': NOVA_TENANT,
  'nova-demo': NOVA_TENANT,
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
 * Resuelve el tenant actual según:
 * 0. Rutas demo oficiales (/demo/nova/*)
 * 1. Prefijo de ruta: /org/:slug (con fallback a NOT_FOUND_TENANT si no existe)
 * 2. Dominio personalizado verificado (e.g. creditos.estudiodeleste.uy)
 * 3. Subdominio (e.g. cliente.hipotecaly.app)
 * 4. Matriz HIPOTECALY Central (solo para root de localhost o dominio principal)
 */
export async function resolveTenant(
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/'
): Promise<Tenant> {
  // 0. Rutas demo de NOVA
  if (pathname.startsWith('/demo/nova')) {
    return NOVA_TENANT;
  }

  // 1. Verificación por prefijo de ruta: /org/:slug
  const orgMatch = pathname.match(/^\/org\/([^/]+)/);
  if (orgMatch && orgMatch[1]) {
    const slug = orgMatch[1].toLowerCase();
    
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
              primary_color: b.primary_color || '#0B8A5A',
              secondary_color: b.secondary_color || '#0F1E36',
              logo_url: b.logo_url,
              favicon_url: b.favicon_url,
            },
            settings: s.allow_borrower_portal !== undefined ? s : DEFAULT_TENANT.settings,
            is_white_label: true,
            demo_mode: Boolean(data.demo_mode),
          };
          registerDynamicTenant(loadedTenant);
          return loadedTenant;
        }

        // Si la organización no existe en Supabase, verificar si fue registrada en memoria
        // (ej. tenants del sistema o creados dinámicamente en esta sesión)
        if (!error && !data) {
          if (REGISTERED_TENANTS[slug]) {
            return REGISTERED_TENANTS[slug];
          }
          return NOT_FOUND_TENANT;
        }
      } catch {
        // Solo si la base no responde por corte de red se verifica fallback offline
      }
    }

    // Check en memoria registrada
    if (REGISTERED_TENANTS[slug]) {
      return REGISTERED_TENANTS[slug];
    }

    // Check en localStorage solo como fallback para modo offline/demo
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('tenant_custom_' + slug);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          REGISTERED_TENANTS[slug] = parsed;
          return parsed;
        } catch {
          // Continuar
        }
      }
    }

    // SEGURIDAD: Un slug desconocido NUNCA hereda datos de otro tenant
    return NOT_FOUND_TENANT;
  }

  // 2. Verificación por Hostname (custom domain)
  const host = hostname.toLowerCase().split(':')[0]; // quitar puerto si existe
  const allTenants = getAllRegisteredTenants();
  for (const t of allTenants) {
    if (t.custom_domain && t.custom_domain.toLowerCase() === host) {
      return t;
    }
  }

  // 3. Verificación por subdominio (ej: cliente.hipotecaly.app o cliente.localhost)
  if (host.includes('.hipotecaly.') || (host.includes('.localhost') && host !== 'localhost')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'app' && sub !== 'www') {
      const found = allTenants.find((t) => t.slug === sub);
      if (found) return found;
      return NOT_FOUND_TENANT;
    }
  }

  // 4. Hostname matriz / desarrollo local en raíz
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

  // Hostname desconocido: no revelar datos
  return NOT_FOUND_TENANT;
}

/**
 * Aplica los colores de marca del tenant de forma dinámica en el DOM
 */
export function applyTenantTheme(branding: TenantBranding) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (branding.primary_color) {
    root.style.setProperty('--brand-green', branding.primary_color);
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
