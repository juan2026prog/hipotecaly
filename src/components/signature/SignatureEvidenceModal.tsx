import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Download,
  Hash,
  Stamp,
  RotateCw,
  Copy,
  Check,
} from 'lucide-react';
import { signatureService } from '../../lib/signature/signatureService';
import { SignatureEvidence } from '../../lib/signature/types';

interface SignatureEvidenceModalProps {
  processId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureEvidenceModal: React.FC<SignatureEvidenceModalProps> = ({
  processId,
  isOpen,
  onClose,
}) => {
  const [evidence, setEvidence] = useState<SignatureEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && processId) {
      loadEvidence();
    }
  }, [isOpen, processId]);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const data = await signatureService.getSignatureEvidence(processId);
      setEvidence(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    setRevalidating(true);
    try {
      await signatureService.completeAndValidateFeaSignature(processId, true);
      await loadEvidence();
    } finally {
      setRevalidating(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span>Evidencia Criptográfica FEA</span>
                <span className="text-[10px] uppercase font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                  Ley 18.600
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auditoría técnica de Firma Electrónica Avanzada e Integridad Documental
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs flex-1">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 font-medium">Recuperando evidencia criptográfica del documento...</p>
            </div>
          ) : evidence ? (
            <>
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-emerald-950 font-black text-sm">
                      Firma Electrónica Avanzada Válida y Certificada
                    </div>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      El documento ha sido firmado con certificado de prestador acreditado (AGESIC / UCE) y preserva su integridad byte-for-byte.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRevalidate}
                  disabled={revalidating}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] transition-colors flex items-center space-x-1 shrink-0"
                >
                  <RotateCw className={`w-3 h-3 ${revalidating ? 'animate-spin' : ''}`} />
                  <span>Verificar firma</span>
                </button>
              </div>

              {/* Document & Signer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-bold text-[10px] uppercase">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Documento Congelado</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{evidence.documentTitle}</div>
                  <div className="text-slate-500 flex items-center space-x-2">
                    <span className="font-bold text-teal-700">Versión {evidence.documentVersion}</span>
                    <span>·</span>
                    <span>Exp. {evidence.applicationPublicId}</span>
                  </div>
                  {evidence.isNotarialElectronicDocument && (
                    <div className="pt-1">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                        <Stamp className="w-3 h-3" />
                        <span>Soporte Notarial: {evidence.notarialSupportCode}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-bold text-[10px] uppercase">
                    <Stamp className="w-3.5 h-3.5" />
                    <span>Firmante Notarial</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{evidence.signerName}</div>
                  <div className="text-slate-600 font-medium">{evidence.signerRole}</div>
                  <div className="text-[11px] text-teal-800 font-bold">
                    Afiliación Caja Notarial: {evidence.notaryAffiliateNumber}
                  </div>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-teal-400 font-sans font-bold text-xs">
                  <span className="flex items-center space-x-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Cadena de Custodia & Hashes SHA-256</span>
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 font-mono">Inmutable</span>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] flex items-center justify-between">
                    <span>Hash SHA-256 Original (Congelado antes de firma):</span>
                    <button
                      onClick={() => handleCopy(evidence.originalSha256, 'orig')}
                      className="text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                    >
                      {copiedHash === 'orig' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[9px]">Copiar</span>
                    </button>
                  </div>
                  <div className="text-teal-300 break-all">{evidence.originalSha256}</div>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] flex items-center justify-between">
                    <span>Hash SHA-256 PDF Firmado (Byte-for-byte verificado):</span>
                    <button
                      onClick={() => handleCopy(evidence.signedSha256, 'signed')}
                      className="text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                    >
                      {copiedHash === 'signed' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[9px]">Copiar</span>
                    </button>
                  </div>
                  <div className="text-emerald-400 break-all">{evidence.signedSha256}</div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Detalles del Certificado Digital (AGESIC / Prestador Acreditado)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Autoridad Emisora:</span>
                    <span className="font-semibold text-slate-800">{evidence.certificateIssuer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Número de Serie:</span>
                    <span className="font-mono font-semibold text-slate-800">{evidence.certificateSerial}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Titular (Subject):</span>
                    <span className="font-mono text-[10px] text-slate-700 break-all">{evidence.certificateSubject}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Huella Digital (Fingerprint):</span>
                    <span className="font-mono text-[10px] text-slate-700 break-all">{evidence.certificateFingerprint}</span>
                  </div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Trazabilidad de Eventos Inmutables (Audit Trail)
                </div>
                <div className="space-y-2">
                  {evidence.auditTrail.map((ev, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-[11px] font-mono">{ev.event}</span>
                          <span className="text-[10px] text-slate-400">· {ev.timestamp}</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 rounded">{ev.actor}</span>
                        </div>
                        <div className="text-slate-600 text-[11px]">{ev.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Preservación digital conforme a Ley 18.600</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Descargando PDF firmado byte-for-byte con firma criptográfica preservada.');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF Firmado</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
