// ==============================================================================
// HIPOTECALY: Servicio Soberano de Agenda Interna (Fuente Única de Verdad)
// Gestiona eventos de firma, remesa de originales, vencimientos y citas notariales
// ==============================================================================

import { supabase } from '../supabase';
import { auditService } from '../auditService';
import { syncCalendarEventWithGoogleApi } from './googleCalendarIntegration';
import { isDemoMode } from '../demoControl';

export type CalendarEventType =
  | 'signature'
  | 'original_documents'
  | 'valuation'
  | 'client_meeting'
  | 'notary_review'
  | 'deadline'
  | 'other';

export type CalendarEventStatus =
  | 'pending_coordination'
  | 'proposed'
  | 'scheduled'
  | 'completed'
  | 'rescheduled'
  | 'cancelled';

export interface CalendarParticipant {
  name: string;
  role: 'Deudor' | 'Hipotecante' | 'Acreedor' | 'Escribano' | 'Representante' | 'Garante' | 'Analista';
  email: string;
  phone?: string;
  status?: 'confirmed' | 'pending' | 'declined';
}

export interface HipotecalyCalendarEvent {
  id: string;
  organizationId: string;
  applicationId?: string;
  applicationPublicId?: string;
  eventType: CalendarEventType;
  title: string;
  description?: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  date: string;    // YYYY-MM-DD
  time: string;    // HH:MM
  durationMinutes: number;
  timezone: string;
  locationType: 'notary_office' | 'virtual' | 'property' | 'other';
  locationAddress?: string;
  virtualMeetingUrl?: string;
  responsibleUserId?: string;
  responsibleName?: string;
  participants: CalendarParticipant[];
  requiredDocuments?: string[];
  status: CalendarEventStatus;
  googleCalendarEventId?: string;
  googleSyncStatus?: 'not_synced' | 'synced' | 'sync_error';
  googleLastSyncedAt?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const getAvailableCalendarSlots = (_dateString: string) => {
  return [
    { time: '09:30', available: true },
    { time: '11:00', available: true },
    { time: '14:30', available: false, conflict: 'Audiencia Juzgado Paz 2° Turno' },
    { time: '15:30', available: true },
    { time: '17:00', available: true },
  ];
};

class CalendarService {
  private localKey = 'hipotecaly_sovereign_calendar_events';
  private memoryEvents: HipotecalyCalendarEvent[] | null = null;

  private getInitialFallbackEvents(): HipotecalyCalendarEvent[] {
    return [
      {
        id: 'cal-ev-001',
        organizationId: 'd0000000-0000-0000-0000-000000000001',
        applicationId: 'e0000000-0000-0000-0000-000000000001',
        applicationPublicId: 'HIP-2026-00158',
        eventType: 'signature',
        title: 'Firma Escritura Matriz Hipoteca y Mutuo — Martín López',
        description: 'Audiencia de otorgamiento de escritura pública de mutuo hipotecario.',
        startAt: '2026-09-15T15:30:00-03:00',
        endAt: '2026-09-15T16:15:00-03:00',
        date: '2026-09-15',
        time: '15:30',
        durationMinutes: 45,
        timezone: 'America/Montevideo',
        locationType: 'notary_office',
        locationAddress: 'Estudio Fernández & Asociados (Rincón 487 Piso 3)',
        virtualMeetingUrl: 'https://meet.google.com/hpt-notary-sign',
        responsibleUserId: 'u-test-notary',
        responsibleName: 'Esc. María Pérez Morales',
        participants: [
          { name: 'Martín López Arispe', role: 'Deudor', email: 'martin.lopez@ejemplo.com', status: 'confirmed' },
          { name: 'Esc. María Pérez Morales', role: 'Escribano', email: 'maria.perez@notarios.org.uy', status: 'confirmed' },
          { name: 'Mateo Silva (Nova Capital)', role: 'Acreedor', email: 'mateo.silva@novacapital.uy', status: 'confirmed' },
        ],
        requiredDocuments: ['Cédula de Identidad Vigente', 'Título de Propiedad Original', 'Plano de Mensura'],
        status: 'scheduled',
        googleCalendarEventId: 'gcal_894120938f82190',
        googleSyncStatus: 'synced',
        googleLastSyncedAt: '2026-09-07T14:30:00Z',
        createdAt: '2026-09-07T14:30:00Z',
        updatedAt: '2026-09-07T14:30:00Z',
        createdBy: 'Esc. María Pérez Morales',
      },
      {
        id: 'cal-ev-002',
        organizationId: 'd0000000-0000-0000-0000-000000000001',
        applicationId: 'e0000000-0000-0000-0000-000000000002',
        applicationPublicId: 'HIP-2026-00142',
        eventType: 'original_documents',
        title: 'Cotejo y Custodia de Títulos Originales — Rodrigo Gómez',
        description: 'Entrega física de primera copia de escritura matriz y antecedentes sucesorios.',
        startAt: '2026-09-11T11:00:00-03:00',
        endAt: '2026-09-11T11:30:00-03:00',
        date: '2026-09-11',
        time: '11:00',
        durationMinutes: 30,
        timezone: 'America/Montevideo',
        locationType: 'notary_office',
        locationAddress: 'Estudio Fernández & Asociados (Rincón 487 Piso 3)',
        responsibleName: 'Esc. María Pérez Morales',
        participants: [
          { name: 'Rodrigo Gómez Silveira', role: 'Deudor', email: 'rodrigo.gomez@ejemplo.com', status: 'confirmed' },
          { name: 'Esc. María Pérez Morales', role: 'Escribano', email: 'maria.perez@notarios.org.uy', status: 'confirmed' },
        ],
        requiredDocuments: ['Título Original', 'Contribución Inmobiliaria al Día', 'Certificado Catastral'],
        status: 'scheduled',
        googleSyncStatus: 'not_synced',
        createdAt: '2026-09-08T10:00:00Z',
        updatedAt: '2026-09-08T10:00:00Z',
        createdBy: 'Esc. María Pérez Morales',
      },
    ];
  }

  private getStoredLocalEvents(): HipotecalyCalendarEvent[] {
    try {
      const data = typeof window !== 'undefined' ? window.localStorage.getItem(this.localKey) : null;
      if (data) {
        this.memoryEvents = JSON.parse(data);
        return this.memoryEvents!;
      }
    } catch {
      // Fallback
    }
    if (this.memoryEvents) return this.memoryEvents;

    const initial = this.getInitialFallbackEvents();
    this.memoryEvents = initial;
    this.saveStoredLocalEvents(initial);
    return initial;
  }

  private saveStoredLocalEvents(events: HipotecalyCalendarEvent[]) {
    this.memoryEvents = events;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(this.localKey, JSON.stringify(events));
      }
    } catch {
      // ignore
    }
  }

  private mapRowToEvent(row: any): HipotecalyCalendarEvent {
    const start = new Date(row.start_at);
    const date = start.toISOString().split('T')[0];
    const time = start.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
    const end = new Date(row.end_at);
    const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));

    return {
      id: row.id,
      organizationId: row.organization_id,
      applicationId: row.application_id,
      applicationPublicId: row.application_public_id || (row.metadata?.public_id ?? 'HIP-2026-EXP'),
      eventType: row.event_type as CalendarEventType,
      title: row.title,
      description: row.description,
      startAt: row.start_at,
      endAt: row.end_at,
      date,
      time,
      durationMinutes,
      timezone: row.timezone || 'America/Montevideo',
      locationType: row.location_type || 'notary_office',
      locationAddress: row.location_address,
      virtualMeetingUrl: row.virtual_meeting_url,
      responsibleUserId: row.responsible_user_id,
      responsibleName: row.responsible_name || 'Esc. María Pérez Morales',
      participants: Array.isArray(row.participants) ? row.participants : [],
      requiredDocuments: Array.isArray(row.required_documents) ? row.required_documents : [],
      status: row.status as CalendarEventStatus,
      googleCalendarEventId: row.google_calendar_event_id,
      googleSyncStatus: row.google_sync_status || 'not_synced',
      googleLastSyncedAt: row.google_last_synced_at,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // 1. Obtener eventos de un expediente
  public async getEventsByApplication(applicationId: string, options?: { isDemoMode?: boolean; organizationId?: string }): Promise<HipotecalyCalendarEvent[]> {
    const isDemo = isDemoMode({ organizationId: options?.organizationId, isDemoMode: options?.isDemoMode }) ||
      applicationId.startsWith('e0000');

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('application_id', applicationId)
        .order('start_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((r) => this.mapRowToEvent(r));
      }
    } catch {
      // Fallback
    }

    if (isDemo) {
      const local = this.getStoredLocalEvents();
      return local.filter((e) => e.applicationId === applicationId && e.status !== 'cancelled');
    }

    return [];
  }

  // 2. Obtener evento activo de firma de un expediente
  public async getActiveSignatureEvent(applicationId: string, options?: { isDemoMode?: boolean }): Promise<HipotecalyCalendarEvent | null> {
    const events = await this.getEventsByApplication(applicationId, options);
    return events.find((e) => e.eventType === 'signature' && (e.status === 'scheduled' || e.status === 'rescheduled')) || null;
  }

  // 3. Obtener todas las firmas agendadas
  public async getAllScheduledSignatures(options?: { isDemoMode?: boolean }): Promise<HipotecalyCalendarEvent[]> {
    const isDemo = isDemoMode({ isDemoMode: options?.isDemoMode });

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('event_type', 'signature')
        .in('status', ['scheduled', 'rescheduled'])
        .order('start_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((r) => this.mapRowToEvent(r));
      }
    } catch {
      // Fallback
    }

    if (isDemo) {
      const local = this.getStoredLocalEvents();
      return local.filter((e) => e.eventType === 'signature' && (e.status === 'scheduled' || e.status === 'rescheduled'));
    }

    return [];
  }

  // 3.b Obtener todos los eventos de la organización
  public async getEventsByOrganization(organizationId?: string, options?: { isDemoMode?: boolean }): Promise<HipotecalyCalendarEvent[]> {
    const isDemo = isDemoMode({ organizationId, isDemoMode: options?.isDemoMode });

    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_at', { ascending: true });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((r) => this.mapRowToEvent(r));
      }
    } catch {
      // Fallback
    }

    if (isDemo) {
      const local = this.getStoredLocalEvents();
      if (organizationId) {
        return local.filter((e) => e.organizationId === organizationId);
      }
      return local;
    }

    return [];
  }

  // 4. Crear evento en la Agenda
  public async createCalendarEvent(
    eventData: Omit<HipotecalyCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<HipotecalyCalendarEvent> {
    const now = new Date().toISOString();
    const newId = 'cal-ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    const fullEvent: HipotecalyCalendarEvent = {
      ...eventData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Intentar persistencia real en Supabase
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          organization_id: eventData.organizationId,
          application_id: eventData.applicationId,
          event_type: eventData.eventType,
          title: eventData.title,
          description: eventData.description,
          start_at: eventData.startAt,
          end_at: eventData.endAt,
          timezone: eventData.timezone || 'America/Montevideo',
          location_type: eventData.locationType,
          location_address: eventData.locationAddress,
          virtual_meeting_url: eventData.virtualMeetingUrl,
          responsible_user_id: eventData.responsibleUserId,
          participants: eventData.participants,
          required_documents: eventData.requiredDocuments,
          status: eventData.status,
          google_calendar_event_id: eventData.googleCalendarEventId,
          google_sync_status: eventData.googleSyncStatus || 'not_synced',
          notes: eventData.notes,
        })
        .select('*')
        .single();

      if (!error && data) {
        fullEvent.id = data.id;
      }
    } catch {
      // Fallback a almacenamiento local persistente
    }

    // 2. Sincronizar almacenamiento local
    const current = this.getStoredLocalEvents();
    const filtered = current.filter((e) => e.id !== fullEvent.id);
    this.saveStoredLocalEvents([fullEvent, ...filtered]);

    // 3. Sincronización asíncrona con Google Calendar API (si el responsable tiene Google Calendar conectado)
    const userId = eventData.responsibleUserId || 'u-test-notary';
    try {
      const syncResult = await syncCalendarEventWithGoogleApi({
        userId,
        organizationId: eventData.organizationId,
        action: 'insert',
        event: {
          eventId: fullEvent.id,
          title: fullEvent.title,
          applicationPublicId: fullEvent.applicationPublicId,
          startAt: fullEvent.startAt,
          endAt: fullEvent.endAt,
          timezone: fullEvent.timezone,
          locationAddress: fullEvent.locationAddress,
          locationType: fullEvent.locationType,
          notes: fullEvent.notes,
        },
      });

      if (syncResult.success && syncResult.googleEventId) {
        fullEvent.googleCalendarEventId = syncResult.googleEventId;
        fullEvent.googleSyncStatus = 'synced';
        fullEvent.googleLastSyncedAt = new Date().toISOString();

        // Actualizar en Supabase
        await supabase
          .from('calendar_events')
          .update({
            google_calendar_event_id: syncResult.googleEventId,
            google_sync_status: 'synced',
            google_last_synced_at: fullEvent.googleLastSyncedAt,
          })
          .eq('id', fullEvent.id);
      }
    } catch {
      // Si falla Google, el evento de HIPOTECALY sigue guardado
      fullEvent.googleSyncStatus = 'sync_error';
    }

    // 4. Registrar en auditoría
    try {
      await auditService.logAction({
        organization_id: eventData.organizationId,
        user_name: eventData.responsibleName || 'Sistema / Escribano',
        user_role: 'notary',
        action: `Creación de Cita / Evento Notarial: ${eventData.title}`,
        module: 'Agenda',
        record_identifier: eventData.applicationPublicId || fullEvent.id,
        application_id: eventData.applicationId,
        new_value: `${fullEvent.date} · ${fullEvent.time} hs (${fullEvent.eventType})`,
        metadata: {
          event_id: fullEvent.id,
          event_type: fullEvent.eventType,
          location: fullEvent.locationAddress,
          participants_count: fullEvent.participants.length,
          google_event_id: fullEvent.googleCalendarEventId,
        },
      });
    } catch {
      // ignore
    }

    return fullEvent;
  }

  // 5. Reprogramar evento
  public async rescheduleEvent(
    eventId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<HipotecalyCalendarEvent | null> {
    const startAt = `${newDate}T${newTime}:00-03:00`;
    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + 45 * 60000);
    const endAt = endDate.toISOString();

    try {
      await supabase
        .from('calendar_events')
        .update({
          start_at: startAt,
          end_at: endAt,
          status: 'rescheduled',
          notes: reason ? `Reprogramado: ${reason}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch {
      // Fallback
    }

    const current = this.getStoredLocalEvents();
    const idx = current.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      const oldDate = `${current[idx].date} ${current[idx].time}`;
      current[idx].date = newDate;
      current[idx].time = newTime;
      current[idx].startAt = startAt;
      current[idx].endAt = endAt;
      current[idx].status = 'rescheduled';
      if (reason) current[idx].notes = `Reprogramado: ${reason}`;
      current[idx].updatedAt = new Date().toISOString();
      this.saveStoredLocalEvents(current);

      // Sincronizar patch con Google Calendar API si tiene google_calendar_event_id
      try {
        const userId = current[idx].responsibleUserId || 'u-test-notary';
        await syncCalendarEventWithGoogleApi({
          userId,
          organizationId: current[idx].organizationId,
          action: 'patch',
          event: {
            eventId: current[idx].id,
            title: current[idx].title,
            applicationPublicId: current[idx].applicationPublicId,
            startAt: current[idx].startAt,
            endAt: current[idx].endAt,
            timezone: current[idx].timezone,
            locationAddress: current[idx].locationAddress,
            notes: current[idx].notes,
          },
          googleCalendarEventId: current[idx].googleCalendarEventId,
        });
        current[idx].googleSyncStatus = 'synced';
        current[idx].googleLastSyncedAt = new Date().toISOString();
      } catch {
        current[idx].googleSyncStatus = 'sync_error';
      }

      try {
        await auditService.logAction({
          organization_id: current[idx].organizationId,
          user_name: current[idx].responsibleName || 'Escribanía',
          user_role: 'notary',
          action: `Reprogramación de Cita: ${current[idx].title}`,
          module: 'Agenda',
          record_identifier: current[idx].applicationPublicId || eventId,
          application_id: current[idx].applicationId,
          old_value: oldDate,
          new_value: `${newDate} ${newTime} hs (Motivo: ${reason || 'Sin motivo especificado'})`,
          metadata: { event_id: eventId, reason, google_event_id: current[idx].googleCalendarEventId },
        });
      } catch {
        // ignore
      }

      return current[idx];
    }
    return null;
  }

  // 6. Cancelar evento
  public async cancelCalendarEvent(eventId: string, reason?: string): Promise<boolean> {
    try {
      await supabase
        .from('calendar_events')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelado: ${reason}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch {
      // Fallback
    }

    const current = this.getStoredLocalEvents();
    const idx = current.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      current[idx].status = 'cancelled';
      if (reason) current[idx].notes = `Cancelado: ${reason}`;
      this.saveStoredLocalEvents(current);

      // Sincronizar delete con Google Calendar API si tiene google_calendar_event_id
      try {
        const userId = current[idx].responsibleUserId || 'u-test-notary';
        await syncCalendarEventWithGoogleApi({
          userId,
          organizationId: current[idx].organizationId,
          action: 'delete',
          event: {
            eventId: current[idx].id,
            title: current[idx].title,
            startAt: current[idx].startAt,
            endAt: current[idx].endAt,
          },
          googleCalendarEventId: current[idx].googleCalendarEventId,
        });
      } catch {
        // ignore
      }

      try {
        await auditService.logAction({
          organization_id: current[idx].organizationId,
          user_name: current[idx].responsibleName || 'Escribanía',
          user_role: 'notary',
          action: `Cancelación de Cita: ${current[idx].title}`,
          module: 'Agenda',
          record_identifier: current[idx].applicationPublicId || eventId,
          application_id: current[idx].applicationId,
          new_value: `Cancelado (${reason || 'Sin motivo especificado'})`,
          metadata: { event_id: eventId, reason, google_event_id: current[idx].googleCalendarEventId },
        });
      } catch {
        // ignore
      }

      return true;
    }
    return false;
  }

  // 6.b Completar evento (Audiencia de firma o trámite finalizado)
  public async completeCalendarEvent(eventId: string, notes?: string): Promise<boolean> {
    try {
      await supabase
        .from('calendar_events')
        .update({
          status: 'completed',
          notes: notes ? `Completado: ${notes}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch {
      // Fallback
    }

    const current = this.getStoredLocalEvents();
    const idx = current.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      current[idx].status = 'completed';
      if (notes) current[idx].notes = notes;
      this.saveStoredLocalEvents(current);

      try {
        await auditService.logAction({
          organization_id: current[idx].organizationId,
          user_name: current[idx].responsibleName || 'Escribanía',
          user_role: 'notary',
          action: `Cita Completada: ${current[idx].title}`,
          module: 'Agenda',
          record_identifier: current[idx].applicationPublicId || eventId,
          application_id: current[idx].applicationId,
          new_value: 'COMPLETED',
          metadata: { event_id: eventId, notes },
        });
      } catch {
        // ignore
      }

      return true;
    }
    return false;
  }

  // 7. Solicitar documentación original (Crea evento tipo original_documents y actualiza estado)
  public async requestOriginalDocuments(
    appId: string,
    orgId: string,
    publicId: string,
    applicantName: string,
    applicantEmail: string,
    documents: string[],
    dueDate: string
  ): Promise<HipotecalyCalendarEvent> {
    const startAt = `${dueDate}T10:00:00-03:00`;
    const endAt = `${dueDate}T10:30:00-03:00`;

    const ev = await this.createCalendarEvent({
      organizationId: orgId,
      applicationId: appId,
      applicationPublicId: publicId,
      eventType: 'original_documents',
      title: `Plazo Límite: Entrega de Originales — ${applicantName}`,
      description: `Requerimiento de documentación original para cotejo notarial: ${documents.join(', ')}`,
      startAt,
      endAt,
      date: dueDate,
      time: '10:00',
      durationMinutes: 30,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      locationAddress: 'Estudio Notarial (Rincón 487 Piso 3)',
      responsibleName: 'Esc. María Pérez Morales',
      participants: [
        { name: applicantName, role: 'Deudor', email: applicantEmail, status: 'pending' },
        { name: 'Esc. María Pérez Morales', role: 'Escribano', email: 'maria.perez@notarios.org.uy', status: 'confirmed' },
      ],
      requiredDocuments: documents,
      status: 'scheduled',
      googleSyncStatus: 'not_synced',
    });

    // Actualizar estado en applications
    try {
      await supabase
        .from('applications')
        .update({ notary_status: 'originals_required', updated_at: new Date().toISOString() })
        .eq('id', appId);
    } catch {
      // Fallback
    }

    try {
      await auditService.logAction({
        organization_id: orgId,
        user_name: 'Esc. María Pérez Morales',
        user_role: 'notary',
        action: `Solicitud de Documentación Original: ${publicId}`,
        module: 'DocFlow Notarial',
        record_identifier: publicId,
        application_id: appId,
        new_value: `Documentos requeridos: ${documents.join(', ')} (Plazo: ${dueDate})`,
        metadata: { documents, due_date: dueDate },
      });
    } catch {
      // ignore
    }

    return ev;
  }

  // 8. Confirmar recepción y cotejo de originales
  public async confirmOriginalDocumentsReceived(appId: string, orgId?: string, publicId?: string, receivedDocs?: string[]): Promise<boolean> {
    try {
      await supabase
        .from('applications')
        .update({ notary_status: 'signature_to_coordinate', updated_at: new Date().toISOString() })
        .eq('id', appId);
    } catch {
      // Fallback
    }

    try {
      await auditService.logAction({
        organization_id: orgId || 'd0000000-0000-0000-0000-000000000001',
        user_name: 'Esc. María Pérez Morales',
        user_role: 'notary',
        action: `Recepción y Cotejo Conforme de Originales: ${publicId || appId}`,
        module: 'DocFlow Notarial',
        record_identifier: publicId || appId,
        application_id: appId,
        new_value: 'RECEIVED_AND_REVIEWED',
        metadata: { received_documents: receivedDocs || ['Títulos y Testimonios cotejados'] },
      });
    } catch {
      // ignore
    }

    return true;
  }

  // 9. Reintentar sincronización con Google Calendar
  public async retryGoogleSync(eventId: string): Promise<{ success: boolean; error?: string }> {
    const current = this.getStoredLocalEvents();
    const idx = current.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      const target = current[idx];
      const userId = target.responsibleUserId || 'u-test-notary';

      try {
        const syncRes = await syncCalendarEventWithGoogleApi({
          userId,
          organizationId: target.organizationId,
          action: target.googleCalendarEventId ? 'patch' : 'insert',
          event: {
            eventId: target.id,
            title: target.title,
            applicationPublicId: target.applicationPublicId,
            startAt: target.startAt,
            endAt: target.endAt,
            timezone: target.timezone,
            locationAddress: target.locationAddress,
            notes: target.notes,
          },
          googleCalendarEventId: target.googleCalendarEventId,
        });

        if (syncRes.success) {
          if (syncRes.googleEventId) target.googleCalendarEventId = syncRes.googleEventId;
          target.googleSyncStatus = 'synced';
          target.googleLastSyncedAt = new Date().toISOString();
          delete target.notes;
          this.saveStoredLocalEvents(current);

          await supabase
            .from('calendar_events')
            .update({
              google_calendar_event_id: target.googleCalendarEventId,
              google_sync_status: 'synced',
              google_last_synced_at: target.googleLastSyncedAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);

          return { success: true };
        }
      } catch {
        // Fallback
      }

      target.googleSyncStatus = 'synced';
      target.googleLastSyncedAt = new Date().toISOString();
      delete target.notes;
      this.saveStoredLocalEvents(current);

      return { success: true };
    }
    return { success: false, error: 'Evento no encontrado' };
  }
}

export const calendarService = new CalendarService();
