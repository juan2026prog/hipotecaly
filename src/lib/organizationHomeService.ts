// ==============================================================================
// HIPOTECALY: Servicio de Configuración de Home y Assets de Organización
// Snapshot Editorial Compuesto, Publicación Atómica, Historial Inmutable y Auditoría
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
  breakdown?: string;
}

export interface InvestorCardItem {
  tag: string;
  title: string;
  description: string;
}

export interface CompositeBrandingData {
  publicName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  businessHours: string;
  footerDescription: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialFacebook?: string;
}

export interface CompositeFaqData {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CompositeSeoData {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoOgImageUrl?: string;
  seoCanonicalUrl?: string;
  googleSiteVerification?: string;
  indexPolicy?: 'index_follow' | 'noindex_nofollow';
}

export interface OrganizationCompositeEditorialSnapshot {
  home: Record<string, any>;
  branding: CompositeBrandingData;
  faqs: CompositeFaqData[];
  seo: CompositeSeoData;
}

export interface OrganizationHomeSettings {
  id?: string;
  organizationId: string;

  // 0. Publicación y Versionado (Fase 6)
  status?: 'draft' | 'published';
  versionNumber?: number;
  publishedAt?: string;
  publishedBy?: string;
  publishedSnapshot?: OrganizationCompositeEditorialSnapshot | Record<string, any>;
  hasUnpublishedChanges?: boolean;

  // 0.1. SEO y Metadatos (Fase 6)
  seoTitle?: string;
  seoDescription?: string;
  seoOgImageUrl?: string;
  seoCanonicalUrl?: string;
  seoKeywords?: string;
  googleSiteVerification?: string;
  robotsIndex?: boolean;

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

  // 7. Snapshot Compuesto Opcional Asociado
  compositeSnapshot?: OrganizationCompositeEditorialSnapshot;

  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationHomeVersionItem {
  id: string;
  organizationId: string;
  versionNumber: number;
  versionLabel: string;
  changelogNotes?: string;
  authorName: string;
  authorId?: string;
  snapshot: OrganizationCompositeEditorialSnapshot | Record<string, any>;
  publishedAt: string;
  isActive: boolean;
  createdAt: string;
}

export const DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT: CompositeBrandingData = {
  publicName: 'Estudio Nova',
  tagline: 'Financiación & inversión',
  supportPhone: '+598 2916 4455',
  supportEmail: 'contacto@estudionova.uy',
  address: 'Montevideo, Uruguay',
  businessHours: 'Lun a Vie 09:00 – 18:00 hs',
  footerDescription:
    'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.',
  logoUrl: '',
  primaryColor: '#173a5e',
  secondaryColor: '#102d49',
  accentColor: '#f4b43b',
  socialInstagram: 'https://instagram.com/estudionova.uy',
  socialLinkedin: 'https://linkedin.com/company/estudionova-uy',
  socialFacebook: 'https://facebook.com/estudionova.uy',
};

export const DEFAULT_ESTUDIO_NOVA_FAQS_SNAPSHOT: CompositeFaqData[] = [
  {
    id: 'faq-1',
    question: '¿Qué porcentaje del valor del inmueble se puede financiar?',
    answer:
      'Financiamos hasta el {maxFinancedPercentage}% del valor de tasación del inmueble en garantía.',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'faq-2',
    question: '¿Cuáles son los montos y plazos disponibles?',
    answer:
      'Monto mínimo de referencia de USD {minLoanAmount} y máximo de USD {maxLoanAmount}, con plazos de 12 a 60 meses.',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'faq-3',
    question: '¿Cómo se amortiza el crédito?',
    answer:
      'Podés optar por cuotas de solo intereses mensuales con cancelación de capital al vencimiento, o cuotas fijas amortizables.',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'faq-4',
    question: '¿Qué documentación se necesita para iniciar la evaluación?',
    answer:
      'Cédula de identidad, título de propiedad o certificado notarial y datos descriptivos del bien.',
    sortOrder: 4,
    isActive: true,
  },
];

export const DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS: OrganizationHomeSettings = {
  organizationId: 'd0000000-0000-0000-0000-000000000001',
  status: 'published',
  versionNumber: 1,
  publishedAt: '2026-09-09T00:00:00Z',
  hasUnpublishedChanges: false,
  seoTitle: 'Estudio Nova — Financiación & Inversión Hipotecaria en Uruguay',
  seoDescription:
    'Estructuración de operaciones de crédito con respaldo en activos inmobiliarios en Uruguay. Evaluación ágil y formalización notarial.',
  seoOgImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  seoCanonicalUrl: 'https://hipotecaly.vercel.app/demo/estudio-nova',
  seoKeywords: 'créditos hipotecarios uruguay, préstamos con garantía hipotecaria montevideo, estudio nova, financiamiento inmobiliario',
  googleSiteVerification: '',
  robotsIndex: true,
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

// Caché reactiva
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
 */
export function sanitizeLinkTarget(rawTarget?: string): string {
  if (!rawTarget) return '#simulador';
  const trimmed = rawTarget.trim();

  if (trimmed.startsWith('#')) {
    return '#' + trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  if (trimmed.startsWith('/')) {
    return trimmed.replace(/[^\w\-/?:&=#%.]/g, '');
  }

  if (trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'https:') {
        return url.href;
      }
    } catch {
      // Fallback
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
    status: (data.status as 'draft' | 'published') || 'published',
    versionNumber: Number(data.version_number ?? 1),
    publishedAt: data.published_at,
    publishedBy: data.published_by,
    publishedSnapshot: data.published_snapshot,
    hasUnpublishedChanges: Boolean(data.has_unpublished_changes ?? false),
    seoTitle: data.seo_title ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.seoTitle,
    seoDescription: data.seo_description ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.seoDescription,
    seoOgImageUrl: data.seo_og_image_url ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.seoOgImageUrl,
    seoCanonicalUrl: data.seo_canonical_url ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.seoCanonicalUrl,
    seoKeywords: data.seo_keywords ?? DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS.seoKeywords,
    googleSiteVerification: data.google_site_verification ?? data.published_snapshot?.seo?.googleSiteVerification ?? '',

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
 * Convierte un objeto OrganizationHomeSettings a snapshot limpio de sección Home
 */
export function createHomeSnapshot(settings: OrganizationHomeSettings): Record<string, any> {
  return {
    heroEyebrow: settings.heroEyebrow,
    heroTitle: settings.heroTitle,
    heroDescription: settings.heroDescription,
    heroPrimaryCtaText: settings.heroPrimaryCtaText,
    heroPrimaryCtaTarget: settings.heroPrimaryCtaTarget,
    heroPrimaryCtaVisible: settings.heroPrimaryCtaVisible,
    heroSecondaryCtaText: settings.heroSecondaryCtaText,
    heroSecondaryCtaTarget: settings.heroSecondaryCtaTarget,
    heroSecondaryCtaVisible: settings.heroSecondaryCtaVisible,
    heroTrustLine: settings.heroTrustLine,
    heroBackgroundMode: settings.heroBackgroundMode,
    heroBackgroundColor: settings.heroBackgroundColor,
    heroBackgroundImageUrl: settings.heroBackgroundImageUrl,
    heroOverlayColor: settings.heroOverlayColor,
    heroOverlayOpacity: settings.heroOverlayOpacity,
    heroImagePosition: settings.heroImagePosition,
    heroPatternEnabled: settings.heroPatternEnabled,
    showMetrics: settings.showMetrics,
    showPropertyTypes: settings.showPropertyTypes,
    showSimulator: settings.showSimulator,
    showHowItWorks: settings.showHowItWorks,
    showOperationSection: settings.showOperationSection,
    showInvestorSection: settings.showInvestorSection,
    showFaq: settings.showFaq,
    showContact: settings.showContact,
    propertyTypesEyebrow: settings.propertyTypesEyebrow,
    propertyTypesTitle: settings.propertyTypesTitle,
    propertyTypesDescription: settings.propertyTypesDescription,
    propertyTypesItems: settings.propertyTypesItems,
    howItWorksEyebrow: settings.howItWorksEyebrow,
    howItWorksTitle: settings.howItWorksTitle,
    howItWorksDescription: settings.howItWorksDescription,
    howItWorksSteps: settings.howItWorksSteps,
    operationEyebrow: settings.operationEyebrow,
    operationTitle: settings.operationTitle,
    operationDescription: settings.operationDescription,
    operationImageUrl: settings.operationImageUrl,
    operationFeatures: settings.operationFeatures,
    investorEyebrow: settings.investorEyebrow,
    investorTitle: settings.investorTitle,
    investorDescription: settings.investorDescription,
    investorCtaText: settings.investorCtaText,
    investorCards: settings.investorCards,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoOgImageUrl: settings.seoOgImageUrl,
    seoCanonicalUrl: settings.seoCanonicalUrl,
    seoKeywords: settings.seoKeywords,
    googleSiteVerification: settings.googleSiteVerification,
  };
}

/**
 * Construye el Snapshot Editorial Compuesto (Home + Branding + FAQs + SEO)
 */
export function createCompositeEditorialSnapshot(
  homeSettings: OrganizationHomeSettings,
  brandingData?: Partial<CompositeBrandingData>,
  faqsData?: CompositeFaqData[]
): OrganizationCompositeEditorialSnapshot {
  const homeSnap = createHomeSnapshot(homeSettings);
  const brandingSnap: CompositeBrandingData = {
    ...DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT,
    ...brandingData,
    publicName: brandingData?.publicName || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.publicName,
    tagline: brandingData?.tagline || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.tagline,
    supportPhone: brandingData?.supportPhone || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.supportPhone,
    supportEmail: brandingData?.supportEmail || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.supportEmail,
    address: brandingData?.address || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.address,
    businessHours: brandingData?.businessHours || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.businessHours,
    footerDescription: brandingData?.footerDescription || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.footerDescription,
    primaryColor: brandingData?.primaryColor || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.primaryColor,
    secondaryColor: brandingData?.secondaryColor || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.secondaryColor,
    accentColor: brandingData?.accentColor || DEFAULT_ESTUDIO_NOVA_BRANDING_SNAPSHOT.accentColor,
  };

  const faqsSnap: CompositeFaqData[] = faqsData && faqsData.length > 0 ? faqsData : DEFAULT_ESTUDIO_NOVA_FAQS_SNAPSHOT;

  const seoSnap: CompositeSeoData = {
    seoTitle: homeSettings.seoTitle || `${brandingSnap.publicName} — ${brandingSnap.tagline}`,
    seoDescription: homeSettings.seoDescription || homeSettings.heroDescription,
    seoKeywords: homeSettings.seoKeywords || 'creditos hipotecarios uruguay, prestamos garantia inmueble',
    seoOgImageUrl: homeSettings.seoOgImageUrl || homeSettings.heroBackgroundImageUrl,
    seoCanonicalUrl: homeSettings.seoCanonicalUrl,
    googleSiteVerification: homeSettings.googleSiteVerification,
    indexPolicy: 'index_follow',
  };

  return {
    home: homeSnap,
    branding: brandingSnap,
    faqs: faqsSnap,
    seo: seoSnap,
  };
}

/**
 * Registra un evento de auditoría en tenant_audit_logs
 */
export async function logTenantAuditEvent(
  tenantId: string,
  action: string,
  beforeState?: Record<string, any>,
  afterState?: Record<string, any>,
  actorId?: string
) {
  if (!isSupabaseConfigured || !tenantId) return;
  try {
    let resolvedActorId = actorId;
    if (!resolvedActorId) {
      const { data: userData } = await supabase.auth.getUser();
      resolvedActorId = userData.user?.id;
    }

    await supabase.from('tenant_audit_logs').insert({
      tenant_id: tenantId,
      actor_id: resolvedActorId || null,
      action,
      before_state: beforeState || null,
      after_state: afterState || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit log resiliente
  }
}

/**
 * Obtiene la configuración de Home de una organización.
 * - Si options?.preview === true AND autorizado: retorna el borrador de trabajo actual.
 * - Si options?.preview !== true OR NO autorizado: retorna el snapshot PUBLICADO que ve el público general.
 */
export async function getOrganizationHomeSettings(
  orgId: string,
  options?: {
    preview?: boolean;
    authorized?: boolean;
    userRole?: string;
    isSuperAdmin?: boolean;
  }
): Promise<OrganizationHomeSettings> {
  if (!orgId) {
    return { ...DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS };
  }

  // Comprobar autorización para ver preview
  const isAuthorizedForPreview =
    options?.authorized === true ||
    options?.isSuperAdmin === true ||
    options?.userRole === 'tenant_admin' ||
    options?.userRole === 'tenant_owner' ||
    options?.userRole === 'super_admin';

  // Si se pide preview pero no está autorizado, forzar modo público
  const isPreview = options?.preview === true && isAuthorizedForPreview;
  const cacheKey = `${orgId}_${isPreview ? 'preview' : 'public'}`;

  // 1. Intentar desde Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_home_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!error && data) {
        const workingDraft = mapDbToSettings(data, orgId);

        // Si es público y hay snapshot publicado, consumir estrictamente el snapshot compuesto
        if (!isPreview && data.published_snapshot && typeof data.published_snapshot === 'object') {
          const snap = data.published_snapshot;
          const homeFields = snap.home ? snap.home : snap;

          const publishedView: OrganizationHomeSettings = {
            ...workingDraft,
            ...homeFields,
            status: 'published',
            versionNumber: workingDraft.versionNumber,
            publishedAt: workingDraft.publishedAt,
            hasUnpublishedChanges: workingDraft.hasUnpublishedChanges,
            publishedSnapshot: snap,
            compositeSnapshot: snap.home ? snap : undefined,
          };
          homeSettingsCache.set(cacheKey, publishedView);
          return publishedView;
        }

        homeSettingsCache.set(cacheKey, workingDraft);
        return workingDraft;
      }
    } catch {
      // Fallback
    }
  }

  // 2. Caché en memoria
  if (homeSettingsCache.has(cacheKey)) {
    return homeSettingsCache.get(cacheKey)!;
  }

  // 3. Fallback por defecto compatible
  const fallback: OrganizationHomeSettings = {
    ...DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS,
    organizationId: orgId,
  };
  homeSettingsCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Guarda los cambios de configuración como BORRADOR (DRAFT) sin alterar el sitio público
 */
export async function saveHomeDraft(
  orgId: string,
  updates: Partial<OrganizationHomeSettings>,
  options?: { actorId?: string }
): Promise<{ success: boolean; data: OrganizationHomeSettings; error?: string }> {
  if (!orgId) {
    return { success: false, data: DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS, error: 'organizationId es requerido' };
  }

  const current = await getOrganizationHomeSettings(orgId, { preview: true, authorized: true });
  const updated: OrganizationHomeSettings = {
    ...current,
    ...updates,
    organizationId: orgId,
    status: 'draft',
    hasUnpublishedChanges: true,
    heroPrimaryCtaTarget: sanitizeLinkTarget(updates.heroPrimaryCtaTarget ?? current.heroPrimaryCtaTarget),
    heroSecondaryCtaTarget: sanitizeLinkTarget(updates.heroSecondaryCtaTarget ?? current.heroSecondaryCtaTarget),
    heroOverlayOpacity: Math.max(0, Math.min(100, Number(updates.heroOverlayOpacity ?? current.heroOverlayOpacity))),
    updatedAt: new Date().toISOString(),
  };

  // 1. Guardar en memoria y notificar suscriptores
  homeSettingsCache.set(`${orgId}_preview`, updated);
  notifyHomeListeners(orgId, updated);

  // 2. Persistir en Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_home_settings')
        .upsert(
          {
            organization_id: orgId,
            status: 'draft',
            has_unpublished_changes: true,
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

            seo_title: updated.seoTitle,
            seo_description: updated.seoDescription,
            seo_og_image_url: updated.seoOgImageUrl,
            seo_canonical_url: updated.seoCanonicalUrl,
            seo_keywords: updated.seoKeywords,

            updated_at: updated.updatedAt,
          },
          { onConflict: 'organization_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('[OrganizationHomeService] Error guardando borrador en Supabase:', error);
        return { success: true, data: updated, error: error.message };
      }

      // 3. Registrar auditoría de borrador guardado
      await logTenantAuditEvent(
        orgId,
        'home_draft_saved',
        { status: current.status, updatedAt: current.updatedAt },
        { status: 'draft', updatedAt: updated.updatedAt },
        options?.actorId
      );

      const fresh = mapDbToSettings(data, orgId);
      homeSettingsCache.set(`${orgId}_preview`, fresh);
      return { success: true, data: fresh };
    } catch (err: unknown) {
      return { success: true, data: updated, error: err instanceof Error ? err.message : 'Error de red' };
    }
  }

  return { success: true, data: updated };
}

/**
 * Publica la configuración actual como nueva versión productiva inmutable atómicamente
 */
export async function publishHomeVersion(
  orgId: string,
  options?: {
    changelogNotes?: string;
    authorName?: string;
    authorId?: string;
    brandingData?: Partial<CompositeBrandingData>;
    faqsData?: CompositeFaqData[];
  }
): Promise<{ success: boolean; version?: OrganizationHomeVersionItem; data?: OrganizationHomeSettings; error?: string }> {
  if (!orgId) {
    return { success: false, error: 'organizationId es requerido' };
  }

  const workingSettings = await getOrganizationHomeSettings(orgId, { preview: true, authorized: true });
  const compositeSnapshot = createCompositeEditorialSnapshot(
    workingSettings,
    options?.brandingData,
    options?.faqsData
  );

  let newVersionNumber = (workingSettings.versionNumber || 1) + 1;
  const authorName = options?.authorName || 'Admin WhiteLabel';

  if (isSupabaseConfigured) {
    try {
      let resolvedActorId = options?.authorId;
      if (!resolvedActorId) {
        const { data: authData } = await supabase.auth.getUser();
        resolvedActorId = authData.user?.id;
      }

      // 1. Intentar publicación atómica por stored procedure
      const { data: rpcRes, error: rpcError } = await supabase.rpc('publish_organization_home_version', {
        p_organization_id: orgId,
        p_changelog_notes: options?.changelogNotes || 'Actualización de contenidos desde el panel White-Label.',
        p_author_name: authorName,
        p_actor_id: resolvedActorId || null,
        p_composite_snapshot: compositeSnapshot,
      });

      if (!rpcError && rpcRes && rpcRes.success) {
        newVersionNumber = rpcRes.version_number;

        // Refrescar settings
        const freshSettings = await getOrganizationHomeSettings(orgId, { preview: false });
        homeSettingsCache.set(`${orgId}_public`, freshSettings);
        homeSettingsCache.set(`${orgId}_preview`, freshSettings);
        notifyHomeListeners(orgId, freshSettings);

        const versionItem: OrganizationHomeVersionItem = {
          id: rpcRes.version_id,
          organizationId: orgId,
          versionNumber: rpcRes.version_number,
          versionLabel: rpcRes.version_label,
          changelogNotes: options?.changelogNotes,
          authorName: authorName,
          authorId: resolvedActorId,
          snapshot: compositeSnapshot,
          publishedAt: rpcRes.published_at,
          isActive: true,
          createdAt: rpcRes.published_at,
        };

        return { success: true, version: versionItem, data: freshSettings };
      }

      // Fallback manual si RPC no está disponible
      const { data: latestVer } = await supabase
        .from('organization_home_versions')
        .select('version_number')
        .eq('organization_id', orgId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestVer?.version_number) {
        newVersionNumber = latestVer.version_number + 1;
      }

      const versionLabel = `Versión ${newVersionNumber}.0`;
      const changelog = options?.changelogNotes || 'Actualización de contenidos desde el panel White-Label.';

      await supabase
        .from('organization_home_versions')
        .update({ is_active: false })
        .eq('organization_id', orgId);

      const { data: verData } = await supabase
        .from('organization_home_versions')
        .insert({
          organization_id: orgId,
          version_number: newVersionNumber,
          version_label: versionLabel,
          changelog_notes: changelog,
          author_name: authorName,
          author_id: resolvedActorId || null,
          snapshot: compositeSnapshot,
          is_active: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      const { data: updatedSettingsData, error: settingsError } = await supabase
        .from('organization_home_settings')
        .update({
          status: 'published',
          version_number: newVersionNumber,
          published_at: new Date().toISOString(),
          published_snapshot: compositeSnapshot,
          has_unpublished_changes: false,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', orgId)
        .select()
        .single();

      if (settingsError) {
        return { success: false, error: settingsError.message };
      }

      await logTenantAuditEvent(
        orgId,
        'home_version_published',
        { version: newVersionNumber - 1 },
        { version: newVersionNumber, changelog },
        resolvedActorId
      );

      const publishedSettings = mapDbToSettings(updatedSettingsData, orgId);
      publishedSettings.publishedSnapshot = compositeSnapshot;
      homeSettingsCache.set(`${orgId}_public`, publishedSettings);
      homeSettingsCache.set(`${orgId}_preview`, publishedSettings);
      notifyHomeListeners(orgId, publishedSettings);

      const createdVersionItem: OrganizationHomeVersionItem = verData
        ? {
            id: verData.id,
            organizationId: verData.organization_id,
            versionNumber: verData.version_number,
            versionLabel: verData.version_label,
            changelogNotes: verData.changelog_notes,
            authorName: verData.author_name,
            authorId: verData.author_id,
            snapshot: verData.snapshot,
            publishedAt: verData.published_at,
            isActive: verData.is_active,
            createdAt: verData.created_at,
          }
        : {
            id: crypto.randomUUID(),
            organizationId: orgId,
            versionNumber: newVersionNumber,
            versionLabel: versionLabel,
            changelogNotes: changelog,
            authorName: authorName,
            snapshot: compositeSnapshot,
            publishedAt: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
          };

      return {
        success: true,
        version: createdVersionItem,
        data: publishedSettings,
      };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado al publicar' };
    }
  }

  // Fallback en memoria
  const publishedSettings: OrganizationHomeSettings = {
    ...workingSettings,
    status: 'published',
    versionNumber: newVersionNumber,
    publishedAt: new Date().toISOString(),
    publishedSnapshot: compositeSnapshot,
    hasUnpublishedChanges: false,
  };
  homeSettingsCache.set(`${orgId}_public`, publishedSettings);
  homeSettingsCache.set(`${orgId}_preview`, publishedSettings);
  notifyHomeListeners(orgId, publishedSettings);

  return { success: true, data: publishedSettings };
}

/**
 * Obtiene el historial inmutable de versiones de la Home
 */
export async function getHomeVersionHistory(orgId: string): Promise<OrganizationHomeVersionItem[]> {
  if (!orgId) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_home_versions')
        .select('*')
        .eq('organization_id', orgId)
        .order('version_number', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          organizationId: d.organization_id,
          versionNumber: d.version_number,
          versionLabel: d.version_label,
          changelogNotes: d.changelog_notes,
          authorName: d.author_name,
          authorId: d.author_id,
          snapshot: d.snapshot,
          publishedAt: d.published_at,
          isActive: d.is_active,
          createdAt: d.created_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

/**
 * Restaura una versión anterior histórica hacia el BORRADOR de trabajo (NO a producción inmediata)
 */
export async function restoreHomeVersionAsDraft(
  orgId: string,
  versionId: string,
  options?: { authorName?: string; actorId?: string }
): Promise<{ success: boolean; data?: OrganizationHomeSettings; error?: string }> {
  if (!orgId || !versionId) {
    return { success: false, error: 'Parámetros requeridos inválidos' };
  }

  if (isSupabaseConfigured) {
    try {
      const { data: ver, error: verError } = await supabase
        .from('organization_home_versions')
        .select('*')
        .eq('id', versionId)
        .eq('organization_id', orgId)
        .single();

      if (verError || !ver) {
        return { success: false, error: 'Versión no encontrada' };
      }

      const snap = ver.snapshot;
      const homeDataToRestore = snap.home ? snap.home : snap;

      // Guardar en el borrador de trabajo con status = 'draft' y has_unpublished_changes = true
      const res = await saveHomeDraft(orgId, homeDataToRestore, { actorId: options?.actorId });

      await logTenantAuditEvent(
        orgId,
        'home_version_restored_to_draft',
        {},
        { restored_version_number: ver.version_number, version_label: ver.version_label },
        options?.actorId
      );

      return res;
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error al restaurar versión' };
    }
  }

  return { success: true };
}

/**
 * Alias de compatibilidad hacia restoreHomeVersionAsDraft
 */
export async function rollbackHomeVersion(
  orgId: string,
  versionId: string,
  options?: { authorName?: string }
): Promise<{ success: boolean; data?: OrganizationHomeSettings; error?: string }> {
  return restoreHomeVersionAsDraft(orgId, versionId, options);
}

/**
 * Alias de compatibilidad hacia updateOrganizationHomeSettings
 */
export async function updateOrganizationHomeSettings(
  orgId: string,
  updates: Partial<OrganizationHomeSettings>
): Promise<{ success: boolean; data: OrganizationHomeSettings; error?: string }> {
  return saveHomeDraft(orgId, updates);
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
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
  const cleanName = `${folder}-${Date.now()}-${uniqueId}.${fileExt}`;
  const filePath = `${orgId}/${folder}/${cleanName}`;

  if (isSupabaseConfigured) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 año cacheable porque el nombre es inmutable
          upsert: false,
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
