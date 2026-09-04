// ==============================================================================
// HANDLER: /api/v1/webhooks
// Endpoint REST Oficial: Gestión de Webhooks para Tenants
// ==============================================================================

import { EnterpriseApiKeyService } from '../apiKeyService';
import { EnterpriseWebhookDispatcher } from '../webhookDispatcher';

export default async function webhooksHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // 1. Autenticación y control de scopes mediante API Key
  const authHeader = req.headers?.authorization || req.headers?.['x-api-key'];
  const auth = await EnterpriseApiKeyService.authenticateApiKey(authHeader, 'admin:webhooks');

  if (!auth.authenticated) {
    return res.status(auth.statusCode).json({
      error: 'Unauthorized',
      message: auth.error,
    });
  }

  const tenantId = auth.tenantId!;

  if (req.method === 'POST') {
    try {
      const { url, events = ['application.created'] } = req.body || {};

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'El campo url es obligatorio y debe ser una URL válida.',
        });
      }

      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'El array events debe contener al menos un evento suscrito.',
        });
      }

      // Validación SSRF
      const ssrfCheck = EnterpriseWebhookDispatcher.validateUrlForSsrf(url);
      if (!ssrfCheck.valid) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `URL no permitida por seguridad: ${ssrfCheck.reason}`,
        });
      }

      // Registro con CSPRNG
      const webhook = await EnterpriseWebhookDispatcher.registerWebhook({
        tenantId,
        url,
        events,
      });

      return res.status(201).json({
        success: true,
        webhookId: webhook.id,
        tenantId: webhook.tenantId,
        url: webhook.url,
        events: webhook.events,
        signingSecret: webhook.signingSecret, // Se muestra una sola vez al crearlo
        createdAt: webhook.createdAt,
        message: 'Webhook registrado exitosamente. Guarde el signingSecret de forma segura para validar firmas HMAC-SHA256.',
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: err?.message || 'Error al registrar el webhook.',
      });
    }
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Método no permitido.',
  });
}
