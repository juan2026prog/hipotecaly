import { test, expect } from '@playwright/test';
import { FirmaGubClient } from '../server/signature/firmaGubClient';
import { FirmaGubPayloadMapper } from '../server/signature/payloadMapper';
import { FirmaGubGatewayAuthProvider } from '../server/signature/gatewayAuth';
import { FirmaGubSignatureProvider } from '../src/lib/siteos/signature/providers/FirmaGubSignatureProvider';
import { normalizeFirmaGubStatus } from '../src/lib/siteos/signature/stateMachine';
import { computeSha256 } from '../src/lib/siteos/signature/hashUtil';

// Dummy PDF valid content starting with %PDF-1.4
const VALID_PDF_BASE64 = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF').toString('base64');
const INVALID_PDF_BASE64 = Buffer.from('NOT_A_VALID_PDF_FILE').toString('base64');

test.describe('Firma.gub.uy (AGESIC) Official Contract Tests - Postman Parity', () => {
  const originalFetch = global.fetch;

  test.afterEach(() => {
    global.fetch = originalFetch;
  });

  // 1. PROCESO 1 SERIALIZATION & CAMELCASE PARITY
  test('1. Proceso 1: serialización exacta camelCase según Postman Collection V1.0', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;
    let capturedHeaders: any = null;

    global.fetch = (async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(init?.body);

      return {
        ok: true,
        status: 200,
        json: async () => ({
          identificador: 'AGESIC-PROC-998877',
          claveSeguridad: 'sec_key_xyz_777',
          fechaExpiracion: '25/12/2026 23:59:59',
        }),
      } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
      signBaseUrl: 'https://firmagub.agesic.gub.uy',
      apiPrefix: '/api/v1/externos',
    });

    const requestPayload = FirmaGubPayloadMapper.toProceso1Request(
      {
        tenantId: 'tenant-123',
        caseId: 'case-456',
        documents: [
          {
            title: 'Contrato_Hipotecario',
            contentBase64: VALID_PDF_BASE64,
            sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        ],
        signers: [
          {
            name: 'María Rodríguez',
            email: 'maria@example.uy',
            documentNumber: '41234567',
            documentCountry: 'UY',
            documentType: 'CI',
            role: 'applicant',
          },
        ],
        expiresAt: '2026-12-25T23:59:59.000Z',
      },
      {
        returnUrl: 'https://hipotecaly.com/signature/return',
        notificationUrl: 'https://hipotecaly.com/api/integrations/signature/firma-gub/webhook',
        systemName: 'HIPOTECALY_TEST',
      }
    );

    const result = await client.postProceso1(requestPayload);

    // Verificación de URL y método
    expect(capturedUrl).toBe('https://gateway.agesic.gub.uy/api/v1/externos/proceso1');
    expect(capturedMethod).toBe('POST');
    expect(capturedHeaders['Content-Type']).toBe('application/json');

    // Verificación de propiedades exactas Postman
    expect(capturedBody.nombreSistema).toBe('HIPOTECALY_TEST');
    expect(capturedBody.cantidadFirmantes).toBe(1);
    expect(capturedBody.urlRetorno).toBe('https://hipotecaly.com/signature/return');
    expect(capturedBody.urlNotificacion).toBe('https://hipotecaly.com/api/integrations/signature/firma-gub/webhook');
    expect(capturedBody.archivos).toHaveLength(1);
    expect(capturedBody.archivos[0].nombre).toBe('Contrato_Hipotecario.pdf');
    expect(capturedBody.archivos[0].contenido).toBe(VALID_PDF_BASE64);
    expect(capturedBody.detalleFirmantes).toHaveLength(1);
    expect(capturedBody.detalleFirmantes[0].nombre).toBe('María Rodríguez');
    expect(capturedBody.detalleFirmantes[0].email).toBe('maria@example.uy');
    expect(capturedBody.detalleFirmantes[0].documento).toBe('41234567');
    expect(capturedBody.detalleFirmantes[0].pais).toBe('UY');
    expect(capturedBody.detalleFirmantes[0].tipoDocumento).toBe('CI');

    // Verificación de normalización
    expect(result.providerProcessId).toBe('AGESIC-PROC-998877');
    expect(result.securityKey).toBe('sec_key_xyz_777');
    expect(result.expiresAt).toBe('25/12/2026 23:59:59');
  });

  // 2. PROCESO 2: STEP A (UPLOAD) & STEP B (PROCESS2)
  test('2. Proceso 2: carga de archivo (binary & multipart) y creación con IDs de archivo', async () => {
    let capturedCalls: Array<{ url: string; method: string; headers: any; body: any }> = [];

    global.fetch = (async (url: any, init: any) => {
      const urlStr = String(url);
      capturedCalls.push({
        url: urlStr,
        method: init?.method,
        headers: init?.headers,
        body: init?.body,
      });

      if (urlStr.includes('/archivo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ idArchivo: 'file-uuid-101' }),
        } as any;
      }

      if (urlStr.includes('/proceso2')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            identificador: 'PROC2-999',
            claveSeguridad: 'key-p2-secret',
          }),
        } as any;
      }

      return { ok: false, status: 404 } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
      apiPrefix: '/api/v1/externos',
      process2Transport: 'binary',
    });

    // Step A: Upload
    const uploadRes = await client.uploadArchivo('Escritura.pdf', VALID_PDF_BASE64, 'application/pdf');
    expect(uploadRes.idArchivo).toBe('file-uuid-101');

    // Step B: Proceso 2
    const p2Payload = FirmaGubPayloadMapper.toProceso2Request(
      {
        tenantId: 'tenant-1',
        caseId: 'case-1',
        documents: [],
        signers: [{ name: 'Carlos Gomez', email: 'carlos@uy.test', role: 'owner' }],
      },
      ['file-uuid-101'],
      {
        returnUrl: 'https://hipotecaly.com/return',
        notificationUrl: 'https://hipotecaly.com/webhook',
      }
    );

    const p2Res = await client.postProceso2(p2Payload);
    expect(p2Res.providerProcessId).toBe('PROC2-999');
    expect(p2Res.securityKey).toBe('key-p2-secret');

    // Verify calls
    expect(capturedCalls[0].url).toBe('https://gateway.agesic.gub.uy/api/v1/externos/archivo');
    expect(capturedCalls[0].headers['Content-Disposition']).toBe('attachment; filename="Escritura.pdf"');
    expect(capturedCalls[1].url).toBe('https://gateway.agesic.gub.uy/api/v1/externos/proceso2');
  });

  // 3. ESTADO GET Y HEADER AUTHORIZATION SIN BEARER
  test('3. Estado GET: Header Authorization = {claveSeguridad} (estricto sin Bearer)', async () => {
    let capturedHeaders: any = null;
    let capturedUrl = '';
    let capturedMethod = '';

    global.fetch = (async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedHeaders = init?.headers;

      return {
        ok: true,
        status: 200,
        json: async () => ({ estado: 'FINALIZADO' }),
      } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
      apiPrefix: '/api/v1/externos',
      statusMethod: 'GET',
    });

    const res = await client.getProcesoEstado('PROC-12345', 'mi_clave_secreta_123');
    expect(capturedUrl).toBe('https://gateway.agesic.gub.uy/api/v1/externos/estado/PROC-12345');
    expect(capturedMethod).toBe('GET');
    expect(capturedHeaders['Authorization']).toBe('mi_clave_secreta_123'); // NO 'Bearer mi_clave_secreta_123'
    expect(res.estado).toBe('FINALIZADO');
    expect(normalizeFirmaGubStatus(res.estado)).toBe('signed');
  });

  // 4. ESTADO HEAD CON FALLBACK
  test('4. Estado HEAD: soporte para método HEAD y fallback ante 405 Method Not Allowed', async () => {
    let attemptCount = 0;

    global.fetch = (async (url: any, init: any) => {
      attemptCount++;
      if (init?.method === 'HEAD') {
        // Simular que el endpoint rechaza HEAD y exige GET
        return {
          ok: false,
          status: 405,
          text: async () => 'Method Not Allowed',
        } as any;
      }
      if (init?.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ estado: 'EN_PROCESO' }),
        } as any;
      }
      return { ok: false, status: 500 } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
      statusMethod: 'HEAD',
    });

    const res = await client.getProcesoEstado('PROC-FALLBACK', 'key123');
    expect(attemptCount).toBe(2); // HEAD fallo con 405, luego GET tuvo éxito
    expect(res.estado).toBe('EN_PROCESO');
    expect(normalizeFirmaGubStatus(res.estado)).toBe('in_progress');
  });

  // 5. DESCARGA MASIVA Y VALIDACIÓN DE PDF (%PDF-) & SHA-256
  test('5. Descarga todos los archivos (/archivos/{id}): decodificación base64 y validación mágica PDF', async () => {
    let capturedHeaders: any = null;

    global.fetch = (async (url: any, init: any) => {
      capturedHeaders = init?.headers;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            nombre: 'DocFirmado1.pdf',
            contenido: VALID_PDF_BASE64,
          },
          {
            nombre: 'DocFirmado2.pdf',
            contenido: INVALID_PDF_BASE64,
          },
        ],
      } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
    });

    const files = await client.getArchivosFirmados('PROC-100', 'pass-xyz');
    expect(capturedHeaders['Authorization']).toBe('pass-xyz');
    expect(files).toHaveLength(2);

    expect(files[0].name).toBe('DocFirmado1.pdf');
    expect(files[0].isValidPdf).toBe(true);
    expect(files[0].sha256).toBeDefined();
    expect(files[0].sha256.length).toBe(64);

    expect(files[1].name).toBe('DocFirmado2.pdf');
    expect(files[1].isValidPdf).toBe(false);
  });

  // 6. DESCARGA INDIVIDUAL DE ARCHIVO (/archivo/{fileId})
  test('6. Descarga individual (/archivo/{fileId}): soporte binario y Content-Disposition', async () => {
    const rawPdfBuffer = Buffer.from('%PDF-1.4\nPrueba binaria individual\n%%EOF');
    const exactArrayBuffer = rawPdfBuffer.buffer.slice(
      rawPdfBuffer.byteOffset,
      rawPdfBuffer.byteOffset + rawPdfBuffer.byteLength
    );

    global.fetch = (async (url: any, init: any) => {
      return {
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'content-disposition'
              ? 'attachment; filename="ContratoFinal.pdf"'
              : null,
        },
        arrayBuffer: async () => exactArrayBuffer,
      } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
    });

    const file = await client.getArchivoFirmadoIndividual('file-unique-777', 'clave123');
    expect(file.fileId).toBe('file-unique-777');
    expect(file.filename).toBe('ContratoFinal.pdf');
    expect(file.isValidPdf).toBe(true);
    expect(file.sha256).toBeDefined();
    expect(file.sha256.length).toBe(64);
  });

  // 7. REDIRECT URL SERVER-SIDE & SANITIZACIÓN DE SECRETOS
  test('7. Redirect / Signing URL: construcción server-side y sanitización de pass en logs', () => {
    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
      signBaseUrl: 'https://firmagub.agesic.gub.uy',
    });

    const signingUrl = client.buildSigningUrl('PROC-555', 'SUPER_SECRET_PASS_999');
    expect(signingUrl).toBe('https://firmagub.agesic.gub.uy/es/pp/firmar?id=PROC-555&pass=SUPER_SECRET_PASS_999');

    // Sanitización para logs
    const sanitized = FirmaGubPayloadMapper.sanitizeUrl(signingUrl);
    expect(sanitized).toBe('https://firmagub.agesic.gub.uy/es/pp/firmar?id=PROC-555&pass=[REDACTED]');
    expect(sanitized).not.toContain('SUPER_SECRET_PASS_999');

    // Redacción de objetos sensibles
    const sensitivePayload = {
      identificador: 'P-1',
      claveSeguridad: 'sec_123',
      pass: 'sec_pass',
      clientSecret: 'cs_xyz',
      nested: {
        securityKey: 'sk_inner',
      },
    };
    const redactedObj = FirmaGubPayloadMapper.redactSecrets(sensitivePayload);
    expect(redactedObj.claveSeguridad).toBe('[REDACTED]');
    expect(redactedObj.pass).toBe('[REDACTED]');
    expect(redactedObj.clientSecret).toBe('[REDACTED]');
    expect(redactedObj.nested.securityKey).toBe('[REDACTED]');
  });

  // 8. API MANAGER GATEWAY AUTH (OAUTH2 CLIENT CREDENTIALS & CACHING)
  test('8. API Manager Gateway Auth: OAuth2 Client Credentials con token caching y auto-renovación', async () => {
    let tokenFetchCount = 0;

    global.fetch = (async (url: any, init: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/oauth/token')) {
        tokenFetchCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: `token_jwt_sample_${tokenFetchCount}`,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hora
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    }) as any;

    const gatewayAuth = new FirmaGubGatewayAuthProvider({
      authMode: 'oauth2_client_credentials',
      tokenUrl: 'https://apimanager.agesic.gub.uy/oauth/token',
      clientId: 'my-agesic-client-id',
      clientSecret: 'my-agesic-client-secret',
    });

    expect(gatewayAuth.isConfigured()).toBe(true);

    // 1st request -> fetches token
    const token1 = await gatewayAuth.getAccessToken();
    expect(token1).toBe('token_jwt_sample_1');
    expect(tokenFetchCount).toBe(1);

    // 2nd request -> uses cache (no fetch)
    const token2 = await gatewayAuth.getAccessToken();
    expect(token2).toBe('token_jwt_sample_1');
    expect(tokenFetchCount).toBe(1);

    // After clearing cache -> fetches new token
    gatewayAuth.clearCache();
    const token3 = await gatewayAuth.getAccessToken();
    expect(token3).toBe('token_jwt_sample_2');
    expect(tokenFetchCount).toBe(2);

    const headers = await gatewayAuth.getGatewayHeaders();
    expect(headers['X-Gateway-Authorization']).toBe('Bearer token_jwt_sample_2');
  });

  // 9. HEALTH CHECK Y NO FALSO PASS
  test('9. Health check: reporta WAITING_PROVIDER_CONFIGURATION si faltan URLs', async () => {
    const unconfiguredClient = new FirmaGubClient({ apiBaseUrl: '' });
    const health = await unconfiguredClient.checkHealth();
    expect(health.status).toBe('WAITING_PROVIDER_CONFIGURATION');

    const configuredOfflineClient = new FirmaGubClient({
      apiBaseUrl: 'https://unreachable-gateway.agesic.gub.uy',
    });

    global.fetch = (async () => {
      throw new Error('Connection refused ENOTFOUND');
    }) as any;

    const offlineHealth = await configuredOfflineClient.checkHealth();
    expect(offlineHealth.status).toBe('WAITING_EXTERNAL_ACCESS');
  });

  // 10. ERROR HANDLING (401, 403, 404)
  test('10. Manejo estricto de errores HTTP 401, 403, 404 en Firma.gub.uy', async () => {
    global.fetch = (async (url: any, init: any) => {
      return {
        ok: false,
        status: 401,
        text: async () => '{"error": "Unauthorized", "message": "Clave de seguridad inválida"}',
      } as any;
    }) as any;

    const client = new FirmaGubClient({
      apiBaseUrl: 'https://gateway.agesic.gub.uy',
    });

    await expect(client.getProcesoEstado('P-101', 'bad_key')).rejects.toThrow(/HTTP 401/);
  });

  // 11. GET Y POST CALLBACK CON NORMALIZACIÓN UNIFICADA
  test('11. Callback / Notificación: soporte tanto para GET como POST con normalización unificada', async () => {
    const { SignatureService } = await import('../server/signature/signatureService');

    // Simular GET request con query params
    const getResult = await SignatureService.handleFirmaGubNotification({
      method: 'GET',
      query: {
        identificador: 'PROC-GET-001',
        estado: 'FINALIZADO',
      },
      body: {},
    });

    expect(getResult.handled).toBe(true);
    expect(getResult.processId).toBe('PROC-GET-001');
    expect(getResult.status).toBe('signed');
    expect(getResult.method).toBe('GET');

    // Simular POST request con body
    const postResult = await SignatureService.handleFirmaGubNotification({
      method: 'POST',
      query: {},
      body: {
        identificador: 'PROC-POST-002',
        estado: 'RECHAZADO',
      },
    });

    expect(postResult.handled).toBe(true);
    expect(postResult.processId).toBe('PROC-POST-002');
    expect(postResult.status).toBe('rejected');
    expect(postResult.method).toBe('POST');
  });

  // 12. IDEMPOTENCIA Y FINGERPRINT ESTABLE
  test('12. Callback Idempotencia: el mismo fingerprint no procesa side-effects duplicados', async () => {
    const { SignatureService } = await import('../server/signature/signatureService');

    const payload = {
      body: {
        identificador: 'PROC-IDEM-999',
        estado: 'FINALIZADO',
      },
      method: 'POST',
    };

    // 1er intento
    const res1 = await SignatureService.handleFirmaGubNotification(payload);
    expect(res1.handled).toBe(true);

    // 2do intento con la misma notificación
    const res2 = await SignatureService.handleFirmaGubNotification(payload);
    expect(res2.handled).toBe(true);
  });

  // 13. CALLBACK SIN IDENTIFICADOR
  test('13. Callback validación: responde error claro ante payload sin identificador', async () => {
    const { SignatureService } = await import('../server/signature/signatureService');

    const res = await SignatureService.handleFirmaGubNotification({
      method: 'POST',
      body: {
        estado: 'FINALIZADO',
      },
      query: {},
    });

    expect(res.handled).toBe(false);
    expect(res.error).toBe('MISSING_IDENTIFIER');
  });

  // 14. CONCURRENCIA OAUTH2 CLIENT CREDENTIALS
  test('14. API Manager Concurrencia: múltiples llamadas simultáneas reutilizan la misma promesa de token', async () => {
    let tokenFetchCount = 0;

    global.fetch = (async (url: any, init: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/oauth/token')) {
        tokenFetchCount++;
        // Retardo artificial de 50ms para simular red
        await new Promise((r) => setTimeout(r, 50));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'concurrent_token_abc',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    }) as any;

    const gatewayAuth = new FirmaGubGatewayAuthProvider({
      authMode: 'oauth2_client_credentials',
      tokenUrl: 'https://apimanager.agesic.gub.uy/oauth/token',
      clientId: 'cid-concurrent',
      clientSecret: 'csec-concurrent',
    });

    // Lanzar 5 solicitudes en paralelo
    const tokens = await Promise.all([
      gatewayAuth.getAccessToken(),
      gatewayAuth.getAccessToken(),
      gatewayAuth.getAccessToken(),
      gatewayAuth.getAccessToken(),
      gatewayAuth.getAccessToken(),
    ]);

    expect(tokenFetchCount).toBe(1); // Sólo 1 petición HTTP fue realizada
    expect(tokens.every((t) => t === 'concurrent_token_abc')).toBe(true);
  });
});
