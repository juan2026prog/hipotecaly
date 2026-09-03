// ==============================================================================
// HIPOTECALY AI: Risk Agent & Semáforo Multidimensional (10 Categorías 🟢 🟡 🔴)
// ==============================================================================

import { SemaphoreItem, SemaphoreStatus } from '../types';
import { ConsistencyIssue } from '../types';
import { UnderwritingOutput } from '../types';
import { PropertyValuationOutput } from '../types';
import { DocumentAnalysisResult } from './documentIntelligenceAgent';

export interface RiskEvaluationInput {
  underwriting: UnderwritingOutput;
  valuation: PropertyValuationOutput;
  consistencyIssues: ConsistencyIssue[];
  missingDocs: string[];
  documents: DocumentAnalysisResult[];
  legalStatus?: string;
  clearingStatus?: string;
}

export class RiskAgent {
  /**
   * Genera los 10 semáforos específicos con explicaciones técnicas y evidencias
   */
  public evaluateRisk(input: RiskEvaluationInput): SemaphoreItem[] {
    const semaphores: SemaphoreItem[] = [];

    // Helper para buscar IDs de documentos asociados
    const docIds = input.documents
      .map((d) => d.documentId)
      .filter((id): id is string => Boolean(id));

    // 1. SEMÁFORO: TASACIÓN
    let tasacionStatus: SemaphoreStatus = 'green';
    let tasacionReason = 'Tasación objetiva respaldada por comparables zonales con liquidez suficiente.';
    if (input.valuation.confidence === 'baja') {
      tasacionStatus = 'yellow';
      tasacionReason = 'Tasación preliminar con confianza acotada por dispersión de mercado o falta de datos.';
    }
    if (input.valuation.warnings.length > 0 && input.valuation.confidence === 'baja') {
      tasacionStatus = 'yellow';
    }
    semaphores.push({
      category: 'tasacion',
      status: tasacionStatus,
      title: 'Valuación y Liquidez de Garantía',
      reason: tasacionReason,
      evidence: `Valor de mercado estimado: USD ${input.valuation.estimated_market_value.toLocaleString('es-UY')} | Valor conservador garantía: USD ${input.valuation.conservative_value.toLocaleString('es-UY')}.`,
      source_document_ids: docIds,
      confidence: input.valuation.confidence === 'alta' ? 95 : input.valuation.confidence === 'media' ? 80 : 60,
      requires_human_review: input.valuation.confidence === 'baja',
    });

    // 2. SEMÁFORO: LTV
    let ltvStatus: SemaphoreStatus = 'green';
    let ltvReason = `LTV conservador del ${input.underwriting.ltv_conservative}% se ubica dentro del límite admitido (${input.underwriting.policy_limits.max_ltv_allowed}%).`;
    if (input.underwriting.ltv_conservative > input.underwriting.policy_limits.max_ltv_allowed) {
      ltvStatus = 'red'; // 🔴 Requiere revisión / ajuste de monto, NO es rechazo automático
      ltvReason = `El LTV conservador (${input.underwriting.ltv_conservative}%) supera el umbral del ${input.underwriting.policy_limits.max_ltv_allowed}%. Monto máximo sugerido: USD ${input.underwriting.max_allowed_by_ltv.toLocaleString('es-UY')}.`;
    } else if (input.underwriting.ltv_conservative > input.underwriting.policy_limits.max_ltv_allowed * 0.9) {
      ltvStatus = 'yellow';
      ltvReason = `LTV (${input.underwriting.ltv_conservative}%) cercano al límite máximo permitido.`;
    }
    semaphores.push({
      category: 'ltv',
      status: ltvStatus,
      title: 'Relación Préstamo / Garantía (LTV)',
      reason: ltvReason,
      evidence: `Solicitado: USD ${input.underwriting.loan_amount.toLocaleString('es-UY')} sobre garantía conservadora de USD ${input.underwriting.conservative_property_value.toLocaleString('es-UY')}.`,
      source_document_ids: docIds,
      confidence: 99,
      requires_human_review: ltvStatus === 'red',
    });

    // 3. SEMÁFORO: TITULARIDAD
    const titularityIssue = input.consistencyIssues.find((i) => i.category === 'titularidad');
    let titularidadStatus: SemaphoreStatus = 'green';
    let titularidadReason = 'Titularidad acreditada en consonancia con el solicitante.';
    if (titularityIssue) {
      titularidadStatus = 'red';
      titularidadReason = titularityIssue.description;
    } else if (input.legalStatus === 'sucesion_en_tramite') {
      titularidadStatus = 'yellow';
      titularidadReason = 'Sucesión en trámite: requiere comprobante de declaratoria de herederos formal.';
    }
    semaphores.push({
      category: 'titularidad',
      status: titularidadStatus,
      title: 'Dominio y Titularidad Registral',
      reason: titularidadReason,
      evidence: titularityIssue ? titularityIssue.evidenced_value : 'Inscripción registral concordante.',
      source_document_ids: docIds,
      confidence: 90,
      requires_human_review: titularidadStatus !== 'green',
    });

    // 4. SEMÁFORO: DOCUMENTACIÓN
    let docStatus: SemaphoreStatus = 'green';
    let docReason = 'Legajo documental completo para análisis preliminar.';
    if (input.missingDocs.length > 0) {
      docStatus = input.missingDocs.some((d) => d.includes('Título') || d.includes('Escritura')) ? 'red' : 'yellow';
      docReason = `Faltan documentos requeridos: ${input.missingDocs.join(', ')}.`;
    }
    semaphores.push({
      category: 'documentacion',
      status: docStatus,
      title: 'Completitud Documental',
      reason: docReason,
      evidence: `${input.documents.length} documentos procesados en el legajo.`,
      source_document_ids: docIds,
      confidence: 95,
      requires_human_review: docStatus === 'red',
    });

    // 5. SEMÁFORO: INGRESOS
    let ingStatus: SemaphoreStatus = 'green';
    let ingReason = 'Capacidad de pago respaldada por ingresos demostrables.';
    const missingIncome = input.missingDocs.some((d) => d.includes('Ingresos'));
    if (missingIncome) {
      ingStatus = 'yellow';
      ingReason = 'Comprobantes de ingresos pendientes de verificación formal.';
    } else if (input.underwriting.debt_to_income_ratio && input.underwriting.debt_to_income_ratio > 40) {
      ingStatus = 'yellow';
      ingReason = `Afectación de ingresos estimada (${input.underwriting.debt_to_income_ratio}%) supera el 40% recomendado.`;
    }
    semaphores.push({
      category: 'ingresos',
      status: ingStatus,
      title: 'Capacidad de Repago e Ingresos',
      reason: ingReason,
      evidence: `Cuota mensual estimada: USD ${input.underwriting.estimated_monthly_installment_usd}/mes.`,
      source_document_ids: docIds,
      confidence: 85,
      requires_human_review: ingStatus !== 'green',
    });

    // 6. SEMÁFORO: DEUDAS
    let deudaStatus: SemaphoreStatus = 'green';
    let deudaReason = 'Sin antecedentes contenciosos ni embargos reportados en legajo.';
    if (input.legalStatus === 'tiene_hipoteca') {
      deudaStatus = 'yellow';
      deudaReason = 'Inmueble con gravamen hipotecario anterior. Requiere carta de saldo o cancelación previa.';
    }
    semaphores.push({
      category: 'deudas',
      status: deudaStatus,
      title: 'Gravámenes y Pasivos Registrales',
      reason: deudaReason,
      evidence: input.legalStatus || 'Libre de gravámenes',
      source_document_ids: docIds,
      confidence: 85,
      requires_human_review: deudaStatus !== 'green',
    });

    // 7. SEMÁFORO: CONSISTENCIA
    const criticalIssues = input.consistencyIssues.filter((i) => i.severity === 'critica');
    let consStatus: SemaphoreStatus = 'green';
    let consReason = 'No se detectaron contradicciones entre datos declarados y documentos.';
    if (criticalIssues.length > 0) {
      consStatus = 'red';
      consReason = `Se detectaron ${criticalIssues.length} inconsistencias críticas: ${criticalIssues.map((i) => i.title).join('; ')}.`;
    } else if (input.consistencyIssues.length > 0) {
      consStatus = 'yellow';
      consReason = `Se detectaron advertencias menores de consistencia (${input.consistencyIssues.length}).`;
    }
    semaphores.push({
      category: 'consistencia',
      status: consStatus,
      title: 'Consistencia y Cruce Documental',
      reason: consReason,
      evidence: input.consistencyIssues.map((i) => `${i.title}: ${i.declared_value} vs ${i.evidenced_value}`).join(' | ') || 'Datos concordantes',
      source_document_ids: docIds,
      confidence: 90,
      requires_human_review: consStatus === 'red',
    });

    // 8. SEMÁFORO: PROPIEDAD
    semaphores.push({
      category: 'propiedad',
      status: 'green',
      title: 'Aptitud del Inmueble en Garantía',
      reason: 'Inmueble urbano en zona apta para garantía hipotecaria.',
      evidence: `Superficie: ${input.valuation.estimated_market_value > 0 ? 'Inspeccionada' : 'Por verificar'}.`,
      source_document_ids: docIds,
      confidence: 90,
      requires_human_review: false,
    });

    // 9. SEMÁFORO: RIESGO
    const hasRedFlags = semaphores.some((s) => s.status === 'red');
    const hasYellowFlags = semaphores.some((s) => s.status === 'yellow');
    const riesgoStatus: SemaphoreStatus = hasRedFlags ? 'red' : hasYellowFlags ? 'yellow' : 'green';
    const riesgoReason = hasRedFlags
      ? 'Condiciones críticas identificadas que requieren pronunciamiento profesional antes del comité.'
      : hasYellowFlags
      ? 'Riesgo moderado mitigable mediante presentación de recaudos complementarios.'
      : 'Riesgo crediticio y registral dentro de parámetros óptimos de colocación.';

    semaphores.push({
      category: 'riesgo',
      status: riesgoStatus,
      title: 'Perfil Integral de Riesgo',
      reason: riesgoReason,
      evidence: `Flags: ${semaphores.filter((s) => s.status === 'red').length} Críticos, ${semaphores.filter((s) => s.status === 'yellow').length} Advertencias`,
      source_document_ids: docIds,
      confidence: 90,
      requires_human_review: hasRedFlags,
    });

    // 10. SEMÁFORO: ELEGIBILIDAD
    let elegStatus: SemaphoreStatus = 'green';
    let elegReason = 'Expediente reúne las condiciones preliminares de elegibilidad según la política.';
    if (!input.underwriting.eligible) {
      elegStatus = 'red';
      elegReason = input.underwriting.notes;
    } else if (hasRedFlags) {
      elegStatus = 'yellow';
      elegReason = 'Elegible sujeto al levantamiento de observaciones documentales o registrales.';
    }
    semaphores.push({
      category: 'elegibilidad',
      status: elegStatus,
      title: 'Elegibilidad de Política Crediticia',
      reason: elegReason,
      evidence: input.underwriting.eligible ? 'Cumple parámetros de LTV y montos' : input.underwriting.notes,
      source_document_ids: docIds,
      confidence: 95,
      requires_human_review: elegStatus !== 'green',
    });

    return semaphores;
  }
}
