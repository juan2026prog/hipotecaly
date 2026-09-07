import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { KycStatus } from '../../lib/siteos/identity/types';

interface KycStatusBadgeProps {
  status: KycStatus | string;
  mode?: 'mock' | 'test' | 'live';
  size?: 'sm' | 'md' | 'lg';
}

export const KycStatusBadge: React.FC<KycStatusBadgeProps> = ({
  status,
  mode = 'mock',
  size = 'md',
}) => {
  const norm = (status || 'created').toLowerCase();

  const getStyle = () => {
    switch (norm) {
      case 'verified':
      case 'approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          label: 'Identidad Verificada',
        };
      case 'pending_review':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: 'En Revisión Notarial',
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-50 text-[#0A3A60] border-blue-200',
          icon: RefreshCw,
          label: 'En Proceso',
        };
      case 'resubmission_required':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: AlertTriangle,
          label: 'Reintento Requerido',
        };
      case 'failed':
      case 'declined':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          label: 'No Aprobada',
        };
      case 'expired':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: Clock,
          label: 'Sesión Expirada',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: ShieldAlert,
          label: 'Pendiente de Verificación',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
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
