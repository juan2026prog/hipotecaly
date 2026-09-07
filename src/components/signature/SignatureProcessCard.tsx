import React, { useState } from 'react';
import {
  FileSignature,
  Hash,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

import { SignatureStatusBadge } from './SignatureStatusBadge';
import { SignerTimeline } from './SignerTimeline';
import { MockSigningModal } from './MockSigningModal';
import { Button } from '../ui/Button';

interface SignatureProcessCardProps {
  process: any;
  onRefresh?: () => void;
}

export const SignatureProcessCard: React.FC<SignatureProcessCardProps> = ({
  process,
  onRefresh,
}) => {
  const [showMockModal, setShowMockModal] = useState(false);

  const status = process.status || 'pending';
  const mode = process.mode || 'mock';
  const provider = process.provider === 'firma_gub' ? 'Firma.gub.uy (AGESIC)' : 'Firma Electrónica (Mock)';
  const isSigned = status === 'signed';

  const documents = process.documents || [];
  const signers = process.signers || [];
  const primaryDoc = documents[0] || { title: 'Documento de Crédito Hipotecario' };

  return (
    <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isSigned ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Proceso #{process.provider_process_id || process.id?.slice(0, 8)}
            </span>
            <h4 className="text-sm font-bold text-navy">{primaryDoc.title}</h4>
          </div>
        </div>

        <SignatureStatusBadge status={status} mode={mode} size="md" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Proveedor</span>
          <span className="font-semibold text-navy">{provider}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Creación</span>
          <span className="font-semibold text-navy">
            {process.created_at ? new Date(process.created_at).toLocaleDateString('es-UY') : '-'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Conclusión</span>
          <span className="font-semibold text-navy">
            {process.completed_at
              ? new Date(process.completed_at).toLocaleDateString('es-UY')
              : 'En curso'}
          </span>
        </div>
      </div>

      {/* Hash SHA-256 de Origen y Firmado */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center">
            <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" /> Integridad Criptográfica (SHA-256)
          </span>
          {isSigned && (
            <span className="text-emerald-700 font-bold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verificado
            </span>
          )}
        </div>

        <div className="font-mono text-[10px] space-y-1 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 select-none">ORIGINAL: </span>
            <span className="select-all">
              {primaryDoc.sha256_original || primaryDoc.sha256Original || 'c7e8a9f...389b (SHA-256)'}
            </span>
          </div>
          {isSigned && (
            <div>
              <span className="text-emerald-700 select-none font-bold">FIRMADO:  </span>
              <span className="text-emerald-800 font-bold select-all">
                {primaryDoc.sha256_signed || primaryDoc.sha256Signed || 'e1b489a...912f (SHA-256)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Firmantes Timeline */}
      <SignerTimeline signers={signers} />

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-slate-400">
          {isSigned ? '✓ Todos los firmantes completaron el proceso' : 'Esperando firma de las partes'}
        </span>

        <div className="flex items-center space-x-2">
          {!isSigned && mode === 'mock' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMockModal(true)}
              className="text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              Simular Firma Demo
            </Button>
          )}

          {!isSigned && process.signing_url && (
            <a
              href={process.signing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded-btn bg-brand-green text-white text-xs font-bold hover:bg-brand-green-dark transition-colors"
            >
              Ir a Firmar <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          )}

          {isSigned && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Descargando documento firmado con certificado digital...')}
              className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-brand-green" />
              Descargar PDF Firmado
            </Button>
          )}
        </div>
      </div>

      <MockSigningModal
        isOpen={showMockModal}
        processId={process.provider_process_id || process.id}
        documentTitle={primaryDoc.title}
        signerName={signers[0]?.name || 'Titular'}
        onClose={() => setShowMockModal(false)}
        onSigned={() => {
          setShowMockModal(false);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
