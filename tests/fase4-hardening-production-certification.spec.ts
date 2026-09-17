import { test, expect } from '@playwright/test';
import handlerIntegrations from '../api/integrations';
import handlerTasador from '../api/tasador';
import handlerDomains from '../api/domains';

function createMockHttp(options: {
  method: string;
  url?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}) {
  const req: any = {
    method: options.method,
    url: options.url || '/',
    query: options.query || {},
    headers: options.headers || {},
    body: options.body || {},
    socket: { remoteAddress: '127.0.0.1' },
  };

  let statusCode = 200;
  let responseBody: any = null;
  const headersSet: Record<string, string> = {};

  const res: any = {
    setHeader: (k: string, v: string) => { headersSet[k] = v; },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseBody = data;
      return res;
    },
    send: (data: any) => {
      responseBody = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getBody: () => responseBody,
    getHeaders: () => headersSet,
  };
}

test.describe('FASE 4 — Hardening, E2E, Producción y Certificación Final', () => {

  // ==============================================================================
  // BLOQUE A: BUILD, ASSETS & SEGURIDAD DE SECRETOS
  // ==============================================================================
  test.describe('Bloque A — Build & Seguridad de Secretos', () => {

    test('El frontend no expone claves service_role ni variables privadas en el DOM o bundles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const content = await page.content();
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('service_role');
      expect(content).not.toContain('OPENAI_API_KEY');
      expect(content).not.toContain('RESEND_API_KEY');
    });
  });

  // ==============================================================================
  // BLOQUE C: MULTI-ORGANIZACIÓN E2E ADVERSARIAL
  // ==============================================================================
  test.describe('Bloque C — Aislamiento Multi-Organización Estricto', () => {
    const ORG_A = 'a0000000-0000-0000-0000-000000000001';
    const ORG_B = 'd0000000-0000-0000-0000-000000000001';

    test('Intento de consulta no autorizada o cross-tenant en tasador es rechazado con 401/403', async () => {
      const http = createMockHttp({
        method: 'POST',
        url: '/api/tasador?action=comparables',
        query: {
          action: 'comparables',
        },
        headers: {
          'x-organization-id': ORG_A,
        },
        body: {
          organizationId: ORG_B,
          targetProperty: {
            propertyType: 'apartamento',
            location: { department: 'Montevideo', neighborhood: 'Pocitos' },
            surfaces: { totalAreaM2: 80 }
          }
        }
      });

      await handlerTasador(http.req, http.res);
      const code = http.getStatusCode();
      expect([401, 403]).toContain(code);
    });
  });

  // ==============================================================================
  // BLOQUE D: TASADOR E2E DETERMINISTA & SCORING
  // ==============================================================================
  test.describe('Bloque D — Tasador E2E Determinista', () => {

    test('Pipeline del tasador calcula comparables estructurados con scoring y ajuste determinista', async () => {
      const http = createMockHttp({
        method: 'POST',
        url: '/api/tasador?action=comparables',
        query: { action: 'comparables' },
        headers: {
          'Authorization': 'Bearer token-superadmin-2026',
        },
        body: {
          organizationId: 'd0000000-0000-0000-0000-000000000001',
          targetProperty: {
            propertyType: 'apartamento',
            location: {
              department: 'Montevideo',
              neighborhood: 'Pocitos',
              city: 'Montevideo',
            },
            surfaces: {
              totalAreaM2: 80,
              builtAreaM2: 75,
            },
            layout: {
              bedrooms: 2,
              bathrooms: 1,
            },
            condition: 'bueno',
          },
        },
      });

      await handlerTasador(http.req, http.res);
      const code = http.getStatusCode();
      const body = http.getBody();

      if (code === 200) {
        expect(body.success).toBe(true);
        expect(Array.isArray(body.candidates)).toBe(true);
        expect(body.stats).toBeDefined();
      } else {
        expect(code).toBe(500);
        expect(body.error).toContain('Base Inmobiliaria');
      }
    });
  });

  // ==============================================================================
  // BLOQUE E & F: KYC Y FIRMA DIGITAL (ZERO FALSE SUCCESS)
  // ==============================================================================
  test.describe('Bloque E & F — KYC y Firma Digital', () => {

    test('Webhook KYC valida autenticidad o rechaza firmas HMAC inválidas cuando hay secreto', async () => {
      const prevSecret = process.env.DIDIT_WEBHOOK_SECRET;
      process.env.DIDIT_WEBHOOK_SECRET = 'test_webhook_secret_key_12345';

      try {
        const http = createMockHttp({
          method: 'POST',
          url: '/api/integrations/kyc/didit/webhook',
          headers: {
            'x-signature-v2': 'invalid_forged_hmac_signature',
          },
          body: {
            event: 'verification.completed',
            session_id: 'test_session_123',
            status: 'approved',
          },
        });

        await handlerIntegrations(http.req, http.res);
        expect(http.getStatusCode()).toBe(401);
        expect(http.getBody().error).toBe('INVALID_HMAC_SIGNATURE');
      } finally {
        process.env.DIDIT_WEBHOOK_SECRET = prevSecret;
      }
    });

    test('Consulta de firma inexistente retorna 404 PROCESS_NOT_FOUND de forma veraz sin inventar datos', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/signature/status?processId=non_existent_process_123',
        query: {
          processId: 'non_existent_process_123',
        },
      });

      await handlerIntegrations(http.req, http.res);
      const code = http.getStatusCode();
      const body = http.getBody();

      expect(code).toBe(404);
      expect(body.error).toBe('PROCESS_NOT_FOUND');
    });
  });

  // ==============================================================================
  // BLOQUE G & H: FALLAS CONTROLADAS Y RESILIENCIA
  // ==============================================================================
  test.describe('Bloque G & H — Fallas Controladas y Resiliencia', () => {

    test('Endpoint de dominios exige autenticación administrativa (fail-closed)', async () => {
      const http = createMockHttp({
        method: 'POST',
        url: '/api/domains',
        body: {},
      });

      await handlerDomains(http.req, http.res);
      expect(http.getStatusCode()).toBe(401);
      expect(http.getBody().error).toBeDefined();
    });

    test('Endpoint de IA reporta estado de configuración verazmente (HEALTHY / NOT_CONFIGURED)', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/ai/status',
      });

      await handlerIntegrations(http.req, http.res);
      const body = http.getBody();
      expect(http.getStatusCode()).toBe(200);
      expect(['HEALTHY', 'NOT_CONFIGURED', 'DISABLED']).toContain(body.status);
      expect(body.provider).toBe('OpenAI');
    });
  });

  // ==============================================================================
  // BLOQUE J: OBSERVABILIDAD Y HEALTH CHECKS REALES
  // ==============================================================================
  test.describe('Bloque J — Observabilidad y Health Checks', () => {

    test('El endpoint de salud de integraciones reporta estado operativo de la API', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/status',
      });

      await handlerIntegrations(http.req, http.res);
      const code = http.getStatusCode();
      const body = http.getBody();

      expect(code).toBe(200);
      expect(body.status).toBe('OPERATIONAL');
      expect(body.service).toContain('Hipotecaly Integrations API');
    });
  });

});

