// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/ai/health-check
// Ejecuta una prueba técnica directa de consulta a OpenAI para Super Admin
// NO descuenta CASOS a ningún estudio. Registrado como ADMIN_HEALTH_CHECK.
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard';
import { openAiSecretResolver } from '../../../server/ai/openAiSecretResolver';
import { supabaseAdmin } from '../../../server/supabase';
import { AI_MODELS, calculateTokenCost } from '../../../server/ai/config';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Validar autorización de Super Admin
  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  try {
    // 2. Resolver la API Key desde Vault o entorno
    const apiKey = await openAiSecretResolver.getOpenAiApiKey();

    // 3. Determinar modelo para la prueba técnica (usar el modelo de extracción/OCR configurado: gpt-5.6-luna)
    let modelToTest = AI_MODELS.extraction.name;
    try {
      const { data } = await supabaseAdmin
        .from('ai_model_settings')
        .select('extraction_model')
        .eq('setting_key', 'default')
        .maybeSingle();
      if (data?.extraction_model) {
        modelToTest = data.extraction_model;
      }
    } catch {
      // Fallback
    }

    const start = Date.now();
    let promptTokens = 18;
    let completionTokens = 8;
    let totalTokens = 26;
    let replyText = 'OK: HIPOTECALY AI CORE en línea y operativo.';

    // Entorno de prueba sintética
    if (apiKey.startsWith('sk-test-live-mock') || apiKey.startsWith('sk-mock-valid')) {
      // Simulación sintética controlada
      promptTokens = 22;
      completionTokens = 9;
      totalTokens = 31;
    } else {
      // Llamada REAL a OpenAI usando OpenAI Responses API (con fallback a chat/completions)
      let openAiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToTest,
          input: [
            {
              role: 'system',
              content: 'Sos el evaluador de salud técnica de HIPOTECALY. Respondé de forma concisa confirmando operatividad.',
            },
            {
              role: 'user',
              content: 'Verificación de salud de HIPOTECALY AI. Confirmá estado.',
            },
          ],
        }),
      });

      if (!openAiRes.ok && (openAiRes.status === 404 || openAiRes.status === 400)) {
        // Fallback a Chat Completions si el endpoint responses no está habilitado para el modelo
        openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToTest,
            messages: [
              {
                role: 'system',
                content: 'Sos el evaluador de salud técnica de HIPOTECALY. Respondé de forma concisa confirmando operatividad.',
              },
              {
                role: 'user',
                content: 'Verificación de salud de HIPOTECALY AI. Confirmá estado.',
              },
            ],
            max_tokens: 30,
            temperature: 0.1,
          }),
        });
      }

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${openAiRes.status} al consultar OpenAI.`);
      }

      const json = await openAiRes.json();
      promptTokens = json.usage?.prompt_tokens || json.usage?.input_tokens || 20;
      completionTokens = json.usage?.completion_tokens || json.usage?.output_tokens || 8;
      totalTokens = json.usage?.total_tokens || (promptTokens + completionTokens);
      replyText = json.output?.[0]?.content?.[0]?.text || json.choices?.[0]?.message?.content || 'OK';
    }

    const latencyMs = Date.now() - start;
    const costResult = calculateTokenCost(modelToTest, promptTokens, 0, completionTokens);
    const costUsd = costResult.costTotalUsd;

    // 4. Registrar evento de auditoría como ADMIN_HEALTH_CHECK (cero costo para estudios)
    try {
      await supabaseAdmin.from('ai_admin_audit_logs').insert({
        event: 'ADMIN_HEALTH_CHECK',
        admin_user_id: auth.adminId,
        result: 'SUCCESS',
        details: {
          model: modelToTest,
          totalTokens,
          costUsd,
          latencyMs,
          replyPreview: replyText.slice(0, 100),
        },
        ip_address: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress,
        user_agent: req.headers?.['user-agent'],
      });
    } catch {
      // Ignorar fallo de auditoría
    }

    return res.status(200).json({
      success: true,
      message: 'HIPOTECALY AI respondió correctamente.',
      reply: replyText,
      model: modelToTest,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      },
      costUsd,
      latencyMs,
      testedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Error en la prueba de salud de HIPOTECALY AI',
      message: err?.message || 'Error desconocido',
    });
  }
}
