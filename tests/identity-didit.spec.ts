import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { HmacVerifier } from '../server/identity/hmacVerifier';
import { MockKycProvider } from '../src/lib/siteos/identity/providers/MockKycProvider';
import { DiditKycProvider } from '../src/lib/siteos/identity/providers/DiditKycProvider';
import { canTransitionKyc, normalizeDiditStatus } from '../src/lib/siteos/identity/stateMachine';
import { KycService } from '../server/identity/kycService';

test.describe('SiteOS Identity & KYC (Didit API v3) Unit / Integration Tests', () => {
  const testSecret = 'didit_shared_secret_key_test_2026';

  test('HmacVerifier: valida correctamente firmas X-Signature-V2 HMAC-SHA256 timing-safe', () => {
    const rawPayload = JSON.stringify({
      session_id: 'didit-sess-12345',
      status: 'Approved',
      workflow_id: 'wf_hipotecaly_standard',
    });

    const validSignature = crypto.createHmac('sha256', testSecret).update(rawPayload).digest('hex');

    const isValid = HmacVerifier.verifyHmacSha256(rawPayload, validSignature, testSecret);
    expect(isValid).toBe(true);
  });

  test('HmacVerifier: rechaza firmas alteradas o inválidas', () => {
    const rawPayload = JSON.stringify({ session_id: 'didit-sess-12345', status: 'Approved' });
    const invalidSignature = 'a'.repeat(64);

    const isValid = HmacVerifier.verifyHmacSha256(rawPayload, invalidSignature, testSecret);
    expect(isValid).toBe(false);
  });

  test('HmacVerifier: rechaza payloads manipulados (tampering)', () => {
    const originalPayload = JSON.stringify({ session_id: 'didit-sess-12345', status: 'Approved' });
    const tamperedPayload = JSON.stringify({ session_id: 'didit-sess-12345', status: 'Declined' });
    const signature = crypto.createHmac('sha256', testSecret).update(originalPayload).digest('hex');

    const isValid = HmacVerifier.verifyHmacSha256(tamperedPayload, signature, testSecret);
    expect(isValid).toBe(false);
  });

  test('MockKycProvider: crea sesión simulada y resuelve estados', async () => {
    const provider = new MockKycProvider();
    const session = await provider.createSession({
      tenantId: 't-001',
      caseId: 'case-001',
      documentType: 'CI',
      country: 'UY',
    });

    expect(session.sessionId).toBeDefined();
    expect(session.status).toBe('created');
    expect(session.provider).toBe('mock');

    // Forzar a verificado
    const decision = provider.forceSessionResult(session.sessionId, 'verified', 'Prueba unitaria');
    expect(decision.status).toBe('verified');
    expect(decision.checks?.documentValid).toBe(true);
    expect(decision.checks?.selfieMatch).toBe(true);
  });

  test('DiditKycProvider: crea sesión simulada en modo mock y valida firma X-Signature-V2', async () => {
    const provider = new DiditKycProvider({
      webhookSecret: testSecret,
      mode: 'mock',
    });

    const session = await provider.createSession({
      tenantId: 't-didit-01',
      caseId: 'case-didit-01',
      documentType: 'CI',
      country: 'UY',
    });

    expect(session.sessionId).toBeDefined();
    expect(session.provider).toBe('didit');
    expect(session.status).toBe('created');
    expect(session.sessionUrl).toContain('didit_mock_session');

    // Verificar firma webhook
    const rawPayload = JSON.stringify({ session_id: session.sessionId, status: 'Approved' });
    const signature = crypto.createHmac('sha256', testSecret).update(rawPayload).digest('hex');

    const isValid = await provider.verifyWebhook(rawPayload, {
      'x-signature-v2': signature,
    });
    expect(isValid).toBe(true);

    // Procesar webhook
    const webhookRes = await provider.handleWebhook(rawPayload, {});
    expect(webhookRes.handled).toBe(true);
    expect(webhookRes.status).toBe('verified');
    expect(webhookRes.decision?.status).toBe('verified');
  });

  test('Didit State Machine & Status Normalizer (Approved, Declined, In Review, Resubmitted, Expired)', () => {
    expect(normalizeDiditStatus('Approved')).toBe('verified');
    expect(normalizeDiditStatus('approved')).toBe('verified');
    expect(normalizeDiditStatus('Declined')).toBe('failed');
    expect(normalizeDiditStatus('declined')).toBe('failed');
    expect(normalizeDiditStatus('In Review')).toBe('pending_review');
    expect(normalizeDiditStatus('in_review')).toBe('pending_review');
    expect(normalizeDiditStatus('Resubmitted')).toBe('resubmission_required');
    expect(normalizeDiditStatus('resubmission_required')).toBe('resubmission_required');
    expect(normalizeDiditStatus('Expired')).toBe('expired');
    expect(normalizeDiditStatus('Abandoned')).toBe('abandoned');
    expect(normalizeDiditStatus('Created')).toBe('created');
    expect(normalizeDiditStatus('In Progress')).toBe('in_progress');

    // Transiciones válidas
    expect(canTransitionKyc('created', 'in_progress')).toBe(true);
    expect(canTransitionKyc('in_progress', 'verified')).toBe(true);
    expect(canTransitionKyc('verified', 'in_progress')).toBe(false); // Verified es terminal
    expect(canTransitionKyc('resubmission_required', 'in_progress')).toBe(true);
  });

  test('KycService: forzado de resultados de prueba para QA', async () => {
    const result = await KycService.forceKycTestResult({
      adminId: 'superadmin-qa',
      sessionId: 'didit-sess-test-unit',
      forcedStatus: 'verified',
      reason: 'Certificación de testing automatizado Didit',
    });

    expect(result).toBeDefined();
    expect(result.provider).toBe('didit');
    expect(result.status).toBe('verified');
  });

  test('KycService: Reconciliación de decisión con fallback para polling', async () => {
    const result = await KycService.reconcileDecision('didit_mock_sess_123');
    expect(result.reconciled).toBe(true);
    expect(result.status).toBe('verified');
  });
});
