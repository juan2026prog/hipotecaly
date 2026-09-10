import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KycService } from '../../../server/identity/kycService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { sessionId } = req.body || {};
  if (!sessionId) {
    return res.status(400).json({ error: 'Falta parámetro sessionId' });
  }
  try {
    const result = await KycService.reconcileDecision(sessionId);
    return res.status(200).json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error al reconciliar decisión', message: err?.message });
  }
}
