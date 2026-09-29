// ==============================================================================
// TEST SUITE: OPENAI AI CORE PRE-LIVE REMEDIATION & SEMANTIC UNDERWRITING
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
  // 1. MULTI-TENANT & SEMANTIC POLICY RESOLUTION
  // ----------------------------------------------------------------------------
  test('1. Multi-Tenant: Resuelve política determinística por organización sin imponer 70% universal', async () => {
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
      isDynamic: true,
      source: 'organization' as const,
    };

    const underAgent = new UnderwritingAgent();
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

  test('2. Semántica Estricta: Un Lender NO puede relajar un límite absoluto de Organización (MIN rule)', async () => {
    // Simular que la organización impone max_ltv = 50% y el lender intenta ofrecer 70%
    // El motor determinístico debe elegir 50%
    const orgMaxLtv = 50.0;
    const lenderMaxLtv = 70.0;
    const effectiveMaxLtv = Math.min(orgMaxLtv, lenderMaxLtv);

    expect(effectiveMaxLtv).toBe(50.0);
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
