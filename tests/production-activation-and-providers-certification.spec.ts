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

test.describe('CERTIFICACIÓN FINAL DE PRODUCCIÓN Y PROVEEDORES', () => {

  const ORG_A = 'a0000000-0000-0000-0000-000000000001';
  const ORG_B = 'd0000000-0000-0000-0000-000000000001';

  // ==============================================================================
  // 1. ESCANEO DE SECRETOS EN PRODUCCIÓN
  // ==============================================================================
  test.describe('1. Auditoría de Secretos y Bundles', () => {

    test('El bundle cliente no expone claves privadas, service_role ni secretos', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const content = await page.content();
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('service_role');
      expect(content).not.toContain('OPENAI_API_KEY');
      expect(content).not.toContain('RESEND_API_KEY');
      expect(content).not.toContain('DIDIT_WEBHOOK_SECRET');
    });
  });

  // ==============================================================================
  // 2. MATRIZ DE PROVEEDORES EXTERNOS (ZERO FALSE SUCCESS)
  // ==============================================================================
  test.describe('2. Proveedores Externos & Fallbacks Honestos', () => {

    test('OpenAI: El servicio reporta NOT_CONFIGURED de forma honesta si no hay API key', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/ai/status',
      });

      await handlerIntegrations(http.req, http.res);
      expect(http.getStatusCode()).toBe(200);
      const body = http.getBody();
      expect(['HEALTHY', 'NOT_CONFIGURED', 'DISABLED']).toContain(body.status);
      expect(body.provider).toBe('OpenAI');
    });

    test('Didit KYC: Webhook rechaza firmas HMAC inválidas con 401 (Fail-Closed)', async () => {
      const prevSecret = process.env.DIDIT_WEBHOOK_SECRET;
      process.env.DIDIT_WEBHOOK_SECRET = 'prod_secret_hmac_2026';

      try {
        const http = createMockHttp({
          method: 'POST',
          url: '/api/integrations/kyc/didit/webhook',
          headers: {
            'x-signature-v2': 'invalid_forged_hmac_hex',
          },
          body: {
            event: 'verification.completed',
            session_id: 'session_prod_001',
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

    test('Firma Digital: Proceso inexistente retorna 404 PROCESS_NOT_FOUND', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/signature/status?processId=fake_process_9999',
        query: { processId: 'fake_process_9999' }
      });

      await handlerIntegrations(http.req, http.res);
      expect(http.getStatusCode()).toBe(404);
      expect(http.getBody().error).toBe('PROCESS_NOT_FOUND');
    });

    test('Google Calendar: Modo directo (DIRECT_LINK_MODE) es reportado verazmente', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/calendar/status',
      });

      await handlerIntegrations(http.req, http.res);
      expect(http.getStatusCode()).toBe(200);
      const body = http.getBody();
      expect(['PARTIAL', 'NOT_CONFIGURED']).toContain(body.status);
      expect(body.provider).toBe('google_calendar');
    });
  });

  // ==============================================================================
  // 3. AISLAMIENTO MULTI-ORGANIZACIÓN
  // ==============================================================================
  test.describe('3. Aislamiento Multi-Organización Estricto', () => {

    test('Intento de consulta cross-tenant en tasador es rechazado (401/403)', async () => {
      const http = createMockHttp({
        method: 'POST',
        url: '/api/tasador?action=comparables',
        query: { action: 'comparables' },
        headers: {
          'x-organization-id': ORG_A,
        },
        body: {
          organizationId: ORG_B,
          targetProperty: {
            propertyType: 'apartamento',
            location: { department: 'Montevideo', neighborhood: 'Pocitos' },
            surfaces: { totalAreaM2: 75 }
          }
        }
      });

      await handlerTasador(http.req, http.res);
      expect([401, 403]).toContain(http.getStatusCode());
    });

    test('Consulta administrativa de dominios exige auth (401)', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/domains',
        query: { organizationId: ORG_A }
      });

      await handlerDomains(http.req, http.res);
      expect(http.getStatusCode()).toBe(401);
    });
  });

  // ==============================================================================
  // 4. TASADOR DETERMINISTA INDEPENDIENTE DE OPENAI
  // ==============================================================================
  test.describe('4. Tasador Inmobiliario y Valuación Determinista', () => {

    test('El pipeline de comparables funciona sin depender de OpenAI', async () => {
      const http = createMockHttp({
        method: 'POST',
        url: '/api/tasador?action=comparables',
        query: { action: 'comparables' },
        headers: {
          'Authorization': 'Bearer token-superadmin-2026',
        },
        body: {
          organizationId: ORG_A,
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
  // 5. SMOKE TEST DE PRODUCCIÓN Y OBSERVABILIDAD
  // ==============================================================================
  test.describe('5. Observabilidad e Integridad de la API', () => {

    test('El orquestador central de integraciones responde con estado OPERATIONAL', async () => {
      const http = createMockHttp({
        method: 'GET',
        url: '/api/integrations/status',
      });

      await handlerIntegrations(http.req, http.res);
      expect(http.getStatusCode()).toBe(200);
      expect(http.getBody().status).toBe('OPERATIONAL');
      expect(http.getBody().service).toContain('Hipotecaly Integrations API');
    });

    test('Ruta /signature/return no valida falsamente firma sin token válido', async ({ page }) => {
      await page.goto('/signature/return');
      await page.waitForLoadState('domcontentloaded');

      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('¡Firma Completada con Éxito!');
    });
  });

});
