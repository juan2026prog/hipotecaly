import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileSignature,
  Zap,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const SuperAdminIntegrationsTab: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);

  // Estados para herramienta de prueba KYC
  const [testSessionId, setTestSessionId] = useState('didit-sess-demo-001');
  const [testStatus, setTestStatus] = useState('verified');
  const [testReason, setTestReason] = useState('Aprobación forzada por QA');
  const [forcingStatus, setForcingStatus] = useState(false);
  const [forceSuccessMsg, setForceSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/integrations/admin/settings');
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (data && (data.kyc || data.signature)) {
          setSettings(data);
          return;
        }
      }
    } catch {
      // Ignorar y usar fallback
    }

    // Defaults
    setSettings({
      kyc: {
        provider: 'didit',
        mode: 'sandbox',
        configured: true,
        freeTierAllowance: 'Hasta 500 verificaciones/mes según plan vigente (ID + Liveness + Face Match + Device/IP)',
      },
      signature: { provider: 'firma_gub', mode: 'mock', configured: true },
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleForceKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setForcingStatus(true);
    setForceSuccessMsg(null);

    try {
      const res = await fetch('/api/integrations/kyc/test-force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          forcedStatus: testStatus,
          reason: testReason,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (res.ok) {
        setForceSuccessMsg(`✓ Estado forzado exitosamente a '${testStatus.toUpperCase()}'.`);
        setTimeout(() => setForceSuccessMsg(null), 4000);
      } else {
        alert(data?.message || 'Error al forzar estado.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error de red.');
    } finally {
      setForcingStatus(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-2.5 py-0.5 rounded-full">
            SiteOS Universal Integrations
          </span>
          <span className="text-[10px] text-slate-400 font-mono">KYC (Didit) & Digital Signature (Firma.gub.uy) Core</span>
        </div>
        <h2 className="text-xl font-black text-navy mt-1">
          Integraciones de Identidad y Firma Digital
        </h2>
        <p className="text-xs text-slate-500">
          Supervisión de conectividad con Didit Verification API v3 (Hosted Flow), Firma.gub.uy (AGESIC) y gestión BYOK multi-tenant.
        </p>
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Didit KYC */}
        <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy">Didit Identity & KYC</h3>
                <span className="text-[10px] text-slate-400 font-mono">Verification API v3 / Hosted Flow</span>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              {settings?.kyc?.mode || 'SANDBOX'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Proveedor Activo:</span>
              <span className="font-bold text-navy capitalize">{settings?.kyc?.provider || 'Didit'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Webhook Receiver:</span>
              <span className="font-bold text-emerald-700">/api/integrations/kyc/didit/webhook</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Firma Criptográfica:</span>
              <span className="font-bold text-slate-700">X-Signature-V2 (HMAC-SHA256 Timing-Safe)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Credenciales:</span>
              <span className="font-bold text-navy">
                {settings?.kyc?.apiKeyConfigured ? '✓ API Key Configurada (Vault)' : 'Mock / No configurada'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Workflow:</span>
              <span className="font-bold text-slate-700">
                {settings?.kyc?.workflowConfigured ? '✓ Workflow ID Asignado' : 'Default / Tenant Workflow'}
              </span>
            </div>
          </div>

          {/* Banner informativo de Free Tier Didit */}
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/60 text-[11px] text-emerald-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Free Tier Informativo Didit</span>
            </div>
            <p className="text-slate-600 text-[10px] leading-relaxed">
              Core KYC (ID Verification + Passive Liveness + Face Match + Device/IP): hasta 500 verificaciones gratuitas mensuales según plan vigente publicado por Didit. Add-ons opcionales (AML, DNIC UY) configurables bajo demanda.
            </p>
          </div>
        </div>

        {/* Card 2: Firma.gub.uy */}
        <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy">Firma.gub.uy (AGESIC)</h3>
                <span className="text-[10px] text-slate-400 font-mono">Proceso 1 & 2 / TuID / Abitab</span>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              {settings?.signature?.mode || 'MOCK / WAITING'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Proveedor Activo:</span>
              <span className="font-bold text-navy capitalize">{settings?.signature?.provider || 'Firma.gub.uy'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Prefijo API Configurable:</span>
              <span className="font-mono font-bold text-slate-700">{settings?.signature?.apiPrefix || '/api/v1/externos'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Webhook Notificaciones:</span>
              <span className="font-bold text-indigo-700">/api/integrations/signature/firma-gub/webhook</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Integridad Criptográfica:</span>
              <span className="font-bold text-slate-700">Doble Hash SHA-256 (Origen & Destino)</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200/60 text-[11px] text-indigo-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Info className="w-3.5 h-3.5 text-indigo-700" />
              <span>Integración AGESIC</span>
            </div>
            <p className="text-slate-600 text-[10px] leading-relaxed">
              Firma digital avanzada para contratos de hipotecas, minutas notariales y poderes con prestadores autorizados de certificación (TuID Antel / Abitab).
            </p>
          </div>
        </div>

      </div>

      {/* Herramienta de Testing y Forzado de Estados para Super Admin / QA */}
      <div className="bg-slate-900 text-white rounded-card p-6 border border-slate-800 shadow-floating space-y-4">
        <div className="flex items-center space-x-2 text-amber-400">
          <Zap className="w-4 h-4" />
          <h3 className="font-bold text-xs uppercase tracking-wider">
            Consola QA: Forzar Resultado de Verificación KYC (Modos Mock / Sandbox)
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Permite validar el comportamiento end-to-end de la plataforma y el desbloqueo de expedientes simulando decisiones de Didit (Approved, Declined, In Review, Resubmitted, etc.) sin consumir cuotas de API real.
        </p>

        <form onSubmit={handleForceKyc} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
              Session ID / Case ID
            </label>
            <input
              type="text"
              value={testSessionId}
              onChange={(e) => setTestSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-btn bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
              Resultado a Forzar
            </label>
            <select
              value={testStatus}
              onChange={(e) => setTestStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-btn bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-brand-green"
            >
              <option value="verified">Verified / Approved</option>
              <option value="failed">Failed / Declined</option>
              <option value="resubmission_required">Resubmission Required</option>
              <option value="pending_review">In Review / Pending</option>
              <option value="expired">Expired</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
              Motivo / Observación
            </label>
            <input
              type="text"
              value={testReason}
              onChange={(e) => setTestReason(e.target.value)}
              className="w-full px-3 py-2 rounded-btn bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={forcingStatus}
              className="w-full bg-brand-green text-white font-bold text-xs"
            >
              {forcingStatus ? 'Aplicando...' : 'Forzar Estado KYC'}
            </Button>
          </div>
        </form>

        {forceSuccessMsg && (
          <p className="text-xs font-bold text-emerald-400 pt-1">{forceSuccessMsg}</p>
        )}
      </div>
    </div>
  );
};
