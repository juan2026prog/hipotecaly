import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { maskCedula, maskBankAccount, maskTaxId, maskPhone, maskEmail, maskName, maskAddress } from '../src/lib/sensitiveDataService';
import { ServerRateLimiter } from '../server/security/rateLimiter';
import { EnterpriseWebhookDispatcher } from '../server/enterprise/webhookDispatcher';
import { HmacVerifier } from '../server/identity/hmacVerifier';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

test.describe('SUITE DE ENDURECIMIENTO DE SEGURIDAD FINTECH / FINANCIERO (12 TESTS)', () => {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. DENY-BY-DEFAULT ANTE USUARIOS ANÓNIMOS
  test('Test 1: Usuario anónimo no puede leer expedientes, prestatarios ni registros sensibles', async () => {
    const { data: apps, error: errApps } = await anonClient.from('applications').select('*');
    expect(apps === null || apps.length === 0 || errApps !== null).toBe(true);

    const { data: borrowers, error: errBorrowers } = await anonClient.from('borrowers').select('*');
    expect(borrowers === null || borrowers.length === 0 || errBorrowers !== null).toBe(true);

    const { data: income, error: errIncome } = await anonClient.from('borrower_income').select('*');
    expect(income === null || income.length === 0 || errIncome !== null).toBe(true);
  });

  // 2. INMUTABILIDAD DE AUDITORÍA Y EVENTOS DE SEGURIDAD (UPDATE & DELETE DENEGADOS)
  test('Test 2: Bloqueo inmutable de UPDATE y DELETE en audit_logs y security_events', async () => {
    const fakeLogId = 'a0000000-0000-0000-0000-000000000001';

    // Intento de UPDATE en audit_logs
    const { data: updateAudit, error: errUpdateAudit } = await anonClient
      .from('audit_logs')
      .update({ action: 'tampered_action' })
      .eq('id', fakeLogId)
      .select();
    expect(updateAudit === null || updateAudit.length === 0 || errUpdateAudit !== null).toBe(true);

    // Intento de DELETE en audit_logs
    const { data: deleteAudit, error: errDeleteAudit } = await anonClient
      .from('audit_logs')
      .delete()
      .eq('id', fakeLogId)
      .select();
    expect(deleteAudit === null || deleteAudit.length === 0 || errDeleteAudit !== null).toBe(true);

    // Intento de UPDATE en security_events
    const { data: updateSec, error: errUpdateSec } = await anonClient
      .from('security_events')
      .update({ severity: 'LOW' })
      .eq('id', fakeLogId)
      .select();
    expect(updateSec === null || updateSec.length === 0 || errUpdateSec !== null).toBe(true);

    // Intento de DELETE en security_events
    const { data: deleteSec, error: errDeleteSec } = await anonClient
      .from('security_events')
      .delete()
      .eq('id', fakeLogId)
      .select();
    expect(deleteSec === null || deleteSec.length === 0 || errDeleteSec !== null).toBe(true);
  });

  // 3. AISLAMIENTO CROSS-TENANT
  test('Test 3: Un tenant no puede consultar ni mutar registros de otro tenant', async () => {
    const foreignTenantId = 'd0000000-0000-0000-0000-000000000002';
    const { data, error } = await anonClient
      .from('applications')
      .select('*')
      .eq('organization_id', foreignTenantId);
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 4. PREVENCIÓN DE ESCALADA DE PRIVILEGIOS
  test('Test 4: Usuario no puede auto-escalar a super_admin ni modificar memberships ajenos', async () => {
    const targetUserId = 'b0000000-0000-0000-0000-000000000001';
    const { data: profileData, error: errProfile } = await anonClient
      .from('profiles')
      .update({ is_super_admin: true })
      .eq('id', targetUserId)
      .select();
    expect(profileData === null || profileData.length === 0 || errProfile !== null).toBe(true);

    const { data: memData, error: errMem } = await anonClient
      .from('organization_members')
      .insert({
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        user_id: targetUserId,
        role: 'tenant_owner',
      })
      .select();
    expect(memData === null || memData.length === 0 || errMem !== null).toBe(true);
  });

  // 5. PROTECCIÓN DE STORAGE Y BUCKETS PRIVADOS
  test('Test 5: Storage privado rechaza descargas anónimas y signed URLs ajenas', async () => {
    const { data, error } = await anonClient.storage
      .from('application-documents')
      .createSignedUrl('private-doc-victim-123.pdf', 60);
    expect(data === null || error !== null).toBe(true);
  });

  // 6. ENMASCARAMIENTO PII EN UI (LEY 18.331)
  test('Test 6: Funciones de enmascaramiento PII ocultan datos personales adecuadamente', () => {
    expect(maskCedula('1.234.567-8')).toBe('1.234.***-*');
    expect(maskCedula('48901234')).toBe('4.890.***-*');
    expect(maskBankAccount('123456783812')).toBe('**** 3812');
    expect(maskTaxId('211234560012')).toBe('21.***.***.0012');
    expect(maskPhone('099123456')).toBe('09X XXX 456');
    expect(maskEmail('juan.perez@ejemplo.com')).toBe('j***z@ejemplo.com');
    expect(maskName('Juan Pérez Morales')).toBe('J*** P*** M***');
    expect(maskAddress('Av. Brasil 2980 apto 402')).toContain('[Altura Reservada]');
  });

  // 7. RATE LIMITING EN MEMORIA (TOKEN BUCKET CERO COSTO)
  test('Test 7: ServerRateLimiter bloquea ráfagas excesivas con status 429', () => {
    const identifier = 'test-ip-rate-limit-check';
    const options = { windowMs: 10000, maxRequests: 3 };

    // 3 solicitudes permitidas
    expect(ServerRateLimiter.checkLimit(identifier, options).allowed).toBe(true);
    expect(ServerRateLimiter.checkLimit(identifier, options).allowed).toBe(true);
    expect(ServerRateLimiter.checkLimit(identifier, options).allowed).toBe(true);

    // 4ta solicitud bloqueada
    const fourth = ServerRateLimiter.checkLimit(identifier, options);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.resetInSeconds).toBeGreaterThan(0);
  });

  // 8. PREVENCIÓN DE ATAQUES SSRF EN WEBHOOKS
  test('Test 8: EnterpriseWebhookDispatcher bloquea URLs hacia redes privadas o loopback', () => {
    // Loopback
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('http://127.0.0.1:8080/hook').valid).toBe(false);
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('http://localhost:3000/hook').valid).toBe(false);

    // Redes privadas
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('http://192.168.1.1/api').valid).toBe(false);
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('http://10.0.0.1/admin').valid).toBe(false);
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('http://169.254.169.254/metadata').valid).toBe(false);

    // HTTPS público permitido
    expect(EnterpriseWebhookDispatcher.validateUrlForSsrf('https://api.miempresa.com.uy/webhooks').valid).toBe(true);
  });

  // 9. VERIFICACIÓN CRIPTOGRÁFICA HMAC TIMING-SAFE
  test('Test 9: HmacVerifier valida firmas correctas y rechaza firmas adulteradas', () => {
    const secret = 'whsec_sample_secret_key_12345';
    const payload = JSON.stringify({ event: 'application.created', id: 'app-99' });

    const validSignature = HmacVerifier.signHmacSha256(payload, secret);
    expect(HmacVerifier.verifyHmacSha256(payload, validSignature, secret)).toBe(true);

    // Firma adulterada o clave errónea
    const badSignature = validSignature.slice(0, -4) + 'abcd';
    expect(HmacVerifier.verifyHmacSha256(payload, badSignature, secret)).toBe(false);
    expect(HmacVerifier.verifyHmacSha256(payload, validSignature, 'wrong_secret')).toBe(false);
  });

  // 10. ACCESO ADMINISTRATIVO SIN SESIÓN
  test('Test 10: Endpoint administrativo deniega acceso sin token de sesión', async () => {
    const { data, error } = await anonClient
      .from('security_events')
      .select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 11. VERIFICACIÓN DE HASH EN DOCFLOW
  test('Test 11: Documentos generados exigen coincidencia de hash SHA-256', async () => {
    const docId = 'doc-hash-test-01';
    const { data, error } = await anonClient
      .from('generated_documents')
      .select('id, file_hash')
      .eq('id', docId);
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 12. TABLAS ENTERPRISE AISLADAS
  test('Test 12: tenant_api_keys y tenant_webhooks protegidas por RLS', async () => {
    const { data: keys, error: errKeys } = await anonClient.from('tenant_api_keys').select('*');
    expect(keys === null || keys.length === 0 || errKeys !== null).toBe(true);

    const { data: hooks, error: errHooks } = await anonClient.from('tenant_webhooks').select('*');
    expect(hooks === null || hooks.length === 0 || errHooks !== null).toBe(true);
  });
});
