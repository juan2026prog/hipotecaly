// ==============================================================================
// HIPOTECALY: Generador y Exportador Universal iCalendar (.ics)
// Permite a clientes y profesionales agendar eventos en Apple, Outlook o Google
// sin obligar a vincular cuentas externas ni exponer información confidencial
// ==============================================================================

import { HipotecalyCalendarEvent } from './calendarService';

/**
 * Genera el contenido de texto en formato estándar iCalendar (RFC 5545).
 */
export function generateIcsFileContent(event: HipotecalyCalendarEvent): string {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = `hipotecaly-${event.id}-${Date.now()}@hipotecaly.uy`;
  const stamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(startDate);
  const dtEnd = formatIcsDate(endDate);

  const safeSummary = `HIPOTECALY: ${event.eventType === 'signature' ? 'Firma de Escritura Notarial' : 'Entrega de Títulos'} — ${event.applicationPublicId || 'Expediente'}`;
  const safeLocation = event.locationAddress || (event.locationType === 'virtual' ? 'Reunión Virtual' : 'Estudio Notarial');
  const safeDescription = [
    'Acto notarial formal coordinado a través de HIPOTECALY.',
    event.description ? `Detalle: ${event.description}` : '',
    event.requiredDocuments && event.requiredDocuments.length > 0 ? `Requisitos: ${event.requiredDocuments.join(', ')}` : '',
    'Por motivos de confidencialidad notarial y financiera, consulte los recaudos completos en el portal seguro de HIPOTECALY.',
  ].filter(Boolean).join('\\n\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HIPOTECALY//Sovereign Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safeSummary}`,
    `DESCRIPTION:${safeDescription}`,
    `LOCATION:${safeLocation}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio 24h antes del acto notarial HIPOTECALY',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio 2h antes del acto notarial HIPOTECALY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Descarga directamente el archivo .ics en el navegador del usuario.
 */
export function downloadIcsFile(event: HipotecalyCalendarEvent): void {
  try {
    const icsContent = generateIcsFileContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HIPOTECALY-${event.applicationPublicId || 'Cita'}-${event.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error al exportar archivo .ics:', err);
  }
}
