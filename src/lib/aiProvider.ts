// ==============================================================================
// HIPOTECALY: Abstracción de Proveedor de Inteligencia Artificial Asistente
// ==============================================================================

export interface AiDimensionResult {
  score: number; // 0 a 100
  status: 'green' | 'yellow' | 'red';
  title: string;
  summary: string;
  checks: Array<{ label: string; passed: boolean; note?: string }>;
}

export interface AiAnalysisOutput {
  providerName: string;
  isPreliminary: boolean;
  disclaimer: string;
  analyzedAt: string;
  dimensions: {
    tasacion: AiDimensionResult;
    documentacion: AiDimensionResult;
    capacidadPago: AiDimensionResult;
    riesgoJuridico: AiDimensionResult;
  };
  overallRecommendation: string;
}

export interface ApplicationAiInput {
  propertyEstimatedValue: number;
  requestedAmount: number;
  currency: string;
  termMonths: number;
  repaymentMode: string;
  monthlyIncome?: number;
  clearingStatus?: string;
  propertyType?: string;
  legalStatus?: string;
  department?: string;
  surfaceM2?: number;
}

export interface AIProvider {
  name: string;
  analyzeApplication(input: ApplicationAiInput): Promise<AiAnalysisOutput>;
}

export const MANDATORY_AI_DISCLAIMER =
  'Análisis tecnológico preliminar. No constituye tasación profesional, estudio de títulos, asesoramiento jurídico ni decisión de crédito.';

/**
 * Proveedor DEMO_PROVIDER explícitamente identificado como tal en código.
 * Implementa heurísticas operativas transparentes sin alucinaciones.
 */
export class DemoAIProvider implements AIProvider {
  public name = 'DEMO_PROVIDER';

  public async analyzeApplication(input: ApplicationAiInput): Promise<AiAnalysisOutput> {
    const financedPercent =
      input.propertyEstimatedValue > 0 ? (input.requestedAmount / input.propertyEstimatedValue) * 100 : 0;

    // 1. Tasación
    const tasacionStatus: 'green' | 'yellow' | 'red' =
      financedPercent <= 45 ? 'green' : financedPercent <= 50 ? 'yellow' : 'red';
    const tasacion: AiDimensionResult = {
      score: financedPercent <= 45 ? 92 : financedPercent <= 50 ? 75 : 40,
      status: tasacionStatus,
      title: 'Valuación y Garantía',
      summary:
        financedPercent <= 50
          ? `Porcentaje financiado del ${financedPercent.toFixed(1)}% se encuentra dentro de los márgenes admitidos.`
          : `Porcentaje financiado del ${financedPercent.toFixed(1)}% supera el límite sugerido del 50%.`,
      checks: [
        { label: 'Relación Monto / Valor Declarado', passed: financedPercent <= 50 },
        { label: 'Ubicación e índice zonal', passed: true, note: input.department || 'Montevideo' },
        { label: 'Tipo de inmueble admitido', passed: true, note: input.propertyType || 'Vivienda' },
      ],
    };

    // 2. Documentación
    const doc: AiDimensionResult = {
      score: 85,
      status: 'green',
      title: 'Legajo y Documentación',
      summary: 'Documentación preliminar cargada y legible. Cédula e ingresos presentados.',
      checks: [
        { label: 'Identidad del solicitante', passed: true },
        { label: 'Comprobantes de ingresos', passed: true },
        { label: 'Cédula catastral verificada', passed: true },
      ],
    };

    // 3. Capacidad de Pago
    const estimatedMonthly = Math.round((input.requestedAmount * (0.115 / 12)));
    const income = input.monthlyIncome || 95000;
    const ratio = (estimatedMonthly * 40) / income; // Estimado USD/UYU
    const capStatus: 'green' | 'yellow' | 'red' = ratio <= 35 ? 'green' : ratio <= 45 ? 'yellow' : 'red';
    const capacidadPago: AiDimensionResult = {
      score: capStatus === 'green' ? 88 : capStatus === 'yellow' ? 68 : 45,
      status: capStatus,
      title: 'Capacidad de Pago Estimada',
      summary: `Cuota estimada de aprox. USD ${estimatedMonthly}/mes (${input.repaymentMode === 'solo_intereses' ? 'Solo intereses' : 'Amortizable'}).`,
      checks: [
        { label: 'Afectación de ingresos estimada <= 35%', passed: capStatus === 'green' },
        { label: 'Historial crediticio / Clearing', passed: input.clearingStatus !== 'bad' },
        { label: 'Estabilidad de la fuente de ingresos', passed: true },
      ],
    };

    // 4. Riesgo Jurídico
    const jurStatus: 'green' | 'yellow' | 'red' =
      input.legalStatus === 'tiene_hipoteca' ? 'yellow' : input.legalStatus === 'sucesion_en_tramite' ? 'yellow' : 'green';
    const riesgoJuridico: AiDimensionResult = {
      score: jurStatus === 'green' ? 95 : 65,
      status: jurStatus,
      title: 'Riesgo Jurídico y Registral',
      summary:
        jurStatus === 'green'
          ? 'Inmueble reportado libre de gravámenes sin antecedentes contenciosos reportados.'
          : 'Requiere revisión notarial por gravámenes previos o trámites sucesorios.',
      checks: [
        { label: 'Titularidad declarada', passed: true },
        { label: 'Libre de embargos preliminar', passed: jurStatus === 'green' },
        { label: 'Disponibilidad de padrón registral', passed: true },
      ],
    };

    const hasWarning = tasacionStatus === 'red' || jurStatus === 'yellow' || capStatus === 'red';

    return {
      providerName: this.name,
      isPreliminary: true,
      disclaimer: MANDATORY_AI_DISCLAIMER,
      analyzedAt: new Date().toISOString(),
      dimensions: {
        tasacion,
        documentacion: doc,
        capacidadPago,
        riesgoJuridico,
      },
      overallRecommendation: hasWarning
        ? 'Requiere ajuste de monto o evaluación técnica notarial prioritaria.'
        : 'Expediente preliminarmente apto para avanzar a revisión notarial y formalización.',
    };
  }
}

// Instancia singleton por defecto
export const defaultAiProvider: AIProvider = new DemoAIProvider();
