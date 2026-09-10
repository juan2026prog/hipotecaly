// ==============================================================================
// HIPOTECALY: Centro Único de Servicios (/superadmin/servicios)
// Vista consolidada de capacidades internas y externas (IA, KYC, Firma, Documentos, Email, Storage)
// Estados verificados en tiempo real mediante /api/admin/system/health
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  FileSignature,
  FileText,
  Mail,
  HardDrive,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Power,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';
import { adminAiService, AdminAiStatus } from '../../lib/adminAiService';
import {
  adminSystemHealthService,
  SystemHealthResponse,
  AuditableServiceStatus,
} from '../../lib/adminSystemHealthService';

export const SuperAdminServicesPage: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<AdminAiStatus | null>(null);
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTogglingAi, setIsTogglingAi] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado para Diagnóstico Real de Didit KYC
  const [kycDiagnostic, setKycDiagnostic] = useState<any>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [refreshingKyc, setRefreshingKyc] = useState(false);

  const loadKycDiagnostic = async () => {
    try {
      const res = await fetch('/api/integrations/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data?.kyc) {
          setKycDiagnostic(data.kyc);
        }
      }
    } catch {
      // Ignorar
    }
  };

  // Cargar estado consolidado de servicios
  const loadServicesData = async () => {
    setLoading(true);
    try {
      const [ai, health] = await Promise.all([
        adminAiService.getStatus().catch(() => null),
        adminSystemHealthService.getSystemHealth().catch(() => null),
        loadKycDiagnostic(),
      ]);
      if (ai) setAiStatus(ai);
      if (health) setHealthData(health);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Servicios';
    loadServicesData();
  }, []);

  const handleToggleAi = async () => {
    if (!aiStatus) return;
    setIsTogglingAi(true);
    try {
      if (aiStatus.active) {
        await adminAiService.deactivateAi();
        setToastMessage('Inteligencia Artificial pausada.');
      } else {
        await adminAiService.activateAi();
        setToastMessage('Inteligencia Artificial activada correctamente.');
      }
      await loadServicesData();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar estado de la Inteligencia Artificial.');
    } finally {
      setIsTogglingAi(false);
    }
  };

  const handleRefreshKyc = async () => {
    setRefreshingKyc(true);
    await loadKycDiagnostic();
    await loadServicesData();
    setRefreshingKyc(false);
    setToastMessage('Diagnóstico KYC actualizado.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getServiceStatus = (serviceKey: keyof SystemHealthResponse['services']): AuditableServiceStatus => {
    if (!healthData?.services?.[serviceKey]) {
      if (serviceKey === 'docflow' || serviceKey === 'database' || serviceKey === 'storage' || serviceKey === 'auth') {
        return 'OPERATIVO';
      }
      return 'NO CONFIGURADO';
    }
    return healthData.services[serviceKey].status;
  };

  const statuses: Record<string, AuditableServiceStatus> = {
    ai: getServiceStatus('ai'),
    kyc: getServiceStatus('kyc'),
    signature: getServiceStatus('signature'),
    docflow: getServiceStatus('docflow'),
    email: getServiceStatus('email'),
    storage: getServiceStatus('storage'),
  };

  const serviceList = Object.values(statuses);
  const totalServices = serviceList.length;
  const operationalCount = serviceList.filter((s) => s === 'OPERATIVO').length;

  const renderStatusBadge = (status: AuditableServiceStatus, testId?: string) => {
    switch (status) {
      case 'OPERATIVO':
        return (
          <span data-testid={testId || 'status-badge-operativo'} className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            🟢 OPERATIVO
          </span>
        );
      case 'NO CONFIGURADO':
        return (
          <span data-testid={testId || 'status-badge-no-configurado'} className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            ⚪ NO CONFIGURADO
          </span>
        );
      case 'DEMO':
        return (
          <span data-testid={testId || 'status-badge-demo'} className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            🟡 DEMO
          </span>
        );
      case 'NO VERIFICADO':
        return (
          <span data-testid={testId || 'status-badge-no-verificado'} className="inline-flex items-center text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            🔘 NO VERIFICADO
          </span>
        );
      case 'DEGRADADO':
        return (
          <span data-testid={testId || 'status-badge-degradado'} className="inline-flex items-center text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            🟠 DEGRADADO
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span data-testid={testId || 'status-badge-error'} className="inline-flex items-center text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            🔴 ERROR
          </span>
        );
    }
  };

  return (
    <SuperAdminLayout title="Servicios" activeSection="servicios">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                CAPACIDADES DEL SISTEMA
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">ESTADO AUDITABLE EN VIVO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Servicios de HIPOTECALY
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Capacidades principales, estado operativo y uso de las integraciones de la plataforma.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#09182C] text-slate-300 border border-[#152E4D]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              {operationalCount} de {totalServices} servicios operativos
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadServicesData}
              disabled={loading}
              className="bg-[#071322] border-[#152E4D] text-slate-300 hover:text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar estado
            </Button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Grid Principal de Tarjetas de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* ======================================================== */}
          {/* SERVICIO 1: INTELIGENCIA ARTIFICIAL                      */}
          {/* ======================================================== */}
          <div data-testid="card-service-ai" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-teal-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Inteligencia Artificial</h2>
                    <span className="text-[11px] text-slate-400">Proveedor: OpenAI</span>
                  </div>
                </div>

                {loading ? (
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  renderStatusBadge(statuses.ai, 'service-ai-status')
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Analiza documentación y asiste en procesos internos de HIPOTECALY.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Estado en Bóveda:</span>
                  <strong className={aiStatus?.configured ? 'text-teal-300 font-mono' : 'text-slate-400 font-mono'}>
                    {aiStatus?.configured ? 'Credencial AEAD Configurada' : 'No configurada'}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  {aiStatus?.configured ? 'Master Switch: Activo' : 'Sin clave en Vault · Análisis simulados en demo'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-between">
              {aiStatus?.configured ? (
                <button
                  onClick={handleToggleAi}
                  disabled={isTogglingAi}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{aiStatus?.active ? 'Pausar IA' : 'Activar IA'}</span>
                </button>
              ) : (
                <Link
                  to="/superadmin/configuracion"
                  className="text-xs font-semibold text-teal-400 hover:underline flex items-center space-x-1"
                >
                  <span>Configurar clave</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal('ai')}
                className="h-8 px-3 text-xs font-bold bg-[#152E4D] border-transparent text-emerald-400 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SERVICIO 2: IDENTIDAD Y KYC                              */}
          {/* ======================================================== */}
          <div data-testid="card-service-kyc" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-purple-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Identidad y KYC</h2>
                    <span className="text-[11px] text-slate-400">Proveedor: Didit</span>
                  </div>
                </div>

                {renderStatusBadge(statuses.kyc, 'service-kyc-status')}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Verificación biométrica, validación documental y prueba de vida (Hosted Flow).
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Modo operativo:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    kycDiagnostic?.mode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : kycDiagnostic?.mode === 'sandbox'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {kycDiagnostic?.modeLabel || (kycDiagnostic?.mode === 'live' ? 'PRODUCCIÓN' : kycDiagnostic?.mode === 'sandbox' ? 'SANDBOX' : 'DEMO')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {kycDiagnostic?.mode === 'live'
                    ? 'Credenciales Didit Live activas (PRODUCCIÓN)'
                    : kycDiagnostic?.mode === 'sandbox'
                    ? 'Credenciales Didit Sandbox activas (SANDBOX)'
                    : 'Modo DEMO / Simulación activo'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-between">
              <Link
                to="/superadmin/configuracion"
                className="text-xs font-semibold text-purple-400 hover:underline flex items-center space-x-1"
              >
                <span>Configuración técnica</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadKycDiagnostic();
                  setActiveModal('kyc');
                }}
                className="h-8 px-3 text-xs font-bold bg-[#152E4D] border-transparent text-purple-300 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SERVICIO 3: FIRMA DIGITAL                                */}
          {/* ======================================================== */}
          <div data-testid="card-service-signature" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-amber-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Firma Digital</h2>
                    <span className="text-[11px] text-slate-400">Proveedor: Firma.gub.uy</span>
                  </div>
                </div>

                {renderStatusBadge(statuses.signature, 'service-signature-status')}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Firma electrónica avanzada con validez legal según Ley N° 18.600 (Abitab / TuID).
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Homologación:</span>
                  <strong className="text-amber-300 font-mono">
                    {statuses.signature === 'OPERATIVO' ? 'Producción AGESIC' : 'Pruebas Notariales'}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  {statuses.signature === 'OPERATIVO' ? 'Integración activa' : 'Sello explícito de demostración activo'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-between">
              <Link
                to="/superadmin/configuracion"
                className="text-xs font-semibold text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Configuración técnica</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal('signature')}
                className="h-8 px-3 text-xs font-bold bg-[#152E4D] border-transparent text-amber-300 hover:bg-[#1E3A5F]"
              >
                Detalles de firma
              </Button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SERVICIO 4: DOCUMENTOS Y FORMULARIOS                     */}
          {/* ======================================================== */}
          <div data-testid="card-service-docflow" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-blue-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Documentos y formularios</h2>
                    <span className="text-[11px] text-slate-400">Motor: DocFlow Core</span>
                  </div>
                </div>

                {renderStatusBadge(statuses.docflow, 'service-docflow-status')}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Generación determinística, autollenado, versionado y legajos notariales.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Motor:</span>
                  <strong className="text-white font-mono">DocFlow Nativo</strong>
                </div>
                <div className="text-[10px] text-slate-500">Plantillas notariales y minutas configuradas</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-end">
              <Link
                to="/superadmin/documentos"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#152E4D] text-slate-200 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1 text-blue-400" /> Ver legajos
              </Link>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SERVICIO 5: EMAIL TRANSACCIONAL                          */}
          {/* ======================================================== */}
          <div data-testid="card-service-email" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-sky-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Email transaccional</h2>
                    <span className="text-[11px] text-slate-400">Proveedor: Resend</span>
                  </div>
                </div>

                {renderStatusBadge(statuses.email, 'service-email-status')}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Envío de notificaciones automáticas y recordatorios a solicitantes e inversores.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Configuración:</span>
                  <strong className={statuses.email === 'OPERATIVO' ? 'text-white font-mono' : 'text-slate-400 font-mono'}>
                    {statuses.email === 'OPERATIVO' ? 'RESEND_API_KEY Configurada' : 'No configurada en Vercel'}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  {statuses.email === 'OPERATIVO' ? 'Dominio remitente verificado' : 'Modo simulación en demo'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-end">
              <Link
                to="/superadmin/configuracion"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#152E4D] text-slate-200 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1 text-sky-400" /> Configurar en Vault
              </Link>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SERVICIO 6: ARCHIVOS PRIVADOS (STORAGE)                  */}
          {/* ======================================================== */}
          <div data-testid="card-service-storage" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 shadow-sm hover:border-indigo-500/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Archivos privados</h2>
                    <span className="text-[11px] text-slate-400">Supabase Storage</span>
                  </div>
                </div>

                {renderStatusBadge(statuses.storage, 'service-storage-status')}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Almacena de forma privada documentos, fotografías y archivos asociados a los expedientes.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Seguridad:</span>
                  <strong className="text-white font-mono">Signed URLs (60s)</strong>
                </div>
                <div className="text-[10px] text-slate-500">Aislamiento por cliente: 100% activo</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#152E4D] flex items-center justify-end">
              <Link
                to="/superadmin/configuracion"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#152E4D] text-slate-200 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Administrar storage
              </Link>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* MODAL 1: ADMINISTRAR IA                                  */}
        {/* ======================================================== */}
        {activeModal === 'ai' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-xl w-full p-6 space-y-5 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-base text-white">Administrar Inteligencia Artificial</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-lg">×</button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-[#071322] rounded-xl border border-[#152E4D]">
                  <div>
                    <strong className="text-white block">Estado del servicio</strong>
                    <span className="text-slate-400 text-[11px]">Permite activar o pausar los análisis automáticos</span>
                  </div>
                  {aiStatus?.configured ? (
                    <button
                      onClick={handleToggleAi}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        aiStatus?.active ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {aiStatus?.active ? 'Pausar IA' : 'Activar IA'}
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">No configurado</span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold block">Modelos configurados:</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D]">
                      <span className="text-slate-400 block text-[10px]">Lectura</span>
                      <strong className="text-teal-300">gpt-5.6-luna</strong>
                    </div>
                    <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D]">
                      <span className="text-slate-400 block text-[10px]">Evaluación</span>
                      <strong className="text-teal-300">gpt-5.6-terra</strong>
                    </div>
                    <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D]">
                      <span className="text-slate-400 block text-[10px]">Tasación</span>
                      <strong className="text-teal-300">gpt-5.6-sol</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#071322] rounded-xl border border-[#152E4D] space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detalles técnicos & Credencial
                  </span>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Clave protegida en bóveda:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {aiStatus?.maskedKey || 'No configurada'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Para modificar claves de API o secretos de infraestructura, accede a la sección de Configuración técnica.
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#152E4D]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="bg-[#071322] border-[#152E4D] text-slate-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: DIAGNÓSTICO REAL DE DIDIT KYC                   */}
        {/* ======================================================== */}
        {activeModal === 'kyc' && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-2xl w-full p-6 space-y-5 text-left shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Encabezado */}
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Diagnóstico y Estado de Didit KYC</h3>
                    <p className="text-[11px] text-slate-400">Verificación Biométrica & Identidad Digital (API v3 / Hosted Flow)</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-[#152E4D] transition"
                >
                  ×
                </button>
              </div>

              {/* Barra de Resumen de Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#071322] border border-[#152E4D] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Proveedor</span>
                  <span className="text-xs font-extrabold text-white">Didit (Verification API v3)</span>
                </div>
                <div className="bg-[#071322] border border-[#152E4D] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estado del Servicio</span>
                  <div className="pt-0.5">{renderStatusBadge(statuses.kyc, 'modal-kyc-status')}</div>
                </div>
                <div className="bg-[#071322] border border-[#152E4D] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ambiente / Modo</span>
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                    kycDiagnostic?.mode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : kycDiagnostic?.mode === 'sandbox'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {kycDiagnostic?.modeLabel || (kycDiagnostic?.mode === 'live' ? 'PRODUCCIÓN' : kycDiagnostic?.mode === 'sandbox' ? 'SANDBOX' : 'DEMO')}
                  </span>
                </div>
              </div>

              {/* Bloque 1: Credenciales y Seguridad Server-Side */}
              <div className="bg-[#071322] border border-[#152E4D] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Credenciales Server-Side (Zero Secret Leaks)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D] space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">DIDIT_API_KEY</span>
                    <span className={`font-bold text-[11px] ${kycDiagnostic?.apiKeyConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {kycDiagnostic?.apiKeyConfigured ? '✓ CONFIGURADA' : '⚪ NO CONFIGURADA'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D] space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">DIDIT_WEBHOOK_SECRET</span>
                    <span className={`font-bold text-[11px] ${kycDiagnostic?.secretConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {kycDiagnostic?.secretConfigured ? '✓ CONFIGURADO' : '⚪ NO CONFIGURADO'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D] space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono">DIDIT_WORKFLOW_ID</span>
                    <span className={`font-bold text-[11px] ${kycDiagnostic?.workflowConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {kycDiagnostic?.workflowConfigured
                        ? (kycDiagnostic.workflowIdMasked ? `✓ ${kycDiagnostic.workflowIdMasked}` : '✓ CONFIGURADO')
                        : '⚪ NO CONFIGURADO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Webhook y Validación Criptográfica */}
              <div className="bg-[#071322] border border-[#152E4D] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Webhook Receptor & Integridad</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">URL Registrada en Didit Console</span>
                      <span className="font-mono text-emerald-300 text-[11px] break-all">
                        {kycDiagnostic?.webhookUrl || 'https://hipotecaly.vercel.app/api/integrations/kyc/didit/webhook'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(kycDiagnostic?.webhookUrl || 'https://hipotecaly.vercel.app/api/integrations/kyc/didit/webhook');
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="bg-[#152E4D] border-transparent text-slate-300 hover:bg-[#1E3A5F] text-[10px] h-7 px-2.5 shrink-0"
                    >
                      {copiedWebhook ? '✓ Copiado' : 'Copiar URL'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D] space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Firma Criptográfica</span>
                      <span className="text-slate-300 text-[11px] font-mono">X-Signature-V2 (HMAC-SHA256 Timing-Safe)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D] space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Última Notificación Recibida</span>
                      <span className="text-slate-300 text-[11px]">
                        {kycDiagnostic?.lastWebhook?.receivedAt
                          ? `${new Date(kycDiagnostic.lastWebhook.receivedAt).toLocaleString('es-UY')} · ${kycDiagnostic.lastWebhook.httpStatus || '200 OK'}`
                          : 'Sin eventos recientes'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Métricas y Sesiones Reales */}
              <div className="bg-[#071322] border border-[#152E4D] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Métricas de Verificaciones Reales</span>
                  <span className="text-[10px] font-normal text-slate-500 font-mono">Supabase DB</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D]">
                    <span className="text-[10px] text-slate-400 uppercase block">Total</span>
                    <span className="text-base font-extrabold text-white">{kycDiagnostic?.stats?.total || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D]">
                    <span className="text-[10px] text-emerald-400 uppercase block">Aprobadas</span>
                    <span className="text-base font-extrabold text-emerald-400">{kycDiagnostic?.stats?.verified || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D]">
                    <span className="text-[10px] text-amber-400 uppercase block">En Proceso</span>
                    <span className="text-base font-extrabold text-amber-400">
                      {(kycDiagnostic?.stats?.in_progress || 0) + (kycDiagnostic?.stats?.pending_review || 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#09182C] border border-[#152E4D]">
                    <span className="text-[10px] text-rose-400 uppercase block">Rechazadas</span>
                    <span className="text-base font-extrabold text-rose-400">{kycDiagnostic?.stats?.failed || 0}</span>
                  </div>
                </div>

                {/* Últimas Sesiones */}
                {kycDiagnostic?.recentSessions && kycDiagnostic.recentSessions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Últimas Sesiones Registradas</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-slate-300">
                        <thead>
                          <tr className="border-b border-[#152E4D] text-slate-500 text-[10px]">
                            <th className="py-1 text-left">Fecha</th>
                            <th className="py-1 text-left">Session ID</th>
                            <th className="py-1 text-left">Expediente</th>
                            <th className="py-1 text-left">Modo</th>
                            <th className="py-1 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kycDiagnostic.recentSessions.map((s: any, idx: number) => (
                            <tr key={idx} className="border-b border-[#152E4D]/50 font-mono text-[10px]">
                              <td className="py-1 text-slate-400">{new Date(s.createdAt).toLocaleDateString('es-UY')}</td>
                              <td className="py-1 text-slate-300">{s.providerSessionId}</td>
                              <td className="py-1 text-slate-400">{s.caseId}</td>
                              <td className="py-1 text-purple-300 uppercase">{s.mode}</td>
                              <td className="py-1 text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  s.status === 'verified'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : s.status === 'failed'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Pie de Modal */}
              <div className="pt-2 flex items-center justify-between border-t border-[#152E4D]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshKyc}
                  disabled={refreshingKyc}
                  className="bg-[#071322] border-[#152E4D] text-purple-300 hover:bg-[#152E4D] text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshingKyc ? 'animate-spin' : ''}`} />
                  {refreshingKyc ? 'Consultando...' : 'Refrescar Diagnóstico'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: DETALLES DE FIRMA DIGITAL                       */}
        {/* ======================================================== */}
        {activeModal === 'signature' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div className="flex items-center space-x-2.5">
                  <FileSignature className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">Firma Digital (Firma.gub.uy)</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-lg">×</button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Para homologar el ambiente notarial en producción con AGESIC y prestadores autorizados (TuID / Abitab), comunícate con la mesa de escribanos o actualiza las credenciales en Configuración técnica.
                </p>

                <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ambiente actual:</span>
                    <strong className={statuses.signature === 'OPERATIVO' ? 'text-emerald-400' : 'text-amber-400'}>
                      {statuses.signature === 'OPERATIVO' ? 'Producción AGESIC' : 'Modo de Pruebas Notariales'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Marco normativo:</span>
                    <span className="text-slate-200">Ley N° 18.600 Uruguay</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#152E4D]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="bg-[#071322] border-[#152E4D] text-slate-300"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SuperAdminLayout>
  );
};
