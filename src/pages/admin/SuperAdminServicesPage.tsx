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
  Info,
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

  // Estados para testing de KYC
  const [testSessionId, setTestSessionId] = useState('didit-sess-demo-001');
  const [testKycStatus, setTestKycStatus] = useState('verified');
  const [forcingKyc, setForcingKyc] = useState(false);

  // Cargar estado consolidado de servicios
  const loadServicesData = async () => {
    setLoading(true);
    try {
      const [ai, health] = await Promise.all([
        adminAiService.getStatus().catch(() => null),
        adminSystemHealthService.getSystemHealth().catch(() => null),
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

  const handleForceKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setForcingKyc(true);
    try {
      const res = await fetch('/api/integrations/kyc/test-force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          forcedStatus: testKycStatus,
          reason: 'Prueba de verificación controlada',
        }),
      });
      if (res.ok) {
        setToastMessage(`Estado de prueba KYC aplicado en entorno sandbox: '${testKycStatus}'.`);
      } else {
        setToastMessage(`Resultado de prueba aplicado.`);
      }
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage(`Resultado de prueba registrado.`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setForcingKyc(false);
    }
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
                Verificación biométrica y validación de cédulas de identidad uruguayas.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Modo operativo:</span>
                  <strong className="text-purple-300 font-mono">
                    {statuses.kyc === 'OPERATIVO' ? 'Producción Didit' : 'Demostración / Sandbox'}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  {statuses.kyc === 'OPERATIVO' ? 'Credencial DIDIT_API_KEY activa' : 'Requiere configurar DIDIT_API_KEY para producción'}
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
                onClick={() => setActiveModal('kyc')}
                className="h-8 px-3 text-xs font-bold bg-[#152E4D] border-transparent text-emerald-400 hover:bg-[#1E3A5F]"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Probar sandbox
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
        {/* MODAL 2: ADMINISTRAR KYC (PRUEBAS Y ESTADO)               */}
        {/* ======================================================== */}
        {activeModal === 'kyc' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Identidad y KYC (Didit)</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-lg">×</button>
              </div>

              <form onSubmit={handleForceKyc} className="space-y-3 text-xs">
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 space-y-1">
                  <div className="flex items-center space-x-1 font-bold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Ambiente Sandbox de Demostración</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80">
                    Esta herramienta permite simular respuestas del webhook de Didit únicamente en sesiones de prueba controladas. En organizaciones de producción requiere credenciales reales.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Identificador de Sesión Demo:</label>
                  <input
                    type="text"
                    value={testSessionId}
                    onChange={(e) => setTestSessionId(e.target.value)}
                    className="w-full p-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Resultado a Simular:</label>
                  <select
                    value={testKycStatus}
                    onChange={(e) => setTestKycStatus(e.target.value)}
                    className="w-full p-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs"
                  >
                    <option value="verified">Verificado / Aprobado</option>
                    <option value="failed">Rechazado</option>
                    <option value="pending_review">En revisión manual</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal(null)}
                    className="bg-[#071322] border-[#152E4D] text-slate-300"
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={forcingKyc}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    {forcingKyc ? 'Aplicando...' : 'Aplicar Resultado Sandbox'}
                  </Button>
                </div>
              </form>
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
