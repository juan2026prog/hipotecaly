// ==============================================================================
// HIPOTECALY AI: Configuración Baseline de Top 20 Portales Inmobiliarios (Fase0)
// Configuración declarativa sin ejecutores activos ni crawlers reales
// ==============================================================================

import { PropertySource } from '../types/aiAppraisalFase0';

export interface PortalSourceSeed extends Omit<PropertySource, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  category: 'portales_lideres_uy' | 'cadenas_inmobiliarias_uy' | 'regionales_latam';
}

export const TOP_20_PORTALS_CONFIG: PortalSourceSeed[] = [
  // 1. Líderes Uruguay
  {
    code: 'infocasas',
    name: 'InfoCasas Uruguay',
    domain: 'infocasas.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 60,
    crawlerConfig: {
      scraperType: 'api',
      note: 'Configuración preliminar de endpoint de catálogo general',
    },
  },
  {
    code: 'mercadolibre_uy',
    name: 'MercadoLibre Inmuebles Uruguay',
    domain: 'inmuebles.mercadolibre.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 60,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Normalización de títulos, precios en USD y superficie útil',
    },
  },
  {
    code: 'gallito_uy',
    name: 'Gallito Luis Inmuebles',
    domain: 'gallito.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Portal tradicional uruguayo, foco en Montevideo y Canelones',
    },
  },
  {
    code: 'casaseneleste_uy',
    name: 'Casas en el Este',
    domain: 'casaseneleste.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Especializado en franja costera y Maldonado / Rocha',
    },
  },
  {
    code: 'zonaprop_uy',
    name: 'ZonaProp Uruguay',
    domain: 'zonaprop.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 45,
    crawlerConfig: {
      scraperType: 'api',
      note: 'Feed estructurado de desarrollos e inmuebles urbanos',
    },
  },

  // 2. Multi-portal y Cadenas Inmobiliarias Uruguay
  {
    code: 'properati_uy',
    name: 'Properati Uruguay',
    domain: 'properati.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 45,
    crawlerConfig: {
      scraperType: 'api',
      note: 'Agregador con métricas de valor m2 de mercado',
    },
  },
  {
    code: 'remax_uy',
    name: 'RE/MAX Uruguay',
    domain: 'remax.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 40,
    crawlerConfig: {
      scraperType: 'api',
      note: 'Red de franquicias con fichas estandarizadas',
    },
  },
  {
    code: 'century21_uy',
    name: 'Century 21 Uruguay',
    domain: 'century21.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 40,
    crawlerConfig: {
      scraperType: 'api',
      note: 'Fichas institucionales con geolocalización',
    },
  },
  {
    code: 'buscandocasa_uy',
    name: 'Buscandocasa',
    domain: 'buscandocasa.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Directorio local de publicaciones',
    },
  },
  {
    code: 'sothebys_uy',
    name: 'Sothebys Realty Uruguay',
    domain: 'sothebysrealty.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Segmento premium / residencial exclusivo',
    },
  },
  {
    code: 'engel_volkers_uy',
    name: 'Engel & Völkers Uruguay',
    domain: 'engelvoelkers.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Residencial de alto valor en Montevideo y Punta del Este',
    },
  },
  {
    code: 'tucasa_uy',
    name: 'TuCasa Uruguay',
    domain: 'tucasa.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'portales_lideres_uy',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Buscador inmobiliario nacional',
    },
  },

  // 3. Portales Complementarios y Regionales LatAm
  {
    code: 'argenprop',
    name: 'Argenprop Latam',
    domain: 'argenprop.com',
    countryCode: 'AR',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Búsquedas comparativas regionales de frontera',
    },
  },
  {
    code: 'inmuebles24',
    name: 'Inmuebles24 Regional',
    domain: 'inmuebles24.com',
    countryCode: 'MX',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Benchmark de metodologías Navent / Grupo QuintoAndar',
    },
  },
  {
    code: 'plusvalia',
    name: 'Plusvalia Latam',
    domain: 'plusvalia.com',
    countryCode: 'EC',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Plataforma del ecosistema regional',
    },
  },
  {
    code: 'portales_ar',
    name: 'Portales Inmobiliarios AR',
    domain: 'portalesinmobiliarios.com.ar',
    countryCode: 'AR',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 30,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Red rioplatense de ofertas',
    },
  },
  {
    code: 'clarin_inmuebles',
    name: 'Clarín Inmuebles',
    domain: 'clarin.com/inmuebles',
    countryCode: 'AR',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Referencial transfronterizo',
    },
  },
  {
    code: 'fincaraiz_latam',
    name: 'FincaRaíz Latam',
    domain: 'fincaraiz.com.co',
    countryCode: 'CO',
    isActive: true,
    category: 'regionales_latam',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Parámetros comparativos LatAm',
    },
  },
  {
    code: 'brio_uy',
    name: 'Brio Inmobiliaria',
    domain: 'brio.com.uy',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Inmobiliaria local montevideana',
    },
  },
  {
    code: 'caldeyro_uy',
    name: 'Caldeyro Victorica Bienes Raíces',
    domain: 'caldeyro.com',
    countryCode: 'UY',
    isActive: true,
    category: 'cadenas_inmobiliarias_uy',
    rateLimitPerMinute: 20,
    crawlerConfig: {
      scraperType: 'html',
      note: 'Operador corporativo y campos en Uruguay',
    },
  },
];
