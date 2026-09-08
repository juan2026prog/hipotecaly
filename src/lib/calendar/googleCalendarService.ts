// ==============================================================================
// HIPOTECALY: Integración Notarial Google Calendar
// Gestión contextual de agenda: Entrega de Originales y Coordinación de Firma
// ==============================================================================

export interface CalendarParticipant {
  name: string;
  role: 'Deudor' | 'Hipotecante' | 'Acreedor' | 'Escribano' | 'Representante' | 'Garante';
  email: string;
}

export interface CalendarEventSchedule {
  id: string;
  applicationId: string;
  applicationPublicId: string;
  type: 'entrega_originales' | 'firma_escritura';
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  location: string;
  locationType: 'estudio' | 'domicilio' | 'otro';
  participants: CalendarParticipant[];
  requiredDocuments?: string[];
  reminders: {
    hours24: boolean;
    hours2: boolean;
  };
  googleCalendarEventId: string;
  googleMeetLink?: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

// Slots disponibles simulados desde la cuenta de Google Calendar del Escribano
export const getAvailableCalendarSlots = (_dateString: string) => {
  return [
    { time: '09:30', available: true },
    { time: '11:00', available: true },
    { time: '14:30', available: false, conflict: 'Audiencia Juzgado Paz 2° Turno' },
    { time: '15:30', available: true },
    { time: '17:00', available: true },
  ];
};

class GoogleCalendarService {
  private eventsKey = 'hipotecaly_notary_calendar_events';

  private getStoredEvents(): CalendarEventSchedule[] {
    try {
      const data = localStorage.getItem(this.eventsKey);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'cal-ev-001',
        applicationId: 'e0000000-0000-0000-0000-000000000001',
        applicationPublicId: 'HIP-2026-00158',
        type: 'firma_escritura',
        title: 'Firma Escritura Matriz Hipoteca y Mutuo — Martín López',
        date: '2026-09-15',
        time: '15:30',
        durationMinutes: 45,
        location: 'Estudio Fernández & Asociados (Rincón 487 Piso 3)',
        locationType: 'estudio',
        participants: [
          { name: 'Martín López Arispe', role: 'Deudor', email: 'martin.lopez@ejemplo.com' },
          { name: 'Esc. María Pérez Morales', role: 'Escribano', email: 'maria.perez@notarios.org.uy' },
          { name: 'Mateo Silva (Nova Capital)', role: 'Acreedor', email: 'mateo.silva@novacapital.uy' },
        ],
        reminders: { hours24: true, hours2: true },
        googleCalendarEventId: 'gcal_894120938f82190',
        googleMeetLink: 'https://meet.google.com/hpt-notary-sign',
        status: 'confirmed',
        createdAt: '2026-09-07T14:30:00Z',
        createdBy: 'Esc. María Pérez Morales',
      },
    ];
  }

  private saveEvents(events: CalendarEventSchedule[]) {
    try {
      localStorage.setItem(this.eventsKey, JSON.stringify(events));
    } catch {
      // ignore
    }
  }

  public async scheduleEvent(
    data: Omit<CalendarEventSchedule, 'id' | 'googleCalendarEventId' | 'status' | 'createdAt'>
  ): Promise<CalendarEventSchedule> {
    const newEvent: CalendarEventSchedule = {
      ...data,
      id: 'cal-ev-' + Date.now().toString(36),
      googleCalendarEventId: 'gcal_' + Math.random().toString(36).substring(2, 15),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const current = this.getStoredEvents();
    const updated = [newEvent, ...current.filter((e) => e.applicationId !== data.applicationId)];
    this.saveEvents(updated);
    return newEvent;
  }

  public getEventByApplication(applicationId: string): CalendarEventSchedule | null {
    const events = this.getStoredEvents();
    return events.find((e) => e.applicationId === applicationId && e.status !== 'cancelled') || null;
  }

  public getAllScheduledSignatures(): CalendarEventSchedule[] {
    const events = this.getStoredEvents();
    return events.filter((e) => e.type === 'firma_escritura' && e.status === 'confirmed');
  }

  public rescheduleEvent(eventId: string, newDate: string, newTime: string): CalendarEventSchedule | null {
    const events = this.getStoredEvents();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx].date = newDate;
      events[idx].time = newTime;
      events[idx].status = 'confirmed';
      this.saveEvents(events);
      return events[idx];
    }
    return null;
  }

  public cancelEvent(eventId: string): boolean {
    const events = this.getStoredEvents();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      events[idx].status = 'cancelled';
      this.saveEvents(events);
      return true;
    }
    return false;
  }
}

export const googleCalendarService = new GoogleCalendarService();
