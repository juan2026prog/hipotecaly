// ==============================================================================
// HIPOTECALY: Integración Externa Opcional con Google Calendar (Por Usuario)
// Sincronización y Enlaces Sanitizados sin Exposición de Datos Financieros Sensibles
// ==============================================================================

import { HipotecalyCalendarEvent } from './calendarService';
import { supabase } from '../supabase';

/**
 * Genera un enlace directo 'Add to Google Calendar' sanitizado con el principio de privacidad estricta.
 */
export function generateGoogleCalendarWebLink(event: HipotecalyCalendarEvent): string {
  try {
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);

    const formatGCalTime = (d: Date) => {
      return d.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const dates = `${formatGCalTime(startDate)}/${formatGCalTime(endDate)}`;
    
    // Título y descripción sanitizados sin revelar montos ni datos patrimoniales
    const safeTitle = encodeURIComponent(
      `HIPOTECALY: ${event.eventType === 'signature' ? 'Firma de Escritura' : 'Entrega de Títulos'} — ${event.applicationPublicId || 'Expediente'}`
    );
    
    const safeDetails = encodeURIComponent(
      `Acto notarial formal coordinado a través de HIPOTECALY.\n\nPor razones de confidencialidad y secreto profesional notarial, los antecedentes dominiales, estados de cuenta y recaudos completos deben consultarse dentro del portal seguro de HIPOTECALY.`
    );
    
    const safeLocation = encodeURIComponent(
      event.locationAddress || (event.locationType === 'virtual' ? 'Reunión Virtual Google Meet' : 'Estudio Notarial')
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${safeTitle}&dates=${dates}&details=${safeDetails}&location=${safeLocation}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

/**
 * Consulta el estado de conexión de Google Calendar del usuario profesional.
 */
export async function getUserCalendarIntegrationState(userId: string): Promise<{
  isConnected: boolean;
  calendarId: string;
}> {
  try {
    const { data } = await supabase
      .from('user_calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    if (data && data.sync_enabled) {
      return { isConnected: true, calendarId: data.calendar_id || 'primary' };
    }
  } catch {
    // Fallback local
  }

  const localState = typeof window !== 'undefined' ? window.localStorage.getItem(`gcal_sync_${userId}`) : null;
  return { isConnected: localState === 'true', calendarId: 'primary' };
}

/**
 * Conecta o desconecta la integración de Google Calendar para el usuario.
 */
export async function setUserCalendarIntegrationState(
  userId: string,
  organizationId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    await supabase.from('user_calendar_integrations').upsert({
      user_id: userId,
      organization_id: organizationId,
      provider: 'google_calendar',
      calendar_id: 'primary',
      sync_enabled: enabled,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Fallback local
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`gcal_sync_${userId}`, String(enabled));
  }
  return true;
}
