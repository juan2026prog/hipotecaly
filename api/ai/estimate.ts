// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/ai/estimate
// ==============================================================================

import { aiWalletService } from '../../server/ai/walletService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { organizationId, pagesCount, imagesCount, documentsCount, cachedDocumentsCount, runType } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' });
    }

    const estimation = await aiWalletService.estimateCaseConsumption({
      organizationId,
      pagesCount: pagesCount || 1,
      imagesCount: imagesCount || 0,
      documentsCount: documentsCount || 1,
      cachedDocumentsCount: cachedDocumentsCount || 0,
      runType: runType || 'full',
    });

    return res.status(200).json(estimation);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
