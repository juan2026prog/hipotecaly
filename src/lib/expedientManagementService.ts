import { ApplicationStatus } from './types';

export type ExpedientGroup = 'all' | 'requires_action' | 'in_progress' | 'closing' | 'finished';

export type AssignmentScope = 'all' | 'mine';

export type AlertFilter = 'all' | 'with_alerts' | 'no_activity' | 'waiting_client' | 'no_blocks';

export type SortByType = 'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'ltv_desc';

export interface ExpedientGroupDefinition {
  id: ExpedientGroup;
  label: string;
  subtitle: string;
}

export const EXPEDIENT_GROUPS: ExpedientGroupDefinition[] = [
  {
    id: 'all',
    label: 'Todos',
    subtitle: 'Expedientes activos',
  },
  {
    id: 'requires_action',
    label: 'Requieren acción',
    subtitle: 'Prioridad del equipo',
  },
  {
    id: 'in_progress',
    label: 'En curso',
    subtitle: 'Con gestión activa',
  },
  {
    id: 'closing',
    label: 'Por cerrar',
    subtitle: 'Firma o formalización',
  },
  {
    id: 'finished',
    label: 'Finalizados',
    subtitle: 'Histórico cerrado',
  },
];

export interface NextActionInfo {
  action: string;
  timing: string;
  color: string;
  responsible: {
    name: string;
    role?: string;
  };
  alert: {
    text: string;
    type: 'critical' | 'warning' | 'info' | 'neutral' | 'clean';
  };
  priority: 'critical' | 'attention' | 'normal';
}

/**
 * Derivación unificada, centralizada y tipada de Próxima Acción, Responsable, Alertas y Prioridad Operativa
 */
export function getExpedientActionInfo(app: any): NextActionInfo {
  const status: ApplicationStatus | string = app?.status || 'draft';

  switch (status) {
    case 'submitted':
      return {
        action: 'Revisar solicitud',
        timing: 'Hoy · prioridad alta',
        color: 'text-amber-800 bg-amber-50 border border-amber-200/80',
        responsible: {
          name: app?.assigned_officer || 'Laura Méndez',
          role: 'Mesa de Entrada',
        },
        alert: {
          text: 'Recién ingresada',
          type: 'warning',
        },
        priority: 'critical',
      };

    case 'info_review':
      return {
        action: 'Validar documentación',
        timing: 'Plazo 24 hs',
        color: 'text-blue-800 bg-blue-50 border border-blue-200/80',
        responsible: {
          name: app?.assigned_officer || 'Valentina Ramos',
          role: 'Analista Documental',
        },
        alert: {
          text: '1 documento pendiente',
          type: 'warning',
        },
        priority: 'attention',
      };

    case 'property_analysis':
      return {
        action: 'Asignar tasador',
        timing: 'Peritaje pendiente',
        color: 'text-purple-800 bg-purple-50 border border-purple-200/80',
        responsible: {
          name: app?.assigned_officer || 'Martín Sosa',
          role: 'Perito Tasador',
        },
        alert: {
          text: 'Tasación requerida',
          type: 'warning',
        },
        priority: 'attention',
      };

    case 'evaluation':
      return {
        action: 'Evaluar riesgo crediticio',
        timing: 'Comité en curso',
        color: 'text-indigo-800 bg-indigo-50 border border-indigo-200/80',
        responsible: {
          name: app?.assigned_officer || 'Federico Gómez',
          role: 'Oficial de Riesgo',
        },
        alert: {
          text: 'Scoring A+ preliminar',
          type: 'info',
        },
        priority: 'attention',
      };

    case 'offer_available':
      return {
        action: 'Enviar condiciones',
        timing: 'Esperando cliente',
        color: 'text-teal-800 bg-teal-50 border border-teal-200/80',
        responsible: {
          name: app?.assigned_officer || 'Laura Méndez',
          role: 'Oficial de Crédito',
        },
        alert: {
          text: 'Propuesta emitida',
          type: 'info',
        },
        priority: 'normal',
      };

    case 'formalization':
      return {
        action: 'Gestionar firma',
        timing: 'Coordinando escribanía',
        color: 'text-emerald-800 bg-emerald-50 border border-emerald-200/80',
        responsible: {
          name: app?.assigned_officer || 'Dra. Valentina Ramos',
          role: 'Escribanía Notarial',
        },
        alert: {
          text: 'Minuta redactada',
          type: 'clean',
        },
        priority: 'attention',
      };

    case 'approved':
      return {
        action: 'Desembolsar fondos',
        timing: 'Escritura inscripta',
        color: 'text-emerald-800 bg-emerald-100/70 border border-emerald-300/80',
        responsible: {
          name: app?.assigned_officer || 'Administración Central',
          role: 'Finanzas',
        },
        alert: {
          text: 'Sin bloqueos',
          type: 'clean',
        },
        priority: 'normal',
      };

    case 'rejected':
      return {
        action: 'Archivar expediente',
        timing: 'Cerrado',
        color: 'text-rose-800 bg-rose-50 border border-rose-200/80',
        responsible: {
          name: app?.assigned_officer || 'Mesa de Crédito',
          role: 'Auditoría',
        },
        alert: {
          text: 'No elegible',
          type: 'neutral',
        },
        priority: 'normal',
      };

    case 'draft':
    default:
      return {
        action: 'Esperar cliente',
        timing: 'Borrador sin enviar',
        color: 'text-slate-700 bg-slate-100 border border-slate-200/80',
        responsible: {
          name: app?.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Solicitante',
          role: 'Titular',
        },
        alert: {
          text: 'Sin actividad 48 h',
          type: 'neutral',
        },
        priority: 'normal',
      };
  }
}

/**
 * Clasifica si un expediente pertenece a un grupo determinado
 */
export function matchesExpedientGroup(app: any, group: ExpedientGroup): boolean {
  const status = app?.status;
  switch (group) {
    case 'requires_action':
      // Próxima acción urgente / inmediata: recién ingresada, recaudos pendientes o peritaje pendiente
      return status === 'submitted' || status === 'info_review' || status === 'property_analysis';

    case 'in_progress':
      // Con gestión activa en análisis, comité o propuesta emitida
      return status === 'info_review' || status === 'property_analysis' || status === 'evaluation' || status === 'offer_available';

    case 'closing':
      // En firma, formalización o etapa inmediatamente previa a cierre
      return status === 'formalization';

    case 'finished':
      // Estados terminales reales
      return status === 'approved' || status === 'rejected' || status === 'funded' || status === 'cancelled';

    case 'all':
    default:
      return true;
  }
}

/**
 * Obtiene el conteo exacto por grupo para un dataset de expedientes
 */
export function calculateExpedientGroupCounts(applications: any[]): Record<ExpedientGroup, number> {
  return {
    all: applications.length,
    requires_action: applications.filter((app) => matchesExpedientGroup(app, 'requires_action')).length,
    in_progress: applications.filter((app) => matchesExpedientGroup(app, 'in_progress')).length,
    closing: applications.filter((app) => matchesExpedientGroup(app, 'closing')).length,
    finished: applications.filter((app) => matchesExpedientGroup(app, 'finished')).length,
  };
}

/**
 * Determina si un expediente coincide con el filtro de alertas
 */
export function matchesAlertFilter(app: any, filter: AlertFilter): boolean {
  if (filter === 'all') return true;
  const info = getExpedientActionInfo(app);

  if (filter === 'with_alerts') {
    return info.alert.type === 'critical' || info.alert.type === 'warning';
  }
  if (filter === 'no_activity') {
    return app.status === 'draft' || info.alert.text.toLowerCase().includes('sin actividad');
  }
  if (filter === 'waiting_client') {
    return app.status === 'draft' || app.status === 'offer_available' || info.action.toLowerCase().includes('cliente');
  }
  if (filter === 'no_blocks') {
    return info.alert.type === 'clean' || (!info.alert.text.includes('pendiente') && !info.alert.text.includes('No elegible'));
  }
  return true;
}
