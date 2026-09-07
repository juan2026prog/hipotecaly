import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, FileSignature } from 'lucide-react';
import { SignatureStatus } from '../../lib/siteos/signature/types';

interface SignatureStatusBadgeProps {
  status: SignatureStatus | string;
  mode?: 'mock' | 'test' | 'live';
  size?: 'sm' | 'md';
}

export const SignatureStatusBadge: React.FC<SignatureStatusBadgeProps> = ({
  status,
  mode = 'mock',
  size = 'md',
}) => {
  const norm = (status || 'draft').toLowerCase();

  const getStyle = () => {
    switch (norm) {
      case 'signed':
      case 'finalizado':
      case 'completo':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: 'Firmado Digitalmente',
        };
      case 'partially_signed':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: FileSignature,
          label: 'Parcialmente Firmado',
        };
      case 'in_progress':
      case 'en_firma':
        return {
          bg: 'bg-blue-50 text-[#0A3A60] border-blue-200',
          icon: Clock,
          label: 'En Proceso de Firma',
        };
      case 'pending':
      case 'ready_for_signature':
      case 'sent_for_signature':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: 'Pendiente de Firma',
        };
      case 'rejected':
      case 'rechazado':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          label: 'Firma Rechazada',
        };
      case 'expired':
      case 'vencido':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: AlertCircle,
          label: 'Plazo Vencido',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: FileSignature,
          label: 'Borrador',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center font-bold rounded-full border ${style.bg} ${sizeClasses}`}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{style.label}</span>
      </span>

      {mode !== 'live' && (
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
          {mode === 'test' ? 'TEST' : 'DEMO'}
        </span>
      )}
    </div>
  );
};
