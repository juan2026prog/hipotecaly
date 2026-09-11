// ==============================================================================
// HIPOTECALY TASADOR IA - NORMALIZADOR DE SUPERFICIES
// Desglose de Superficie Total, Edificada, Terreno, Terrazas y Balcones
// ==============================================================================

export interface NormalizedSurfaces {
  totalAreaM2: number | null;
  builtAreaM2: number | null;
  landAreaM2: number | null;
  internalAreaM2: number | null;
  coveredAreaM2: number | null;
  semiCoveredAreaM2: number | null;
  uncoveredAreaM2: number | null;
  terraceAreaM2: number | null;
  balconyAreaM2: number | null;
  gardenAreaM2: number | null;
  garageAreaM2: number | null;
  confidence: number;
}

export function parseAreaFromText(text?: string | null): number | null {
  if (!text || !text.trim()) return null;

  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|mts2|m²|metros\s+cuadrados|mts)/i);
  if (match && match[1]) {
    const val = parseFloat(match[1].replace(',', '.'));
    return isNaN(val) || val <= 0 ? null : val;
  }
  return null;
}

export function normalizeSurfaces(params: {
  totalAreaM2Raw?: number | null;
  builtAreaM2Raw?: number | null;
  landAreaM2Raw?: number | null;
  titleRaw?: string | null;
  descriptionRaw?: string | null;
}): NormalizedSurfaces {
  let total = params.totalAreaM2Raw && params.totalAreaM2Raw > 0 ? params.totalAreaM2Raw : null;
  let built = params.builtAreaM2Raw && params.builtAreaM2Raw > 0 ? params.builtAreaM2Raw : null;
  const land = params.landAreaM2Raw && params.landAreaM2Raw > 0 ? params.landAreaM2Raw : null;

  // Si falta total o built, buscar en el texto del título o descripción
  if (!total && !built) {
    const fromTitle = parseAreaFromText(params.titleRaw);
    const fromDesc = parseAreaFromText(params.descriptionRaw);
    const extracted = fromTitle || fromDesc;
    if (extracted) {
      total = extracted;
      built = extracted;
    }
  } else if (total && !built) {
    built = total;
  } else if (built && !total) {
    total = built;
  }

  // Redondear a 2 decimales si existe
  const roundArea = (val: number | null) => (val !== null ? Math.round(val * 100) / 100 : null);

  return {
    totalAreaM2: roundArea(total),
    builtAreaM2: roundArea(built),
    landAreaM2: roundArea(land),
    internalAreaM2: roundArea(built),
    coveredAreaM2: roundArea(built),
    semiCoveredAreaM2: null,
    uncoveredAreaM2: total && built && total > built ? roundArea(total - built) : null,
    terraceAreaM2: null,
    balconyAreaM2: null,
    gardenAreaM2: null,
    garageAreaM2: null,
    confidence: total || built ? 90 : 0,
  };
}
