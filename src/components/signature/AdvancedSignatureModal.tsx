import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Key,
  Cloud,
  Stamp,
  RotateCw,
} from 'lucide-react';
import { signatureService } from '../../lib/signature/signatureService';
import {
  SignatureMechanism,
  SIGNATURE_MECHANISMS,
  SignatureProcess,
  SignatureValidationResult,
} from '../../lib/signature/types';

interface AdvancedSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentVersion: number;
  applicationId: string;
  applicationPublicId: string;
  generatedDocumentId?: string;
  notaryUserId?: string;
  onSignatureCompleted?: (process: SignatureProcess, validation: SignatureValidationResult) => void;
}

export const AdvancedSignatureModal: React.FC<AdvancedSignatureModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentVersion,
  applicationId,
  applicationPublicId,
  generatedDocumentId = 'doc-gen-001',
  notaryUserId = 'u-test-notary',
  onSignatureCompleted,
}) => {
  const [step, setStep] = useState<'confirm' | 'gateway' | 'validating' | 'success' | 'error'>('confirm');
  const [mechanism, setMechanism] = useState<SignatureMechanism>('cloud_fea');
  const [isNotarialDoc, setIsNotarialDoc] = useState(true);
  const [notarialSupportCode, setNotarialSupportCode] = useState('SNE-2026-UY-48291-0021');
  const [processData, setProcessData] = useState<SignatureProcess | null>(null);
  const [validationData, setValidationData] = useState<SignatureValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hash inicial pre-congelamiento simulado
  const preFreezeHash = '8f542a1b9e02c7891234567890abcdef482910fedcba0987654321fedcba0987';

  if (!isOpen) return null;

  const handleStartSignature = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signatureService.initiateNotaryFeaProcess({
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        applicationId,
        generatedDocumentId,
        documentVersion,
        documentTitle,
        notaryUserId,
        mechanism,
        isNotarialDoc,
        requiresNotarialSupport: isNotarialDoc,
        notarialSupportCode: isNotarialDoc ? notarialSupportCode : undefined,
        returnUrl: window.location.href,
        notificationUrl: `${window.location.origin}/api/signature/callback`,
      });

      if (result.error) {
        setErrorMessage(result.error);
        setStep('error');
      } else {
        setProcessData(result.process);
        setStep('gateway');
      }
    } catch {
      setErrorMessage('Error al conectar con la pasarela de Firma.gub.uy');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGatewayReturn = async (success = true) => {
    setStep('validating');
    setTimeout(async () => {
      if (!processData) return;
      const res = await signatureService.completeAndValidateFeaSignature(processData.id, success);
      if (res.success) {
        setValidationData(res.validation);
        setProcessData(res.process);
        setStep('success');
        if (onSignatureCompleted) {
          onSignatureCompleted(res.process, res.validation);
        }
      } else {
        setErrorMessage('La validación criptográfica o la identidad del certificado falló.');
        setValidationData(res.validation);
        setStep('error');
      }
    }, 1800);
  };

  const getMechanismIcon = (id: SignatureMechanism) => {
    switch (id) {
      case 'cloud_fea':
        return <Cloud className="w-5 h-5 text-teal-600" />;
      case 'chip_id':
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      case 'crypto_token':
        return <Key className="w-5 h-5 text-amber-600" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Stamp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Firma Electrónica Avanzada (FEA)
              </h3>
              <p className="text-xs text-slate-400">
                Firma oficial de Escribano conforme a Ley 18.600 y Firma.gub.uy
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* STEP 1: CONFIRMACIÓN Y BLOQUEO */}
          {step === 'confirm' && (
            <>
              {/* Document Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Documento Apto para Firma
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {applicationPublicId}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {documentTitle} — Versión {documentVersion}
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Estado actual: <strong className="text-slate-800 font-semibold">Listo para Firma</strong></span>
                </div>
              </div>

              {/* Hash & Freezing Warning */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Congelamiento Inmutable de Versión</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Al continuar, esta versión quedará <strong>bloqueada de forma permanente</strong>. Se calculará su huella criptográfica SHA-256 y no podrá ser editada. Cualquier modificación posterior requerirá emitir una nueva versión.
                </p>
                <div className="bg-white/80 p-2 rounded-xl border border-amber-200/80 font-mono text-[10px] text-slate-600 break-all">
                  <span className="font-bold text-slate-800">Hash SHA-256 previo: </span>
                  {preFreezeHash}
                </div>
              </div>

              {/* Mechanism Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Selecciona tu mecanismo personal de Firma Electrónica Avanzada:
                </label>
                <div className="space-y-2">
                  {SIGNATURE_MECHANISMS.map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setMechanism(opt.id)}
                      className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        mechanism === opt.id
                          ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mechanism"
                        checked={mechanism === opt.id}
                        onChange={() => setMechanism(opt.id)}
                        className="mt-1 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getMechanismIcon(opt.id)}
                            <span className="font-bold text-slate-900 text-xs">{opt.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{opt.description}</p>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Dispositivo: {opt.recommendedDevice}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notarial Document Toggle */}
              <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNotarialDoc}
                    onChange={(e) => setIsNotarialDoc(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="font-bold text-purple-950 text-xs">
                    Documento Notarial Electrónico (Reglamento SCJ)
                  </span>
                </label>
                {isNotarialDoc && (
                  <div className="pt-1.5 space-y-1">
                    <label className="text-[10px] font-bold text-purple-900 block uppercase">
                      Código / Serie Soporte Notarial Electrónico:
                    </label>
                    <input
                      type="text"
                      value={notarialSupportCode}
                      onChange={(e) => setNotarialSupportCode(e.target.value)}
                      placeholder="Ej. SNE-2026-UY-48291-0021"
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleStartSignature}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
                >
                  <span>Firmar con Firma Electrónica Avanzada</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: GATEWAY FIRMA.GUB.UY */}
          {step === 'gateway' && processData && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-teal-400 text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <Stamp className="w-4 h-4" />
                    <span>Conexión con Firma.gub.uy (AGESIC)</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {processData.external_process_id}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Has sido conectado con la plataforma oficial de firma digital del Estado Uruguayo. La introducción de tu PIN o autenticación biométrica ocurre directamente en tu dispositivo o proveedor seguro.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Firmante: <strong className="text-white">Esc. María Pérez Morales (CI 3.892.415-8)</strong></div>
                  <div>Mecanismo: <strong className="text-teal-300">{mechanism === 'cloud_fea' ? 'Firma en la Nube' : mechanism === 'chip_id' ? 'Cédula con Chip' : 'Token USB'}</strong></div>
                  <div>Documento: <strong className="text-white">{documentTitle} (v{documentVersion})</strong></div>
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-center space-y-3">
                <p className="text-teal-950 font-bold text-xs">
                  Por favor, confirma la firma en la ventana de tu prestador de firma o continúa aquí:
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => handleSimulateGatewayReturn(true)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simular Firma Exitosa (Firma.gub.uy)</span>
                  </button>
                  <button
                    onClick={() => handleSimulateGatewayReturn(false)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Simular Rechazo / Error
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDANDO */}
          {step === 'validating' && (
            <div className="text-center py-10 space-y-4">
              <RotateCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm">Validando Firma Electrónica Avanzada...</h4>
                <p className="text-slate-500 text-xs">
                  Comprobando coincidencia de identidad notarial, certificado AGESIC y preservación byte-for-byte del PDF.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: ÉXITO */}
          {step === 'success' && validationData && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-emerald-950">
                  ¡Documento Firmado y Validado Exitosamente!
                </h4>
                <p className="text-emerald-800 text-xs">
                  La Firma Electrónica Avanzada de la <strong>Esc. María Pérez Morales</strong> ha sido incorporada al expediente con plena validez jurídica.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="text-slate-500 flex justify-between font-sans text-xs font-bold">
                  <span>Resultado Criptográfico</span>
                  <span className="text-emerald-600">✓ ÍNTEGRO</span>
                </div>
                <div className="text-slate-700">
                  <strong>Firmante: </strong>{validationData.signerName} ({validationData.documentNumber})
                </div>
                <div className="text-slate-700">
                  <strong>Emisor: </strong>{validationData.certificateIssuer}
                </div>
                <div className="text-slate-700">
                  <strong>Sello de Tiempo: </strong>TSA Verificado
                </div>
                <div className="text-slate-700 break-all">
                  <strong>Hash Firmado: </strong>{validationData.signedHash}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Finalizar y Volver al Expediente
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ERROR */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-rose-950">
                  No se pudo validar la Firma Electrónica Avanzada
                </h4>
                <p className="text-rose-800 text-xs">
                  {errorMessage || 'El documento no pudo ser autenticado contra el certificado del escribano asignado.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setStep('confirm')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition-colors"
                >
                  Reintentar
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
