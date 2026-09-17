import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export type SignatureReturnStatus =
  | 'LOADING'
  | 'SIGNED'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'DEMO'
  | 'NOT_CONFIGURED';

interface SignatureEvidence {
  processId: string;
  documentId?: string;
  signerId?: string;
  organizationId?: string;
  provider: string;
  providerStatus: string;
  status: string;
  sha256Original?: string;
  sha256Signed?: string;
  timestamp?: string;
  isLegalValid?: boolean;
}

export const SignatureReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const processId =
    searchParams.get('signature_process_id') ||
    searchParams.get('process_id') ||
    searchParams.get('id') ||
    searchParams.get('firma_gub_session') ||
    searchParams.get('mock_process_id');

  const caseId = searchParams.get('caseId') || searchParams.get('case_id');
  const documentId = searchParams.get('document_id') || searchParams.get('documentId');
  const signerId = searchParams.get('signer_id') || searchParams.get('signerId');
  const organizationId = searchParams.get('organization_id') || searchParams.get('org_id');

  const [status, setStatus] = useState<SignatureReturnStatus>('LOADING');
  const [evidence, setEvidence] = useState<SignatureEvidence | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveSignatureStatus() {
      if (!processId) {
        if (isMounted) {
          setStatus('NOT_CONFIGURED');
          setErrorMessage('No se proporcionó un identificador de proceso de firma en la URL.');
        }
        return;
      }

      // Si es un identificador explícito de mock o demo
      if (processId.startsWith('mock_') || processId.startsWith('firma_gub_mock_') || searchParams.get('mock_process_id')) {
        if (isMounted) {
          setStatus('DEMO');
          setEvidence({
            processId,
            documentId: documentId || 'DOC-DEMO-001',
            signerId: signerId || 'SIGNER-DEMO',
            organizationId: organizationId || 'DEMO-ORG',
            provider: 'Mock / Demo Simulator',
            providerStatus: 'DEMO_COMPLETED',
            status: 'demo',
            sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            sha256Signed: 'a8f5201b9e02c7891234567890abcdef1234567890abcdef1234567890abcdef',
            timestamp: new Date().toISOString(),
            isLegalValid: false,
          });
        }
        return;
      }

      // Consulta Serverless / DB para procesos reales
      try {
        const res = await fetch(`/api/integrations/signature/status?processId=${encodeURIComponent(processId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.process) {
            const p = data.process;
            const isSigned = p.status === 'signed' || p.status === 'completed';
            const isRejected = p.status === 'rejected' || p.status === 'cancelled';
            const isExpired = p.status === 'expired';

            setStatus(isSigned ? 'SIGNED' : isRejected ? 'REJECTED' : isExpired ? 'EXPIRED' : 'PENDING');
            setEvidence({
              processId: p.id || processId,
              documentId: p.documents?.[0]?.source_document_id || documentId || undefined,
              signerId: p.signers?.[0]?.user_id || signerId || undefined,
              organizationId: p.tenant_id || p.organization_id || organizationId || undefined,
              provider: p.provider || 'firma_gub',
              providerStatus: p.provider_status || p.status,
              status: p.status,
              sha256Original: p.documents?.[0]?.sha256_original,
              sha256Signed: p.documents?.[0]?.sha256_signed || p.signed_sha256,
              timestamp: p.completed_at || p.updated_at || new Date().toISOString(),
              isLegalValid: isSigned,
            });
            return;
          }
        }
      } catch {
        // Fallback a consulta Supabase si la API serverless no está alcanzable
      }

      if (isSupabaseConfigured) {
        try {
          const { data: dbProc, error } = await supabase
            .from('signature_processes')
            .select(`*, documents:signature_documents(*), signers:signature_signers(*)`)
            .or(`id.eq.${processId},provider_process_id.eq.${processId}`)
            .maybeSingle();

          if (!error && dbProc) {
            if (isMounted) {
              const isSigned = dbProc.status === 'signed' || dbProc.status === 'completed';
              const isRejected = dbProc.status === 'rejected' || dbProc.status === 'cancelled';
              const isExpired = dbProc.status === 'expired';

              setStatus(isSigned ? 'SIGNED' : isRejected ? 'REJECTED' : isExpired ? 'EXPIRED' : 'PENDING');
              setEvidence({
                processId: dbProc.id,
                documentId: dbProc.documents?.[0]?.source_document_id || documentId || undefined,
                signerId: dbProc.signers?.[0]?.user_id || signerId || undefined,
                organizationId: dbProc.tenant_id || dbProc.organization_id || organizationId || undefined,
                provider: dbProc.provider || 'firma_gub',
                providerStatus: dbProc.provider_status || dbProc.status,
                status: dbProc.status,
                sha256Original: dbProc.documents?.[0]?.sha256_original,
                sha256Signed: dbProc.documents?.[0]?.sha256_signed,
                timestamp: dbProc.completed_at || dbProc.updated_at || new Date().toISOString(),
                isLegalValid: isSigned,
              });
            }
            return;
          }
        } catch {}
      }

      if (isMounted) {
        setStatus('NOT_CONFIGURED');
        setErrorMessage('El proceso de firma no pudo ser verificado contra la base de datos o el proveedor oficial.');
      }
    }

    resolveSignatureStatus();

    return () => {
      isMounted = false;
    };
  }, [processId, caseId, documentId, signerId, organizationId, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card max-w-lg w-full p-8 border border-slate-border shadow-floating text-center space-y-6 animate-fade-in">
        {status === 'LOADING' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto animate-spin">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-navy">Consultando estado de firma...</h1>
            <p className="text-xs text-slate-500">Verificando evidencia criptográfica en el registro oficial.</p>
          </div>
        )}

        {status === 'SIGNED' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">
                Firma Electrónica Verificada
              </span>
              <h1 className="text-2xl font-extrabold text-navy">Proceso de Firma Completado</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                El documento ha sido firmado conforme y cuenta con evidencia criptográfica registrada.
              </p>
            </div>
          </>
        )}

        {status === 'DEMO' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Modo Demostración Comercial (DEMO)
              </span>
              <h1 className="text-2xl font-extrabold text-navy">Firma Simulada de Prueba</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta es una simulación de firma para evaluación de interfaz. No constituye una firma digital vinculante bajo Ley N° 18.600.
              </p>
            </div>
          </>
        )}

        {status === 'PENDING' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                Firma en Trámite
              </span>
              <h1 className="text-2xl font-extrabold text-navy">Pendiente de Confirmación</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                El proceso de firma fue iniciado pero aún no ha sido confirmado por el proveedor de identidad.
              </p>
            </div>
          </>
        )}

        {(status === 'REJECTED' || status === 'EXPIRED') && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                Firma No Completada
              </span>
              <h1 className="text-2xl font-extrabold text-navy">
                {status === 'EXPIRED' ? 'Proceso Expirado' : 'Firma Rechazada o Cancelada'}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                El proceso de firma no pudo completarse satisfactoriamente.
              </p>
            </div>
          </>
        )}

        {status === 'NOT_CONFIGURED' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Estado: NOT_CONFIGURED
              </span>
              <h1 className="text-2xl font-extrabold text-navy">Sin Evidencia de Firma</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {errorMessage || 'No existe evidencia verificable de firma para los parámetros provistos.'}
              </p>
            </div>
          </>
        )}

        {evidence && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-bold">Proceso:</span>
              <span className="text-navy">{evidence.processId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-bold">Proveedor:</span>
              <span className="text-navy">{evidence.provider}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-bold">Estado Real:</span>
              <span className="font-bold text-navy uppercase">{evidence.providerStatus}</span>
            </div>
            {evidence.sha256Signed && (
              <div className="text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-sans font-bold block mb-0.5">SHA-256 Firmado:</span>
                <span className="text-[10px] break-all text-slate-500">{evidence.sha256Signed}</span>
              </div>
            )}
            {evidence.timestamp && (
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-sans font-bold">Registro:</span>
                <span className="text-[11px] text-slate-500">{new Date(evidence.timestamp).toLocaleString('es-UY')}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Link to={caseId ? `/demo/estudio-nova/admin/solicitudes/${caseId}` : '/mi-cuenta'}>
            <Button variant="primary" size="lg" fullWidth className="text-xs font-bold bg-brand-green text-white">
              Volver al Expediente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link to="/">
            <Button variant="outline" size="md" fullWidth className="text-xs text-slate-600">
              <Home className="w-3.5 h-3.5 mr-1.5" /> Ir al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

