import React, { useState } from 'react';
import { Shield, CheckCircle2, Lock, X, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface KycStartModalProps {
  isOpen: boolean;
  caseId?: string;
  userId?: string;
  applicantName?: string;
  isInitialPrompt?: boolean;
  onClose: () => void;
  onPostpone?: () => void;
  onSessionCreated: (session: any) => void;
}

export const KycStartModal: React.FC<KycStartModalProps> = ({
  isOpen,
  caseId,
  userId,
  applicantName,
  isInitialPrompt = false,
  onClose,
  onPostpone,
  onSessionCreated,
}) => {
  const [step, setStep] = useState<'prompt' | 'consent'>(isInitialPrompt ? 'prompt' : 'consent');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePostponeClick = () => {
    if (onPostpone) {
      onPostpone();
    } else {
      onClose();
    }
  };

  const handleStart = async () => {
    if (!agreed && step === 'consent') return;
    setLoading(true);
    setError(null);

    // Pre-abrir pestaña para evitar que el bloqueador de popups del navegador la bloquee post-fetch
    let targetWindow: Window | null = null;
    try {
      targetWindow = window.open('about:blank', '_blank');
    } catch {
      // Si falla abrir popup, continuaremos en la misma ventana o fallback
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      let activeUserId = userId;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        if (!activeUserId && session?.user?.id) {
          activeUserId = session.user.id;
        }
      } catch (authErr) {
        console.warn('[KycStartModal] No se pudo obtener sesión de auth:', authErr);
      }

      const res = await fetch('/api/integrations/kyc/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          caseId,
          userId: activeUserId,
          documentType: 'CI',
          country: 'UY',
          vendorData: `case_${caseId || 'demo'}`,
          consentGiven: true,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (!res.ok) {
        let errorDetail = '';
        if (contentType.includes('application/json')) {
          const errJson = await res.json().catch(() => ({}));
          errorDetail = errJson?.message || errJson?.error || `HTTP ${res.status}`;
        } else {
          const rawText = await res.text().catch(() => '');
          errorDetail = rawText.slice(0, 150) || `HTTP ${res.status}`;
        }

        console.error('[Didit KYC Server Error Detail]:', errorDetail);
        throw new Error('No pudimos iniciar la verificación de identidad. Intentá nuevamente.');
      }

      const data = contentType.includes('application/json')
        ? await res.json()
        : null;

      if (!data?.session) {
        throw new Error('No pudimos iniciar la verificación de identidad. Intentá nuevamente.');
      }

      const session = data.session;
      const sessionUrl = session.sessionUrl || session.url;

      if (sessionUrl) {
        if (targetWindow && !targetWindow.closed) {
          targetWindow.location.href = sessionUrl;
        } else {
          window.location.href = sessionUrl;
        }
      } else if (targetWindow && !targetWindow.closed) {
        targetWindow.close();
      }

      onSessionCreated(session);
    } catch (err: any) {
      if (targetWindow && !targetWindow.closed) {
        targetWindow.close();
      }
      console.error('[Didit KYC Exception]:', err);
      setError(err?.message || 'No pudimos iniciar la verificación de identidad. Intentá nuevamente.');
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

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand-green">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
              Validación Oficial de Identidad
            </span>
            <h3 className="text-lg font-extrabold text-navy">Verificación de identidad</h3>
          </div>
        </div>

        {step === 'prompt' ? (
          <>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Para enviar una solicitud hipotecaria necesitamos verificar tu identidad. Podés hacerlo ahora o continuar y verificarla antes del envío.
            </p>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Cédula de Identidad o Pasaporte oficial uruguayo.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Prueba biométrica de vida mediante selfie en tiempo real.</span>
              </div>
              <div className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Proceso seguro y encriptado conforme a la Ley N° 18.331.</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={handlePostponeClick}
                className="w-full sm:w-auto text-xs font-bold order-2 sm:order-1"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Hacerlo más tarde
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep('consent')}
                className="w-full sm:w-auto text-xs font-bold !bg-[#102d49] text-white hover:!bg-[#071a35] order-1 sm:order-2"
              >
                Verificar ahora
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#f4b43b]" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para garantizar la seguridad jurídica del expediente y cumplir con la normativa contra el fraude y lavado de activos, requerimos validar la identidad de{' '}
              <strong className="text-navy">{applicantName || 'el titular'}</strong> mediante documento de identidad oficial y prueba biométrica en vivo.
            </p>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Foto nítida del frente y dorso de la Cédula de Identidad o Pasaporte.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Prueba biométrica de vida (selfie en tiempo real con cámara).</span>
              </div>
              <div className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Cifrado de grado bancario y estricta confidencialidad según Ley N° 18.331.</span>
              </div>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded text-brand-green focus:ring-brand-green mt-0.5"
              />
              <span className="text-[11px] text-slate-600 leading-normal">
                Autorizo el tratamiento de mis datos biométricos y documentales exclusivamente a efectos del análisis y formalización de esta solicitud crediticia.
              </span>
            </label>

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
                onClick={handleStart}
                disabled={!agreed || loading}
                className="text-xs font-bold !bg-[#102d49] text-white"
              >
                {loading ? 'Preparando verificación...' : 'Iniciar Verificación'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#f4b43b]" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
