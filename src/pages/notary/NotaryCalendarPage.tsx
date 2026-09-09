import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Link2,
  Unlink,
} from 'lucide-react';
import { calendarService, HipotecalyCalendarEvent } from '../../lib/calendar/calendarService';
import {
  generateGoogleCalendarWebLink,
  getUserCalendarIntegrationState,
  getGoogleCalendarOAuthUrl,
  disconnectGoogleCalendar,
  setUserCalendarIntegrationState,
  GoogleCalendarIntegrationState,
} from '../../lib/calendar/googleCalendarIntegration';
import { useAuth } from '../../contexts/AuthContext';

export const NotaryCalendarPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [calendarEvents, setCalendarEvents] = useState<HipotecalyCalendarEvent[]>([]);
  const [gcalState, setGcalState] = useState<GoogleCalendarIntegrationState>({
    isConnected: false,
    calendarId: 'primary',
    connectionStatus: 'disconnected',
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const currentUserId = user?.id || 'u-test-notary';

  useEffect(() => {
    const load = async () => {
      const evs = await calendarService.getEventsByOrganization(tenant.id);
      if (evs && evs.length > 0) {
        setCalendarEvents(evs);
      } else {
        const fallback = await calendarService.getAllScheduledSignatures();
        setCalendarEvents(fallback);
      }

      const syncStatus = await getUserCalendarIntegrationState(currentUserId);
      setGcalState(syncStatus);
    };
    load();
  }, [tenant.id, currentUserId]);

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      const url = await getGoogleCalendarOAuthUrl(currentUserId, tenant.id || 'd0000000-0000-0000-0000-000000000001');
      // Si estamos en un test o entorno local directo, activar conexión segura
      if (url.includes('mock-google-calendar-client-id')) {
        await setUserCalendarIntegrationState(currentUserId, tenant.id, true, 'escribania.morales@gmail.com');
        const updated = await getUserCalendarIntegrationState(currentUserId);
        setGcalState(updated);
      } else {
        window.location.href = url;
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleCalendar(currentUserId, tenant.id);
    const updated = await getUserCalendarIntegrationState(currentUserId);
    setGcalState(updated);
  };

  return (
    <NotaryLayout title="Calendario Notarial">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Agenda Notarial Soberana & Vencimientos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fuente única de verdad para firmas notariales, entrega de títulos originales y vencimientos registrales.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            Septiembre 2026
          </div>
        </div>
      </div>

      {/* Banner de Integración Google Calendar Real & Opcional */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-200 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">Google Calendar</span>
              {gcalState.isConnected ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  <span>Sincronización Activa</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  No conectado (Opcional)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {gcalState.isConnected
                ? `Cuenta conectada: ${gcalState.googleAccountEmail || 'escribania.morales@gmail.com'}. Los eventos de firma se proyectan automáticamente sin exponer datos financieros.`
                : 'Conecte su cuenta profesional para sincronizar automáticamente sus audiencias de firma.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-2">
          {gcalState.isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5 border border-slate-200"
            >
              <Unlink className="w-3.5 h-3.5 text-slate-500" />
              <span>Desconectar</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogleCalendar}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm shadow-blue-600/20"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isConnecting ? 'Iniciando...' : 'Conectar Google Calendar'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario visual (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Septiembre 2026</span>
            <div className="flex items-center space-x-1 text-slate-400">
              <button className="p-1 hover:text-slate-600 rounded"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1 hover:text-slate-600 rounded"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
              <span key={d} className="font-bold text-slate-400 py-1 text-[11px]">{d}</span>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const hasEvent = day === 8 || day === 10 || day === 11 || day === 12 || day === 15;
              const isToday = day === 7;
              return (
                <button
                  key={day}
                  className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    isToday
                      ? 'bg-slate-900 text-white'
                      : hasEvent
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 font-extrabold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Vencimiento urgente / Observación</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Firma digital / Entrega de Originales</span>
            </div>
          </div>
        </div>

        {/* Lista de Eventos Agendados (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Eventos y Citas del Mes ({calendarEvents.length})
            </h3>
            <span className="text-[11px] text-slate-400">Agenda Soberana HIPOTECALY</span>
          </div>

          <div className="space-y-3">
            {calendarEvents.map((ev) => {
              const isSignature = ev.eventType === 'signature';
              const isOriginals = ev.eventType === 'original_documents';
              const isDeadline = ev.eventType === 'deadline';

              return (
                <div
                  key={ev.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {ev.applicationPublicId || 'HIP-GRAL'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSignature
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : isOriginals
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isDeadline
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSignature ? 'Firma Escritura' : isOriginals ? 'Entrega de Originales' : isDeadline ? 'Vencimiento' : 'Reunión'}
                      </span>
                      {ev.googleSyncStatus === 'synced' && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          GCal Sync
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.date} · {ev.time} hs</span>
                      </div>
                      {ev.locationAddress && (
                        <span className="truncate max-w-xs">{ev.locationAddress}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center flex items-center space-x-2">
                    <a
                      href={generateGoogleCalendarWebLink(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center space-x-1 border border-blue-200"
                      title="Agregar a Google Calendar"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google Cal</span>
                    </a>

                    <Link
                      to={`${basePath}/expedientes/${ev.applicationId || 'e0000000-0000-0000-0000-000000000001'}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Ver expediente
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </NotaryLayout>
  );
};
