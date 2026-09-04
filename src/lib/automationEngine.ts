// ==============================================================================
// HIPOTECALY: Automation Engine (Triggers de Eventos, Acciones y Notificaciones)
// ==============================================================================

export type AutomationTriggerEvent =
  | 'application.created'
  | 'document.uploaded'
  | 'document.missing'
  | 'offer.created'
  | 'offer.accepted'
  | 'underwriting.ready'
  | 'case.stalled';

export type AutomationActionType =
  | 'send_notification'
  | 'send_email_alert'
  | 'create_operational_task'
  | 'suggest_status_transition';

export interface AutomationRule {
  id: string;
  name: string;
  event: AutomationTriggerEvent;
  enabled: boolean;
  tenantId?: string; // Si es undefined, aplica globalmente
  conditions?: {
    minLtv?: number;
    maxLtv?: number;
    documentType?: string;
    inactivityHours?: number;
    userRole?: string;
  };
  actions: {
    type: AutomationActionType;
    templateTitle: string;
    templateBody: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    targetRoles?: Array<'borrower' | 'lender' | 'analyst' | 'admin'>;
    suggestedStatus?: string;
  }[];
}

export interface InAppNotification {
  id: string;
  tenantId: string;
  recipientRole: 'borrower' | 'lender' | 'analyst' | 'admin';
  recipientId?: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  relatedCaseId?: string;
  actionUrl?: string;
}

export interface AutomationExecutionLog {
  id: string;
  timestamp: string;
  event: AutomationTriggerEvent;
  tenantId: string;
  caseId?: string;
  matchedRules: string[];
  executedActionsCount: number;
  payloadSummary: string;
}

// ------------------------------------------------------------------------------
// REGLAS PREDEFINIDAS DEL SISTEMA DE AUTOMATIZACIÓN
// ------------------------------------------------------------------------------

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_app_created',
    name: 'Nueva Solicitud: Notificar Analista y Crear Tarea de Triage',
    event: 'application.created',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: 'Nueva solicitud ingresada: {{caseId}}',
        templateBody: 'El solicitante {{applicantName}} ha enviado un nuevo expediente para revisión.',
        priority: 'normal',
        targetRoles: ['analyst', 'admin'],
      },
      {
        type: 'create_operational_task',
        templateTitle: 'Revisión preliminar y triage de documentos ({{caseId}})',
        templateBody: 'Verificar datos de contacto, cédula de identidad y consistencia del inmueble declarado.',
        priority: 'high',
        targetRoles: ['analyst'],
      },
    ],
  },
  {
    id: 'rule_doc_uploaded',
    name: 'Documento Subido: Aviso al Analista',
    event: 'document.uploaded',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: 'Nuevo documento cargado en {{caseId}}',
        templateBody: 'Se ha adjuntado el documento {{documentName}} al legajo.',
        priority: 'normal',
        targetRoles: ['analyst'],
      },
    ],
  },
  {
    id: 'rule_doc_missing',
    name: 'Documento Faltante: Recordatorio al Solicitante',
    event: 'document.missing',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: 'Documentación requerida para tu préstamo',
        templateBody: 'Para continuar la evaluación de tu solicitud, por favor sube: {{missingDocName}}.',
        priority: 'urgent',
        targetRoles: ['borrower'],
      },
    ],
  },
  {
    id: 'rule_offer_created',
    name: 'Oferta Emitida: Notificar Solicitante y Analista',
    event: 'offer.created',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: '¡Nueva oferta de financiamiento recibida!',
        templateBody: 'Un inversor ha presentado una oferta de financiamiento para tu solicitud {{caseId}}.',
        priority: 'high',
        targetRoles: ['borrower'],
      },
      {
        type: 'send_notification',
        templateTitle: 'Oferta registrada en expediente {{caseId}}',
        templateBody: 'Se registró una postura financiera por USD {{offerAmount}} al {{interestRate}}%.',
        priority: 'normal',
        targetRoles: ['analyst'],
      },
    ],
  },
  {
    id: 'rule_offer_accepted',
    name: 'Oferta Aceptada: Apertura Notarial y Notificación al Prestamista',
    event: 'offer.accepted',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: '¡Oferta aceptada por el solicitante en {{caseId}}!',
        templateBody: 'El prestatario ha aceptado tu oferta. Se desbloquea la coordinación formal y apertura notarial.',
        priority: 'urgent',
        targetRoles: ['lender'],
      },
      {
        type: 'create_operational_task',
        templateTitle: 'Coordinación Notarial y Escrituración ({{caseId}})',
        templateBody: 'Contactar a las partes, solicitar certificados registrales e instruir al escribano interviniente.',
        priority: 'urgent',
        targetRoles: ['analyst', 'admin'],
      },
      {
        type: 'suggest_status_transition',
        templateTitle: 'Transición a Coordinación Notarial',
        templateBody: 'Avanzar el estado del expediente de "Ofertas" a "Coordinación Notarial / Liquidación".',
        suggestedStatus: 'coordinacion_notarial',
      },
    ],
  },
  {
    id: 'rule_underwriting_ready',
    name: 'Evaluación AI / Riesgo Lista: Sugerir Pase a Marketplace',
    event: 'underwriting.ready',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: 'Evaluación de riesgo completada: {{caseId}}',
        templateBody: 'El análisis de coherencia y tasación asistida ha finalizado con resultado: {{riskStatus}}.',
        priority: 'normal',
        targetRoles: ['analyst'],
      },
      {
        type: 'suggest_status_transition',
        templateTitle: 'Pase a Marketplace de Oportunidades',
        templateBody: 'El expediente cumple las políticas crediticias para ser visible a prestamistas verificados.',
        suggestedStatus: 'marketplace_activo',
      },
    ],
  },
  {
    id: 'rule_case_stalled',
    name: 'Expediente Estancado: Alerta por Inactividad > 7 Días',
    event: 'case.stalled',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        templateTitle: 'Alerta de estancamiento en expediente {{caseId}}',
        templateBody: 'El expediente no ha registrado avances ni actividad en más de 7 días corridos.',
        priority: 'high',
        targetRoles: ['analyst', 'admin'],
      },
      {
        type: 'create_operational_task',
        templateTitle: 'Reactivación o archivo de expediente estancado ({{caseId}})',
        templateBody: 'Llamar al cliente o prestamista para verificar interés o proceder con el cierre administrativo.',
        priority: 'normal',
        targetRoles: ['analyst'],
      },
    ],
  },
];

// ------------------------------------------------------------------------------
// ALMACÉN Y MOTOR DE EJECUCIÓN EN MEMORIA (REACTIVO / LOCAL)
// ------------------------------------------------------------------------------

export class AutomationEngine {
  private static notificationsStore: InAppNotification[] = [];
  private static executionLogs: AutomationExecutionLog[] = [];
  private static customRules: Map<string, AutomationRule[]> = new Map();

  /**
   * Dispara un evento del ciclo de vida y ejecuta las reglas aplicables de forma síncrona/reactiva
   */
  public static async dispatchEvent(
    event: AutomationTriggerEvent,
    context: {
      tenantId: string;
      caseId?: string;
      applicantName?: string;
      documentName?: string;
      missingDocName?: string;
      offerAmount?: number;
      interestRate?: number;
      riskStatus?: string;
      [key: string]: any;
    }
  ): Promise<{
    matchedRules: number;
    notificationsCreated: number;
    suggestedStatus?: string;
  }> {
    const tenantRules = this.customRules.get(context.tenantId) || DEFAULT_AUTOMATION_RULES;
    const applicableRules = tenantRules.filter((r) => r.enabled && r.event === event);

    let notificationsCreated = 0;
    let suggestedStatus: string | undefined = undefined;
    const matchedRuleNames: string[] = [];

    for (const rule of applicableRules) {
      matchedRuleNames.push(rule.id);

      for (const action of rule.actions) {
        // Renderizar templates reemplazando tags
        const renderText = (str: string) => {
          return str
            .replace(/\{\{caseId\}\}/g, context.caseId || 'SOL-000')
            .replace(/\{\{applicantName\}\}/g, context.applicantName || 'Solicitante')
            .replace(/\{\{documentName\}\}/g, context.documentName || 'Documento')
            .replace(/\{\{missingDocName\}\}/g, context.missingDocName || 'Recaudo')
            .replace(/\{\{offerAmount\}\}/g, context.offerAmount ? context.offerAmount.toLocaleString('es-UY') : '0')
            .replace(/\{\{interestRate\}\}/g, context.interestRate ? `${context.interestRate}` : '12')
            .replace(/\{\{riskStatus\}\}/g, context.riskStatus || 'Aprobado');
        };

        if (action.type === 'send_notification') {
          const roles = action.targetRoles || ['analyst'];
          for (const role of roles) {
            const notif: InAppNotification = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              tenantId: context.tenantId,
              recipientRole: role,
              title: renderText(action.templateTitle),
              message: renderText(action.templateBody),
              priority: action.priority || 'normal',
              read: false,
              createdAt: new Date().toISOString(),
              relatedCaseId: context.caseId,
              actionUrl: context.caseId ? `/admin/cases/${context.caseId}` : undefined,
            };
            this.notificationsStore.unshift(notif);
            notificationsCreated++;
          }
        }

        if (action.type === 'suggest_status_transition') {
          suggestedStatus = action.suggestedStatus;
        }
      }
    }

    // Registrar log forense de la automatización
    this.executionLogs.unshift({
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      event,
      tenantId: context.tenantId,
      caseId: context.caseId,
      matchedRules: matchedRuleNames,
      executedActionsCount: notificationsCreated,
      payloadSummary: JSON.stringify({
        caseId: context.caseId,
        applicant: context.applicantName,
        doc: context.documentName,
      }),
    });

    return {
      matchedRules: applicableRules.length,
      notificationsCreated,
      suggestedStatus,
    };
  }

  /**
   * Obtiene las notificaciones activas para un rol y tenant determinado
   */
  public static getNotifications(tenantId: string, role?: 'borrower' | 'lender' | 'analyst' | 'admin'): InAppNotification[] {
    return this.notificationsStore.filter((n) => {
      if (n.tenantId !== tenantId) return false;
      if (role && n.recipientRole !== role) return false;
      return true;
    });
  }

  /**
   * Marca una notificación como leída
   */
  public static markAsRead(notificationId: string): boolean {
    const notif = this.notificationsStore.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  /**
   * Retorna los logs de ejecución del motor para inspección forense y tests
   */
  public static getExecutionLogs(tenantId?: string): AutomationExecutionLog[] {
    if (!tenantId) return [...this.executionLogs];
    return this.executionLogs.filter((l) => l.tenantId === tenantId);
  }

  /**
   * Limpia almacén en memoria para pruebas
   */
  public static resetStore(): void {
    this.notificationsStore = [];
    this.executionLogs = [];
    this.customRules.clear();
  }
}
