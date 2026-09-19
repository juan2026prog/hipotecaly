// ==============================================================================
// HIPOTECALY GEOCORE - NORMALIZACIÓN Y FORMATEO GEOGRÁFICO
// ==============================================================================

import { CanonicalGeoAddress, Department } from "./types";

export const OFFICIAL_URUGUAY_DEPARTMENTS: Department[] = [
  { id: 1, name: "Montevideo", canonicalName: "Montevideo", code: "MO" },
  { id: 2, name: "Artigas", canonicalName: "Artigas", code: "AR" },
  { id: 3, name: "Canelones", canonicalName: "Canelones", code: "CA" },
  { id: 4, name: "Cerro Largo", canonicalName: "Cerro Largo", code: "CL" },
  { id: 5, name: "Colonia", canonicalName: "Colonia", code: "CO" },
  { id: 6, name: "Durazno", canonicalName: "Durazno", code: "DU" },
  { id: 7, name: "Flores", canonicalName: "Flores", code: "FS" },
  { id: 8, name: "Florida", canonicalName: "Florida", code: "FD" },
  { id: 9, name: "Lavalleja", canonicalName: "Lavalleja", code: "LA" },
  { id: 10, name: "Maldonado", canonicalName: "Maldonado", code: "MA" },
  { id: 11, name: "Paysandú", canonicalName: "Paysandú", code: "PA" },
  { id: 12, name: "Río Negro", canonicalName: "Río Negro", code: "RN" },
  { id: 13, name: "Rivera", canonicalName: "Rivera", code: "RV" },
  { id: 14, name: "Rocha", canonicalName: "Rocha", code: "RO" },
  { id: 15, name: "Salto", canonicalName: "Salto", code: "SA" },
  { id: 16, name: "San José", canonicalName: "San José", code: "SJ" },
  { id: 17, name: "Soriano", canonicalName: "Soriano", code: "SO" },
  { id: 18, name: "Tacuarembó", canonicalName: "Tacuarembó", code: "TA" },
  { id: 19, name: "Treinta y Tres", canonicalName: "Treinta y Tres", code: "TT" },
];

export const URUGUAY_DEPARTMENTS: string[] = OFFICIAL_URUGUAY_DEPARTMENTS.map((d) => d.name);

export function normalizeDepartment(deptRaw?: string | null): string | null {
  if (!deptRaw || !deptRaw.trim()) return null;
  const clean = cleanGeoText(deptRaw);
  const found = OFFICIAL_URUGUAY_DEPARTMENTS.find(
    (d) => cleanGeoText(d.name) === clean || cleanGeoText(d.canonicalName) === clean
  );
  return found ? found.name : null;
}

export function normalizeLocality(locRaw?: string | null): string {
  if (!locRaw) return "";
  return locRaw.trim();
}

export function normalizeStreetName(streetRaw?: string | null): string {
  if (!streetRaw) return "";
  let s = streetRaw.trim();
  // Limpiar prefijos de calle comunes
  s = s.replace(/^(avda\.?|av\.?|avenida|calle|bvar\.?|bulevar|pasaje|rambla|ruta)\s+/i, "");
  return s.trim();
}

export function isValidUruguayCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  // Uruguay Bounding Box aproximado: Latitud [-35.5, -30.0], Longitud [-58.5, -53.0]
  return lat >= -35.5 && lat <= -30.0 && lng >= -58.5 && lng <= -53.0;
}

export function cleanGeoText(str?: string | null): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDepartmentName(deptRaw?: string | null): Department {
  if (!deptRaw || !deptRaw.trim()) {
    return OFFICIAL_URUGUAY_DEPARTMENTS[0]; // Montevideo default
  }
  const clean = cleanGeoText(deptRaw);
  const found = OFFICIAL_URUGUAY_DEPARTMENTS.find(
    (d) => cleanGeoText(d.name) === clean || cleanGeoText(d.canonicalName) === clean
  );
  if (found) return found;

  const partial = OFFICIAL_URUGUAY_DEPARTMENTS.find((d) => {
    const cName = cleanGeoText(d.name);
    return clean.includes(cName) || cName.includes(clean);
  });
  if (partial) return partial;

  return {
    id: clean,
    name: deptRaw.trim(),
    canonicalName: deptRaw.trim(),
  };
}

export function formatUruguayAddress(addr: Partial<CanonicalGeoAddress>): string {
  const parts: string[] = [];

  const streetPart = [addr.streetName, addr.streetNumber].filter(Boolean).join(" ");
  if (streetPart) {
    let unitPart = "";
    if (addr.unitOrApt) unitPart += " " + (addr.unitOrApt.toLowerCase().startsWith("ap") ? addr.unitOrApt : "Ap. " + addr.unitOrApt);
    if (addr.floor) unitPart += " Piso " + addr.floor;
    parts.push(streetPart + unitPart);
  }

  if (addr.neighborhood && addr.neighborhood !== addr.locality && addr.neighborhood !== addr.department) {
    parts.push(addr.neighborhood);
  }

  if (addr.locality && addr.locality !== addr.department && (!addr.neighborhood || addr.locality !== addr.neighborhood)) {
    parts.push(addr.locality);
  }

  if (addr.department) {
    parts.push(addr.department);
  }

  return parts.join(", ") || "Dirección sin especificar";
}
