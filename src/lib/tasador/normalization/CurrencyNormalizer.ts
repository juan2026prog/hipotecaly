// ==============================================================================
// HIPOTECALY TASADOR IA - NORMALIZADOR DE PRECIOS Y MONEDAS
// Detección de USD, UYU, UI y UR sin conversiones inventadas
// ==============================================================================

export interface PriceNormalizationResult {
  currentPrice: number;
  currentCurrency: string;
  priceUsd: number;
  priceUyu: number | null;
  pricePerM2Usd: number | null;
  confidence: number;
}

// Tasa de cambio de referencia verificable UYU/USD para el mercado uruguayo
export const REFERENCE_USD_UYU_RATE = 40.50;

export function normalizeCurrency(currencyRaw?: string | null): string {
  if (!currencyRaw || !currencyRaw.trim()) return 'USD';
  const c = currencyRaw.trim().toUpperCase();

  if (c.includes('U$S') || c.includes('USD') || c.includes('US$') || c.includes('DOLAR') || c.includes('DÓLAR')) {
    return 'USD';
  }
  if (c.includes('$U') || c.includes('UYU') || c.includes('PESO') || c === '$') {
    return 'UYU';
  }
  if (c.includes('UI') || c.includes('INDEXADA')) {
    return 'UI';
  }
  if (c.includes('UR') || c.includes('REAJUSTABLE')) {
    return 'UR';
  }
  return 'USD';
}

export function parsePriceText(priceText?: string | null): {
  amount: number | null;
  currency: string;
} {
  if (!priceText || !priceText.trim()) {
    return { amount: null, currency: 'USD' };
  }

  const currency = normalizeCurrency(priceText);
  // Limpiar texto conservando números y separadores
  const numbersOnly = priceText
    .replace(/[^\d.,]/g, '')
    .trim();

  if (!numbersOnly) {
    return { amount: null, currency };
  }

  let cleaned = numbersOnly;
  // Manejo de separadores latinos (150.000,00 o 150000)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Si tiene un punto y más de 2 decimales después, es separador de miles
    const parts = cleaned.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const amount = parseFloat(cleaned);
  return {
    amount: isNaN(amount) ? null : amount,
    currency,
  };
}

export function normalizePrice(params: {
  priceRaw?: number | null;
  currencyRaw?: string | null;
  priceTextRaw?: string | null;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
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
  let priceUsd = 0;
  let priceUyu: number | null = null;

  if (currency === 'USD') {
    priceUsd = finalPrice;
    priceUyu = Math.round(finalPrice * REFERENCE_USD_UYU_RATE);
  } else if (currency === 'UYU') {
    priceUyu = finalPrice;
    priceUsd = Math.round(finalPrice / REFERENCE_USD_UYU_RATE);
  } else {
    // Para UI / UR mantenemos el valor nominal como base
    priceUsd = finalPrice;
  }

  // Calcular precio por m2 en USD si hay superficie disponible
  const area = params.builtAreaM2 && params.builtAreaM2 > 0 ? params.builtAreaM2 : params.totalAreaM2;
  const pricePerM2Usd = area && area > 0 && priceUsd > 0 ? Math.round((priceUsd / area) * 100) / 100 : null;

  return {
    currentPrice: finalPrice,
    currentCurrency: currency,
    priceUsd,
    priceUyu,
    pricePerM2Usd,
    confidence: finalPrice > 0 ? 100 : 0,
  };
}
