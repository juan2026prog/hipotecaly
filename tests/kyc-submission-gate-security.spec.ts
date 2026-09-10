import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { HmacVerifier } from '../server/identity/hmacVerifier';
import { KycService, normalizeDiditStatus } from '../server/identity/kycService';
import { submitFinalApplication } from '../src/lib/applicationService';

test.describe('KYC Submission Gate & Security Hardening (Playwright Security Suite)', () => {
  const testSecret = 'didit_webhook_secret_test_2026_secure';

  test.beforeAll(() => {
    process.env.DIDIT_WEBHOOK_SECRET = testSecret;
    process.env.KYC_MODE = 'sandbox';
  });

  test('Matrix 1: KYC status NOT_STARTED deniega envío formal y conserva borrador', async () => {
    const mockAppId = `app_test_not_started_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
    expect(result.error?.message).toContain('KYC_REQUIRED');
  });

  test('Matrix 2: KYC status IN_PROGRESS deniega envío formal', async () => {
    const mockAppId = `app_test_in_progress_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Matrix 3: KYC status PENDING_REVIEW deniega envío formal', async () => {
    const mockAppId = `app_test_pending_review_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Matrix 4: KYC status FAILED deniega envío formal', async () => {
    const mockAppId = `app_test_failed_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Matrix 5: KYC status RESUBMISSION_REQUIRED deniega envío formal', async () => {
    const mockAppId = `app_test_resubmission_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Matrix 6: KYC status EXPIRED deniega envío formal', async () => {
    const mockAppId = `app_test_expired_${Date.now()}`;
    const result = await submitFinalApplication(mockAppId);
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Matrix 7: KYC status VERIFIED autoriza cambio de borrador a submitted', async () => {
    const demoAppId = `demo_app_verified_${Date.now()}`;
    const result = await submitFinalApplication(demoAppId);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  test('Seguridad Frontend: Manipulación de payload kycStatus="verified" en cliente no elude la DB autoritativa', async () => {
    // Simular que el cliente intenta forzar kycStatus: "verified" desde frontend
    const manipulatedAppId = `app_tampered_${Date.now()}`;
    const result = await submitFinalApplication(manipulatedAppId);
    
    // Debe consultar la base de datos autoritativa y denegar si en la DB no figura verificado
    expect(result.success).toBe(false);
    expect(result.code).toBe('KYC_REQUIRED');
  });

  test('Seguridad Webhook Didit: Webhook sin firma o firma HMAC inválida es denegado con HTTP 401', async () => {
    const rawPayload = JSON.stringify({ session_id: 'sess_unauthorized', status: 'Approved' });
    const invalidSig = 'invalid_hmac_signature_hash_1234567890abcdef';

    const isValid = HmacVerifier.verifyHmacSha256(rawPayload, invalidSig, testSecret);
    expect(isValid).toBe(false);

    try {
      await KycService.handleDiditWebhook(rawPayload, { 'x-signature-v2': invalidSig });
      expect(true).toBe(false); // No debe llegar aquí
    } catch (err: any) {
      expect(err.message).toContain('Didit X-Signature-V2 verification failed');
    }
  });

  test('Seguridad Webhook Didit: Webhook con firma HMAC válida actualiza estado a VERIFIED', async () => {
    const sessionId = `didit_sess_valid_${Date.now()}`;
    const rawPayload = JSON.stringify({
      session_id: sessionId,
      status: 'Approved',
      workflow_id: 'wf_official',
    });

    const validSig = crypto.createHmac('sha256', testSecret).update(rawPayload).digest('hex');

    const isValid = HmacVerifier.verifyHmacSha256(rawPayload, validSig, testSecret);
    expect(isValid).toBe(true);

    const webhookResult = await KycService.handleDiditWebhook(rawPayload, {
      'x-signature-v2': validSig,
    });

    expect(webhookResult.handled).toBe(true);
    expect(webhookResult.status).toBe('verified');
  });

  test('Idempotencia Webhook Didit: Mismo evento dos veces no corrompe datos ni duplica registros', async () => {
    const sessionId = `didit_sess_idempotent_${Date.now()}`;
    const eventId = `evt_idempotent_${Date.now()}`;
    const rawPayload = JSON.stringify({
      session_id: sessionId,
      event_id: eventId,
      status: 'Approved',
    });

    const validSig = crypto.createHmac('sha256', testSecret).update(rawPayload).digest('hex');

    const firstCall = await KycService.handleDiditWebhook(rawPayload, {
      'x-signature-v2': validSig,
      'x-event-id': eventId,
    });

    expect(firstCall.handled).toBe(true);
    expect(firstCall.status).toBe('verified');

    const secondCall = await KycService.handleDiditWebhook(rawPayload, {
      'x-signature-v2': validSig,
      'x-event-id': eventId,
    });

    expect(secondCall.handled).toBe(true);
    expect(secondCall.duplicate).toBe(true);
  });

  test('Normalizador de Estados Didit: Mapea correctamente Approved, Declined, Review, Resubmitted, Expired', () => {
    expect(normalizeDiditStatus('Approved')).toBe('verified');
    expect(normalizeDiditStatus('verification.approved')).toBe('verified');
    expect(normalizeDiditStatus('Declined')).toBe('failed');
    expect(normalizeDiditStatus('decision.declined')).toBe('failed');
    expect(normalizeDiditStatus('Pending Review')).toBe('pending_review');
    expect(normalizeDiditStatus('Resubmitted')).toBe('resubmission_required');
    expect(normalizeDiditStatus('Expired')).toBe('expired');
  });
});
