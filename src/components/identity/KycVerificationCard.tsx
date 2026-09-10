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
  caseId: string;
  applicantName?: string;
  applicantCi?: string;
  canInitiate?: boolean;
}

export const KycVerificationCard: React.FC<KycVerificationCardProps> = ({
  caseId,
  applicantName,
  applicantCi,
  canInitiate = true,
}) => {
  const [verification, setVerification] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async () => {
    if (!caseId) return;
    try {
      // Intentar recuperar de backend por caseId
      const res = await fetch(`/api/integrations/kyc/status?caseId=${encodeURIComponent(caseId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.verification) {
          setVerification(json.verification);
        }
      }
    } catch {
      // Fallback
    }
  };


  useEffect(() => {
    fetchStatus();
  }, [caseId]);

  const currentStatus = verification?.status || 'created';
  const mode = verification?.mode || 'mock';
  const provider = verification?.provider || 'Didit';
  const isVerified = currentStatus === 'verified' || currentStatus === 'approved';

  return (
    <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
              Verificación de Identidad (KYC)
            </h4>
            <p className="text-[11px] text-slate-400">
              Titular: <strong className="text-slate-700">{applicantName || 'Solicitante'}</strong>
              {applicantCi && ` · CI: ${applicantCi}`}
            </p>
          </div>
        </div>

        <KycStatusBadge status={currentStatus} mode={mode} size="md" />
      </div>

      {/* Detalles del proveedor y validaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Proveedor</span>
          <span className="font-semibold text-navy capitalize">{provider}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Biometría / Liveness</span>
          <span className="font-semibold text-navy flex items-center">
            {isVerified ? (
              <span className="text-emerald-700 font-bold flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Rostro Comprobado
              </span>
            ) : (
              <span className="text-slate-400">Pendiente de captura</span>
            )}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Validación</span>
          <span className="font-semibold text-navy">
            {verification?.completed_at
              ? new Date(verification.completed_at).toLocaleDateString('es-UY')
              : 'Sin registrar'}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          {isVerified
            ? '✓ Identidad verificada de conformidad con estándares KYC'
            : 'Se requiere validación biométrica antes del desembolso'}
        </span>

        {canInitiate && !isVerified && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            className="text-xs font-bold bg-brand-green text-white"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            Iniciar KYC
          </Button>
        )}
      </div>

      {/* Modal de inicio */}
      <KycStartModal
        isOpen={showModal}
        caseId={caseId}
        applicantName={applicantName}
        onClose={() => setShowModal(false)}
        onSessionCreated={(session) => {
          setVerification({
            ...verification,
            status: session.status,
            mode: session.mode,
            provider: session.provider,
          });
          setShowModal(false);


          // Si hay sessionUrl externa o simulada
          if (session?.sessionUrl && !session.sessionUrl.includes('mock.internal')) {
            window.open(session.sessionUrl, '_blank');
          }
        }}
      />
    </div>
  );
};
