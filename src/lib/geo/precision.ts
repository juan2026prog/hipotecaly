// ==============================================================================
// HIPOTECALY GEOCORE - NIVELES DE PRECISIÓN Y FALLBACK ORDENADO
// ==============================================================================

import { LocationPrecision } from "./types";

export interface PrecisionDescriptor {
  level: LocationPrecision;
  label: string;
  description: string;
  isExact: boolean;
  colorClass: string;
  badgeBg: string;
}

export const PRECISION_DESCRIPTORS: Record<LocationPrecision, PrecisionDescriptor> = {
  EXACT_ADDRESS: {
    level: "EXACT_ADDRESS",
    label: "Dirección exacta verificada",
    description: "Coordenada geocodificada al número de puerta oficial.",
    isExact: true,
    colorClass: "text-emerald-700 border-emerald-300 bg-emerald-50",
    badgeBg: "bg-emerald-500",
  },
  STREET_NUMBER: {
    level: "STREET_NUMBER",
    label: "Número aproximado",
    description: "Portal o tramo inmediato sobre la calle identificada.",
    isExact: true,
    colorClass: "text-emerald-700 border-emerald-300 bg-emerald-50",
    badgeBg: "bg-emerald-500",
  },
  STREET: {
    level: "STREET",
    label: "Ubicación en calle",
    description: "Sin número de puerta exacto; geocodificado al eje o centroide de calle.",
    isExact: false,
    colorClass: "text-amber-800 border-amber-300 bg-amber-50",
    badgeBg: "bg-amber-500",
  },
  NEIGHBORHOOD: {
    level: "NEIGHBORHOOD",
    label: "Ubicación aproximada: barrio",
    description: "Georreferenciado al centroide de la zona o barrio.",
    isExact: false,
    colorClass: "text-amber-800 border-amber-300 bg-amber-50",
    badgeBg: "bg-amber-500",
  },
  LOCALITY: {
    level: "LOCALITY",
    label: "Ubicación general: localidad",
    description: "Referencia a nivel de ciudad o localidad.",
    isExact: false,
    colorClass: "text-amber-800 border-amber-300 bg-amber-50",
    badgeBg: "bg-amber-500",
  },
  DEPARTMENT: {
    level: "DEPARTMENT",
    label: "Ubicación departamental",
    description: "Solo departamento identificado.",
    isExact: false,
    colorClass: "text-rose-800 border-rose-300 bg-rose-50",
    badgeBg: "bg-rose-500",
  },
  UNKNOWN: {
    level: "UNKNOWN",
    label: "Ubicación no determinada",
    description: "Sin geocodificación confirmada.",
    isExact: false,
    colorClass: "text-slate-700 border-slate-300 bg-slate-50",
    badgeBg: "bg-slate-400",
  },
};

export const PRECISION_HIERARCHY: LocationPrecision[] = [
  "EXACT_ADDRESS",
  "STREET_NUMBER",
  "STREET",
  "NEIGHBORHOOD",
  "LOCALITY",
  "DEPARTMENT",
  "UNKNOWN",
];

export function isExactPrecision(level?: LocationPrecision | null): boolean {
  if (!level) return false;
  return level === "EXACT_ADDRESS" || level === "STREET_NUMBER";
}

export function getPrecisionDescriptor(level?: LocationPrecision | null): PrecisionDescriptor {
  if (!level || !PRECISION_DESCRIPTORS[level]) {
    return PRECISION_DESCRIPTORS.UNKNOWN;
  }
  return PRECISION_DESCRIPTORS[level];
}
