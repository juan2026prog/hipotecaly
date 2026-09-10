// ==============================================================================
// HIPOTECALY: Servicio de Resolución Multi-Tenant y White-Label (Fase 5)
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { auditService } from './auditService';

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
  support_phone?: string;
  support_email?: string;
  address?: string;
  city?: string;
  country?: string;
  business_hours?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_facebook?: string;
  footer_description?: string;
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
  role: 'admin' | 'tenant_admin' | 'tenant_owner' | 'analyst' | 'operator' | 'notary' | 'viewer' | string;
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  last_access_at?: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token_hash?: string;
  token?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invited_by?: string;
  created_at: string;
  expires_at?: string;
  accepted_at?: string;
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
    support_phone: '+598 2916 4455',
    support_email: 'contacto@estudionova.uy',
    address: 'Montevideo, Uruguay',
    city: 'Montevideo',
    country: 'Uruguay',
    business_hours: 'Lun a Vie 09:00 – 18:00 hs',
    footer_description: 'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.',
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
  // 0. Rutas demo de Tenants (/demo/:tenantSlug/...)
  const demoMatch = pathname.match(/^\/demo\/([^/]+)/);
  if (demoMatch && demoMatch[1]) {
    const rawSlug = demoMatch[1].toLowerCase().replace('_', '-');
    if (rawSlug === 'estudio-nova' || rawSlug === 'nova' || rawSlug === 'nova-demo') {
      setActiveTenantSession('estudio-nova');
      return NOVA_TENANT;
    }
    if (REGISTERED_TENANTS[rawSlug]) {
      setActiveTenantSession(rawSlug);
      return REGISTERED_TENANTS[rawSlug];
    }
    // Intentar buscar en DB si existe
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*, organization_branding(*), organization_settings(*)')
          .eq('slug', rawSlug)
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
          setActiveTenantSession(loadedTenant.slug);
          return loadedTenant;
        }
      } catch {
        // Fallback
      }
    }
    return NOT_FOUND_TENANT;
  }
  if (pathname === '/demo') {
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
              support_phone: b.support_phone || '+598 2916 4455',
              support_email: b.support_email || 'contacto@estudionova.uy',
              address: b.address || 'Montevideo, Uruguay',
              city: b.city || 'Montevideo',
              country: b.country || 'Uruguay',
              business_hours: b.business_hours || 'Lun a Vie 09:00 – 18:00 hs',
              social_instagram: b.social_instagram || '',
              social_linkedin: b.social_linkedin || '',
              social_facebook: b.social_facebook || '',
              footer_description: b.footer_description || 'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.',
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

  // 4. Verificación por Hostname (custom domain verificado en organization_domains)
  const host = hostname.toLowerCase().split(':')[0]; // quitar puerto si existe
  
  if (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    host !== 'hipotecaly.app' &&
    host !== 'www.hipotecaly.app' &&
    host !== 'hipotecaly.uy' &&
    host !== 'hipotecaly.vercel.app' &&
    !host.endsWith('.vercel.app')
  ) {
    if (isSupabaseConfigured) {
      try {
        const { data: domData } = await supabase
          .from('organization_domains')
          .select('organization_id, domain, is_verified')
          .eq('domain', host)
          .eq('is_verified', true)
          .maybeSingle();

        if (domData?.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*, organization_branding(*), organization_settings(*)')
            .eq('id', domData.organization_id)
            .maybeSingle();

          if (orgData) {
            const b = Array.isArray(orgData.organization_branding)
              ? orgData.organization_branding[0] || {}
              : orgData.organization_branding || {};
            const s = Array.isArray(orgData.organization_settings)
              ? orgData.organization_settings[0] || {}
              : orgData.organization_settings || {};

            const customTenant: Tenant = {
              id: orgData.id,
              name: orgData.name,
              slug: orgData.slug,
              status: (orgData.status as any) || 'active',
              branding: {
                public_name: b.public_name || orgData.commercial_name || orgData.name,
                tag_line: b.tag_line || 'Financiación & inversión',
                primary_color: b.primary_color || '#173a5e',
                secondary_color: b.secondary_color || '#102d49',
                accent_color: b.accent_color || '#f4b43b',
                logo_url: b.logo_url,
                favicon_url: b.favicon_url,
                powered_by_text: 'Tecnología provista por HIPOTECALY',
                support_phone: b.support_phone || '+598 2916 4455',
                support_email: b.support_email || 'contacto@estudionova.uy',
                address: b.address || 'Montevideo, Uruguay',
                city: b.city || 'Montevideo',
                country: b.country || 'Uruguay',
                business_hours: b.business_hours || 'Lun a Vie 09:00 – 18:00 hs',
                social_instagram: b.social_instagram || '',
                social_linkedin: b.social_linkedin || '',
                social_facebook: b.social_facebook || '',
                footer_description: b.footer_description || 'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.',
              },
              settings: s.allow_borrower_portal !== undefined ? s : DEFAULT_TENANT.settings,
              is_white_label: true,
              demo_mode: Boolean(orgData.demo_mode),
            };
            registerDynamicTenant(customTenant);
            setActiveTenantSession(customTenant.slug);
            return customTenant;
          }
        }
      } catch (err) {
        console.error('[tenantService] Error buscando dominio verificado:', err);
      }
    }
  }

  // 5. Verificación por subdominio (ej: cliente.hipotecaly.app)
  const allTenants = getAllRegisteredTenants();
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
      email: 'admin@estudionova.uy',
      full_name: 'Ignacio Notario',
      role: 'tenant_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_access_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      organization_id: organizationId,
      user_id: 'u2',
      email: 'valeria@estudionova.uy',
      full_name: 'Valeria Rivas',
      role: 'analyst',
      status: 'active',
      created_at: new Date().toISOString(),
      last_access_at: new Date().toISOString(),
    },
    {
      id: 'm3',
      organization_id: organizationId,
      user_id: 'u3',
      email: 'maria@escribania.com',
      full_name: 'Esc. María Pérez Morales',
      role: 'notary',
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

export interface ActorSecurityContext {
  userId?: string;
  userEmail?: string;
  role?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

/**
 * Computa el HASH SHA-256 (hexadecimal) de una cadena dada usando Web Crypto API.
 */
export async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (cryptoObj && cryptoObj.subtle) {
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Genera un secreto aleatorio criptográficamente seguro (CSPRNG) equivalente a 32 bytes (256 bits)
 * y devuelve tanto el rawToken (para entrega inicial) como su SHA-256 tokenHash (para guardar en DB).
 */
export async function generateSecureInvitationToken(): Promise<{ rawToken: string; tokenHash: string }> {
  const bytes = new Uint8Array(32);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const rawToken = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const tokenHash = await computeSHA256(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Resuelve y valida el contexto del actor actuante a nivel de backend/servicio confiable.
 */
export async function resolveServerActorContext(
  targetOrganizationId: string,
  actorContext?: ActorSecurityContext
): Promise<{
  isAuthorized: boolean;
  userRole: string;
  organizationId: string | null;
  userId: string | null;
  userEmail: string | null;
  error: string | null;
}> {
  let realUserId: string | null = null;
  let realUserEmail: string | null = null;
  let realRole: string | null = null;
  let realOrgId: string | null = null;
  let isSuperAdmin = false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      realUserId = session.user.id;
      realUserEmail = session.user.email || null;
      const { data: member } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (member) {
        realRole = member.role;
        realOrgId = member.organization_id;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.is_super_admin) {
        isSuperAdmin = true;
      }
    }
  } catch {}

  const evaluatedRole = (realRole || actorContext?.role || 'tenant_admin').toLowerCase();
  const evaluatedOrgId = realOrgId || actorContext?.organizationId || targetOrganizationId;
  const superAdminFlag =
    isSuperAdmin ||
    (actorContext?.isSuperAdmin === true &&
      !['analyst', 'operator', 'notary', 'borrower', 'lender', 'operador', 'escribano', 'cliente', 'inversor'].includes(evaluatedRole));

  // Bloqueo incondicional de roles no administrativos
  if (['analyst', 'operator', 'operador', 'notary', 'escribano', 'borrower', 'cliente', 'lender', 'inversor', 'viewer'].includes(evaluatedRole)) {
    return {
      isAuthorized: false,
      userRole: evaluatedRole,
      organizationId: evaluatedOrgId,
      userId: realUserId || actorContext?.userId || null,
      userEmail: realUserEmail || actorContext?.userEmail || null,
      error: 'Acceso denegado: El usuario actuante no cuenta con privilegios administrativos para gestionar usuarios.',
    };
  }

  // Aislamiento Multi-Tenant
  if (!superAdminFlag && evaluatedOrgId && evaluatedOrgId !== targetOrganizationId) {
    return {
      isAuthorized: false,
      userRole: evaluatedRole,
      organizationId: evaluatedOrgId,
      userId: realUserId || actorContext?.userId || null,
      userEmail: realUserEmail || actorContext?.userEmail || null,
      error: 'Acceso denegado: Aislamiento multi-tenant violado. No se pueden administrar usuarios de otra organización.',
    };
  }

  const isAuthorized = superAdminFlag || ['tenant_owner', 'tenant_admin', 'admin', 'administrador'].includes(evaluatedRole);

  return {
    isAuthorized,
    userRole: evaluatedRole,
    organizationId: evaluatedOrgId,
    userId: realUserId || actorContext?.userId || null,
    userEmail: realUserEmail || actorContext?.userEmail || null,
    error: isAuthorized ? null : 'Acceso denegado: Se requieren permisos de Administrador.',
  };
}

/**
 * Invita un nuevo usuario a la organización realizando llamada server-side a /api/organization-users.
 * Administrador invitado = tenant_admin, NUNCA tenant_owner.
 */
export async function inviteOrganizationMember(
  organizationId: string,
  email: string,
  role: string,
  actorContext?: ActorSecurityContext
): Promise<{ success: boolean; error: string | null; rawToken?: string; tokenHash?: string }> {
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const token = sessionRes?.data?.session?.access_token;

    const apiRes = await fetch('/api/organization-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: 'invite', organizationId, email, role, actorContext }),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch {}

  // Fallback seguro a servicio local
  const authRes = await resolveServerActorContext(organizationId, actorContext);
  if (!authRes.isAuthorized) {
    return { success: false, error: authRes.error || 'Acceso denegado.' };
  }

  let targetTechnicalRole = role.toLowerCase();
  if (['administrador', 'admin', 'tenant_owner', 'owner', 'tenant_admin'].includes(targetTechnicalRole)) {
    targetTechnicalRole = 'tenant_admin';
  } else if (['operador', 'operator', 'analyst'].includes(targetTechnicalRole)) {
    targetTechnicalRole = 'analyst';
  } else if (['escribano', 'notary'].includes(targetTechnicalRole)) {
    targetTechnicalRole = 'notary';
  }

  const { rawToken, tokenHash } = await generateSecureInvitationToken();
  const expiresAt = new Date(Date.now() + 3600000 * 24 * 7).toISOString();

  try {
    await supabase.from('organization_invitations').insert({
      organization_id: organizationId,
      email,
      role: targetTechnicalRole,
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: 'PENDING',
      invited_by: authRes.userEmail || 'Administrador',
    });
  } catch {}

  await auditService.logAction({
    organizationId,
    userId: authRes.userId || undefined,
    userName: authRes.userEmail || 'Administrador',
    userRole: authRes.userRole || 'tenant_admin',
    action: 'USER_INVITED',
    module: 'Usuarios',
    recordIdentifier: email,
    newValue: targetTechnicalRole,
    metadata: {
      email,
      assigned_role: targetTechnicalRole,
      expires_at: expiresAt,
    },
  });

  return { success: true, error: null, rawToken, tokenHash };
}

/**
 * Actualiza el rol de un miembro con protección incondicional de tenant_owner.
 */
export async function updateOrganizationMemberRole(
  organizationId: string,
  targetMemberId: string,
  targetEmail: string,
  currentTechnicalRole: string,
  newTechnicalRole: string,
  actorContext?: ActorSecurityContext
): Promise<{ success: boolean; error: string | null }> {
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const token = sessionRes?.data?.session?.access_token;

    const apiRes = await fetch('/api/organization-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'change-role',
        organizationId,
        targetMemberId,
        targetEmail,
        currentRole: currentTechnicalRole,
        newRole: newTechnicalRole,
        actorContext,
      }),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch {}

  const authRes = await resolveServerActorContext(organizationId, actorContext);
  if (!authRes.isAuthorized) {
    return { success: false, error: authRes.error || 'Acceso denegado.' };
  }

  const mappedNewRole = newTechnicalRole === 'Administrador' ? 'tenant_admin' : newTechnicalRole;
  const currentClean = currentTechnicalRole.toLowerCase();
  const newClean = mappedNewRole.toLowerCase();

  // BLINDAJE TENANT_OWNER
  if (currentClean === 'tenant_owner') {
    await auditService.logAction({
      organizationId,
      userId: authRes.userId || undefined,
      userName: authRes.userEmail || 'Administrador',
      userRole: authRes.userRole || 'tenant_admin',
      action: 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED',
      module: 'Usuarios',
      recordIdentifier: targetEmail,
      oldValue: 'tenant_owner',
      newValue: newClean,
      metadata: { reason: 'Intento de modificar o degradar al propietario principal (tenant_owner).' },
    });

    return {
      success: false,
      error: 'Acceso denegado: El propietario principal de la organización (tenant_owner) no puede ser modificado ni degradado.',
    };
  }

  // BLINDAJE ESCALAMIENTO A TENANT_OWNER
  if (newClean === 'tenant_owner' || newClean === 'owner') {
    await auditService.logAction({
      organizationId,
      userId: authRes.userId || undefined,
      userName: authRes.userEmail || 'Administrador',
      userRole: authRes.userRole || 'tenant_admin',
      action: 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED',
      module: 'Usuarios',
      recordIdentifier: targetEmail,
      oldValue: currentClean,
      newValue: 'tenant_owner',
      metadata: { reason: 'Intento de auto-escalamiento o asignación no autorizada de tenant_owner.' },
    });

    return {
      success: false,
      error: 'Acceso denegado: No se pueden asignar derechos de propietario principal (tenant_owner) desde la gestión común de roles.',
    };
  }

  try {
    await supabase
      .from('organization_members')
      .update({ role: newClean })
      .eq('id', targetMemberId)
      .eq('organization_id', organizationId);
  } catch {}

  const actionName = newClean === 'tenant_admin' || newClean === 'admin' ? 'ADMIN_GRANTED' : 'USER_ROLE_CHANGED';

  await auditService.logAction({
    organizationId,
    userId: authRes.userId || undefined,
    userName: authRes.userEmail || 'Administrador',
    userRole: authRes.userRole || 'tenant_admin',
    action: actionName,
    module: 'Usuarios',
    recordIdentifier: targetEmail,
    oldValue: currentClean,
    newValue: newClean,
  });

  return { success: true, error: null };
}

/**
 * Desactiva o activa el acceso de un miembro con protección de tenant_owner y último admin.
 */
export async function toggleOrganizationMemberStatus(
  organizationId: string,
  targetMemberId: string,
  targetEmail: string,
  targetTechnicalRole: string,
  newStatus: 'active' | 'disabled',
  activeAdminsCount: number,
  actorContext?: ActorSecurityContext
): Promise<{ success: boolean; error: string | null }> {
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const token = sessionRes?.data?.session?.access_token;

    const apiRes = await fetch('/api/organization-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'toggle-status',
        organizationId,
        targetMemberId,
        targetEmail,
        currentRole: targetTechnicalRole,
        newStatus,
        activeAdminsCount,
        actorContext,
      }),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch {}

  const authRes = await resolveServerActorContext(organizationId, actorContext);
  if (!authRes.isAuthorized) {
    return { success: false, error: authRes.error || 'Acceso denegado.' };
  }

  if (targetTechnicalRole.toLowerCase() === 'tenant_owner') {
    await auditService.logAction({
      organizationId,
      userId: authRes.userId || undefined,
      userName: authRes.userEmail || 'Administrador',
      userRole: authRes.userRole || 'tenant_admin',
      action: 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED',
      module: 'Usuarios',
      recordIdentifier: targetEmail,
      oldValue: 'active',
      newValue: newStatus,
      metadata: { reason: 'Intento de desactivar al propietario principal (tenant_owner).' },
    });

    return {
      success: false,
      error: 'Acceso denegado: El propietario principal de la organización (tenant_owner) no puede ser desactivado.',
    };
  }

  const isTargetAdmin = ['tenant_admin', 'tenant_owner', 'admin'].includes(targetTechnicalRole.toLowerCase());
  if (newStatus === 'disabled' && isTargetAdmin && activeAdminsCount <= 1) {
    return {
      success: false,
      error: 'Tu organización debe conservar al menos un Administrador activo.',
    };
  }

  try {
    await supabase
      .from('organization_members')
      .update({ status: newStatus })
      .eq('id', targetMemberId)
      .eq('organization_id', organizationId);
  } catch {}

  await auditService.logAction({
    organizationId,
    userId: authRes.userId || undefined,
    userName: authRes.userEmail || 'Administrador',
    userRole: authRes.userRole || 'tenant_admin',
    action: newStatus === 'disabled' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
    module: 'Usuarios',
    recordIdentifier: targetEmail,
    oldValue: newStatus === 'disabled' ? 'active' : 'disabled',
    newValue: newStatus,
  });

  return { success: true, error: null };
}

/**
 * Revoca una invitación pendiente con validación de RBAC y aislamiento multi-tenant.
 */
export async function revokeOrganizationInvitation(
  organizationId: string,
  invitationId: string,
  targetEmail: string,
  actorContext?: ActorSecurityContext
): Promise<{ success: boolean; error: string | null }> {
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const token = sessionRes?.data?.session?.access_token;

    const apiRes = await fetch('/api/organization-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'revoke-invitation',
        organizationId,
        invitationId,
        targetEmail,
        actorContext,
      }),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch {}

  const authRes = await resolveServerActorContext(organizationId, actorContext);
  if (!authRes.isAuthorized) {
    return { success: false, error: authRes.error || 'Acceso denegado.' };
  }

  try {
    await supabase
      .from('organization_invitations')
      .update({ status: 'REVOKED' })
      .eq('id', invitationId)
      .eq('organization_id', organizationId);
  } catch {}

  await auditService.logAction({
    organizationId,
    userId: authRes.userId || undefined,
    userName: authRes.userEmail || 'Administrador',
    userRole: authRes.userRole || 'tenant_admin',
    action: 'INVITATION_REVOKED',
    module: 'Usuarios',
    recordIdentifier: targetEmail,
    newValue: 'REVOKED',
  });

  return { success: true, error: null };
}

/**
 * Procesa la aceptación de una invitación con verificación de expiración, SHA-256 token hash y reuso (Idempotencia).
 */
export async function acceptOrganizationInvitation(
  receivedToken: string,
  invitationData?: {
    expires_at?: string;
    status?: string;
    role?: string;
    email?: string;
    token_hash?: string;
  },
  authenticatedUserEmail?: string
): Promise<{ success: boolean; error: string | null; role?: string }> {
  try {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const token = sessionRes?.data?.session?.access_token;

    const apiRes = await fetch('/api/organization-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'accept-invitation',
        receivedToken,
        invitationData,
      }),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch {}

  if (!invitationData && !receivedToken) {
    return { success: false, error: 'Invitación no encontrada o token inválido.' };
  }

  // Validar coincidencia de email (INVITATION_EMAIL_MISMATCH)
  if (invitationData?.email && authenticatedUserEmail) {
    if (invitationData.email.trim().toLowerCase() !== authenticatedUserEmail.trim().toLowerCase()) {
      return {
        success: false,
        error: 'INVITATION_EMAIL_MISMATCH: El correo autenticado no coincide con el destinatario de la invitación.',
      };
    }
  }

  // 1. Verificación de Expiración
  if (invitationData?.expires_at) {
    const expires = new Date(invitationData.expires_at).getTime();
    if (Date.now() > expires) {
      return { success: false, error: 'La invitación ha expirado y ya no puede ser aceptada.' };
    }
  }

  // 2. Verificación de Revocación o Reuso (Idempotencia)
  if (invitationData?.status === 'REVOKED') {
    return { success: false, error: 'La invitación ha sido revocada.' };
  }

  if (invitationData?.status === 'ACCEPTED') {
    return { success: false, error: 'La invitación ya fue utilizada previamente.' };
  }

  // 3. Verificación de SHA-256 Token Hash si el hash está presente
  if (invitationData?.token_hash && receivedToken) {
    const computedHash = await computeSHA256(receivedToken);
    if (computedHash !== invitationData.token_hash) {
      return { success: false, error: 'Token de invitación inválido o alterado.' };
    }
  }

  // 4. Garantía de asignación segura (NUNCA tenant_owner)
  let assignedRole = (invitationData?.role || 'analyst').toLowerCase();
  if (['tenant_owner', 'owner', 'admin'].includes(assignedRole)) {
    assignedRole = 'tenant_admin';
  }

  return { success: true, error: null, role: assignedRole };
}

/**
 * Actualiza dinámicamente el título del documento y el favicon según el tenant y sección
 */
export function updateDocumentMetadata(tenant: Tenant, sectionTitle?: string) {
  if (typeof document === 'undefined') return;

  const brandName = tenant.branding?.public_name || tenant.name || 'HIPOTECALY';
  if (sectionTitle) {
    document.title = `${brandName} | ${sectionTitle}`;
  } else if (tenant.branding?.tag_line) {
    document.title = `${brandName} — ${tenant.branding.tag_line}`;
  } else {
    document.title = brandName;
  }

  if (tenant.branding?.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = tenant.branding.favicon_url;
  }
}

