import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Camera,
  RefreshCw,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { KycStatusBadge } from './KycStatusBadge';
import { KycStartModal } from './KycStartModal';
import { Button } from '../ui/Button';

// ==============================================================================
// 1. BANNER DE RECORDATORIO PERSISTENTE (No invasivo)
// ==============================================================================
export interface KycReminderBannerProps {
  kycStatus?: string;
  onStartKyc: () => void;
  applicantName?: string;
  className?: string;
}

export const KycReminderBanner: React.FC<KycReminderBannerProps> = ({
  kycStatus = 'not_started',
  onStartKyc,
  applicantName,
  className = '',
}) => {
  const norm = (kycStatus || 'not_started').toLowerCase().trim();

  // Si ya está verificado, no mostramos el banner de recordatorio pendiente
  if (norm === 'verified' || norm === 'approved') {
    return null;
  }

  const getConfig = () => {
    switch (norm) {
      case 'in_progress':
        return {
          bg: 'bg-blue-50/90 border-blue-200 text-[#0A3A60]',
          iconBg: 'bg-blue-100 text-blue-700',
          icon: RefreshCw,
          title: 'Verificación en curso',
          desc: 'Tu sesión de verificación está iniciada. Podés completarla o reabrir el enlace.',
          cta: 'Continuar verificación',
        };
      case 'pending_review':
      case 'in_review':
        return {
          bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
          iconBg: 'bg-amber-100 text-amber-700',
          icon: Clock,
          title: 'Tu identidad está siendo revisada',
          desc: 'Nuestro equipo y el sistema de cumplimiento están validando tus documentos.',
          cta: null,
        };
      case 'failed':
      case 'declined':
        return {
          bg: 'bg-rose-50/90 border-rose-200 text-rose-900',
          iconBg: 'bg-rose-100 text-rose-700',
          icon: XCircle,
          title: 'No pudimos verificar tu identidad',
          desc: 'Hubo un inconveniente con los documentos o la validación biométrica.',
          cta: 'Intentar nuevamente',
        };
      case 'resubmission_required':
        return {
          bg: 'bg-orange-50/90 border-orange-200 text-orange-900',
          iconBg: 'bg-orange-100 text-orange-700',
          icon: AlertTriangle,
          title: 'Necesitamos que repitas la verificación',
          desc: 'Por favor reintentá la captura con mejor iluminación o documento más legible.',
          cta: 'Reintentar',
        };
      case 'expired':
        return {
          bg: 'bg-slate-100/90 border-slate-300 text-slate-800',
          iconBg: 'bg-slate-200 text-slate-600',
          icon: Clock,
          title: 'La sesión de verificación expiró',
          desc: 'El tiempo límite de la sesión caducó.',
          cta: 'Iniciar nueva verificación',
        };
      case 'not_started':
      case 'created':
      default:
        return {
          bg: 'bg-amber-50/90 border-amber-200/90 text-amber-950',
          iconBg: 'bg-amber-100 text-amber-800',
          icon: ShieldAlert,
          title: 'Identidad pendiente',
          desc: 'Necesaria antes de enviar tu solicitud.',
          cta: 'Verificar identidad',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${config.bg} ${className} flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left`}
    >
      <div className="flex items-start sm:items-center space-x-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
          <Icon className={`w-5 h-5 ${norm === 'in_progress' ? 'animate-spin-slow' : ''}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold tracking-tight text-navy">
              {config.title}
            </h4>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-300/60">
              Pendiente
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-normal">
            {config.desc}{applicantName ? ` (${applicantName})` : ''}
          </p>
        </div>
      </div>

      {config.cta && (
        <div className="flex items-center shrink-0 self-end sm:self-auto">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onStartKyc}
            className="text-xs font-bold !bg-[#102d49] text-white hover:!bg-[#071a35] !rounded-xl shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
            {config.cta}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#f4b43b]" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// 2. TARJETA COMPLETA DE VERIFICACIÓN KYC
// ==============================================================================
interface KycVerificationCardProps {
  caseId?: string;
  applicantName?: string;
  applicantCi?: string;
  canInitiate?: boolean;
  onStatusChange?: (status: string) => void;
}

export const KycVerificationCard: React.FC<KycVerificationCardProps> = ({
  caseId = 'user-kyc-session',
  applicantName,
  applicantCi,
  canInitiate = true,
  onStatusChange,
}) => {
  const [verification, setVerification] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/integrations/kyc/status?caseId=${encodeURIComponent(caseId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.verification) {
          setVerification(json.verification);
          if (onStatusChange) {
            onStatusChange(json.verification.status);
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [caseId]);

  const currentStatus = verification?.status || 'not_started';
  const mode = verification?.mode || 'didit';
  const provider = verification?.provider || 'Didit';
  const isVerified = currentStatus === 'verified' || currentStatus === 'approved';

  const getCtaLabel = () => {
    switch (currentStatus) {
      case 'in_progress':
        return 'Continuar verificación';
      case 'failed':
      case 'declined':
        return 'Intentar nuevamente';
      case 'resubmission_required':
        return 'Reintentar';
      case 'expired':
        return 'Iniciar nueva verificación';
      case 'not_started':
      case 'created':
      default:
        return 'Verificar identidad';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy">
              {isVerified ? 'Identidad verificada' : 'Identidad pendiente'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVerified
                ? `Titular: ${applicantName || 'Solicitante'}${applicantCi ? ` · CI: ${applicantCi}` : ''}`
                : 'Necesaria antes de enviar tu solicitud'}
            </p>
          </div>
        </div>

        <KycStatusBadge status={currentStatus} mode={mode} size="md" />
      </div>

      {/* Detalles del proveedor y validaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Proveedor KYC</span>
          <span className="font-semibold text-navy capitalize">{provider}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Prueba Biométrica</span>
          <span className="font-semibold text-navy flex items-center">
            {isVerified ? (
              <span className="text-emerald-700 font-bold flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Validada
              </span>
            ) : (
              <span className="text-slate-400">Pendiente de selfie y documento</span>
            )}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Validación</span>
          <span className="font-semibold text-navy">
            {verification?.completed_at
              ? new Date(verification.completed_at).toLocaleDateString('es-UY')
              : 'Sin registrar'}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          {isVerified
            ? '✓ Identidad verificada conforme a estándares crediticios y normativos'
            : 'Tu solicitud se guardará como borrador hasta completar la verificación de identidad.'}
        </span>

        {canInitiate && !isVerified && currentStatus !== 'pending_review' && currentStatus !== 'in_review' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            className="text-xs font-bold !bg-[#102d49] text-white hover:!bg-[#071a35] shrink-0 !rounded-xl"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
            {getCtaLabel()}
          </Button>
        )}
      </div>

      {/* Modal de inicio KYC */}
      <KycStartModal
        isOpen={showModal}
        caseId={caseId}
        applicantName={applicantName}
        onClose={() => setShowModal(false)}
        onSessionCreated={(session) => {
          setVerification({
            ...verification,
            status: session.status || 'in_progress',
            mode: session.mode,
            provider: session.provider,
          });
          setShowModal(false);
          if (onStatusChange) {
            onStatusChange(session.status || 'in_progress');
          }
        }}
      />
    </div>
  );
};

