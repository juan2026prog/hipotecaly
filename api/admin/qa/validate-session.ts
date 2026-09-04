// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/qa/validate-session
// Validación server-side de sesión QA activa
// ==============================================================================

import { QaSessionService } from '../../../server/qa/qaSessionService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: 'El campo "sessionId" es obligatorio.', valid: false });
    }

    const validation = await QaSessionService.validateSession(sessionId);

    return res.status(200).json({
      valid: validation.valid,
      reason: validation.reason,
      session: validation.session,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al validar sesión QA',
      message: error?.message || 'Error interno del servidor.',
      valid: false,
    });
  }
}
