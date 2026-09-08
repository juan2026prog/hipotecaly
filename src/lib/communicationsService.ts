// ==============================================================================
// HIPOTECALY: Servicio de Comunicaciones Operativas & Biblioteca de Plantillas
// ==============================================================================

import { logAuditEvent } from './auditService';

export type CommunicationChannel = 'email' | 'whatsapp' | 'sms' | 'push';

export interface CommunicationTemplate {
  id: string;
  code: string;
  name: string;
  event: string;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  available_variables: string[];
  is_active: boolean;
  version: number;
}

export interface CommunicationLog {
  id: string;
  application_id: string;
  channel: CommunicationChannel;
  recipient: string;
  event_name: string;
  template_code: string;
  template_version: number;
  subject?: string;
  message_content: string;
  status: 'delivered' | 'sent' | 'failed' | 'pending';
  delivery_type: 'AUTOMÁTICA' | 'MANUAL';
  sent_by_user?: string;
  error_message?: string;
  created_at: string;
}

// 12 Plantillas Estándar del Tenant
const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tpl-comm-1',
    code: 'solicitud_recibida',
    name: '1. Solicitud Recibida',
    event: 'Solicitud Recibida',
    channel: 'email',
    subject: 'Tu solicitud {{expediente.id}} ha sido recibida correctamente',
    body: 'Hola {{cliente.nombre}}, confirmamos que recibimos tu solicitud de crédito hipotecario por USD {{expediente.monto}} para el inmueble en {{propiedad.direccion}}. Nuestro equipo se pondrá en contacto contigo a la brevedad.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{expediente.monto}}', '{{propiedad.direccion}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-2',
    code: 'doc_faltante',
    name: '2. Documentación Faltante',
    event: 'Documentación Faltante',
    channel: 'email',
    subject: 'Recaudos pendientes para tu expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, te recordamos que tenemos pendiente la entrega de tu documentación de ingresos antes del {{fecha_limite}} para avanzar en la evaluación de tu crédito.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{fecha_limite}}', '{{responsable.nombre}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-3',
    code: 'doc_observado',
    name: '3. Documento Observado',
    event: 'Documento Observado',
    channel: 'email',
    subject: 'Observación documental en expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, el equipo de escribanía ha detectado una observación en el documento adjunto. Por favor ingresa a tu portal para revisar las correcciones solicitadas.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{responsable.nombre}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-4',
    code: 'doc_aprobado',
    name: '4. Documento Aprobado',
    event: 'Documento Aprobado',
    channel: 'email',
    subject: 'Documentación aprobada para expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, tu documentación ha sido validada y aprobada con éxito. Tu expediente avanza a la etapa técnica.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-5',
    code: 'tasacion_pendiente',
    name: '5. Tasación Asignada',
    event: 'Tasación Asignada',
    channel: 'email',
    subject: 'Perito asignado para la garantía en {{propiedad.direccion}}',
    body: 'Hola {{cliente.nombre}}, se ha asignado un perito tasador oficial para inspeccionar el inmueble en {{propiedad.direccion}}.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{propiedad.direccion}}', '{{responsable.nombre}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-6',
    code: 'tasacion_finalizada',
    name: '6. Tasación Finalizada',
    event: 'Tasación Finalizada',
    channel: 'email',
    subject: 'Tasación completada — Expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, el informe de tasación para {{propiedad.direccion}} fue finalizado conforme y cargado en el expediente.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{propiedad.direccion}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-7',
    code: 'propuesta_disponible',
    name: '7. Propuesta Disponible',
    event: 'Propuesta de Financiación Disponible',
    channel: 'whatsapp',
    body: '¡Buenas noticias {{cliente.nombre}}! La propuesta de crédito hipotecario para tu solicitud {{expediente.id}} está lista para ser revisada en tu portal.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{expediente.monto}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-8',
    code: 'kyc_pendiente',
    name: '8. Verificación de Identidad Requerida',
    event: 'KYC Pendiente',
    channel: 'email',
    subject: 'Completa la validación biométrica de tu cédula',
    body: 'Hola {{cliente.nombre}}, por favor realiza la verificación de identidad biométrica para habilitar la formalización de tu crédito {{expediente.id}}.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-9',
    code: 'firma_por_coordinar',
    name: '9. Firma Notarial por Coordinar',
    event: 'Firma por Coordinar',
    channel: 'email',
    subject: 'Coordinación de firma notarial para expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, la minuta hipotecaria está redactada. El escribano {{responsable.nombre}} se contactará para coordinar la firma.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{responsable.nombre}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-10',
    code: 'firma_agendada',
    name: '10. Firma Agendada',
    event: 'Firma Agendada',
    channel: 'whatsapp',
    body: 'Hola {{cliente.nombre}}, te confirmamos la fecha de firma notarial para el {{fecha_limite}} con el escribano {{responsable.nombre}}.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{fecha_limite}}', '{{responsable.nombre}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-11',
    code: 'recordatorio',
    name: '11. Recordatorio Operativo',
    event: 'Recordatorio',
    channel: 'sms',
    body: 'Recordatorio {{cliente.nombre}}: Tienes un trámite pendiente en tu solicitud {{expediente.id}}. Vence: {{fecha_limite}}.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{fecha_limite}}'],
    is_active: true,
    version: 1,
  },
  {
    id: 'tpl-comm-12',
    code: 'solicitud_finalizada',
    name: '12. Solicitud Finalizada y Desembolso',
    event: 'Solicitud Finalizada',
    channel: 'email',
    subject: '¡Operación finalizada con éxito! Expediente {{expediente.id}}',
    body: 'Hola {{cliente.nombre}}, te felicitamos. Tu crédito hipotecario {{expediente.id}} por USD {{expediente.monto}} ha concluido su ciclo de desembolso.',
    available_variables: ['{{cliente.nombre}}', '{{expediente.id}}', '{{expediente.monto}}'],
    is_active: true,
    version: 1,
  },
];

// Historial en memoria por expediente
const DEMO_APPLICATION_COMMUNICATIONS: Record<string, CommunicationLog[]> = {
  'e0000000-0000-0000-0000-000000000001': [
    {
      id: 'comm-1',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      channel: 'email',
      recipient: 'maria.lopez@ejemplo.com',
      event_name: 'Solicitud Recibida',
      template_code: 'solicitud_recibida',
      template_version: 1,
      subject: 'Tu solicitud HIP-DEMO-00124 ha sido recibida correctamente',
      message_content: 'Hola María López, confirmamos que recibimos tu solicitud de crédito hipotecario por USD 80.000 para el inmueble en Carrasco, Montevideo.',
      status: 'delivered',
      delivery_type: 'AUTOMÁTICA',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'comm-2',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      channel: 'email',
      recipient: 'maria.lopez@ejemplo.com',
      event_name: 'Documentación Faltante',
      template_code: 'doc_faltante',
      template_version: 1,
      subject: 'Recaudos pendientes para tu expediente HIP-DEMO-00124',
      message_content: 'Hola María López, te recordamos que tenemos pendiente la entrega de tu recibo de sueldo de Globant Uruguay antes de mañana.',
      status: 'delivered',
      delivery_type: 'AUTOMÁTICA',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'comm-3',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      channel: 'whatsapp',
      recipient: '099 234 567',
      event_name: 'Mensaje Personalizado de Mesa de Crédito',
      template_code: 'manual_dispatch',
      template_version: 1,
      message_content: 'Estimada María, recibimos tu recibo de sueldo conforme. Tu expediente ya se encuentra en evaluación técnica.',
      status: 'delivered',
      delivery_type: 'MANUAL',
      sent_by_user: 'Valeria Rivas (Analista)',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
};

/**
 * Obtiene las plantillas de comunicación configuradas
 */
export function getCommunicationTemplates(): CommunicationTemplate[] {
  return DEFAULT_COMMUNICATION_TEMPLATES;
}

/**
 * Valida si un texto contiene variables no soportadas
 */
export function validateTemplateVariables(text: string, allowedVariables: string[]): {
  valid: boolean;
  unrecognizedVariables: string[];
} {
  const matches = text.match(/{{[a-zA-Z0-9_.]+}}/g) || [];
  const unrecognized = matches.filter((m) => !allowedVariables.includes(m));
  return {
    valid: unrecognized.length === 0,
    unrecognizedVariables: unrecognized,
  };
}

/**
 * Obtiene el historial de comunicaciones de un expediente
 */
export function getApplicationCommunications(applicationId: string): CommunicationLog[] {
  return DEMO_APPLICATION_COMMUNICATIONS[applicationId] || [
    {
      id: `comm-${Date.now()}`,
      application_id: applicationId,
      channel: 'email',
      recipient: 'cliente@ejemplo.com',
      event_name: 'Solicitud Recibida',
      template_code: 'solicitud_recibida',
      template_version: 1,
      subject: 'Solicitud recibida',
      message_content: 'Confirmación inicial enviada al cliente.',
      status: 'delivered',
      delivery_type: 'AUTOMÁTICA',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];
}

/**
 * Registra y envía una comunicación (automática o manual)
 */
export async function sendApplicationCommunication(params: {
  applicationId: string;
  channel: CommunicationChannel;
  recipient: string;
  eventName?: string;
  templateCode?: string;
  subject?: string;
  messageContent?: string;
  deliveryType: 'AUTOMÁTICA' | 'MANUAL';
  sentByUser?: string;
  userName?: string;
  organizationId?: string;
  variables?: Record<string, string>;
}): Promise<CommunicationLog> {
  const template = params.templateCode ? getCommunicationTemplates().find((t) => t.code === params.templateCode) : undefined;
  const eventName = params.eventName || template?.name || 'Notificación Operativa';
  
  let finalSubject = params.subject || template?.subject || 'Notificación Hipotecaly';
  let finalContent = params.messageContent || template?.body || 'Mensaje de notificación operativa.';

  if (params.variables) {
    Object.entries(params.variables).forEach(([k, v]) => {
      finalSubject = finalSubject.split(k).join(v);
      finalContent = finalContent.split(k).join(v);
    });
  }

  const user = params.userName || params.sentByUser || 'Sistema';

  const newComm: CommunicationLog = {
    id: `comm-${Date.now()}`,
    application_id: params.applicationId,
    channel: params.channel,
    recipient: params.recipient,
    event_name: eventName,
    template_code: params.templateCode || 'custom_message',
    template_version: template?.version || 1,
    subject: finalSubject,
    message_content: finalContent,
    status: 'delivered',
    delivery_type: params.deliveryType,
    sent_by_user: user,
    created_at: new Date().toISOString(),
  };

  const list = DEMO_APPLICATION_COMMUNICATIONS[params.applicationId] || [];
  list.unshift(newComm);
  DEMO_APPLICATION_COMMUNICATIONS[params.applicationId] = list;

  // Registrar en auditoría
  await logAuditEvent({
    organizationId: params.organizationId,
    userName: user,
    userRole: 'operator',
    action: `Envío de comunicación (${params.deliveryType})`,
    module: 'Comunicaciones',
    recordIdentifier: `${params.channel.toUpperCase()} — ${params.recipient}`,
    applicationId: params.applicationId,
    newValue: eventName,
  });

  return newComm;
}
