import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AiAnalysisScorecardProps {
  className?: string;
}

export const AiAnalysisScorecard: React.FC<AiAnalysisScorecardProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'tasacion' | 'documentos' | 'capacidad' | 'juridico'>('resumen');

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden text-left text-xs text-slate-text select-none ${className}`}>
      {/* Top Header Card with AI Assistant badge */}
      <div className="bg-navy p-4 sm:p-5 text-white border-b border-navy-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">Análisis Asistido por IA</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-green text-navy">
                  Copiloto Operativo
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Evaluación preliminar automatizada · Expediente #HPT-2026-0849
              </p>
            </div>
          </div>

          <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Scoring Asistido</span>
            <span className="text-base font-extrabold text-brand-green">84 / 100</span>
          </div>
        </div>

        {/* 4 Semáforos Indicadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10">
          {/* 1. Tasación */}
          <button
            onClick={() => setActiveTab('tasacion')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              activeTab === 'tasacion'
                ? 'bg-white/15 border-brand-green text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">1. Tasación</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="font-bold text-xs mt-1 text-white">USD 215.000</p>
            <span className="text-[9px] text-emerald-300">Margen sólido (39%)</span>
          </button>

          {/* 2. Documentación */}
          <button
            onClick={() => setActiveTab('documentos')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              activeTab === 'documentos'
                ? 'bg-white/15 border-amber-400 text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">2. Documentación</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
            <p className="font-bold text-xs mt-1 text-white">1 Observación</p>
            <span className="text-[9px] text-amber-300">Páginas faltantes</span>
          </button>

          {/* 3. Capacidad de Pago */}
          <button
            onClick={() => setActiveTab('capacidad')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              activeTab === 'capacidad'
                ? 'bg-white/15 border-brand-green text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">3. Capacidad Pago</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="font-bold text-xs mt-1 text-white">Cobertura 3.4x</p>
            <span className="text-[9px] text-emerald-300">Ingresos respaldados</span>
          </button>

          {/* 4. Riesgo Jurídico */}
          <button
            onClick={() => setActiveTab('juridico')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              activeTab === 'juridico'
                ? 'bg-white/15 border-brand-green text-white shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">4. Riesgo Jurídico</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="font-bold text-xs mt-1 text-white">Sin Embargos</p>
            <span className="text-[9px] text-emerald-300">Padrón libre</span>
          </button>
        </div>
      </div>

      {/* Main Body with Tab Content and Insights */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Dynamic Alerts / Findings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garantía Inmobiliaria Favorable</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed pl-6">
              El valor preliminar del inmueble (USD 215.000) permite financiar el monto solicitado
              (USD 85.000) con un porcentaje del 39.5%, inferior al tope máximo configurado (40%).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Alerta Documental Detectada</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed pl-6">
              La copia del testimonio de propiedad cargada carece del sello de inscripción registral
              en el reverso. Requiere verificación por el escribano interviniente.
            </p>
          </div>
        </div>

        {/* Breakdown of AI checks */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Verificaciones Automáticas de Reglas Crediticias
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-600">Porcentaje financiado solicitado:</span>
              <span className="font-bold text-navy">39.5% (Aprobado)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-600">Zona urbana habilitada:</span>
              <span className="font-bold text-navy">Montevideo (Pocitos)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-600">Tipo de inmueble:</span>
              <span className="font-bold text-navy">Apartamento PH</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-600">Revisión de Clearing:</span>
              <span className="font-bold text-slate-700">Admitido según política</span>
            </div>
          </div>
        </div>

        {/* Mandatory Regulatory Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300/80 flex items-start space-x-3 text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-navy font-semibold">Aviso importante:</strong> El análisis
            tecnológico es preliminar y no sustituye la tasación profesional, el estudio de títulos
            ni la decisión crediticia final, que corresponden exclusivamente al prestamista o comité evaluador.
          </p>
        </div>
      </div>
    </div>
  );
};
