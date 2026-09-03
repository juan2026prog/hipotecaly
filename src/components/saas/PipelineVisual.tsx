import React from 'react';
import {
  Globe,
  Calculator,
  ArrowRight,
  Layers,
  FolderKanban,
  FileCheck2,
  Sparkles,
  PenTool,
  TrendingUp,
} from 'lucide-react';

interface PipelineVisualProps {
  className?: string;
}

export const PipelineVisual: React.FC<PipelineVisualProps> = ({
  className = '',
}) => {
  const steps = [
    {
      icon: Globe,
      label: 'Tu Web Actual',
      sub: 'Mantén tu diseño y dominio',
      highlight: false,
    },
    {
      icon: Calculator,
      label: 'Simulador / Botón',
      sub: 'El cliente calcula su monto',
      highlight: false,
    },
    {
      icon: ArrowRight,
      label: 'CONTINUAR SOLICITUD',
      sub: 'Paso fluido de parámetros',
      highlight: true,
      isAction: true,
    },
    {
      icon: Layers,
      label: 'HIPOTECALY White-Label',
      sub: 'Bajo tu propia marca',
      highlight: true,
    },
    {
      icon: FolderKanban,
      label: 'Expediente Digital',
      sub: 'ID único y trazabilidad',
      highlight: false,
    },
    {
      icon: FileCheck2,
      label: 'Documentación',
      sub: 'Checklist y visor privado',
      highlight: false,
    },
    {
      icon: Sparkles,
      label: 'Análisis Asistido',
      sub: 'Scoring preliminar IA',
      highlight: false,
    },
    {
      icon: PenTool,
      label: 'Firma Notarial',
      sub: 'Coordinación con escribano',
      highlight: false,
    },
    {
      icon: TrendingUp,
      label: 'Seguimiento',
      sub: 'Crédito activo y pagos',
      highlight: false,
    },
  ];

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-2.5 items-stretch">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-left relative ${
                step.isAction
                  ? 'bg-brand-green text-white border-brand-green shadow-md'
                  : step.highlight
                  ? 'bg-navy text-white border-navy-border shadow-md'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      step.isAction
                        ? 'bg-white/20 text-white'
                        : step.highlight
                        ? 'bg-brand-green/20 text-brand-green'
                        : 'bg-slate-100 text-navy'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      step.isAction
                        ? 'bg-white/20 text-white'
                        : step.highlight
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    0{idx + 1}
                  </span>
                </div>
                <h5
                  className={`text-xs font-bold leading-snug ${
                    step.isAction || step.highlight ? 'text-white' : 'text-navy'
                  }`}
                >
                  {step.label}
                </h5>
                <p
                  className={`text-[10px] mt-0.5 leading-tight ${
                    step.isAction
                      ? 'text-emerald-100'
                      : step.highlight
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.sub}
                </p>
              </div>

              {/* Conector flecha visible en desktop excepto el último */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-300 pointer-events-none">
                  <span className="text-xs">›</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
