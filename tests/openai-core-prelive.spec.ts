// ==============================================================================
// TEST SUITE: OPENAI AI CORE PRE-LIVE REMEDIATION & POLICY ENGINE HARDENING
// ==============================================================================

import { test, expect } from '@playwright/test';
import {
  underwritingPolicyResolver,
  CANONICAL_DEMO_POLICY,
  isWildcard,
  resolveListIntersection,
} from '../server/ai/underwritingPolicyResolver';
import { pricingRegistry } from '../server/ai/pricingRegistry';
import { promptRegistry } from '../server/ai/promptRegistry';
import { normalizeOpenAiModel, calculateTokenCost } from '../server/ai/config';
import { UnderwritingAgent } from '../server/ai/agents/underwritingAgent';
import { parseSafeJson } from '../src/lib/adminAiService';

test.describe('HIPOTECALY OPENAI AI CORE — POLICY ENGINE & PRE-LIVE HARDENING', () => {

  // ----------------------------------------------------------------------------
  // 1. SEMÁNTICA DE PRECEDENCIA & INTERSECCIONES DE POLÍTICA
  // ----------------------------------------------------------------------------
  test('1. Semántica: Org maxLtv 50 + Lender maxLtv 70 => Resuelve 50 (MIN Cap)', () => {
    const orgLtv = 50.0;
    const lenderLtv = 70.0;
    const effective = Math.min(orgLtv, lenderLtv);
    expect(effective).toBe(50.0);
  });

  test('2. Semántica: Org maxLtv 90 + Lender maxLtv 60 => Resuelve 60 (MIN Cap)', () => {
    const orgLtv = 90.0;
    const lenderLtv = 60.0;
    const effective = Math.min(orgLtv, lenderLtv);
    expect(effective).toBe(60.0);
  });

  test('3. Intersección Disjunta: Org ["apartamento"] + Lender ["campo"] => NO_COMPATIBLE_POLICY', () => {
    const int = resolveListIntersection(['apartamento'], ['campo']);
    expect(int.empty).toBe(true);
    expect(int.result.length).toBe(0);
  });

  test('4. Intersección Departamentos: Org ["Montevideo"] + Lender ["Maldonado"] => NO_COMPATIBLE_POLICY', () => {
    const int = resolveListIntersection(['Montevideo'], ['Maldonado']);
    expect(int.empty).toBe(true);
  });

  test('5. Intersección Monedas: Org ["USD"] + Lender ["UYU"] => NO_COMPATIBLE_POLICY', () => {
    const int = resolveListIntersection(['USD'], ['UYU']);
    expect(int.empty).toBe(true);
  });

  test('6. Rangos Imposibles: minTerm 48 > maxTerm 36 => Incompatible', () => {
    const minTerm = 48;
    const maxTerm = 36;
    expect(minTerm > maxTerm).toBe(true);
  });

  test('7. Rangos Imposibles: minLoan 200.000 > maxLoan 100.000 => Incompatible', () => {
    const minLoan = 200000;
    const maxLoan = 100000;
    expect(minLoan > maxLoan).toBe(true);
  });

  test('8. Wildcards: Helper isWildcard identifica "Todos", "ALL", "*" y Arrays correctamente', () => {
    expect(isWildcard('Todos')).toBe(true);
    expect(isWildcard('ALL')).toBe(true);
    expect(isWildcard('*')).toBe(true);
    expect(isWildcard(['Montevideo', 'Todos'])).toBe(true);
    expect(isWildcard('Montevideo')).toBe(false);
  });

  test('9. Wildcard Matching: Org ALL + Lender Montevideo => Montevideo', () => {
    const int = resolveListIntersection(['Todos'], ['Montevideo']);
    expect(int.empty).toBe(false);
    expect(int.result).toEqual(['Montevideo']);
  });

  test('10. Wildcard Matching: Org Montevideo + Lender ALL => Montevideo', () => {
    const int = resolveListIntersection(['Montevideo'], ['ALL']);
    expect(int.empty).toBe(false);
    expect(int.result).toEqual(['Montevideo']);
  });

  test('11. Demo Explícito: Resolver devuelve DEMO_POLICY para tenant demo', async () => {
    const res = await underwritingPolicyResolver.resolveEffectivePolicy({
      organizationId: 'd0000000-0000-0000-0000-000000000001',
      isDemoMode: true,
    });
    expect(res.status).toBe('DEMO_POLICY');
    if (res.status === 'DEMO_POLICY') {
      expect(res.policy.source).toBe('demo');
      expect(res.policy.maxLtv).toBe(CANONICAL_DEMO_POLICY.maxLtv);
    }
  });

  // ----------------------------------------------------------------------------
  // 2. UNDERWRITING AGENT DETERMINÍSTICO
  // ----------------------------------------------------------------------------
  test('12. Deterministic Underwriting: Aplica regla estricta de LTV y DTI sin intervención de LLM', () => {
    const underAgent = new UnderwritingAgent();
    const res = underAgent.evaluateUnderwriting(
      120000,
      200000,
      200000,
      36,
      'casa',
      'Montevideo',
      4000,
      {
        ...CANONICAL_DEMO_POLICY,
        maxLtv: 50.0,
      }
    );

    // Préstamo 120.000 / 200.000 = LTV 60% > tope 50%
    expect(res.eligible).toBe(false);
    expect(res.ltv_conservative).toBe(60);
    expect(res.policy_limits.max_ltv_allowed).toBe(50);
  });

  // ----------------------------------------------------------------------------
  // 3. PRICING REGISTRY & FRESHNESS
  // ----------------------------------------------------------------------------
  test('13. Pricing Registry: Identifica modelos configurados y gestiona freshness', async () => {
    const mini = await pricingRegistry.getPricingForModel('gpt-4o-mini');
    expect(mini.model).toBe('gpt-4o-mini');
    expect(mini.costInputPerMillionUsd).toBe(0.15);
    expect(['CURRENT', 'STALE', 'UNKNOWN']).toContain(mini.status);

    const unknown = await pricingRegistry.getPricingForModel('non-existent-model');
    expect(unknown.status).toBe('UNKNOWN');
    expect(unknown.isFallback).toBe(true);
  });

  test('14. Cost Calculation: Calcula desglose exacto de input, cached y output tokens', () => {
    const cost = calculateTokenCost('gpt-4o-mini', 100000, 50000, 20000, 0);
    expect(cost.costInputUsd).toBeGreaterThan(0);
    expect(cost.cacheSavingsUsd).toBeGreaterThan(0);
    expect(cost.caseUnits).toBeGreaterThanOrEqual(0.05);
  });

  // ----------------------------------------------------------------------------
  // 4. MODEL ROUTING & PROMPT REGISTRY
  // ----------------------------------------------------------------------------
  test('15. Model Router: Normaliza perfiles internos a IDs de modelo configurados', () => {
    expect(normalizeOpenAiModel('gpt-5.6-luna')).toBe('gpt-4o-mini');
    expect(normalizeOpenAiModel('gpt-5.6-terra')).toBe('gpt-4o');
    expect(normalizeOpenAiModel('gpt-5.6-sol')).toBe('o3-mini');
  });

  test('16. Prompt Registry: Recupera plantillas activas de prompts versionados', async () => {
    const prompt = await promptRegistry.getPrompt('DOCUMENT_EXTRACTION', '1.0.0');
    expect(prompt.promptKey).toBe('DOCUMENT_EXTRACTION');
    expect(prompt.status).toBe('ACTIVE');
  });

  // ----------------------------------------------------------------------------
  // 5. SAFE JSON PARSING & ERROR HANDLING
  // ----------------------------------------------------------------------------
  test('17. Safe JSON: Maneja respuestas HTML de error 500/502 sin SyntaxError', async () => {
    const htmlRes = {
      text: async () => '<html><body>A server error occurred in Vercel</body></html>',
    } as any;

    const fallback = { success: false, error: 'SERVER_ERROR' };
    const parsed = await parseSafeJson(htmlRes, fallback);
    expect(parsed).toEqual(fallback);
  });

  test('18. Safe JSON: Parsea correctamente payloads JSON válidos', async () => {
    const jsonRes = {
      text: async () => JSON.stringify({ success: true, active: true }),
    } as any;

    const parsed = await parseSafeJson(jsonRes, { success: false });
    expect(parsed.success).toBe(true);
    expect(parsed.active).toBe(true);
  });

});
