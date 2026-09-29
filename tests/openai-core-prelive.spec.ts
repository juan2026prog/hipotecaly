// ==============================================================================
// TEST SUITE: OPENAI AI CORE PRE-LIVE REMEDIATION & POLICY ENGINE HARDENING
// ZERO IMPLICIT CREDIT DEFAULTS & REAL BUSINESS LOGIC VALIDATION
// ==============================================================================

import { test, expect } from '@playwright/test';
import {
  UnderwritingPolicyResolver,
  PolicyRepository,
  RawOrgPolicyRecord,
  RawLenderRulesRecord,
  CANONICAL_DEMO_POLICY,
  isWildcard,
  resolveListIntersection,
} from '../server/ai/underwritingPolicyResolver';
import { pricingRegistry } from '../server/ai/pricingRegistry';
import { promptRegistry } from '../server/ai/promptRegistry';
import { normalizeOpenAiModel, calculateTokenCost } from '../server/ai/config';
import { UnderwritingAgent } from '../server/ai/agents/underwritingAgent';
import { parseSafeJson } from '../src/lib/adminAiService';

// ------------------------------------------------------------------------------
// FAKE POLICY REPOSITORY PARA TESTS CONTROLADOS DE RESOLUCIÓN REAL
// ------------------------------------------------------------------------------
class FakePolicyRepository implements PolicyRepository {
  public orgPolicies: Map<string, RawOrgPolicyRecord> = new Map();
  public lenderRules: Map<string, RawLenderRulesRecord> = new Map();

  public async findActiveOrgPolicy(organizationId: string): Promise<{ data: RawOrgPolicyRecord | null; error: Error | null }> {
    const p = this.orgPolicies.get(organizationId);
    return { data: p || null, error: null };
  }

  public async findLenderRules(organizationId: string, lenderId: string): Promise<{ data: RawLenderRulesRecord | null; error: Error | null }> {
    const key = `${organizationId}__${lenderId}`;
    const r = this.lenderRules.get(key);
    return { data: r || null, error: null };
  }
}

test.describe('HIPOTECALY OPENAI AI CORE — POLICY ENGINE & PRE-LIVE HARDENING', () => {

  // ----------------------------------------------------------------------------
  // 1. RESOLUCIÓN DETERMINÍSTICA REAL CON POLICY REPOSITORY (ZERO IMPLICIT DEFAULTS)
  // ----------------------------------------------------------------------------
  test('1. Resolver Real: Org LTV 50 + Lender LTV 70 => Resuelve LTV 50 (MIN Cap)', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-001';
    const lenderId = 'lender-real-001';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
      min_loan_amount: 10000,
      max_loan_amount: 200000,
      min_term_months: 12,
      max_term_months: 60,
      accepted_property_types: ['casa', 'apartamento'],
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 70.0,
      min_loan: 15000,
      max_loan: 150000,
      min_term_months: 24,
      max_term_months: 48,
      accepted_property_types: ['casa', 'apartamento'],
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('RESOLVED');
    if (res.status === 'RESOLVED') {
      expect(res.policy.maxLtv).toBe(50.0);
      expect(res.policy.minLoanAmount).toBe(15000);
      expect(res.policy.maxLoanAmount).toBe(150000);
      expect(res.policy.minTermMonths).toBe(24);
      expect(res.policy.maxTermMonths).toBe(48);
      expect(res.policy.source).toBe('organization_and_lender');
    }
  });

  test('2. Resolver Real: Org LTV 90 + Lender LTV 60 => Resuelve LTV 60 (MIN Cap)', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-002';
    const lenderId = 'lender-real-002';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 90.0,
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 60.0,
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('RESOLVED');
    if (res.status === 'RESOLVED') {
      expect(res.policy.maxLtv).toBe(60.0);
      // Comprobar que no inventó montos ni plazos cuando no fueron configurados
      expect(res.policy.minLoanAmount).toBeUndefined();
      expect(res.policy.maxLoanAmount).toBeUndefined();
    }
  });

  test('3. Resolver Real: Política Incompleta (sin maxLtv) => POLICY_INCOMPLETE fail-closed', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-incomplete-001';

    // Org sin max_ltv configurado
    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      min_loan_amount: 10000,
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId });

    expect(res.status).toBe('POLICY_INCOMPLETE');
    if (res.status === 'POLICY_INCOMPLETE') {
      expect(res.missingFields).toContain('maxLtv');
    }
  });

  test('4. Resolver Real: Inversor Inactivo => LENDER_INACTIVE', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-003';
    const lenderId = 'lender-inactive-001';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 40.0,
      lender: { organization_id: orgId, status: 'suspended' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('LENDER_INACTIVE');
  });

  test('5. Resolver Real: Tipos de propiedad disjuntos => NO_COMPATIBLE_POLICY', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-004';
    const lenderId = 'lender-real-004';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
      accepted_property_types: ['apartamento'],
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 50.0,
      accepted_property_types: ['campo'],
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('NO_COMPATIBLE_POLICY');
    if (res.status === 'NO_COMPATIBLE_POLICY') {
      expect(res.reasons.some((r) => r.includes('PROPERTY_TYPE_INTERSECTION_EMPTY'))).toBe(true);
    }
  });

  test('6. Resolver Real: Departamentos disjuntos => NO_COMPATIBLE_POLICY', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-005';
    const lenderId = 'lender-real-005';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
      accepted_departments: ['Montevideo'],
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 50.0,
      accepted_departments: ['Maldonado'],
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('NO_COMPATIBLE_POLICY');
    if (res.status === 'NO_COMPATIBLE_POLICY') {
      expect(res.reasons.some((r) => r.includes('DEPARTMENT_INTERSECTION_EMPTY'))).toBe(true);
    }
  });

  test('7. Resolver Real: Rango de montos incompatible (minLoan > maxLoan) => NO_COMPATIBLE_POLICY', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-006';
    const lenderId = 'lender-real-006';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
      min_loan_amount: 150000,
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 50.0,
      max_loan: 100000,
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('NO_COMPATIBLE_POLICY');
    if (res.status === 'NO_COMPATIBLE_POLICY') {
      expect(res.reasons.some((r) => r.includes('LOAN_RANGE_EMPTY'))).toBe(true);
    }
  });

  test('8. Resolver Real: Rango de plazos incompatible (minTerm > maxTerm) => NO_COMPATIBLE_POLICY', async () => {
    const fakeRepo = new FakePolicyRepository();
    const orgId = 'org-real-007';
    const lenderId = 'lender-real-007';

    fakeRepo.orgPolicies.set(orgId, {
      organization_id: orgId,
      max_ltv: 50.0,
      min_term_months: 60,
    });

    fakeRepo.lenderRules.set(`${orgId}__${lenderId}`, {
      lender_id: lenderId,
      max_ltv: 50.0,
      max_term_months: 36,
      lender: { organization_id: orgId, status: 'active' },
    });

    const resolver = new UnderwritingPolicyResolver(fakeRepo);
    const res = await resolver.resolveEffectivePolicy({ organizationId: orgId, lenderId });

    expect(res.status).toBe('NO_COMPATIBLE_POLICY');
    if (res.status === 'NO_COMPATIBLE_POLICY') {
      expect(res.reasons.some((r) => r.includes('TERM_RANGE_EMPTY'))).toBe(true);
    }
  });

  test('9. Wildcards: Helper isWildcard identifica "Todos", "ALL", "*" y Arrays correctamente', () => {
    expect(isWildcard('Todos')).toBe(true);
    expect(isWildcard('ALL')).toBe(true);
    expect(isWildcard('*')).toBe(true);
    expect(isWildcard(['Montevideo', 'Todos'])).toBe(true);
    expect(isWildcard('Montevideo')).toBe(false);
  });

  test('10. Wildcard Matching: Org ALL + Lender Montevideo => Montevideo', () => {
    const int = resolveListIntersection(['Todos'], ['Montevideo']);
    expect(int.empty).toBe(false);
    expect(int.result).toEqual(['Montevideo']);
  });

  test('11. Demo Explícito: Devuelve DEMO_POLICY solo cuando isDemoMode=true o ID canónico', async () => {
    const resolver = UnderwritingPolicyResolver.getInstance();
    const res = await resolver.resolveEffectivePolicy({
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
  // 2. UNDERWRITING AGENT DETERMINÍSTICO FAIL-CLOSED
  // ----------------------------------------------------------------------------
  test('12. Underwriting Agent: Rechaza si no se provee política válida', () => {
    const underAgent = new UnderwritingAgent();
    expect(() => {
      underAgent.evaluateUnderwriting(100000, 200000, 200000, 36, 'casa', 'Montevideo', 3000, undefined as any);
    }).toThrow('INVALID_POLICY');
  });

  test('13. Deterministic Underwriting: Aplica regla estricta de LTV sin defaults inventados', () => {
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
        maxLtv: 50.0,
        maxLoanAmount: 200000,
        minLoanAmount: 10000,
        minTermMonths: 12,
        maxTermMonths: 60,
        acceptedPropertyTypes: ['casa'],
        acceptedDepartments: ['Montevideo'],
        defaultInterestRateAnnual: 11.5,
      }
    );

    // Préstamo 120.000 / 200.000 = LTV 60% > tope 50%
    expect(res.eligible).toBe(false);
    expect(res.ltv_conservative).toBe(60);
    expect(res.policy_limits.max_ltv_allowed).toBe(50);
  });

  // ----------------------------------------------------------------------------
  // 3. PRICING REGISTRY & COST ENGINE
  // ----------------------------------------------------------------------------
  test('14. Pricing Registry: Identifica modelos configurados y gestiona freshness', async () => {
    const mini = await pricingRegistry.getPricingForModel('gpt-4o-mini');
    expect(mini.model).toBe('gpt-4o-mini');
    expect(mini.costInputPerMillionUsd).toBe(0.15);
    expect(['CURRENT', 'STALE', 'UNKNOWN']).toContain(mini.status);

    const unknown = await pricingRegistry.getPricingForModel('non-existent-model');
    expect(unknown.status).toBe('UNKNOWN');
    expect(unknown.isFallback).toBe(true);
  });

  test('15. Cost Calculation: Calcula desglose exacto de input, cached y output tokens', () => {
    const cost = calculateTokenCost('gpt-4o-mini', 100000, 50000, 20000, 0);
    expect(cost.costInputUsd).toBeGreaterThan(0);
    expect(cost.cacheSavingsUsd).toBeGreaterThan(0);
    expect(cost.caseUnits).toBeGreaterThanOrEqual(0.05);
  });

  // ----------------------------------------------------------------------------
  // 4. MODEL ROUTING & PROMPT REGISTRY
  // ----------------------------------------------------------------------------
  test('16. Model Router: Normaliza perfiles internos a IDs de modelo configurados', () => {
    expect(normalizeOpenAiModel('gpt-5.6-luna')).toBe('gpt-4o-mini');
    expect(normalizeOpenAiModel('gpt-5.6-terra')).toBe('gpt-4o');
    expect(normalizeOpenAiModel('gpt-5.6-sol')).toBe('o3-mini');
  });

  test('17. Prompt Registry: Recupera plantillas activas de prompts versionados', async () => {
    const prompt = await promptRegistry.getPrompt('DOCUMENT_EXTRACTION', '1.0.0');
    expect(prompt.promptKey).toBe('DOCUMENT_EXTRACTION');
    expect(prompt.status).toBe('ACTIVE');
  });

  // ----------------------------------------------------------------------------
  // 5. SAFE JSON PARSING & ERROR HANDLING
  // ----------------------------------------------------------------------------
  test('18. Safe JSON: Maneja respuestas HTML de error 500/502 sin SyntaxError', async () => {
    const htmlRes = {
      text: async () => '<html><body>A server error occurred in Vercel</body></html>',
    } as any;

    const fallback = { success: false, error: 'SERVER_ERROR' };
    const parsed = await parseSafeJson(htmlRes, fallback);
    expect(parsed).toEqual(fallback);
  });

  test('19. Safe JSON: Parsea correctamente payloads JSON válidos', async () => {
    const jsonRes = {
      text: async () => JSON.stringify({ success: true, active: true }),
    } as any;

    const parsed = await parseSafeJson(jsonRes, { success: false });
    expect(parsed.success).toBe(true);
    expect(parsed.active).toBe(true);
  });

});

