// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/ai/[...route]
// Punto de entrada consolidado para todos los endpoints de HIPOTECALY AI
// ==============================================================================

import { hipotecalyAiOrchestrator, ApplicationCaseInput } from '../../server/ai/orchestrator';
import { aiWalletService } from '../../server/ai/walletService';
import { openAiSecretResolver } from '../../server/ai/openAiSecretResolver';
import { MemoryRetrievalAgent } from '../../server/ai/agents/memoryRetrievalAgent';

const memAgent = new MemoryRetrievalAgent();

// ------------------------------------------------------------------------------
// 1. /api/ai/analyze
// ------------------------------------------------------------------------------
async function analyzeHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const caseInput: ApplicationCaseInput = req.body;

    if (!caseInput || !caseInput.applicationId || !caseInput.organizationId) {
      return res.status(400).json({ error: 'Missing applicationId or organizationId in request body.' });
    }

    // 0. Verificar Master Switch global
    const metadata = await openAiSecretResolver.getMetadata();
    if (metadata.configured && !metadata.active) {
      return res.status(503).json({
        error: 'AI_PROVIDER_DISABLED',
        message: 'HIPOTECALY AI no está disponible temporalmente.',
      });
    }

    // 1. Ejecutar análisis orquestado
    const report = await hipotecalyAiOrchestrator.analyzeCase(caseInput);

    // 2. Deducir saldo atómicamente en la billetera
    const walletDeduction = await aiWalletService.deductConsumption({
      organizationId: caseInput.organizationId,
      runId: report.run_id,
      caseUnits: report.usage.case_units_consumed,
      costUsd: report.usage.cost_total_usd,
      description: `Ejecución serverless para expediente ${caseInput.applicationId}`,
    });

    return res.status(200).json({
      report,
      walletDeduction,
    });
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('AI_PROVIDER_DISABLED') || msg.includes('AI_PROVIDER_UNAVAILABLE')) {
      return res.status(503).json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'HIPOTECALY AI no está disponible temporalmente.',
      });
    }

    return res.status(500).json({
      error: 'Error en el análisis del expediente',
      message: 'No se pudo completar el análisis del expediente en este momento.',
    });
  }
}

// ------------------------------------------------------------------------------
// 2. /api/ai/estimate
// ------------------------------------------------------------------------------
async function estimateHandler(req: any, res: any) {
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

// ------------------------------------------------------------------------------
// 3. /api/ai/wallet
// ------------------------------------------------------------------------------
async function walletHandler(req: any, res: any) {
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

// ------------------------------------------------------------------------------
// 4. /api/ai/corrections
// ------------------------------------------------------------------------------
async function correctionsHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const params = req.body;
    if (params.action === 'correct' || params.action === 'incorrect_ai') {
      await memAgent.learnCorrection({
        memoryType: 'correction_pattern',
        department: params.department || 'Montevideo',
        propertyType: params.propertyType || 'apartamento',
        rawCorrectionSummary: `Correccion en ${params.itemCategory}: ${params.humanCorrectionText}`,
        rawInsight: params.correctionReason,
      });
    }
    return res.status(200).json({ success: true, status: 'candidate' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Error processing correction' });
  }
}

// ------------------------------------------------------------------------------
// ROUTER PRINCIPAL DE /api/ai/*
// ------------------------------------------------------------------------------
export default async function handler(req: any, res: any) {
  const routeParam = req.query?.route;
  const subpath = Array.isArray(routeParam)
    ? routeParam.join('/')
    : (typeof routeParam === 'string' ? routeParam : '');

  const normalizedPath = (
    subpath ||
    (req.url ? req.url.replace(/^\/api\/ai\/?/, '').split('?')[0] : '')
  ).toLowerCase().replace(/\/$/, '');

  if (normalizedPath === 'analyze') {
    return analyzeHandler(req, res);
  }

  if (normalizedPath === 'estimate') {
    return estimateHandler(req, res);
  }

  if (normalizedPath === 'wallet') {
    return walletHandler(req, res);
  }

  if (normalizedPath === 'corrections') {
    return correctionsHandler(req, res);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Endpoint '/api/ai/${normalizedPath}' no encontrado.`,
    availableEndpoints: [
      'POST /api/ai/analyze',
      'POST /api/ai/estimate',
      'GET|POST /api/ai/wallet',
      'POST /api/ai/corrections',
    ],
  });
}
