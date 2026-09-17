// ==============================================================================
// TEST SUITE: Fase 1 - Normalización de Monedas y Parsing Numérico Inteligente
// Bloque G: USD, UYU, UI, UR, EUR y formatos mixtos
// ==============================================================================

import { test, expect } from '@playwright/test';
import {
  normalizeCurrency,
  parsePriceText,
  normalizePrice,
  REFERENCE_USD_UYU_RATE,
} from '../src/lib/tasador/normalization/CurrencyNormalizer';

test.describe('Fase 1 - Bloque G: Normalización de Monedas y Formatos', () => {
  test('1. Normalización de símbolos y textos de moneda', () => {
    expect(normalizeCurrency('USD')).toBe('USD');
    expect(normalizeCurrency('U$S')).toBe('USD');
    expect(normalizeCurrency('US$')).toBe('USD');
    expect(normalizeCurrency('Dólares')).toBe('USD');
    expect(normalizeCurrency('DOLAR')).toBe('USD');

    expect(normalizeCurrency('UYU')).toBe('UYU');
    expect(normalizeCurrency('$U')).toBe('UYU');
    expect(normalizeCurrency('$')).toBe('UYU');
    expect(normalizeCurrency('Pesos Uruguayos')).toBe('UYU');

    expect(normalizeCurrency('EUR')).toBe('EUR');
    expect(normalizeCurrency('€')).toBe('EUR');
    expect(normalizeCurrency('Euros')).toBe('EUR');

    expect(normalizeCurrency('UI')).toBe('UI');
    expect(normalizeCurrency('Unidades Indexadas')).toBe('UI');

    expect(normalizeCurrency('UR')).toBe('UR');
    expect(normalizeCurrency('Unidad Reajustable')).toBe('UR');
  });

  test('2. Parsing numérico inteligente para formatos monetarios', () => {
    // 150000
    const r1 = parsePriceText('150000');
    expect(r1.amount).toBe(150000);
    expect(r1.currency).toBe('USD');

    // 150.000 (miles)
    const r2 = parsePriceText('150.000');
    expect(r2.amount).toBe(150000);

    // 150,000 (miles anglo)
    const r3 = parsePriceText('150,000');
    expect(r3.amount).toBe(150000);

    // 150000.00 (decimal)
    const r4 = parsePriceText('150000.00');
    expect(r4.amount).toBe(150000.00);

    // 150.000,00 (latino con decimales)
    const r5 = parsePriceText('150.000,00');
    expect(r5.amount).toBe(150000);

    // USD 150,000.00 (anglo con decimales - NO debe convertirse en 150)
    const r6 = parsePriceText('USD 150,000.00');
    expect(r6.amount).toBe(150000);
    expect(r6.currency).toBe('USD');

    // US$ 150.000
    const r7 = parsePriceText('US$ 150.000');
    expect(r7.amount).toBe(150000);
    expect(r7.currency).toBe('USD');

    // $U 6.000.000 (múltiples separadores de miles)
    const r8 = parsePriceText('$U 6.000.000');
    expect(r8.amount).toBe(6000000);
    expect(r8.currency).toBe('UYU');
  });

  test('3. Conversión de USD y UYU verificable con tasa de referencia', () => {
    const usdRes = normalizePrice({
      priceRaw: 150000,
      currencyRaw: 'USD',
      builtAreaM2: 100,
    });
    expect(usdRes.status).toBe('NORMALIZED');
    expect(usdRes.priceUsd).toBe(150000);
    expect(usdRes.priceUyu).toBe(Math.round(150000 * REFERENCE_USD_UYU_RATE));
    expect(usdRes.pricePerM2Usd).toBe(1500);

    const uyuRes = normalizePrice({
      priceRaw: 6000000,
      currencyRaw: 'UYU',
      builtAreaM2: 100,
    });
    expect(uyuRes.status).toBe('NORMALIZED');
    expect(uyuRes.priceUyu).toBe(6000000);
    expect(uyuRes.priceUsd).toBe(Math.round(6000000 / REFERENCE_USD_UYU_RATE));
  });

  test('4. Bloqueo honesto VALUATION_BLOCKED_MISSING_EXCHANGE_RATE cuando falta cotización de UI, UR o EUR', () => {
    // Sin cotización de UI
    const uiRes = normalizePrice({
      priceRaw: 500000,
      currencyRaw: 'UI',
      builtAreaM2: 75,
    });
    expect(uiRes.status).toBe('VALUATION_BLOCKED_MISSING_EXCHANGE_RATE');
    expect(uiRes.priceUsd).toBeNull();
    expect(uiRes.error).toContain('Unidad Indexada');

    // Sin cotización de UR
    const urRes = normalizePrice({
      priceRaw: 3000,
      currencyRaw: 'UR',
      builtAreaM2: 75,
    });
    expect(urRes.status).toBe('VALUATION_BLOCKED_MISSING_EXCHANGE_RATE');
    expect(urRes.priceUsd).toBeNull();
    expect(urRes.error).toContain('Unidad Reajustable');

    // Sin cotización de EUR
    const eurRes = normalizePrice({
      priceRaw: 150000,
      currencyRaw: 'EUR',
      builtAreaM2: 75,
    });
    expect(eurRes.status).toBe('VALUATION_BLOCKED_MISSING_EXCHANGE_RATE');
    expect(eurRes.priceUsd).toBeNull();
    expect(eurRes.error).toContain('EUR/USD');

    // Con cotización oficial provista explícitamente
    const eurWithRate = normalizePrice({
      priceRaw: 100000,
      currencyRaw: 'EUR',
      builtAreaM2: 100,
      customExchangeRates: { EUR: 1.08 },
    });
    expect(eurWithRate.status).toBe('NORMALIZED');
    expect(eurWithRate.priceUsd).toBe(108000);
    expect(eurWithRate.pricePerM2Usd).toBe(1080);
  });
});
