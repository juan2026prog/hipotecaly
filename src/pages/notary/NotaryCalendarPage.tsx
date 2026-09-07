import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const NotaryCalendarPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const events = [
    {
      date: '08 Sep 2026',
      time: '11:00',
      caseId: 'HIP-2026-00158',
      applicant: 'Martín López',
      title: 'Vencimiento de certificado DGR Sección Inmobiliaria',
      type: 'vencimiento',
      severity: 'high',
    },
    {
      date: '10 Sep 2026',
      time: '15:30',
      caseId: 'HIP-2026-00131',
      applicant: 'Carlos Méndez',
      title: 'Audiencia de Firma Digital de Escritura Hipotecaria',
      type: 'firma',
      severity: 'normal',
    },
    {
      date: '12 Sep 2026',
      time: '10:00',
      caseId: 'HIP-2026-00144',
      applicant: 'Ana Pereira',
      title: 'Presentación de Minuta Notarial en Registro',
      type: 'tramite',
      severity: 'normal',
    },
    {
      date: '15 Sep 2026',
      time: '17:00',
      caseId: 'HIP-2026-00152',
      applicant: 'Lucía Vázquez',
      title: 'Plazo límite para levantamiento de observación de sucesión',
      type: 'observacion',
      severity: 'high',
    },
  ];

  return (
    <NotaryLayout title="Calendario Notarial">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Agenda Notarial & Vencimientos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Plazos de certificados registrales, audiencias de escrituración y levantamiento de observaciones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            Septiembre 2026
          </div>
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
              const hasEvent = day === 8 || day === 10 || day === 12 || day === 15;
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
              <span>Firma digital / Trámite</span>
            </div>
          </div>
        </div>

        {/* Lista de Eventos Agendados (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Eventos y Vencimientos del Mes
          </h3>

          <div className="space-y-3">
            {events.map((ev, i) => (
              <div
                key={i}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {ev.caseId}
                    </span>
                    <span className="text-xs font-bold text-slate-600 truncate">{ev.applicant}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.date} · {ev.time} hs</span>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Link
                    to={`${basePath}/expedientes/e0000000-0000-0000-0000-000000000001`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Ver expediente
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NotaryLayout>
  );
};
