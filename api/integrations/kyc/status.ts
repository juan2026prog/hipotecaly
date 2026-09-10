import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KycService } from '../../../server/identity/kycService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const sessionId = (req.query?.sessionId || req.query?.session_id) as string;
  const caseId = (req.query?.caseId || req.query?.case_id) as string;
  const userId = (req.query?.userId || req.query?.user_id) as string;

  if (!sessionId && !caseId && !userId) {
    return res.status(400).json({ error: 'Falta parámetro sessionId, caseId o userId' });
  }

  try {
    const status = await KycService.getStatus({ sessionId, caseId, userId });
    return res.status(200).json({ success: true, verification: status });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error al consultar estado KYC', message: err?.message });
  }
}
