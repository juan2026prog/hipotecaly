import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export const MobileTrackerMockup: React.FC = () => {
  return (
    <div className="w-56 md:w-60 bg-white rounded-[32px] p-3 shadow-2xl border-[6px] border-slate-800 text-left select-none relative mx-auto">
      {/* Phone speaker notch */}
      <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-3"></div>

      {/* Header inside phone */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-4 rounded bg-brand-green flex items-center justify-center text-[9px] font-bold text-white">
            H
          </div>
          <span className="font-bold text-[10px] text-navy">HIPOTECALY</span>
        </div>
        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">PWA</span>
      </div>

      {/* Applicant Card */}
      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Solicitud</span>
            <p className="font-bold text-xs text-navy">HPT-2026-00124</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 flex items-center">
            <Clock className="w-2.5 h-2.5 mr-1" /> En análisis
          </span>
        </div>
      </div>

      {/* Score circle */}
      <div className="my-3 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-brand-green flex flex-col items-center justify-center mx-auto bg-brand-green-light/30">
          <span className="text-base font-extrabold text-navy leading-none">78</span>
          <span className="text-[8px] font-bold text-brand-green uppercase tracking-wide">Bueno</span>
        </div>
        <p className="text-[9px] text-slate-500 mt-1 font-medium">Calificación preliminar</p>
      </div>

      {/* Mini timeline */}
      <div className="space-y-1.5 text-[9px] px-1 py-2 bg-white rounded-lg border border-slate-100">
        <div className="flex items-center space-x-2 text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
          <span className="font-medium">Solicitud recibida</span>
        </div>
        <div className="flex items-center space-x-2 text-navy font-semibold">
          <div className="w-3.5 h-3.5 rounded-full bg-brand-green flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <span>Información en revisión</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <Circle className="w-3.5 h-3.5 shrink-0" />
          <span>Propiedad en análisis</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <Circle className="w-3.5 h-3.5 shrink-0" />
          <span>Propuesta disponible</span>
        </div>
      </div>

      {/* CTA inside phone */}
      <div className="mt-3">
        <button className="w-full py-2 bg-navy text-white rounded-lg font-bold text-[10px] text-center shadow-sm">
          Ver expediente
        </button>
      </div>
    </div>
  );
};
