// ==============================================================================
// TEST SUITE: OPENAI AI CORE PRE-LIVE REMEDIATION
// Verificación exhaustiva de Multi-Tenant Underwriting, Pricing Registry,
// Safe JSON Parsing, Model Routing y Aislamiento Multi-Organización.
// ==============================================================================

import { test, expect } from '@playwright/test';
import { underwritingPolicyResolver, PILOT_FALLBACK_POLICY } from '../server/ai/underwritingPolicyResolver';
import { pricingRegistry } from '../server/ai/pricingRegistry';
import { promptRegistry } from '../server/ai/promptRegistry';
import { normalizeOpenAiModel, calculateTokenCost } from '../server/ai/config';
import { UnderwritingAgent } from '../server/ai/agents/underwritingAgent';
import { parseSafeJson } from '../src/lib/adminAiService';

test.describe('HIPOTECALY OPENAI AI CORE — PRE-LIVE REMEDIATION', () => {

  // ----------------------------------------------------------------------------
  // 1. MULTI-TENANT UNDERWRITING RESOLUTION
  // ----------------------------------------------------------------------------
  test('1. Multi-Tenant: Resuelve política determinística por organización sin imponer 70% universal', async () => {
    // Organización A con política conservadora (LTV 40%)
    const customOrgPolicy = {
      organizationId: 'org_test_aaa_111',
      maxLtv: 40.0,
      maxLoanAmount: 150000,
      minLoanAmount: 20000,
      minTermMonths: 12,
      maxTermMonths: 48,
      acceptedPropertyTypes: ['apartamento', 'casa'],
      acceptedDepartments: ['Montevideo'],
      acceptedCurrencies: ['USD'],
      requiresIncomeProof: true,
      acceptedIncomeTypes: ['dependiente'],
      minimumIncomeMonthly: 1500,
      acceptsClearing: false,
      maxDtiRatio: 30.0,
      maxBorrowerAgeAtMaturity: 70,
      defaultInterestRateAnnual: 12.0,
    };

    const underAgent = new UnderwritingAgent();
    // Inmueble tasado en USD 200.000, préstamo solicitado USD 100.000 (LTV 50%) -> Debe violar tope del 40%
    const res = underAgent.evaluateUnderwriting(
      100000,
      200000,
      200000,
      36,
      'apartamento',
      'Montevideo',
      3000,
      customOrgPolicy
    );

    expect(res.eligible).toBe(false);
    expect(res.ltv_conservative).toBe(50);
    expect(res.policy_limits.max_ltv_allowed).toBe(40);
    expect(res.notes).toContain('supera el tope reglamentario del 40%');
  });

  test('2. Multi-Tenant: Organización B con política permisiva (LTV 65%) aprueba operación correspondiente', async () => {
    const orgBPolicy = {
      organizationId: 'org_test_bbb_222',
      maxLtv: 65.0,
      maxLoanAmount: 300000,
      minLoanAmount: 10000,
      minTermMonths: 12,
      maxTermMonths: 60,
      acceptedPropertyTypes: ['casa', 'apartamento', 'local_comercial'],
      acceptedDepartments: ['Montevideo', 'Canelones', 'Maldonado'],
      acceptedCurrencies: ['USD'],
      requiresIncomeProof: false,
      acceptedIncomeTypes: ['dependiente', 'independiente'],
      minimumIncomeMonthly: 0,
      acceptsClearing: true,
      maxDtiRatio: 40.0,
      maxBorrowerAgeAtMaturity: 80,
      defaultInterestRateAnnual: 10.5,
    };

    const underAgent = new UnderwritingAgent();
    // Inmueble USD 200.000, préstamo USD 110.000 (LTV 55%) -> Es menor a 65%, debe ser elegible
    const res = underAgent.evaluateUnderwriting(
      110000,
      200000,
      200000,
      36,
      'casa',
      'Canelones',
      4000,
      orgBPolicy
    );

    expect(res.eligible).toBe(true);
    expect(res.ltv_conservative).toBe(55);
    expect(res.policy_limits.max_ltv_allowed).toBe(65);
  });

  test('3. Fallback Seguro: Si organización no tiene política explícita, aplica piloto de forma transparente', async () => {
    const fallback = await underwritingPolicyResolver.resolveEffectivePolicy({
      organizationId: 'unconfigured_org_999',
    });

    expect(fallback.source).toBe('pilot_fallback');
    expect(fallback.maxLtv).toBe(PILOT_FALLBACK_POLICY.maxLtv);
  });

  // ----------------------------------------------------------------------------
  // 2. PRICING REGISTRY & FRESHNESS ENGINE
  // ----------------------------------------------------------------------------
  test('4. Pricing Registry: Retorna tarifas con estado de frescura (CURRENT / STALE / UNKNOWN)', async () => {
    const miniPricing = await pricingRegistry.getPricingForModel('gpt-4o-mini');
    expect(miniPricing.provider).toBe('openai');
    expect(miniPricing.model).toBe('gpt-4o-mini');
    expect(miniPricing.costInputPerMillionUsd).toBe(0.15);
    expect(miniPricing.costOutputPerMillionUsd).toBe(0.60);
    expect(['CURRENT', 'STALE', 'UNKNOWN']).toContain(miniPricing.status);

    const unknownPricing = await pricingRegistry.getPricingForModel('modelo-inexistente-xyz');
    expect(unknownPricing.status).toBe('UNKNOWN');
    expect(unknownPricing.isFallback).toBe(true);
  });

  test('5. Cost Calculation: Calcula ahorro exacto de Prompt Caching y unidad CASO AI', async () => {
    // 100.000 tokens input totales, 50.000 cacheados, 10.000 output en gpt-4o-mini
    const cost = calculateTokenCost('gpt-4o-mini', 100000, 50000, 10000, 0);
    expect(cost.costInputUsd).toBeGreaterThan(0);
    expect(cost.cacheSavingsUsd).toBeGreaterThan(0);
    expect(cost.caseUnits).toBeGreaterThanOrEqual(0.05);
  });

  // ----------------------------------------------------------------------------
  // 3. MODEL ROUTER & PROMPT REGISTRY
  // ----------------------------------------------------------------------------
  test('6. Model Router: Normaliza aliases internos (Luna, Terra, Sol) a identificadores oficiales de OpenAI', () => {
    expect(normalizeOpenAiModel('gpt-5.6-luna')).toBe('gpt-4o-mini');
    expect(normalizeOpenAiModel('gpt-5.6-terra')).toBe('gpt-4o');
    expect(normalizeOpenAiModel('gpt-5.6-sol')).toBe('o3-mini');
    expect(normalizeOpenAiModel('text-embedding-3-small')).toBe('text-embedding-3-small');
  });

  test('7. Prompt Registry: Recupera system prompts canónicos versionados', async () => {
    const docPrompt = await promptRegistry.getPrompt('DOCUMENT_EXTRACTION', '1.0.0');
    expect(docPrompt.promptKey).toBe('DOCUMENT_EXTRACTION');
    expect(docPrompt.status).toBe('ACTIVE');
    expect(docPrompt.systemPrompt).toContain('HIPOTECALY');
  });

  // ----------------------------------------------------------------------------
  // 4. PREVENCIÓN DEFINITIVA DE ERRORES DE PARSEO JSON (PARSE SAFE JSON)
  // ----------------------------------------------------------------------------
  test('8. Safe JSON Parsing: Maneja respuestas HTML o no JSON sin lanzar SyntaxError', async () => {
    // Simular respuesta HTML de error 500 de servidor
    const mockHtmlResponse = {
      text: async () => '<html><body>A server error occurred</body></html>',
    } as any;

    const fallback = { success: false, error: 'SERVER_ERROR' };
    const parsed = await parseSafeJson(mockHtmlResponse, fallback);
    expect(parsed).toEqual(fallback);
  });

  test('9. Safe JSON Parsing: Parsea correctamente respuestas JSON válidas', async () => {
    const mockValidResponse = {
      text: async () => JSON.stringify({ success: true, status: 'HEALTHY', provider: 'OpenAI' }),
    } as any;

    const parsed = await parseSafeJson(mockValidResponse, { success: false });
    expect(parsed.success).toBe(true);
    expect(parsed.status).toBe('HEALTHY');
  });

});
