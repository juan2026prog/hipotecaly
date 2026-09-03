import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Download,
  User,
  HelpCircle,
} from 'lucide-react';

interface ClientPortalMockupProps {
  className?: string;
}

export const ClientPortalMockup: React.FC<ClientPortalMockupProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden text-left text-xs text-slate-text select-none ${className}`}
    >
      {/* Top Browser Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[11px] text-slate-400 font-mono ml-2">
            portal.tuestudio.uy/mi-expediente
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sesión Segura Encriptada</span>
        </div>
      </div>

      {/* Portal Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-sm">
            EP
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-navy">Estudio del Plata</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold">
                Portal Cliente
              </span>
            </div>
            <span className="text-[11px] text-slate-muted block">Expediente #HPT-2026-0849</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
          <User className="w-3.5 h-3.5" />
          <span>Mariana Gómez</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Estado, Acciones y Documentos */}
        <div className="lg:col-span-8 space-y-4">
          {/* Banner de Estado Principal */}
          <div className="bg-gradient-to-r from-navy to-navy-surface text-white p-4 sm:p-5 rounded-xl border border-navy-border shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-green">
                Estado Actual del Expediente
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Documentación en Revisión
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">
              Propuesta pre-aprobada por USD 85.000
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Tu solicitud sobre el inmueble en Pocitos fue evaluada con éxito. Completá los
              documentos solicitados abajo para coordinar la firma notarial.
            </p>

            {/* Stepper horizontal dentro del banner */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="text-brand-green font-semibold">
                <div className="w-4 h-4 mx-auto rounded-full bg-brand-green text-white flex items-center justify-center text-[9px] mb-1">
                  ✓
                </div>
                Solicitud
              </div>
              <div className="text-brand-green font-semibold">
                <div className="w-4 h-4 mx-auto rounded-full bg-brand-green text-white flex items-center justify-center text-[9px] mb-1">
                  ✓
                </div>
                Tasación
              </div>
              <div className="text-white font-bold">
                <div className="w-4 h-4 mx-auto rounded-full bg-amber-400 text-navy font-bold flex items-center justify-center text-[9px] mb-1">
                  3
                </div>
                Documentos
              </div>
              <div className="text-slate-400">
                <div className="w-4 h-4 mx-auto rounded-full bg-white/20 text-slate-300 flex items-center justify-center text-[9px] mb-1">
                  4
                </div>
                Firma Escribano
              </div>
            </div>
          </div>

          {/* Checklist de Documentación Faltante */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-navy text-sm flex items-center">
                <FileText className="w-4 h-4 text-brand-green mr-1.5" />
                Checklist de Documentación Requerida
              </h5>
              <span className="text-[11px] text-slate-500 font-medium">2 de 4 completados</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-xs">
                    Cédula de Identidad de Titulares (ambos lados)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-100 rounded">
                  Aprobado
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-xs">
                    Comprobante de Ingresos / Certificación de Ingresos
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-100 rounded">
                  Aprobado
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Copia Simple del Título de Propiedad o Promesa
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Observación: Subir hojas 4 a 8 legibles
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-[10px]">
                  Subir corrección
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-600 text-xs">
                    Último recibo de Contribución Inmobiliaria y Primaria
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-navy text-white rounded font-bold text-[10px]">
                  Subir PDF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Próximos Pagos, Calendario y Soporte */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Próximo Pago / Cuota */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Plan de Pagos Previsto
              </span>
              <Calendar className="w-3.5 h-3.5 text-brand-green" />
            </div>

            <div>
              <span className="text-xl font-extrabold text-navy">USD 780</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Modalidad: Solo Intereses mensual
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Plazo acordado:</span>
                <span className="font-bold text-navy">36 meses</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vencimiento cuota:</span>
                <span className="font-bold text-navy">Día 10 de cada mes</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cancelación anticipada:</span>
                <span className="font-bold text-brand-green">Sin penalidad</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1.5">
                <Download className="w-3 h-3" />
                <span>Simulación Oficial (PDF)</span>
              </div>
            </div>
          </div>

          {/* Recordatorios y Asistencia */}
          <div className="bg-brand-green-light/40 p-4 rounded-xl border border-brand-green/20 space-y-2">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-brand-green shrink-0" />
              <h6 className="font-bold text-navy text-xs">Atención Notarial Asignada</h6>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dra. Lucía Soria · Escribana Pública interviniente. Todo intercambio y consulta queda
              registrado en este expediente seguro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
