import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'received'
  | 'info_review'
  | 'in_review'
  | 'technical_review'
  | 'under_review'
  | 'missing_documents'
  | 'docs_pending'
  | 'offer_available'
  | 'presented'
  | 'opportunity'
  | 'approved'
  | 'accepted'
  | 'active'
  | 'rejected'
  | 'error'
  | 'cancelled'
  | 'completed'
  | 'formalization'
  | 'archived';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  string,
  { label: string; styles: string; dot: string }
> = {
  draft: {
    label: 'Borrador',
    styles: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  submitted: {
    label: 'Recibida',
    styles: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  received: {
    label: 'Recibida',
    styles: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  info_review: {
    label: 'En evaluación',
    styles: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  in_review: {
    label: 'En análisis',
    styles: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  technical_review: {
    label: 'Revisión técnica',
    styles: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  under_review: {
    label: 'En análisis',
    styles: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  missing_documents: {
    label: 'Faltan documentos',
    styles: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
  },
  docs_pending: {
    label: 'Doc. pendiente',
    styles: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
  },
  offer_available: {
    label: 'Oferta disponible',
    styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  presented: {
    label: 'Propuesta emitida',
    styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  opportunity: {
    label: 'Oportunidad',
    styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  approved: {
    label: 'Aprobada',
    styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  accepted: {
    label: 'Aceptada',
    styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  active: {
    label: 'Activo',
    styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rechazada',
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  error: {
    label: 'Error',
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelada',
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  completed: {
    label: 'Completada',
    styles: 'bg-navy/10 text-navy border-navy/20',
    dot: 'bg-navy',
  },
  formalization: {
    label: 'En formalización',
    styles: 'bg-navy/10 text-navy border-navy/20',
    dot: 'bg-navy',
  },
  archived: {
    label: 'Archivada',
    styles: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className,
  ...props
}) => {
  const normalizedKey = status ? status.toLowerCase().trim() : 'draft';
  const config = STATUS_CONFIG[normalizedKey] || {
    label: label || status,
    styles: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const displayText = label || config.label;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center space-x-1.5 font-medium rounded-full border',
          config.styles,
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span className="truncate">{displayText}</span>
    </span>
  );
};
