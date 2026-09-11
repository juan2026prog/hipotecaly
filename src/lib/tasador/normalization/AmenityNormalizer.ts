// ==============================================================================
// HIPOTECALY TASADOR IA - NORMALIZADOR DE AMENITIES Y CARACTERÍSTICAS
// Principio Estricto: NULL = DESCONOCIDO (Nunca convertir NULL en false)
// ==============================================================================

import { cleanText } from './UruguayLocationDictionary';

export interface NormalizedAmenities {
  pool: boolean | null;
  barbecue: boolean | null;
  garden: boolean | null;
  patio: boolean | null;
  terrace: boolean | null;
  balcony: boolean | null;
  elevator: boolean | null;
  security: boolean | null;
  doorman: boolean | null;
  heating: boolean | null;
  airConditioning: boolean | null;
  fireplace: boolean | null;
  laundry: boolean | null;
  storage: boolean | null;
  gym: boolean | null;
  eventRoom: boolean | null;
  seaView: boolean | null;
  waterfront: boolean | null;
  petFriendly: boolean | null;
  furnished: boolean | null;
  coveredParking: boolean | null;
  solarPanels: boolean | null;
  underfloorHeating: boolean | null;
}

const AMENITY_KEYWORDS: Record<keyof NormalizedAmenities, string[]> = {
  pool: ['piscina', 'pileta', 'swimming pool', 'alberca'],
  barbecue: ['parrillero', 'barbacoa', 'asador', 'parrilla', 'bbq'],
  garden: ['jardin', 'jardín', 'parque verde'],
  patio: ['patio', 'patio interno', 'fondo con verde', 'fondo'],
  terrace: ['terraza', 'azotea', 'rooftop', 'solarium'],
  balcony: ['balcon', 'balcón'],
  elevator: ['ascensor', 'elevador'],
  security: ['seguridad', 'vigilancia', 'circuito cerrado', 'camaras', 'cctv', 'porteria 24hs', 'seguridad 24'],
  doorman: ['porteria', 'portero', 'conserje', 'recepcion'],
  heating: ['calefaccion', 'calefacción', 'losa radiante', 'caldera', 'radiadores'],
  airConditioning: ['aire acondicionado', 'a/a', 'split', 'climatizado', 'aa'],
  fireplace: ['estufa a lena', 'estufa a leña', 'hogar a lena', 'chimenea'],
  laundry: ['lavadero', 'lavanderia', 'laundry'],
  storage: ['box', 'baulera', 'deposito individual'],
  gym: ['gimnasio', 'gym', 'fitness'],
  eventRoom: ['salon de fiestas', 'sum', 'barbacoa comun', 'sala de eventos', 'salon de usos multiples'],
  seaView: ['vista al mar', 'frente al mar', 'vista despejada al rio', 'vista rambla', 'vista al agua'],
  waterfront: ['primera linea', 'sobre rambla', 'frente a la playa', 'costanera'],
  petFriendly: ['acepta mascotas', 'pet friendly', 'permite animales'],
  furnished: ['amoblado', 'amueblado', 'totalmente equipado', 'equipado'],
  coveredParking: ['cochera techada', 'garage cerrado', 'cochera fija techada'],
  solarPanels: ['paneles solares', 'energia solar', 'termotanque solar'],
  underfloorHeating: ['losa radiante', 'piso radiante', 'eurocable'],
};

export function normalizeAmenities(params: {
  rawAmenities?: Record<string, boolean | string | number> | null;
  descriptionRaw?: string | null;
  titleRaw?: string | null;
}): NormalizedAmenities {
  const result: NormalizedAmenities = {
    pool: null,
    barbecue: null,
    garden: null,
    patio: null,
    terrace: null,
    balcony: null,
    elevator: null,
    security: null,
    doorman: null,
    heating: null,
    airConditioning: null,
    fireplace: null,
    laundry: null,
    storage: null,
    gym: null,
    eventRoom: null,
    seaView: null,
    waterfront: null,
    petFriendly: null,
    furnished: null,
    coveredParking: null,
    solarPanels: null,
    underfloorHeating: null,
  };

  // 1. Procesar mapa estructurado de la fuente si existe
  if (params.rawAmenities && typeof params.rawAmenities === 'object') {
    for (const [key, val] of Object.entries(params.rawAmenities)) {
      const cleanKey = cleanText(key);
      const isTrue = val === true || val === 1 || val === '1' || val === 'true' || val === 'si';
      const isFalse = val === false || val === 0 || val === '0' || val === 'false' || val === 'no';

      for (const [amenity, keywords] of Object.entries(AMENITY_KEYWORDS)) {
        const k = amenity as keyof NormalizedAmenities;
        if (keywords.some((kw) => cleanKey.includes(kw))) {
          if (isTrue) result[k] = true;
          else if (isFalse) result[k] = false;
        }
      }
    }
  }

  // 2. Extraer de título y descripción si el campo sigue siendo null
  const textCombined = cleanText(`${params.titleRaw || ''} ${params.descriptionRaw || ''}`);
  if (textCombined) {
    for (const [amenity, keywords] of Object.entries(AMENITY_KEYWORDS)) {
      const k = amenity as keyof NormalizedAmenities;
      if (result[k] === null) {
        if (keywords.some((kw) => textCombined.includes(kw))) {
          result[k] = true;
        }
      }
    }
  }

  return result;
}
