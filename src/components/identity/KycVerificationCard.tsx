import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Camera,
} from 'lucide-react';
import { KycStatusBadge } from './KycStatusBadge';
import { KycStartModal } from './KycStartModal';
import { Button } from '../ui/Button';

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
              {isVerified ? 'Verificación de Identidad' : 'Identidad pendiente'}
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

        {canInitiate && !isVerified && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            className="text-xs font-bold !bg-[#102d49] text-white hover:!bg-[#071a35] shrink-0"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
            Verificar identidad
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
