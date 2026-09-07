import React from 'react';
import { Stamp, ShieldCheck } from 'lucide-react';

interface NotaryElectronicSupportBadgeProps {
  isNotarialElectronicDocument?: boolean;
  requiresNotarialSupport?: boolean;
  notarialSupportCode?: string;
  className?: string;
}

export const NotaryElectronicSupportBadge: React.FC<NotaryElectronicSupportBadgeProps> = ({
  isNotarialElectronicDocument = false,
  requiresNotarialSupport = false,
  notarialSupportCode,
  className = '',
}) => {
  if (isNotarialElectronicDocument) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 ${className}`}
        title="Documento Notarial Electrónico sujeto al Reglamento Notarial de la Suprema Corte de Justicia"
      >
        <Stamp className="w-3.5 h-3.5 text-purple-600" />
        <span>Doc. Notarial Electrónico (SCJ)</span>
        {notarialSupportCode && (
          <span className="font-mono text-[10px] text-purple-600 bg-purple-100/80 px-1 rounded ml-1">
            {notarialSupportCode}
          </span>
        )}
      </div>
    );
  }

  if (requiresNotarialSupport) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
      >
        <Stamp className="w-3.5 h-3.5 text-amber-600" />
        <span>Requiere Soporte Notarial Electrónico</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 ${className}`}
      title="Firma Electrónica Avanzada conforme a Ley N.º 18.600"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
      <span>Firma Electrónica Avanzada (FEA)</span>
    </div>
  );
};
