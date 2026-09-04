// ==============================================================================
// HANDLER: /api/v1/simulations
// Endpoint REST Oficial: Simulación Hipotecaria Paramétrica Multi-Tenant
// ==============================================================================

import { EnterpriseApiKeyService } from '../apiKeyService';
import { supabaseAdmin } from '../../supabase';

export default async function simulationsHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite solicitudes HTTP POST.',
    });
  }

  // 1. Autenticación y control de scopes mediante API Key
  const authHeader = req.headers?.authorization || req.headers?.['x-api-key'];
  const auth = await EnterpriseApiKeyService.authenticateApiKey(authHeader, 'read:simulations');

  if (!auth.authenticated) {
    return res.status(auth.statusCode).json({
      error: 'Unauthorized',
      message: auth.error,
    });
  }

  const tenantId = auth.tenantId!;

  try {
    // 2. Validación de Payload
    const {
      propertyValueUsd,
      requestedAmountUsd,
      termMonths = 36,
      propertyDepartment = 'Montevideo',
      propertyType = 'casa',
    } = req.body || {};

    if (!propertyValueUsd || typeof propertyValueUsd !== 'number' || propertyValueUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El campo propertyValueUsd es obligatorio y debe ser un número positivo.',
      });
    }

    if (!requestedAmountUsd || typeof requestedAmountUsd !== 'number' || requestedAmountUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El campo requestedAmountUsd es obligatorio y debe ser un número positivo.',
      });
    }

    if (termMonths < 6 || termMonths > 240) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El plazo termMonths debe ubicarse entre 6 y 240 meses.',
      });
    }

    // 3. Resolver políticas reales del tenant desde Supabase
    let maxLtv = 40.0;
    let baseRate = 11.5;

    try {
      const { data: policyData } = await supabaseAdmin
        .from('underwriting_policies')
        .select('max_ltv, default_interest_rate')
        .eq('organization_id', tenantId)
        .maybeSingle();

      if (policyData) {
        if (typeof policyData.max_ltv === 'number') maxLtv = policyData.max_ltv;
        if (typeof policyData.default_interest_rate === 'number') baseRate = policyData.default_interest_rate;
      }
    } catch {
      // Usar defaults de política institucional
    }

    // 4. Evaluación paramétrica
    const ltvPct = Math.round((requestedAmountUsd / propertyValueUsd) * 100);
    const maxAllowedLoanUsd = Math.round(propertyValueUsd * (maxLtv / 100));

    if (ltvPct > maxLtv) {
      return res.status(422).json({
        valid: false,
        ltvPct,
        maxAllowedLoanUsd,
        appliedPolicy: {
          maxLtvAllowed: maxLtv,
          annualInterestRatePct: baseRate,
        },
        rejectionReason: `El LTV solicitado (${ltvPct}%) excede la política crediticia máxima configurada (${maxLtv}%).`,
      });
    }

    // 5. Cálculo cuota sistema francés mensual
    const monthlyRate = baseRate / 100 / 12;
    const monthlyPayment = Math.round(
      (requestedAmountUsd * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
    );

    return res.status(200).json({
      valid: true,
      ltvPct,
      maxAllowedLoanUsd,
      estimatedMonthlyPaymentUsd: monthlyPayment,
      annualInterestRatePct: baseRate,
      propertyDetails: {
        department: propertyDepartment,
        propertyType,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'No se pudo procesar la simulación en este momento.',
    });
  }
}
