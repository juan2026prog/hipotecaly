// ==============================================================================
// HIPOTECALY: CRM, Operational Tasks & Activity Timeline Service
// ==============================================================================

export type PipelineStage =
  | 'lead'
  | 'contacted'
  | 'prequalified'
  | 'docs_pending'
  | 'underwriting'
  | 'marketplace'
  | 'offer_accepted'
  | 'closing'
  | 'disbursed'
  | 'rejected'
  | 'stalled';

export interface CrmLead {
  id: string;
  tenantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  requestedAmountUsd: number;
  propertyEstimatedValueUsd: number;
  propertyDepartment: string;
  stage: PipelineStage;
  assignedAdvisorId?: string;
  assignedAdvisorName?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  caseId?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface OperationalTask {
  id: string;
  tenantId: string;
  caseId?: string;
  leadId?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeRole: 'analyst' | 'underwriter' | 'notary' | 'admin';
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ActivityTimelineItem {
  id: string;
  tenantId: string;
  caseId?: string;
  leadId?: string;
  actorType: 'system' | 'ai_agent' | 'user';
  actorName: string;
  action: string;
  details?: string;
  timestamp: string;
}

// ------------------------------------------------------------------------------
// ALMACÉN REACTIVO / EN MEMORIA CON AISLAMIENTO TENANT
// ------------------------------------------------------------------------------

export class CrmService {
  private static leads: CrmLead[] = [];
  private static tasks: OperationalTask[] = [];
  private static timeline: ActivityTimelineItem[] = [];

  /**
   * Registra un nuevo lead o solicitud en el pipeline comercial
   */
  public static createLead(
    lead: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { initialNote?: string }
  ): CrmLead {
    const newLead: CrmLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: lead.tenantId,
      applicantName: lead.applicantName,
      applicantEmail: lead.applicantEmail,
      applicantPhone: lead.applicantPhone,
      requestedAmountUsd: lead.requestedAmountUsd,
      propertyEstimatedValueUsd: lead.propertyEstimatedValueUsd,
      propertyDepartment: lead.propertyDepartment,
      stage: lead.stage || 'lead',
      assignedAdvisorId: lead.assignedAdvisorId,
      assignedAdvisorName: lead.assignedAdvisorName,
      notes: lead.initialNote ? [lead.initialNote] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caseId: lead.caseId,
    };

    this.leads.unshift(newLead);

    // Registrar en el timeline de actividad
    this.recordActivity({
      tenantId: lead.tenantId,
      leadId: newLead.id,
      caseId: lead.caseId,
      actorType: 'system',
      actorName: 'Motor de Originación',
      action: 'LEAD_REGISTERED',
      details: `Lead creado para ${lead.applicantName} por USD ${lead.requestedAmountUsd.toLocaleString('es-UY')}.`,
    });

    return newLead;
  }

  /**
   * Actualiza la etapa del pipeline comercial de un lead
   */
  public static updateLeadStage(
    tenantId: string,
    leadId: string,
    newStage: PipelineStage,
    actorName = 'Asesor Comercial'
  ): CrmLead | null {
    const lead = this.leads.find((l) => l.tenantId === tenantId && l.id === leadId);
    if (!lead) return null;

    const oldStage = lead.stage;
    lead.stage = newStage;
    lead.updatedAt = new Date().toISOString();

    this.recordActivity({
      tenantId,
      leadId,
      caseId: lead.caseId,
      actorType: 'user',
      actorName,
      action: 'PIPELINE_STAGE_CHANGED',
      details: `Etapa modificada de "${oldStage}" a "${newStage}".`,
    });

    return lead;
  }

  /**
   * Obtiene todos los leads de un tenant, con filtro opcional por etapa
   */
  public static getLeads(tenantId: string, stage?: PipelineStage): CrmLead[] {
    return this.leads.filter((l) => {
      if (l.tenantId !== tenantId) return false;
      if (stage && l.stage !== stage) return false;
      return true;
    });
  }

  /**
   * Crea una nueva tarea operativa asignada al equipo
   */
  public static createTask(
    task: Omit<OperationalTask, 'id' | 'createdAt' | 'status'>
  ): OperationalTask {
    const newTask: OperationalTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: task.tenantId,
      caseId: task.caseId,
      leadId: task.leadId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'todo',
      assigneeRole: task.assigneeRole,
      assigneeName: task.assigneeName,
      dueDate: task.dueDate,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(newTask);

    this.recordActivity({
      tenantId: task.tenantId,
      caseId: task.caseId,
      leadId: task.leadId,
      actorType: 'system',
      actorName: 'Gestor de Tareas Operativas',
      action: 'TASK_CREATED',
      details: `Tarea asignada a rol ${task.assigneeRole}: "${task.title}".`,
    });

    return newTask;
  }

  /**
   * Actualiza el estado de una tarea (todo -> in_progress -> completed)
   */
  public static updateTaskStatus(
    tenantId: string,
    taskId: string,
    status: TaskStatus,
    actorName = 'Operador'
  ): OperationalTask | null {
    const task = this.tasks.find((t) => t.tenantId === tenantId && t.id === taskId);
    if (!task) return null;

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
    }

    this.recordActivity({
      tenantId,
      caseId: task.caseId,
      leadId: task.leadId,
      actorType: 'user',
      actorName,
      action: 'TASK_STATUS_UPDATED',
      details: `Tarea "${task.title}" marcada como ${status}.`,
    });

    return task;
  }

  /**
   * Obtiene las tareas operativas de un tenant
   */
  public static getTasks(tenantId: string, filter?: { status?: TaskStatus; caseId?: string }): OperationalTask[] {
    return this.tasks.filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.caseId && t.caseId !== filter.caseId) return false;
      return true;
    });
  }

  /**
   * Registra un evento en la bitácora de actividad cronológica
   */
  public static recordActivity(
    item: Omit<ActivityTimelineItem, 'id' | 'timestamp'>
  ): ActivityTimelineItem {
    const entry: ActivityTimelineItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: item.tenantId,
      caseId: item.caseId,
      leadId: item.leadId,
      actorType: item.actorType,
      actorName: item.actorName,
      action: item.action,
      details: item.details,
      timestamp: new Date().toISOString(),
    };

    this.timeline.unshift(entry);
    return entry;
  }

  /**
   * Obtiene la cronología de actividad para un expediente o tenant
   */
  public static getTimeline(tenantId: string, caseId?: string): ActivityTimelineItem[] {
    return this.timeline.filter((item) => {
      if (item.tenantId !== tenantId) return false;
      if (caseId && item.caseId !== caseId) return false;
      return true;
    });
  }

  /**
   * Resetea el almacén en memoria para pruebas
   */
  public static resetStore(): void {
    this.leads = [];
    this.tasks = [];
    this.timeline = [];
  }
}
