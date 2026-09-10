import React, { useState } from 'react';
import { Shield, CheckCircle2, Lock, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface KycStartModalProps {
  isOpen: boolean;
  caseId?: string;
  userId?: string;
  applicantName?: string;
  onClose: () => void;
  onSessionCreated: (session: any) => void;
}

export const KycStartModal: React.FC<KycStartModalProps> = ({
  isOpen,
  caseId,
  userId,
  applicantName,
  onClose,
  onSessionCreated,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener token de sesión Supabase si existe
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

      // 2. Iniciar sesión KYC en el servidor
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

        console.error('[KycStartModal] Error del servidor al iniciar KYC:', errorDetail);
        throw new Error('No se pudo iniciar la verificación de identidad. Por favor, reintente en unos momentos.');
      }

      const data = contentType.includes('application/json')
        ? await res.json()
        : null;

      if (!data?.session) {
        throw new Error('No se recibió la sesión de verificación de identidad.');
      }

      onSessionCreated(data.session);
    } catch (err: any) {
      console.error('[KycStartModal] Error capturado:', err);
      setError(err?.message || 'No se pudo iniciar la verificación de identidad.');
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
            <h3 className="text-lg font-extrabold text-navy">Verificación de Identidad (KYC)</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Para garantizar la seguridad jurídica del expediente y cumplir con la normativa contra el fraude y lavado de activos, requerimos validar la identidad de{' '}
          <strong className="text-navy">{applicantName || 'el titular'}</strong> mediante documento de identidad oficial y prueba biométrica en vivo.
        </p>

        {/* Puntos clave */}
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

        {/* Checkbox de consentimiento */}
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
            className="text-xs font-bold"
          >
            {loading ? 'Preparando verificación...' : 'Iniciar Verificación'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
