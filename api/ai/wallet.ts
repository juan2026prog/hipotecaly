// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/ai/wallet
// ==============================================================================

import { aiWalletService } from '../../server/ai/walletService';

export default async function handler(req: any, res: any) {
  const orgId = req.query?.organizationId || req.body?.organizationId;

  if (!orgId) {
    return res.status(400).json({ error: 'Missing organizationId' });
  }

  try {
    if (req.method === 'GET') {
      const state = await aiWalletService.getWalletState(orgId);
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const { action, cases, caseUnits, month, monthNumber } = req.body;
      const numCases = Number(cases || caseUnits);
      const numMonth = Number(month || monthNumber);
      if (action === 'purchase' && numCases) {
        const result = await aiWalletService.purchaseCases(orgId, numCases);
        return res.status(200).json(result);
      }
      if (action === 'grant_promo' && numMonth) {
        const result = await aiWalletService.grantMonthlyPromotional(orgId, numMonth);
        return res.status(200).json(result);
      }
      return res.status(400).json({ error: 'Invalid wallet action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
