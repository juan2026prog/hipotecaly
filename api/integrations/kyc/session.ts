import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KycService } from '../../../server/identity/kycService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      tenantId = 'a0000000-0000-0000-0000-000000000001',
      userId,
      caseId,
      documentType,
      country,
      vendorData,
      callbackUrl,
    } = req.body || {};

    const session = await KycService.createSession({
      tenantId,
      userId,
      caseId,
      documentType,
      country,
      vendorData,
      callbackUrl,
    });

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Error al iniciar sesión de verificación KYC',
      message: err?.message,
    });
  }
}
