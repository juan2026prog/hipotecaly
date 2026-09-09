// ==============================================================================
// HIPOTECALY: Servicio de Configuración de Home y Assets de Organización
// Fuente de verdad en Supabase con RLS, reactividad y validación de seguridad
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export type HeroBackgroundMode = 'color' | 'image' | 'image_overlay';
export type HeroImagePosition = 'left' | 'center' | 'right';

export interface PropertyTypeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  bullets: string[];
  visible: boolean;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  visible: boolean;
}

export interface OperationFeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface InvestorCardItem {
  tag: string;
  title: string;
  description: string;
}

export interface OrganizationHomeSettings {
  id?: string;
  organizationId: string;

  // 1. Contenido Hero
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;

  // Botones CTA Hero
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

  // 2. Switches de visibilidad de secciones
  showMetrics: boolean;
  showPropertyTypes: boolean;
  showSimulator: boolean;
  showHowItWorks: boolean;
  showOperationSection: boolean;
  showInvestorSection: boolean;
  showFaq: boolean;
  showContact: boolean;

  // 3. Inmuebles Admitidos
  propertyTypesEyebrow: string;
  propertyTypesTitle: string;
  propertyTypesDescription: string;
  propertyTypesItems: PropertyTypeItem[];

  // 4. Cómo Funciona
  howItWorksEyebrow: string;
  howItWorksTitle: string;
  howItWorksDescription: string;
  howItWorksSteps: HowItWorksStep[];

  // 5. Bloque Operativo ("Una operación, todo ordenado")
  operationEyebrow: string;
  operationTitle: string;
  operationDescription: string;
  operationImageUrl: string;
  operationFeatures: OperationFeatureItem[];

  // 6. Área de Inversores
  investorEyebrow: string;
  investorTitle: string;
  investorDescription: string;
  investorCtaText: string;
  investorCards: InvestorCardItem[];

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

  // Secciones Centrales
  propertyTypesEyebrow: 'GARANTÍAS INMOBILIARIAS',
  propertyTypesTitle: 'Inmuebles admitidos para estructuración',
  propertyTypesDescription:
    'Analizamos operaciones respaldadas por diversos tipos de activos con títulos en regla y tasación técnica.',
  propertyTypesItems: [
    {
      id: 'viviendas',
      icon: 'HomeIcon',
      title: 'Viviendas',
      description:
        'Propiedades residenciales utilizadas como garantía: casas urbanas, apartamentos en propiedad horizontal y chalets.',
      bullets: ['Zonas consolidadas de todo el país', 'Evaluación según estado y metraje'],
      visible: true,
    },
    {
      id: 'locales',
      icon: 'Building',
      title: 'Locales comerciales',
      description:
        'Inmuebles comerciales, oficinas céntricas, depósitos industriales y unidades aptas para renta u operativa comercial.',
      bullets: ['Puntos comerciales estratégicos', 'Análisis de flujo y tasación comercial'],
      visible: true,
    },
    {
      id: 'campos',
      icon: 'Trees',
      title: 'Campos',
      description:
        'Propiedades rurales, chacras productivas y fracciones de campo con potencial productivo o de inversión.',
      bullets: ['Índice CONEAT y aptitud del suelo', 'Estudio de antecedentes dominiales'],
      visible: true,
    },
  ],

  howItWorksEyebrow: 'PASO A PASO',
  howItWorksTitle: 'Cómo funciona el proceso',
  howItWorksDescription:
    'Cuatro etapas ordenadas desde la primera simulación hasta la recepción de la propuesta definitiva.',
  howItWorksSteps: [
    {
      step: 1,
      title: 'Simulá',
      description:
        'Ingresá el valor del inmueble y el monto necesario para conocer las cuotas y plazos de referencia.',
      visible: true,
    },
    {
      step: 2,
      title: 'Completá tu solicitud',
      description:
        'Cargá los datos del bien y la documentación básica en tu expediente digital protegido.',
      visible: true,
    },
    {
      step: 3,
      title: 'Evaluamos',
      description:
        'Realizamos el análisis pericial de tasación y el estudio notarial preliminar del título.',
      visible: true,
    },
    {
      step: 4,
      title: 'Recibí la propuesta',
      description:
        'Te presentamos las condiciones formales para coordinar la firma notarial y formalización.',
      visible: true,
    },
  ],

  operationEyebrow: 'UNA OPERACIÓN, TODO ORDENADO',
  operationTitle: 'Información clara desde el primer paso.',
  operationDescription:
    'Estructuramos cada operación para que solicitantes, profesionales y escribanos cuenten con un flujo predecible y documentado.',
  operationImageUrl:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
  operationFeatures: [
    {
      icon: 'FileSpreadsheet',
      title: 'Evaluación preliminar de la propiedad',
      description: 'Cotejo de valores de mercado y análisis de relación préstamo/garantía.',
    },
    {
      icon: 'FileText',
      title: 'Documentación en un único expediente',
      description: 'Títulos, planos, certificados y recibos organizados digitalmente.',
    },
    {
      icon: 'Layers',
      title: 'Seguimiento de estados',
      description:
        'Visualización del avance de cada etapa sin incertidumbre ni llamados innecesarios.',
    },
    {
      icon: 'FileCheck2',
      title: 'Proceso preparado para validaciones y firma',
      description: 'Coordinación notarial lista para la confección de escrituras e inscripciones.',
    },
  ],

  investorEyebrow: 'ÁREA DE INVERSIÓN',
  investorTitle: 'Capital respaldado por activos reales.',
  investorDescription:
    'Estructuración de operaciones de financiamiento con garantía hipotecaria formalizada en Uruguay.',
  investorCtaText: 'Acceder al Panel Inversor',
  investorCards: [
    {
      tag: 'GARANTÍA',
      title: 'Inmueble identificado',
      description:
        'Cada operación cuenta con una propiedad raíz determinada con títulos verificados por escribano.',
    },
    {
      tag: 'VALUACIÓN',
      title: 'Análisis de respaldo',
      description:
        'Peritaje técnico para asegurar una adecuada relación entre el capital financiado y el activo.',
    },
    {
      tag: 'EXPEDIENTE',
      title: 'Información estructurada',
      description:
        'Legajo completo con antecedentes del solicitante, certificados registrales y condiciones.',
    },
    {
      tag: 'SEGUIMIENTO',
      title: 'Proceso documentado',
      description:
        'Trazabilidad notarial y contractual continua a lo largo de toda la vigencia de la operación.',
    },
  ],
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

    propertyTypesEyebrow: data.property_types_eyebrow ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.propertyTypesEyebrow,
    propertyTypesTitle: data.property_types_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.propertyTypesTitle,
    propertyTypesDescription: data.property_types_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.propertyTypesDescription,
    propertyTypesItems: data.property_types_items ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.propertyTypesItems,

    howItWorksEyebrow: data.how_it_works_eyebrow ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.howItWorksEyebrow,
    howItWorksTitle: data.how_it_works_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.howItWorksTitle,
    howItWorksDescription: data.how_it_works_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.howItWorksDescription,
    howItWorksSteps: data.how_it_works_steps ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.howItWorksSteps,

    operationEyebrow: data.operation_eyebrow ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.operationEyebrow,
    operationTitle: data.operation_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.operationTitle,
    operationDescription: data.operation_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.operationDescription,
    operationImageUrl: data.operation_image_url ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.operationImageUrl,
    operationFeatures: data.operation_features ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.operationFeatures,

    investorEyebrow: data.investor_eyebrow ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.investorEyebrow,
    investorTitle: data.investor_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.investorTitle,
    investorDescription: data.investor_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.investorDescription,
    investorCtaText: data.investor_cta_text ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.investorCtaText,
    investorCards: data.investor_cards ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.investorCards,

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

            property_types_eyebrow: updated.propertyTypesEyebrow,
            property_types_title: updated.propertyTypesTitle,
            property_types_description: updated.propertyTypesDescription,
            property_types_items: updated.propertyTypesItems,

            how_it_works_eyebrow: updated.howItWorksEyebrow,
            how_it_works_title: updated.howItWorksTitle,
            how_it_works_description: updated.howItWorksDescription,
            how_it_works_steps: updated.howItWorksSteps,

            operation_eyebrow: updated.operationEyebrow,
            operation_title: updated.operationTitle,
            operation_description: updated.operationDescription,
            operation_image_url: updated.operationImageUrl,
            operation_features: updated.operationFeatures,

            investor_eyebrow: updated.investorEyebrow,
            investor_title: updated.investorTitle,
            investor_description: updated.investorDescription,
            investor_cta_text: updated.investorCtaText,
            investor_cards: updated.investorCards,

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
    } catch (err: unknown) {
      console.error('[OrganizationHomeService] Excepción guardando:', err);
      return { success: true, data: updated, error: err instanceof Error ? err.message : 'Error de red' };
    }
  }

  return { success: true, data: updated };
}

/**
 * Sube un asset visual al bucket público 'organization-assets'
 */
export async function uploadOrganizationAsset(
  orgId: string,
  file: File,
  folder: 'hero' | 'logo' | 'institutional' | 'sections' | 'team' = 'hero'
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!orgId || !file) {
    return { success: false, error: 'Parámetros inválidos' };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = `${folder}-${Date.now()}.${fileExt}`;
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
        console.error('[OrganizationHomeService] Error subiendo asset a Storage:', uploadError);
        const dataUrl = await fileToDataUrl(file);
        return { success: true, url: dataUrl };
      }

      const { data: publicData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      return { success: true, url: publicData.publicUrl };
    } catch (err: unknown) {
      console.error('[OrganizationHomeService] Error en upload asset:', err);
      const dataUrl = await fileToDataUrl(file);
      return { success: true, url: dataUrl };
    }
  }

  const dataUrl = await fileToDataUrl(file);
  return { success: true, url: dataUrl };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
