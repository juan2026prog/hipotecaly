// ==============================================================================
// HIPOTECALY TASADOR IA - NORMALIZADOR DE TIPO DE PROPIEDAD Y OPERACIÓN
// Determinístico, sin suposiciones ambiguas (NULL / UNKNOWN preservado)
// ==============================================================================

import {
  PropertyTypeNormalized,
  OperationType,
} from '../types/tasadorPipelineTypes';
import { cleanText } from './UruguayLocationDictionary';

export function normalizeOperationType(opRaw?: string | null): {
  normalized: OperationType;
  confidence: number;
} {
  if (!opRaw || !opRaw.trim()) {
    return { normalized: 'SALE', confidence: 50 }; // Default de mercado
  }

  const clean = cleanText(opRaw);

  if (clean.includes('venta') || clean.includes('sale') || clean.includes('comprar')) {
    return { normalized: 'SALE', confidence: 100 };
  }
  if (
    clean.includes('temporal') ||
    clean.includes('temporada') ||
    clean.includes('vacacional') ||
    clean.includes('por dia')
  ) {
    return { normalized: 'TEMPORARY_RENT', confidence: 95 };
  }
  if (clean.includes('alquiler') || clean.includes('rent') || clean.includes('arriendo')) {
    return { normalized: 'RENT', confidence: 100 };
  }
  if (clean.includes('remate') || clean.includes('subasta') || clean.includes('auction')) {
    return { normalized: 'AUCTION', confidence: 100 };
  }

  return { normalized: 'UNKNOWN', confidence: 0 };
}

export function normalizePropertyType(
  typeRaw?: string | null,
  titleRaw?: string | null
): {
  normalized: PropertyTypeNormalized;
  confidence: number;
} {
  const textCombined = `${typeRaw || ''} ${titleRaw || ''}`;
  const clean = cleanText(textCombined);

  if (!clean) {
    return { normalized: 'UNKNOWN', confidence: 0 };
  }

  // Apartamento / Penthouse / Dúplex
  if (
    clean.includes('apartamento') ||
    clean.includes('apto') ||
    clean.includes('departamento') ||
    clean.includes('penthouse') ||
    clean.includes('monoambiente') ||
    clean.includes('studio') ||
    clean.includes('duplex') ||
    clean.includes('triplex')
  ) {
    return { normalized: 'APARTMENT', confidence: 95 };
  }

  // PH (Propiedad Horizontal)
  if (clean.includes('propiedad horizontal') || clean.includes('casa en ph') || clean.includes('ph')) {
    return { normalized: 'PH', confidence: 90 };
  }

  // Casa / Chalet / Mansión
  if (
    clean.includes('casa') ||
    clean.includes('chalet') ||
    clean.includes('mansion') ||
    clean.includes('residencia') ||
    clean.includes('padron unico')
  ) {
    return { normalized: 'HOUSE', confidence: 95 };
  }

  // Chacra / Campo / Rural
  if (
    clean.includes('chacra') ||
    clean.includes('campo') ||
    clean.includes('finca') ||
    clean.includes('estancia') ||
    clean.includes('hectareas') ||
    clean.includes('fraccion de campo') ||
    clean.includes('has')
  ) {
    return { normalized: 'RURAL', confidence: 95 };
  }

  // Terreno / Lote / Solar
  if (
    clean.includes('terreno') ||
    clean.includes('solar') ||
    clean.includes('lote') ||
    clean.includes('fraccion') ||
    clean.includes('parcela')
  ) {
    return { normalized: 'LAND', confidence: 95 };
  }

  // Oficina / Consultorio
  if (clean.includes('oficina') || clean.includes('consultorio') || clean.includes('estudio')) {
    return { normalized: 'OFFICE', confidence: 95 };
  }

  // Local Comercial
  if (clean.includes('local') || clean.includes('comercial') || clean.includes('negocio') || clean.includes('tienda')) {
    return { normalized: 'COMMERCIAL', confidence: 90 };
  }

  // Depósito / Galpón / Nave industrial
  if (
    clean.includes('deposito') ||
    clean.includes('galpon') ||
    clean.includes('tinglado') ||
    clean.includes('nave industrial') ||
    clean.includes('almacen')
  ) {
    return { normalized: 'WAREHOUSE', confidence: 95 };
  }

  // Garaje / Cochera / Estacionamiento
  if (
    clean.includes('garaje') ||
    clean.includes('cochera') ||
    clean.includes('estacionamiento') ||
    clean.includes('box') ||
    clean.includes('garage')
  ) {
    return { normalized: 'GARAGE', confidence: 95 };
  }

  // Edificio entero
  if (clean.includes('edificio') || clean.includes('bloque')) {
    return { normalized: 'BUILDING', confidence: 90 };
  }

  return { normalized: 'UNKNOWN', confidence: 0 };
}
