import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KycService } from '../../../../server/identity/kycService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const result = await KycService.handleDiditWebhook(rawBody, req.headers as any || {});
    return res.status(200).json({ status: 'ok', result });
  } catch (err: any) {
    if (err?.message?.includes('Signature') || err?.message?.includes('HMAC')) {
      return res.status(401).json({ error: 'Unauthorized webhook signature', message: err.message });
    }
    return res.status(500).json({ error: 'Error procesando webhook de Didit', message: err?.message });
  }
}
