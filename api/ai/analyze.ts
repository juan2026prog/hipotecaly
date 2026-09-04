// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/ai/analyze
// Ejecución Server-Side exclusiva para HIPOTECALY AI CORE
// ==============================================================================

import { hipotecalyAiOrchestrator, ApplicationCaseInput } from '../../server/ai/orchestrator';
import { aiWalletService } from '../../server/ai/walletService';
import { openAiSecretResolver } from '../../server/ai/openAiSecretResolver';

export default async function handler(req: any, res: any) {
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
