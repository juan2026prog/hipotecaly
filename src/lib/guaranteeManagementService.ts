import { PropertyType } from './types';

export type GuaranteeGroup = 'all' | 'requires_attention' | 'released_closed';

export type GuaranteeViewMode = 'table' | 'cards';

export type LtvRangeFilter = 'all' | 'lt_30' | '30_35' | '35_40' | 'gt_40';

export type AppraisalStatus = 'vigente' | 'por_actualizar' | 'pendiente' | 'vencida' | 'no_disponible';

export type NormalizedLegalStatus =
  | 'libre_gravamenes'
  | 'en_revision'
  | 'tiene_hipoteca'
  | 'sucesion_en_tramite'
  | 'desconocido';

export interface GuaranteeGroupDefinition {
  id: GuaranteeGroup;
  label: string;
  subtitle: string;
}

export const GUARANTEE_GROUPS: GuaranteeGroupDefinition[] = [
  {
    id: 'all',
    label: 'Todas',
    subtitle: 'Garantías registradas',
  },
  {
    id: 'requires_attention',
    label: 'Requieren atención',
    subtitle: 'Con alertas o pendientes',
  },
  {
    id: 'released_closed',
    label: 'Liberadas / cerradas',
    subtitle: 'Histórico de garantías',
  },
];

export interface GuaranteeItem {
  id: string;
  appId: string;
  publicId: string;
  borrowerName: string;
  propertyType: PropertyType | string;
  department: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  cadastralNumber: string;
  surfaceM2: number;
  value: number | null; // Valor vigente/estimado
  valueSource: string; // 'Tasación pericial', 'Valuación preliminar', 'Estimación declarada'
  requestedAmount: number;
  financingAmount: number;
  ltv: number | null;
  ltvFormatted: string;
  ltvLevel: 'low' | 'moderate' | 'high' | 'critical' | 'none';
  appStatus: string;
  isReleasedOrClosed: boolean;
  appraisalStatus: {
    status: AppraisalStatus;
    label: string;
    badgeColor: string;
    reviewedAt?: string;
    details?: string;
  };
  legalStatus: {
    status: NormalizedLegalStatus;
    label: string;
    badgeColor: string;
    verified: boolean;
  };
  nextAction: {
    action: string;
    timing: string;
    responsible: string;
  };
  alerts: {
    hasAlert: boolean;
    text: string;
    level: 'critical' | 'warning' | 'info' | 'clean';
  };
  requiresAttention: boolean;
}

/**
 * Normaliza y evalúa la vigencia real de una tasación en base a su fecha de revisión o creación
 */
export function evaluateAppraisalStatus(valuation: any, appDateStr?: string): GuaranteeItem['appraisalStatus'] {
  if (!valuation || (!valuation.preliminary_value && !valuation.applicant_estimated_value && !valuation.reviewed_at)) {
    return {
      status: 'pendiente',
      label: 'Pendiente de peritaje',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
      details: 'Sin tasación asignada',
    };
  }

  const dateToCheck = valuation.reviewed_at || appDateStr;
  if (!dateToCheck) {
    return {
      status: 'no_disponible',
      label: 'No disponible',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const reviewedDate = new Date(dateToCheck);
  const now = new Date();
  const monthsDiff = (now.getTime() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

  if (monthsDiff > 12) {
    return {
      status: 'vencida',
      label: 'Vencida (+12 meses)',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      reviewedAt: reviewedDate.toLocaleDateString('es-UY'),
      details: 'Requiere nueva inspección',
    };
  }

  if (monthsDiff >= 6) {
    return {
      status: 'por_actualizar',
      label: 'Por actualizar (+6 meses)',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      reviewedAt: reviewedDate.toLocaleDateString('es-UY'),
      details: 'Cercana a vencimiento',
    };
  }

  return {
    status: 'vigente',
    label: 'Vigente',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    reviewedAt: reviewedDate.toLocaleDateString('es-UY'),
    details: valuation.methodology ? valuation.methodology.replace(/_/g, ' ') : 'Certificada',
  };
}

/**
 * Normaliza el estado legal/jurídico de la propiedad sin asumir OK si es NULL o desconocido
 */
export function evaluateLegalStatus(legalStatusRaw: any, appStatus?: string): GuaranteeItem['legalStatus'] {
  if (!legalStatusRaw || legalStatusRaw === 'desconocido') {
    return {
      status: 'desconocido',
      label: 'Sin verificar',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      verified: false,
    };
  }

  if (legalStatusRaw === 'tiene_hipoteca') {
    return {
      status: 'tiene_hipoteca',
      label: 'Gravamen detectado',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      verified: true,
    };
  }

  if (legalStatusRaw === 'sucesion_en_tramite') {
    return {
      status: 'sucesion_en_tramite',
      label: 'Sucesión en trámite',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      verified: true,
    };
  }

  if (legalStatusRaw === 'en_revision' || appStatus === 'info_review') {
    return {
      status: 'en_revision',
      label: 'En revisión jurídica',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      verified: false,
    };
  }

  if (legalStatusRaw === 'libre_gravamenes') {
    return {
      status: 'libre_gravamenes',
      label: 'Libre de gravámenes',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      verified: true,
    };
  }

  return {
    status: 'desconocido',
    label: String(legalStatusRaw).replace(/_/g, ' '),
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    verified: false,
  };
}

/**
 * Deriva la próxima acción operativa requerida sobre la garantía
 */
export function evaluateGuaranteeNextAction(app: any, appraisal: GuaranteeItem['appraisalStatus'], legal: GuaranteeItem['legalStatus']): GuaranteeItem['nextAction'] {
  const status = app.status;

  if (legal.status === 'tiene_hipoteca') {
    return {
      action: 'Revisar gravamen',
      timing: 'Prioridad alta',
      responsible: 'Escribanía Notarial',
    };
  }

  if (legal.status === 'sucesion_en_tramite') {
    return {
      action: 'Validar declaratoria',
      timing: 'En juzgado',
      responsible: 'Asesor Legal',
    };
  }

  if (appraisal.status === 'vencida') {
    return {
      action: 'Re-tasar inmueble',
      timing: 'Vencida',
      responsible: 'Perito Tasador',
    };
  }

  if (appraisal.status === 'pendiente') {
    return {
      action: 'Asignar tasador',
      timing: 'Pendiente',
      responsible: 'Perito Tasador',
    };
  }

  if (status === 'property_analysis') {
    return {
      action: 'Cotejar padrón y planos',
      timing: 'Plazo 24 hs',
      responsible: 'Analista Técnico',
    };
  }

  if (status === 'formalization') {
    return {
      action: 'Coordinar minuta e hipoteca',
      timing: 'Firma próxima',
      responsible: 'Escribanía Notarial',
    };
  }

  if (status === 'approved' || status === 'funded') {
    return {
      action: 'Garantía inscripta DGR',
      timing: 'Vigente',
      responsible: 'Registro Inmobiliario',
    };
  }

  if (status === 'rejected' || status === 'cancelled') {
    return {
      action: 'Garantía liberada / no afectada',
      timing: 'Cerrado',
      responsible: 'Mesa de Crédito',
    };
  }

  return {
    action: 'Validar certificados registrales',
    timing: 'En curso',
    responsible: 'Mesa Notarial',
  };
}

/**
 * Deriva alertas operativas de la garantía
 */
export function evaluateGuaranteeAlerts(app: any, appraisal: GuaranteeItem['appraisalStatus'], legal: GuaranteeItem['legalStatus']): GuaranteeItem['alerts'] {
  if (legal.status === 'tiene_hipoteca') {
    return {
      hasAlert: true,
      text: 'Gravamen detectado',
      level: 'critical',
    };
  }

  if (appraisal.status === 'vencida') {
    return {
      hasAlert: true,
      text: 'Tasación vencida',
      level: 'critical',
    };
  }

  if (legal.status === 'sucesion_en_tramite') {
    return {
      hasAlert: true,
      text: 'Sucesión en trámite',
      level: 'warning',
    };
  }

  if (appraisal.status === 'por_actualizar') {
    return {
      hasAlert: true,
      text: 'Tasación +6 meses',
      level: 'warning',
    };
  }

  if (appraisal.status === 'pendiente') {
    return {
      hasAlert: true,
      text: 'Tasación pendiente',
      level: 'warning',
    };
  }

  if (legal.status === 'desconocido') {
    return {
      hasAlert: true,
      text: 'Estado legal sin verificar',
      level: 'warning',
    };
  }

  if (app.status === 'approved' || legal.status === 'libre_gravamenes') {
    return {
      hasAlert: false,
      text: 'Sin alertas · Conforme',
      level: 'clean',
    };
  }

  return {
    hasAlert: false,
    text: 'En revisión regular',
    level: 'info',
  };
}

/**
 * Transforma un expediente completo a un objeto GuaranteeItem normalizado
 */
export function mapApplicationToGuarantee(app: any): GuaranteeItem {
  const prop = app.property || {};
  const val = app.valuation || {};
  const borrower = app.borrower || {};

  const estValue = Number(prop.estimated_value) || Number(val.preliminary_value) || Number(val.applicant_estimated_value) || 0;
  const valueSource = val.preliminary_value
    ? 'Tasación pericial'
    : prop.estimated_value
      ? 'Valuación preliminar'
      : 'Declarado';

  const reqAmount = Number(app.requested_amount) || 0;
  const ltvVal = estValue > 0 ? (reqAmount / estValue) * 100 : null;

  let ltvLevel: GuaranteeItem['ltvLevel'] = 'none';
  if (ltvVal !== null) {
    if (ltvVal > 50) ltvLevel = 'critical';
    else if (ltvVal > 40) ltvLevel = 'high';
    else if (ltvVal >= 30) ltvLevel = 'moderate';
    else ltvLevel = 'low';
  }

  const appraisal = evaluateAppraisalStatus(val, app.created_at);
  const legal = evaluateLegalStatus(prop.legal_status, app.status);
  const nextAction = evaluateGuaranteeNextAction(app, appraisal, legal);
  const alerts = evaluateGuaranteeAlerts(app, appraisal, legal);

  const isReleasedOrClosed = ['approved', 'rejected', 'funded', 'cancelled'].includes(app.status);
  const requiresAttention = !isReleasedOrClosed && (alerts.hasAlert || appraisal.status !== 'vigente' || legal.status !== 'libre_gravamenes');

  const borrowerName = borrower.first_name
    ? `${borrower.first_name} ${borrower.last_name || ''}`.trim()
    : 'Borrador sin titular';

  return {
    id: prop.id || app.id,
    appId: app.id,
    publicId: app.public_id || `HIP-${app.id.slice(0, 5).toUpperCase()}`,
    borrowerName,
    propertyType: prop.property_type || 'casa',
    department: prop.department || 'Montevideo',
    city: prop.city,
    neighborhood: prop.neighborhood,
    address: prop.address,
    cadastralNumber: prop.cadastral_number || 'A definir',
    surfaceM2: Number(prop.surface_m2) || 0,
    value: estValue > 0 ? estValue : null,
    valueSource,
    requestedAmount: reqAmount,
    financingAmount: reqAmount,
    ltv: ltvVal,
    ltvFormatted: ltvVal !== null ? `${ltvVal.toFixed(1)}%` : 'N/D',
    ltvLevel,
    appStatus: app.status,
    isReleasedOrClosed,
    appraisalStatus: appraisal,
    legalStatus: legal,
    nextAction,
    alerts,
    requiresAttention,
  };
}

/**
 * Calcula los 4 KPIs principales de Garantías Hipotecarias
 */
export function calculateGuaranteeKpis(guarantees: GuaranteeItem[]) {
  const activeGuarantees = guarantees.filter((g) => !g.isReleasedOrClosed);
  const totalGuaranteedValue = activeGuarantees.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const activeWithLtv = activeGuarantees.filter((g) => g.ltv !== null);
  const averageLtv = activeWithLtv.length > 0
    ? activeWithLtv.reduce((acc, curr) => acc + (curr.ltv || 0), 0) / activeWithLtv.length
    : 0;

  const requiresAttentionCount = guarantees.filter((g) => g.requiresAttention).length;

  return {
    activeCount: activeGuarantees.length,
    totalGuaranteedValue,
    averageLtv: averageLtv.toFixed(1),
    requiresAttentionCount,
  };
}

/**
 * Calcula los contadores de los 3 macro-grupos de garantías
 */
export function calculateGuaranteeGroupCounts(guarantees: GuaranteeItem[]): Record<GuaranteeGroup, number> {
  return {
    all: guarantees.length,
    requires_attention: guarantees.filter((g) => g.requiresAttention).length,
    released_closed: guarantees.filter((g) => g.isReleasedOrClosed).length,
  };
}

/**
 * Filtra las garantías por rango de LTV
 */
export function filterByLtvRange(guarantee: GuaranteeItem, range: LtvRangeFilter): boolean {
  if (range === 'all') return true;
  if (guarantee.ltv === null) return false;

  const ltv = guarantee.ltv;
  switch (range) {
    case 'lt_30':
      return ltv < 30;
    case '30_35':
      return ltv >= 30 && ltv <= 35;
    case '35_40':
      return ltv > 35 && ltv <= 40;
    case 'gt_40':
      return ltv > 40;
    default:
      return true;
  }
}
