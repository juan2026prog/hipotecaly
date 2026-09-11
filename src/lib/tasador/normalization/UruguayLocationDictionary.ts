// ==============================================================================
// HIPOTECALY TASADOR IA - DICCIONARIO DE NORMALIZACIÓN GEOGRÁFICA URUGUAY
// 19 Departamentos, 62+ Barrios de Montevideo, Localidades y Reglas de Calles
// ==============================================================================

import { LocationPrecision } from '../types/tasadorPipelineTypes';

export const URUGUAY_DEPARTMENTS: Record<string, string> = {
  montevideo: 'Montevideo',
  mvd: 'Montevideo',
  canelones: 'Canelones',
  maldonado: 'Maldonado',
  rocha: 'Rocha',
  colonia: 'Colonia',
  'san jose': 'San José',
  'san josé': 'San José',
  soriano: 'Soriano',
  'rio negro': 'Río Negro',
  'río negro': 'Río Negro',
  paysandu: 'Paysandú',
  paysandú: 'Paysandú',
  salto: 'Salto',
  artigas: 'Artigas',
  rivera: 'Rivera',
  tacuarembo: 'Tacuarembó',
  tacuarembó: 'Tacuarembó',
  durazno: 'Durazno',
  florida: 'Florida',
  lavalleja: 'Lavalleja',
  'treinta y tres': 'Treinta y Tres',
  'cerro largo': 'Cerro Largo',
  flores: 'Flores',
};

export const MONTEVIDEO_NEIGHBORHOODS: Record<string, string> = {
  // Franja Costera & Este
  'punta carretas': 'Punta Carretas',
  'pta carretas': 'Punta Carretas',
  'pta. carretas': 'Punta Carretas',
  pocitos: 'Pocitos',
  'pocitos nuevo': 'Pocitos',
  'villa dolores': 'Villa Dolores',
  buceo: 'Buceo',
  'puerto buceo': 'Buceo',
  malvin: 'Malvín',
  malvín: 'Malvín',
  'malvin norte': 'Malvín Norte',
  'malvín norte': 'Malvín Norte',
  'punta gorda': 'Punta Gorda',
  'pta gorda': 'Punta Gorda',
  'pta. gorda': 'Punta Gorda',
  carrasco: 'Carrasco',
  'carrasco este': 'Carrasco',
  'carrasco norte': 'Carrasco Norte',
  'carrasco sur': 'Carrasco',

  // Zona Centro & Sur
  centro: 'Centro',
  'ciudad vieja': 'Ciudad Vieja',
  barrio_sur: 'Barrio Sur',
  'barrio sur': 'Barrio Sur',
  palermo: 'Palermo',
  cordon: 'Cordón',
  cordón: 'Cordón',
  'cordon sur': 'Cordón',
  'cordon soho': 'Cordón',
  'cordon norte': 'Cordón',
  'parque rodo': 'Parque Rodó',
  'parque rodó': 'Parque Rodó',
  'parque batlle': 'Parque Batlle',
  'tres cruces': 'Tres Cruces',
  'la blanqueada': 'La Blanqueada',
  blanqueada: 'La Blanqueada',
  larrañaga: 'Larrañaga',
  larranaga: 'Larrañaga',
  union: 'Unión',
  unión: 'Unión',

  // Zona Prado, Norte & Oeste
  prado: 'Prado',
  'paso molino': 'Paso Molino',
  belvedere: 'Belvedere',
  sayago: 'Sayago',
  penarol: 'Peñarol',
  peñarol: 'Peñarol',
  colon: 'Colón',
  colón: 'Colón',
  lecoq: 'Lecoq',
  conciacion: 'Conciliación',
  conciliacion: 'Conciliación',
  conciliación: 'Conciliación',
  lecocq: 'Lecoq',
  capurro: 'Capurro',
  'bella vista': 'Bella Vista',
  aguada: 'Aguada',
  'la aguada': 'Aguada',
  reducto: 'Reducto',
  atahualpa: 'Atahualpa',
  brazo_oriental: 'Brazo Oriental',
  'brazo oriental': 'Brazo Oriental',
  figurita: 'Figurita',
  'jacinto vera': 'Jacinto Vera',
  cerrito: 'Cerrito de la Victoria',
  'cerrito de la victoria': 'Cerrito de la Victoria',
  maroñas: 'Maroñas',
  maronas: 'Maroñas',
  ituzaingo: 'Ituzaingó',
  ituzaingó: 'Ituzaingó',
  floro: 'Flor de Maroñas',
  'flor de maroñas': 'Flor de Maroñas',
  'flor de maronas': 'Flor de Maroñas',
  manga: 'Manga',
  toledo_chico: 'Toledo Chico',
  'toledo chico': 'Toledo Chico',
  piedras_blancas: 'Piedras Blancas',
  'piedras blancas': 'Piedras Blancas',
  casavalle: 'Casavalle',
  borro: 'Casavalle',
  cerro: 'Cerro',
  'villa del cerro': 'Cerro',
  'la teja': 'La Teja',
  teja: 'La Teja',
  'paso de la arena': 'Paso de la Arena',
  'santiago vazquez': 'Santiago Vázquez',
  'santiago vázquez': 'Santiago Vázquez',
  'punta de rieles': 'Punta de Rieles',
  'villa garcia': 'Villa García',
  'villa garcía': 'Villa García',
};

export const MALDONADO_ZONES: Record<string, string> = {
  'punta del este': 'Punta del Este',
  pde: 'Punta del Este',
  'la barra': 'La Barra',
  manantiales: 'Manantiales',
  'jose ignacio': 'José Ignacio',
  'josé ignacio': 'José Ignacio',
  'playa mansa': 'Playa Mansa',
  'playa brava': 'Playa Brava',
  peninsula: 'Península',
  península: 'Península',
  roosevelt: 'Avenida Roosevelt',
  cantegril: 'Cantegril',
  'san rafael': 'San Rafael',
  'el golf': 'El Golf',
  beverly_hills: 'Beverly Hills',
  'beverly hills': 'Beverly Hills',
  piriapolis: 'Piriápolis',
  piriápolis: 'Piriápolis',
  portezuelo: 'Portezuelo',
  'punta ballena': 'Punta Ballena',
};

export const CANELONES_ZONES: Record<string, string> = {
  'ciudad de la costa': 'Ciudad de la Costa',
  shangrila: 'Shangrilá',
  shangrilá: 'Shangrilá',
  lagomar: 'Lagomar',
  solymar: 'Solymar',
  'el pinar': 'El Pinar',
  pinar: 'El Pinar',
  'lomas de solymar': 'Lomas de Solymar',
  'parque carrasco': 'Parque Carrasco',
  'barra de carrasco': 'Barra de Carrasco',
  atlantida: 'Atlántida',
  atlántida: 'Atlántida',
  'las toscas': 'Las Toscas',
  'parque del plata': 'Parque del Plata',
  'las piedras': 'Las Piedras',
  pando: 'Pando',
  canelones: 'Canelones',
  progreso: 'Progreso',
  'la paz': 'La Paz',
};

const STREET_PREFIXES: [RegExp, string][] = [
  [/^avda\.?\s+/i, 'Avenida '],
  [/^av\.?\s+/i, 'Avenida '],
  [/^bvr\.?\s+/i, 'Bulevar '],
  [/^bv\.?\s+/i, 'Bulevar '],
  [/^blvd\.?\s+/i, 'Bulevar '],
  [/^cnel\.?\s+/i, 'Coronel '],
  [/^gral\.?\s+/i, 'General '],
  [/^dr\.?\s+/i, 'Doctor '],
  [/^dra\.?\s+/i, 'Doctora '],
  [/^ing\.?\s+/i, 'Ingeniero '],
  [/^arq\.?\s+/i, 'Arquitecto '],
  [/^tte\.?\s+/i, 'Teniente '],
  [/^cap\.?\s+/i, 'Capitán '],
  [/^sta\.?\s+/i, 'Santa '],
  [/^sto\.?\s+/i, 'Santo '],
  [/^pje\.?\s+/i, 'Pasaje '],
  [/^cta\.?\s+/i, 'Camino '],
  [/^cno\.?\s+/i, 'Camino '],
  [/^rbla\.?\s+/i, 'Rambla '],
  [/^rbbla\.?\s+/i, 'Rambla '],
];

export function cleanText(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDepartment(deptRaw?: string | null): {
  normalized: string;
  confidence: number;
} {
  if (!deptRaw || !deptRaw.trim()) {
    return { normalized: 'Montevideo', confidence: 50 }; // Default UY con menor confidence si no está provisto
  }
  const clean = cleanText(deptRaw);
  if (URUGUAY_DEPARTMENTS[clean]) {
    return { normalized: URUGUAY_DEPARTMENTS[clean], confidence: 100 };
  }
  for (const [key, val] of Object.entries(URUGUAY_DEPARTMENTS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return { normalized: val, confidence: 85 };
    }
  }
  return { normalized: deptRaw.trim(), confidence: 40 };
}

export function normalizeNeighborhood(
  neighborhoodRaw?: string | null,
  department: string = 'Montevideo'
): {
  normalized: string | null;
  subNeighborhood: string | null;
  confidence: number;
} {
  if (!neighborhoodRaw || !neighborhoodRaw.trim()) {
    return { normalized: null, subNeighborhood: null, confidence: 0 };
  }

  const clean = cleanText(neighborhoodRaw);

  if (department === 'Montevideo') {
    if (MONTEVIDEO_NEIGHBORHOODS[clean]) {
      return {
        normalized: MONTEVIDEO_NEIGHBORHOODS[clean],
        subNeighborhood: null,
        confidence: 100,
      };
    }
    for (const [key, val] of Object.entries(MONTEVIDEO_NEIGHBORHOODS)) {
      if (clean === key || clean.startsWith(key) || clean.endsWith(key)) {
        return {
          normalized: val,
          subNeighborhood: null,
          confidence: 90,
        };
      }
    }
  } else if (department === 'Maldonado') {
    if (MALDONADO_ZONES[clean]) {
      return {
        normalized: MALDONADO_ZONES[clean],
        subNeighborhood: null,
        confidence: 100,
      };
    }
  } else if (department === 'Canelones') {
    if (CANELONES_ZONES[clean]) {
      return {
        normalized: CANELONES_ZONES[clean],
        subNeighborhood: null,
        confidence: 100,
      };
    }
  }

  // Capitalizar formato estándar si no coincide con diccionarios
  const formatted = neighborhoodRaw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return { normalized: formatted, subNeighborhood: null, confidence: 60 };
}

export function normalizeStreetName(streetRaw?: string | null): {
  normalized: string | null;
  confidence: number;
} {
  if (!streetRaw || !streetRaw.trim()) {
    return { normalized: null, confidence: 0 };
  }

  let s = streetRaw.trim();
  for (const [regex, replacement] of STREET_PREFIXES) {
    if (regex.test(s)) {
      s = s.replace(regex, replacement);
      break;
    }
  }

  // Normalizar capitalización respetando palabras clave
  const words = s.split(/\s+/);
  const normalizedWords = words.map((w, idx) => {
    const lower = w.toLowerCase();
    if (idx > 0 && ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en'].includes(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return { normalized: normalizedWords.join(' '), confidence: 90 };
}

export function determineLocationPrecision(params: {
  streetName?: string | null;
  streetNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  city?: string | null;
  department?: string | null;
}): LocationPrecision {
  const hasCoords = Boolean(params.latitude && params.longitude && params.latitude !== 0);
  const hasStreet = Boolean(params.streetName && params.streetName.trim().length > 2);
  const hasNumber = Boolean(params.streetNumber && params.streetNumber.trim().length > 0);

  if (hasStreet && hasNumber) {
    return 'EXACT';
  }
  if (hasCoords) {
    return hasStreet ? 'STREET' : 'APPROXIMATE';
  }
  if (hasStreet) {
    return 'STREET';
  }
  if (params.neighborhood) {
    return 'NEIGHBORHOOD';
  }
  if (params.city) {
    return 'CITY';
  }
  if (params.department) {
    return 'DEPARTMENT';
  }
  return 'UNKNOWN';
}
