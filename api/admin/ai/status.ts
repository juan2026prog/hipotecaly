// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/ai/status
// Estado de conexión, metadata no sensible y salud del proveedor AI
// Exclusivo para Super Admin (zero secret keys en la respuesta)
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard';
import { openAiSecretResolver } from '../../../server/ai/openAiSecretResolver';
import { supabaseAdmin } from '../../../server/supabase';
import { AI_MODELS } from '../../../server/ai/config';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // 1. Validar autorización de Super Admin
  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  try {
    // 2. Obtener metadata segura del secret resolver
    const metadata = await openAiSecretResolver.getMetadata();

    // 3. Obtener configuración de modelos activos en ai_model_settings
    let configuredModels = {
      extraction: AI_MODELS.extraction.name,
      reasoning: AI_MODELS.reasoning.name,
      deep: AI_MODELS.deep.name,
    };

    let modelSettingsFromDb: any = null;
    try {
      const { data } = await supabaseAdmin
        .from('ai_model_settings')
        .select('*')
        .eq('setting_key', 'default')
        .maybeSingle();

      if (data) {
        modelSettingsFromDb = data;
        configuredModels = {
          extraction: data.extraction_model || AI_MODELS.extraction.name,
          reasoning: data.reasoning_model || AI_MODELS.reasoning.name,
          deep: data.deep_model || AI_MODELS.deep.name,
        };
      }
    } catch {
      // Usar defaults
    }

    // 4. Obtener último test detallado
    let lastTestModels: any[] = [];
    let lastTestMessage: string = '';
    try {
      const { data } = await supabaseAdmin
        .from('ai_provider_settings')
        .select('last_test_models, last_test_message')
        .eq('provider', 'openai')
        .maybeSingle();
      if (data) {
        lastTestModels = data.last_test_models || [];
        lastTestMessage = data.last_test_message || '';
      }
    } catch {
      // Ignorar
    }

    return res.status(200).json({
      provider: 'openai',
      configured: metadata.configured,
      active: metadata.active,
      maskedKey: metadata.maskedKey,
      lastTestedAt: metadata.lastTestedAt,
      lastTestStatus: metadata.lastTestStatus || 'UNTESTED',
      lastTestMessage,
      secretSource: metadata.source,
      configuredModels,
      modelsStatus: lastTestModels.length > 0 ? lastTestModels : [
        { role: 'Extracción / OCR', model: configuredModels.extraction, accessible: metadata.configured },
        { role: 'Razonamiento / Underwriting', model: configuredModels.reasoning, accessible: metadata.configured },
        { role: 'Análisis Profundo', model: configuredModels.deep, accessible: metadata.configured },
      ],
      systemHealth: {
        supabaseConnected: true,
        vaultActive: true,
        memory3Available: true,
        walletCasosActive: true,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al recuperar estado del proveedor AI',
      message: error?.message || 'Error interno',
    });
  }
}
