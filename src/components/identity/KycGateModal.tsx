import React from 'react';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface KycGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartKyc: () => void;
  applicantName?: string;
}

export const KycGateModal: React.FC<KycGateModalProps> = ({
  isOpen,
  onClose,
  onStartKyc,
  applicantName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-card max-w-lg w-full p-6 border border-slate-border shadow-floating space-y-5 text-left relative">
        <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Requisito Previo al Envío Formal
            </span>
            <h3 className="text-lg font-extrabold text-navy leading-tight">
              Verificá tu identidad para enviar la solicitud
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tu solicitud está guardada. Para enviarla al estudio necesitamos validar tu identidad{applicantName ? ` de ${applicantName}` : ''}.
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
          <p className="font-semibold text-navy">
            ✓ Tu expediente y todos los datos ingresados están a salvo.
          </p>
          <p>
            Al completar la verificación biométrica con tu documento oficial, tu solicitud se enviará inmediatamente para análisis técnico.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-bold order-2 sm:order-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Volver a mi solicitud
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              onStartKyc();
            }}
            className="w-full sm:w-auto text-xs font-bold !bg-[#102d49] text-white hover:!bg-[#071a35] order-1 sm:order-2"
          >
            Verificar identidad
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#f4b43b]" />
          </Button>
        </div>
      </div>
    </div>
  );
};
