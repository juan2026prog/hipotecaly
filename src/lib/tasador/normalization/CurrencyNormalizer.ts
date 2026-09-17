// ==============================================================================
// HIPOTECALY TASADOR IA - NORMALIZADOR DE PRECIOS Y MONEDAS
// Detección y normalización estricta de USD, UYU, UI, UR y EUR sin conversiones inventadas
// ==============================================================================

export type SupportedCurrency = 'USD' | 'UYU' | 'UI' | 'UR' | 'EUR';

export interface PriceNormalizationResult {
  currentPrice: number;
  currentCurrency: SupportedCurrency;
  priceUsd: number | null;
  priceUyu: number | null;
  pricePerM2Usd: number | null;
  confidence: number;
  status: 'NORMALIZED' | 'VALUATION_BLOCKED_MISSING_EXCHANGE_RATE';
  error?: string;
}

// Tasa de cambio de referencia verificable UYU/USD para el mercado uruguayo
export const REFERENCE_USD_UYU_RATE = 40.50;

export function normalizeCurrency(currencyRaw?: string | null): SupportedCurrency {
  if (!currencyRaw || !currencyRaw.trim()) return 'USD';
  const clean = currencyRaw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (clean.includes('EUR') || clean.includes('€') || clean.includes('EURO')) {
    return 'EUR';
  }
  if (clean.includes('UI') || clean.includes('INDEXADA')) {
    return 'UI';
  }
  if (clean.includes('$U') || clean.includes('UYU') || clean.includes('PESO') || clean.includes('URUGUAY') || clean === '$' || clean.startsWith('$ ')) {
    return 'UYU';
  }
  if (clean.includes('UNIDAD REAJUSTABLE') || clean.split(/[\s,.-]+/).includes('UR') || clean === 'UR') {
    return 'UR';
  }
  if (clean.includes('U$S') || clean.includes('USD') || clean.includes('US$') || clean.includes('DOLAR')) {
    return 'USD';
  }

  return 'USD';
}

/**
 * Parser numérico inteligente para formatos monetarios:
 * - 150000
 * - 150.000
 * - 150,000
 * - 150000.00
 * - 150.000,00
 * - USD 150,000.00
 * - US$ 150.000
 * - $U 6.000.000
 */
export function parsePriceText(priceText?: string | null): {
  amount: number | null;
  currency: SupportedCurrency;
} {
  if (!priceText || !priceText.trim()) {
    return { amount: null, currency: 'USD' };
  }

  const raw = priceText.trim();
  const currency = normalizeCurrency(raw);

  // Extraer únicamente dígitos, puntos y comas
  const numbersOnly = raw.replace(/[^\d.,]/g, '').trim();
  if (!numbersOnly) {
    return { amount: null, currency };
  }

  let cleaned = numbersOnly;

  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  if (hasDot && hasComma) {
    const lastDotIndex = cleaned.lastIndexOf('.');
    const lastCommaIndex = cleaned.lastIndexOf(',');

    if (lastCommaIndex > lastDotIndex) {
      // Formato latino: 150.000,00 -> eliminar puntos de miles y coma a punto decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato anglosajón: 150,000.00 -> eliminar comas de miles
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasDot && !hasComma) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Múltiples puntos: ej. 6.000.000 -> son separadores de miles
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts.length === 2) {
      // Un solo punto: ej. 150.000 (miles) vs 150000.50 (decimal)
      if (parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
        // Separador de miles: 150.000 -> 150000
        cleaned = cleaned.replace(/\./g, '');
      }
      // Si tiene 1 o 2 dígitos después del punto, se asume decimal: ej. 150000.00 -> 150000.00
    }
  } else if (hasComma && !hasDot) {
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      // Múltiples comas: ej. 6,000,000 -> son separadores de miles
      cleaned = cleaned.replace(/,/g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
        // Separador de miles: 150,000 -> 150000
        cleaned = cleaned.replace(/,/g, '');
      } else {
        // Decimal latino: 150000,50 -> 150000.50
        cleaned = cleaned.replace(',', '.');
      }
    }
  }

  const amount = parseFloat(cleaned);
  return {
    amount: isNaN(amount) ? null : amount,
    currency,
  };
}

/**
 * Normaliza el precio a USD y UYU verificando cotizaciones
 */
export function normalizePrice(params: {
  priceRaw?: number | null;
  currencyRaw?: string | null;
  priceTextRaw?: string | null;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  customExchangeRates?: Partial<Record<SupportedCurrency, number>>;
}): PriceNormalizationResult {
  let price = params.priceRaw;
  let currency = normalizeCurrency(params.currencyRaw);

  if ((price === undefined || price === null || price <= 0) && params.priceTextRaw) {
    const parsed = parsePriceText(params.priceTextRaw);
    if (parsed.amount && parsed.amount > 0) {
      price = parsed.amount;
      currency = parsed.currency;
    }
  }

  const finalPrice = price && price > 0 ? price : 0;
  let priceUsd: number | null = null;
  let priceUyu: number | null = null;
  let status: 'NORMALIZED' | 'VALUATION_BLOCKED_MISSING_EXCHANGE_RATE' = 'NORMALIZED';
  let errorMsg: string | undefined = undefined;

  const customRates = params.customExchangeRates || {};

  if (currency === 'USD') {
    priceUsd = finalPrice;
    priceUyu = Math.round(finalPrice * REFERENCE_USD_UYU_RATE);
  } else if (currency === 'UYU') {
    priceUyu = finalPrice;
    priceUsd = Math.round(finalPrice / REFERENCE_USD_UYU_RATE);
  } else if (currency === 'EUR') {
    if (customRates.EUR && customRates.EUR > 0) {
      priceUsd = Math.round(finalPrice * customRates.EUR);
      priceUyu = Math.round((priceUsd || 0) * REFERENCE_USD_UYU_RATE);
    } else {
      status = 'VALUATION_BLOCKED_MISSING_EXCHANGE_RATE';
      errorMsg = 'Falta cotización oficial verificada EUR/USD para normalizar la tasación.';
    }
  } else if (currency === 'UI') {
    if (customRates.UI && customRates.UI > 0) {
      priceUyu = Math.round(finalPrice * customRates.UI);
      priceUsd = Math.round(priceUyu / REFERENCE_USD_UYU_RATE);
    } else {
      status = 'VALUATION_BLOCKED_MISSING_EXCHANGE_RATE';
      errorMsg = 'Falta valor oficial de la Unidad Indexada (UI/UYU) para normalizar la tasación.';
    }
  } else if (currency === 'UR') {
    if (customRates.UR && customRates.UR > 0) {
      priceUyu = Math.round(finalPrice * customRates.UR);
      priceUsd = Math.round(priceUyu / REFERENCE_USD_UYU_RATE);
    } else {
      status = 'VALUATION_BLOCKED_MISSING_EXCHANGE_RATE';
      errorMsg = 'Falta valor oficial de la Unidad Reajustable (UR/UYU) para normalizar la tasación.';
    }
  }

  // Calcular precio por m2 en USD si hay superficie disponible y precio USD válido
  const area = params.builtAreaM2 && params.builtAreaM2 > 0 ? params.builtAreaM2 : params.totalAreaM2;
  const pricePerM2Usd = area && area > 0 && priceUsd && priceUsd > 0 ? Math.round((priceUsd / area) * 100) / 100 : null;

  return {
    currentPrice: finalPrice,
    currentCurrency: currency,
    priceUsd,
    priceUyu,
    pricePerM2Usd,
    confidence: status === 'NORMALIZED' && finalPrice > 0 ? 100 : 0,
    status,
    error: errorMsg,
  };
}
