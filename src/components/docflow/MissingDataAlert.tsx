import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ValidationResult } from '../../lib/docflow/types';

interface MissingDataAlertProps {
  validation: ValidationResult;
  onGoToSection?: (category: string) => void;
  documentTitle?: string;
}

export const MissingDataAlert: React.FC<MissingDataAlertProps> = ({
  validation,
  onGoToSection,
  documentTitle,
}) => {
  if (validation.isValid) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">
          Todos los campos obligatorios ({validation.availableFieldsCount}/{validation.totalRequiredCount}) están completos para este documento.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 text-xs text-amber-900 animate-in fade-in">
      <div className="flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-900">
            Faltan datos requeridos para generar {documentTitle ? `"${documentTitle}"` : 'este documento'}
          </h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            DocFlow no genera silenciosamente documentos con variables vacías. Por favor complete los siguientes campos:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {validation.missingRequiredFields.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between p-2 bg-white/80 rounded border border-amber-200 text-[11px]"
          >
            <div>
              <span className="font-bold text-navy block">{f.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">{f.key}</span>
            </div>
            {onGoToSection && (
              <button
                type="button"
                onClick={() => onGoToSection(f.category)}
                className="text-[10px] font-bold text-brand-green hover:underline flex items-center"
              >
                Completar <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
