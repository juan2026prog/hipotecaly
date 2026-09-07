import React from 'react';
import { CheckCircle2, XCircle, User } from 'lucide-react';
import { SignerConfig } from '../../lib/siteos/signature/types';


interface SignerTimelineProps {
  signers: SignerConfig[];
}

export const SignerTimeline: React.FC<SignerTimelineProps> = ({ signers }) => {
  if (!signers || signers.length === 0) {
    return <p className="text-xs text-slate-400 italic">No hay firmantes asignados a este proceso.</p>;
  }

  return (
    <div className="space-y-3">
      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Estado de Firmantes ({signers.filter((s) => s.status === 'signed').length}/{signers.length})
      </h5>
      <div className="space-y-2">
        {signers.map((s, idx) => {
          const isSigned = s.status === 'signed';
          const isRejected = s.status === 'rejected' || s.status === 'failed';
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSigned
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isSigned ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isRejected ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-navy leading-tight">{s.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {s.role} · {s.email}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSigned
                      ? 'bg-emerald-50 text-emerald-700'
                      : isRejected
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isSigned ? 'Firmado' : isRejected ? 'Rechazado' : 'Pendiente'}
                </span>
                {s.signedAt && (
                  <span className="block text-[9px] text-slate-400 mt-0.5">
                    {new Date(s.signedAt).toLocaleDateString('es-UY')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
