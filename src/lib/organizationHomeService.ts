// ==============================================================================
// HIPOTECALY: Servicio de Configuración de Home y Assets de Organización
// Fuente de verdad en Supabase con RLS, reactividad y validación de seguridad
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export type HeroBackgroundMode = 'color' | 'image' | 'image_overlay';
export type HeroImagePosition = 'left' | 'center' | 'right';

export interface OrganizationHomeSettings {
  id?: string;
  organizationId: string;

  // Contenido Hero
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;

  // Botones CTA
  heroPrimaryCtaText: string;
  heroPrimaryCtaTarget: string;
  heroPrimaryCtaVisible: boolean;

  heroSecondaryCtaText: string;
  heroSecondaryCtaTarget: string;
  heroSecondaryCtaVisible: boolean;

  heroTrustLine: string;

  // Apariencia y Fondo del Hero
  heroBackgroundMode: HeroBackgroundMode;
  heroBackgroundColor: string;
  heroBackgroundImageUrl: string;
  heroOverlayColor: string;
  heroOverlayOpacity: number; // 0 - 100
  heroImagePosition: HeroImagePosition;
  heroPatternEnabled: boolean;

  // Switches de visibilidad de secciones
  showMetrics: boolean;
  showPropertyTypes: boolean;
  showSimulator: boolean;
  showHowItWorks: boolean;
  showOperationSection: boolean;
  showInvestorSection: boolean;
  showFaq: boolean;
  showContact: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS: OrganizationHomeSettings = {
  organizationId: 'd0000000-0000-0000-0000-000000000001',
  heroEyebrow: 'FINANCIACIÓN CON GARANTÍA HIPOTECARIA',
  heroTitle: 'Convertí el valor de tu inmueble en capital para avanzar.',
  heroDescription:
    'Accedé a una evaluación clara y ordenada de tu operación. Viviendas, locales comerciales y campos con respaldo para una financiación adaptada a cada caso.',
  heroPrimaryCtaText: 'SIMULAR FINANCIACIÓN',
  heroPrimaryCtaTarget: '#simulador',
  heroPrimaryCtaVisible: true,
  heroSecondaryCtaText: 'CÓMO FUNCIONA',
  heroSecondaryCtaTarget: '#como-funciona',
  heroSecondaryCtaVisible: true,
  heroTrustLine: 'Evaluación inicial online · Proceso documentado · Seguimiento de la operación',
  heroBackgroundMode: 'image_overlay',
  heroBackgroundColor: '#102d49',
  heroBackgroundImageUrl:
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  heroOverlayColor: '#102d49',
  heroOverlayOpacity: 65,
  heroImagePosition: 'center',
  heroPatternEnabled: true,
  showMetrics: true,
  showPropertyTypes: true,
  showSimulator: true,
  showHowItWorks: true,
  showOperationSection: true,
  showInvestorSection: true,
  showFaq: true,
  showContact: true,
};

// Caché en memoria reactiva por organización
const homeSettingsCache = new Map<string, OrganizationHomeSettings>();
const listeners = new Set<(orgId: string, settings: OrganizationHomeSettings) => void>();

export function subscribeToOrganizationHomeSettings(
  callback: (orgId: string, settings: OrganizationHomeSettings) => void
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyHomeListeners(orgId: string, settings: OrganizationHomeSettings) {
  listeners.forEach((cb) => {
    try {
      cb(orgId, settings);
    } catch {
      // Ignorar errores en callbacks
    }
  });
}

/**
 * Sanitiza links de destino para prevenir esquemas peligrosos como javascript:, data:, vbscript:
 * Permite: anchors (#...), rutas internas (/...) o URLs completas HTTPS
 */
export function sanitizeLinkTarget(rawTarget?: string): string {
  if (!rawTarget) return '#simulador';
  const trimmed = rawTarget.trim();

  // Anchors (#seccion)
  if (trimmed.startsWith('#')) {
    return '#' + trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  // Rutas relativas (/ruta)
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/[^\w\-/?:&=#%.]/g, '');
  }

  // URLs completas seguras (HTTPS)
  if (trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'https:') {
        return url.href;
      }
    } catch {
      // URL inválida, fallback
    }
  }

  return '#simulador';
}

/**
 * Normaliza y mapea la respuesta de base de datos a la interfaz TypeScript
 */
function mapDbToSettings(data: any, orgId: string): OrganizationHomeSettings {
  return {
    id: data.id,
    organizationId: data.organization_id || orgId,
    heroEyebrow: data.hero_eyebrow ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroEyebrow,
    heroTitle: data.hero_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroTitle,
    heroDescription: data.hero_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroDescription,
    heroPrimaryCtaText: data.hero_primary_cta_text ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroPrimaryCtaText,
    heroPrimaryCtaTarget: data.hero_primary_cta_target ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroPrimaryCtaTarget,
    heroPrimaryCtaVisible: data.hero_primary_cta_visible ?? true,
    heroSecondaryCtaText: data.hero_secondary_cta_text ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroSecondaryCtaText,
    heroSecondaryCtaTarget: data.hero_secondary_cta_target ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroSecondaryCtaTarget,
    heroSecondaryCtaVisible: data.hero_secondary_cta_visible ?? true,
    heroTrustLine: data.hero_trust_line ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroTrustLine,
    heroBackgroundMode: (data.hero_background_mode as HeroBackgroundMode) || 'image_overlay',
    heroBackgroundColor: data.hero_background_color || '#102d49',
    heroBackgroundImageUrl: data.hero_background_image_url || DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.heroBackgroundImageUrl,
    heroOverlayColor: data.hero_overlay_color || '#102d49',
    heroOverlayOpacity: Number(data.hero_overlay_opacity ?? 65),
    heroImagePosition: (data.hero_image_position as HeroImagePosition) || 'center',
    heroPatternEnabled: data.hero_pattern_enabled ?? true,
    showMetrics: data.show_metrics ?? true,
    showPropertyTypes: data.show_property_types ?? true,
    showSimulator: data.show_simulator ?? true,
    showHowItWorks: data.show_how_it_works ?? true,
    showOperationSection: data.show_operation_section ?? true,
    showInvestorSection: data.show_investor_section ?? true,
    showFaq: data.show_faq ?? true,
    showContact: data.show_contact ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Obtiene la configuración de Home de una organización desde Supabase (con fallback robusto)
 */
export async function getOrganizationHomeSettings(orgId: string): Promise<OrganizationHomeSettings> {
  if (!orgId) {
    return { ...DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS };
  }

  // 1. Intentar desde Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_home_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapDbToSettings(data, orgId);
        homeSettingsCache.set(orgId, mapped);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(`org_home_settings_${orgId}`, JSON.stringify(mapped));
          } catch {
            // Ignorar
          }
        }
        return mapped;
      }
    } catch {
      // Fallback si la red falla
    }
  }

  // 2. Caché en memoria
  if (homeSettingsCache.has(orgId)) {
    return homeSettingsCache.get(orgId)!;
  }

  // 3. LocalStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem(`org_home_settings_${orgId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        homeSettingsCache.set(orgId, parsed);
        return parsed;
      }
    } catch {
      // Ignorar
    }
  }

  // 4. Default compatible
  const fallback: OrganizationHomeSettings = {
    ...DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS,
    organizationId: orgId,
  };
  homeSettingsCache.set(orgId, fallback);
  return fallback;
}

/**
 * Guarda y propaga en tiempo real los cambios de configuración de la Home
 */
export async function updateOrganizationHomeSettings(
  orgId: string,
  updates: Partial<OrganizationHomeSettings>
): Promise<{ success: boolean; data: OrganizationHomeSettings; error?: string }> {
  if (!orgId) {
    return { success: false, data: DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS, error: 'organizationId es requerido' };
  }

  const current = await getOrganizationHomeSettings(orgId);
  const updated: OrganizationHomeSettings = {
    ...current,
    ...updates,
    organizationId: orgId,
    heroPrimaryCtaTarget: sanitizeLinkTarget(updates.heroPrimaryCtaTarget ?? current.heroPrimaryCtaTarget),
    heroSecondaryCtaTarget: sanitizeLinkTarget(updates.heroSecondaryCtaTarget ?? current.heroSecondaryCtaTarget),
    heroOverlayOpacity: Math.max(0, Math.min(100, Number(updates.heroOverlayOpacity ?? current.heroOverlayOpacity))),
    updatedAt: new Date().toISOString(),
  };

  // 1. Guardar en memoria y notificar suscriptores
  homeSettingsCache.set(orgId, updated);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`org_home_settings_${orgId}`, JSON.stringify(updated));
    } catch {
      // Ignorar
    }
  }
  notifyHomeListeners(orgId, updated);

  // 2. Persistir en Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_home_settings')
        .upsert(
          {
            organization_id: orgId,
            hero_eyebrow: updated.heroEyebrow,
            hero_title: updated.heroTitle,
            hero_description: updated.heroDescription,
            hero_primary_cta_text: updated.heroPrimaryCtaText,
            hero_primary_cta_target: updated.heroPrimaryCtaTarget,
            hero_primary_cta_visible: updated.heroPrimaryCtaVisible,
            hero_secondary_cta_text: updated.heroSecondaryCtaText,
            hero_secondary_cta_target: updated.heroSecondaryCtaTarget,
            hero_secondary_cta_visible: updated.heroSecondaryCtaVisible,
            hero_trust_line: updated.heroTrustLine,
            hero_background_mode: updated.heroBackgroundMode,
            hero_background_color: updated.heroBackgroundColor,
            hero_background_image_url: updated.heroBackgroundImageUrl,
            hero_overlay_color: updated.heroOverlayColor,
            hero_overlay_opacity: updated.heroOverlayOpacity,
            hero_image_position: updated.heroImagePosition,
            hero_pattern_enabled: updated.heroPatternEnabled,
            show_metrics: updated.showMetrics,
            show_property_types: updated.showPropertyTypes,
            show_simulator: updated.showSimulator,
            show_how_it_works: updated.showHowItWorks,
            show_operation_section: updated.showOperationSection,
            show_investor_section: updated.showInvestorSection,
            show_faq: updated.showFaq,
            show_contact: updated.showContact,
            updated_at: updated.updatedAt,
          },
          { onConflict: 'organization_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('[OrganizationHomeService] Error guardando en Supabase:', error);
        return { success: true, data: updated, error: error.message };
      }

      const freshMapped = mapDbToSettings(data, orgId);
      homeSettingsCache.set(orgId, freshMapped);
      return { success: true, data: freshMapped };
    } catch (err: any) {
      console.error('[OrganizationHomeService] Error de red:', err);
      return { success: true, data: updated, error: err.message };
    }
  }

  return { success: true, data: updated };
}

/**
 * Sube un asset visual al bucket público 'organization-assets'
 * Validaciones: JPG, JPEG, PNG, WEBP, tamaño <= 5MB
 */
export async function uploadOrganizationAsset(
  orgId: string,
  folder: 'hero' | 'branding',
  file: File
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  if (!orgId) return { success: false, error: 'organizationId es requerido' };

  // 1. Validar Tipo de Archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      success: false,
      error: 'Formato no permitido. Por favor seleccioná un archivo JPG, PNG o WEBP.',
    };
  }

  // 2. Validar Tamaño (Máx 5MB)
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      error: 'El archivo excede el tamaño máximo permitido de 5 MB.',
    };
  }

  // 3. Generar Path Limpio en Bucket: {orgId}/{folder}/{timestamp}_{filename}
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${orgId}/${folder}/${cleanName}`;

  if (isSupabaseConfigured) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('[OrganizationHomeService] Storage upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      return {
        success: true,
        publicUrl: publicUrlData.publicUrl,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al subir la imagen' };
    }
  }

  // Si no hay Supabase configurado (mock dev), crear ObjectURL local
  const localUrl = URL.createObjectURL(file);
  return { success: true, publicUrl: localUrl };
}
