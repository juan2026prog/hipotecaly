import React, { useState } from 'react';
import { FileSignature, X, ArrowRight, Stamp } from 'lucide-react';
import { Button } from '../ui/Button';


interface MockSigningModalProps {
  isOpen: boolean;
  processId: string;
  documentTitle?: string;
  signerName?: string;
  onClose: () => void;
  onSigned: () => void;
}

export const MockSigningModal: React.FC<MockSigningModalProps> = ({
  isOpen,
  processId,
  documentTitle = 'Documento Legal Hipotecario',
  signerName = 'Titular del Crédito',
  onClose,
  onSigned,
}) => {
  const [signingMechanism, setSigningMechanism] = useState<'tuid' | 'abitab' | 'ci_electronica'>('tuid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSign = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/signature/mock-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processId,
          signerIndex: 0,
          evidenceNote: `Firma simulada con mecanismo ${signingMechanism.toUpperCase()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Error al firmar documento.');
      }

      onSigned();
    } catch (err: any) {
      setError(err?.message || 'Error en la simulación de firma.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-card max-w-lg w-full p-6 border border-slate-border shadow-floating space-y-6 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Banner de simulación DEMO */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col space-y-1 text-amber-900 text-xs">
          <div className="flex items-center space-x-2 font-bold">
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
              DEMO / SIMULACIÓN
            </span>
            <span className="flex items-center space-x-1 text-amber-900 font-bold text-xs">
              <Stamp className="w-3.5 h-3.5 text-amber-700" />
              <span>Modo Demostración</span>
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-tight">
            Esta función se encuentra en modo demostración. No genera una firma electrónica avanzada con validez productiva.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Firma Digital Avanzada
            </span>
            <h3 className="text-lg font-extrabold text-navy">Firma Electrónica de Documento</h3>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <p className="text-slate-500">Documento:</p>
          <p className="font-bold text-navy text-sm">{documentTitle}</p>
          <p className="text-slate-500 pt-1">Firmante: <strong className="text-navy">{signerName}</strong></p>
        </div>

        {/* Selección de mecanismo compatible con Firma.gub.uy */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Mecanismo de Firma Electrónica a Simular:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSigningMechanism('tuid')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                signingMechanism === 'tuid'
                  ? 'border-brand-green bg-brand-green-light/20 text-brand-green-dark ring-2 ring-brand-green/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              TuID Antel
            </button>
            <button
              type="button"
              onClick={() => setSigningMechanism('abitab')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                signingMechanism === 'abitab'
                  ? 'border-brand-green bg-brand-green-light/20 text-brand-green-dark ring-2 ring-brand-green/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              Identidad Abitab
            </button>
            <button
              type="button"
              onClick={() => setSigningMechanism('ci_electronica')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                signingMechanism === 'ci_electronica'
                  ? 'border-brand-green bg-brand-green-light/20 text-brand-green-dark ring-2 ring-brand-green/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              Cédula Digital
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading} className="text-xs">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSign}
            disabled={loading}
            className="text-xs font-bold bg-brand-green text-white"
          >
            {loading ? 'Aplicando firma digital...' : 'Firmar Documento'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
