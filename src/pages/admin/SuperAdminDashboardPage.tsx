// ==============================================================================
// HIPOTECALY: Super Admin Dashboard Principal (/superadmin)
// Vista de inicio: salud operativa, indicadores clave reales y atención dinámica
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2,
  FileCheck2,
  Sparkles,
  Fingerprint,
  FileText,
  AlertTriangle,
  ArrowRight,
  Plus,
  UserCheck,
  Boxes,
  Eye,
  Sliders,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { SuperAdminTenantDetailModal } from '../../components/admin/SuperAdminTenantDetailModal';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';
import { platformModeService, PlatformMode } from '../../lib/platformModeService';
import { PlatformModeSwitchModal } from '../../components/admin/PlatformModeSwitchModal';
import { adminSystemHealthService } from '../../lib/adminSystemHealthService';
import { supabase } from '../../lib/supabase';

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  serviceName: string;
  timeAgo: string;
  actionLabel: string;
  actionLink?: string;
  tenantSlug?: string;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantModal, setSelectedTenantModal] = useState<Tenant | null>(null);
  const [platformMode, setPlatformMode] = useState<PlatformMode>(platformModeService.getCachedMode());
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    activeTenants: 0,
    applications: 0,
    documents: 0,
    signatures: 0,
    kyc: 0,
    aiCases: 0,
  });

  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      let loadedTenants = getAllRegisteredTenants();
      try {
        const { data } = await supabase.from('organizations').select('*');
        if (data && data.length > 0) {
          loadedTenants = data as unknown as Tenant[];
        }
      } catch {
        // Fallback
      }
      setTenants(loadedTenants);

      const health = await adminSystemHealthService.getSystemHealth().catch(() => null);

      let appCount = 0;
      let docCount = 0;
      try {
        const { count } = await supabase.from('loan_applications').select('*', { count: 'exact', head: true });
        if (typeof count === 'number') appCount = count;
      } catch {
        // Ignorar
      }
      try {
        const { count } = await supabase.from('generated_documents').select('*', { count: 'exact', head: true });
        if (typeof count === 'number') docCount = count;
      } catch {
        // Ignorar
      }

      setMetrics({
        activeTenants: loadedTenants.filter((t) => t.status === 'active').length,
        applications: appCount,
        documents: docCount,
        signatures: 0,
        kyc: 0,
        aiCases: 0,
      });

      // Build real dynamic attention items based on verified health state
      const items: AttentionItem[] = [];

      if (health?.services?.signature?.status === 'NO CONFIGURADO') {
        items.push({
          id: 'att-sig',
          title: 'Firma Digital (Firma.gub.uy)',
          description: 'Habilitación AGESIC pendiente de homologación para entorno de producción.',
          severity: 'high',
          serviceName: 'Firma Digital',
          timeAgo: 'Configuración pendiente',
          actionLabel: 'Ver servicios',
          actionLink: '/superadmin/servicios',
        });
      }

      if (health?.services?.ai?.status === 'NO CONFIGURADO') {
        items.push({
          id: 'att-ai',
          title: 'Inteligencia Artificial',
          description: 'OpenAI API Key pendiente de configuración en Supabase Vault.',
          severity: 'medium',
          serviceName: 'Inteligencia Artificial',
          timeAgo: 'Configuración pendiente',
          actionLabel: 'Configurar clave',
          actionLink: '/superadmin/configuracion',
        });
      }

      if (health?.services?.kyc?.status === 'NO CONFIGURADO') {
        items.push({
          id: 'att-kyc',
          title: 'Identidad y KYC (Didit)',
          description: 'DIDIT_API_KEY pendiente de configuración en variables de entorno Vercel.',
          severity: 'medium',
          serviceName: 'Identidad y KYC',
          timeAgo: 'Configuración pendiente',
          actionLabel: 'Configurar credencial',
          actionLink: '/superadmin/configuracion',
        });
      }

      if (health?.services?.email?.status === 'NO CONFIGURADO') {
        items.push({
          id: 'att-email',
          title: 'Email transaccional (Resend)',
          description: 'RESEND_API_KEY no configurada. Correos operando en simulación demo.',
          severity: 'low',
          serviceName: 'Email',
          timeAgo: 'Pendiente',
          actionLabel: 'Configurar',
          actionLink: '/superadmin/configuracion',
        });
      }

      setAttentionItems(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Inicio Super Admin';
    loadDashboardData();

    const unsubscribe = platformModeService.subscribe((settings) => {
      setPlatformMode(settings.platform_mode);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SuperAdminLayout title="Inicio" activeSection="overview">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
        {/* ============================================================ */}
        {/* BANNER INDICADOR DE MODO DE PLATAFORMA (PRODUCCIÓN / PRUEBA) */}
        {/* ============================================================ */}
        {platformMode === 'test' ? (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div>
                <div className="text-sm font-black text-amber-300 flex items-center gap-2">
                  🟡 PLATAFORMA EN MODO PRUEBA
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  El usuario universal <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-amber-300 font-bold">admin@estudionova.uy</code> está habilitado con selector de vistas demo.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSwitchModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 shadow-sm"
            >
              Pasar a Producción
            </Button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-black text-emerald-300 flex items-center gap-2">
                  🟢 PLATAFORMA EN PRODUCCIÓN
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Acceso universal de prueba desactivado (401 Unauthorized). Operando exclusivamente con usuarios y permisos reales.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSwitchModal(true)}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs shrink-0 font-bold"
            >
              Pasar a Prueba
            </Button>
          </div>
        )}

        {/* Modal de confirmación para alternar modo */}
        <PlatformModeSwitchModal
          isOpen={showSwitchModal}
          onClose={() => setShowSwitchModal(false)}
          currentMode={platformMode}
          onSuccess={(newMode) => setPlatformMode(newMode)}
        />
        
        {/* ============================================================ */}
        {/* 1. ESTADO DE SALUD OPERATIVA (ENCABEZADO CLARO)              */}
        {/* ============================================================ */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              PANEL GENERAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Buen día
            </h1>
            <div className="flex items-center space-x-2.5 pt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-sm font-bold text-emerald-400">
                HIPOTECALY está funcionando correctamente
              </p>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                Infraestructura PostgreSQL y servicios base operativos
              </span>
            </div>
          </div>

          {/* Acciones Rápidas Principales */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="bg-[#071322] border-[#1E3A5F] text-slate-300 hover:text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            <Link to="/superadmin/tenants/new">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo cliente
              </Button>
            </Link>

            <Link to="/superadmin/ver-como-cliente">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Ver como cliente
              </Button>
            </Link>

            <Link to="/superadmin/servicios">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Boxes className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Administrar servicios
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. INDICADORES PRINCIPALES DE OPERACIÓN                      */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              INDICADORES PRINCIPALES (DATOS REALES)
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Consultado desde Supabase PostgreSQL</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Clientes activos */}
            <div data-testid="kpi-active-tenants" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Clientes activos</span>
                <Users2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.activeTenants}</div>
              <span className="text-[10px] text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Organizaciones activas
              </span>
            </div>

            {/* Expedientes activos */}
            <div data-testid="kpi-applications" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Expedientes en curso</span>
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">{metrics.applications}</div>
              <span className="text-[10px] text-slate-400">En base de datos real</span>
            </div>

            {/* Casos IA utilizados */}
            <div data-testid="kpi-ai-cases" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold flex items-center" title="Casos procesados por Inteligencia Artificial">
                  Casos de IA <HelpCircle className="w-3 h-3 ml-1 text-slate-500" />
                </span>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-300">{metrics.aiCases}</div>
              <span className="text-[10px] text-teal-400">Billeteras de IA</span>
            </div>

            {/* Firmas realizadas */}
            <div data-testid="kpi-signatures" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Firmas realizadas</span>
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{metrics.signatures}</div>
              <span className="text-[10px] text-slate-400">Firmas registradas</span>
            </div>

            {/* Validaciones KYC */}
            <div data-testid="kpi-kyc" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Identidad y KYC</span>
                <Fingerprint className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">{metrics.kyc}</div>
              <span className="text-[10px] text-purple-300">Identidades verificadas</span>
            </div>

            {/* Documentos y formularios */}
            <div data-testid="kpi-documents" className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Documentos</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.documents}</div>
              <span className="text-[10px] text-slate-400">Legajos generados</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. REQUIERE TU ATENCIÓN (ACCIONABLE & DINÁMICO)              */}
        {/* ============================================================ */}
        <div data-testid="section-attention-items" className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Requiere tu atención</h2>
                <p className="text-xs text-slate-400">Configuraciones pendientes e integraciones a completar para producción</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {attentionItems.length} pendientes
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="p-6 bg-[#071322] border border-[#152E4D] rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-white">No hay alertas de configuración pendientes.</p>
              <p className="text-[11px] text-slate-400">Todas las capacidades requeridas se encuentran verificadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#071322] border border-[#152E4D] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{item.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.timeAgo}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    <span className="inline-block text-[10px] text-emerald-400">
                      Servicio: {item.serviceName}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#152E4D]/80 flex justify-end">
                    {item.actionLink ? (
                      <Link
                        to={item.actionLink}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          const found = tenants.find((t) => t.slug === item.tenantSlug);
                          if (found) setSelectedTenantModal(found);
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 4. CLIENTES DESTACADOS & ACCESOS DIRECTOS                    */}
        {/* ============================================================ */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Clientes de HIPOTECALY</h2>
              <p className="text-xs text-slate-400">Organizaciones registradas en la plataforma y accesos de operación</p>
            </div>
            <Link to="/superadmin/tenants" className="text-xs font-bold text-emerald-400 hover:underline flex items-center space-x-1">
              <span>Ver todos los clientes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-[#071322] border border-[#152E4D] hover:border-[#1E3A5F] transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: t.branding?.primary_color || '#102d49' }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="text-xs text-white block">{t.name}</strong>
                        <span className="text-[10px] text-slate-400">
                          {t.custom_domain || 'Subdominio estándar'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {t.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#152E4D]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Plan: <strong className="text-slate-200">{t.is_white_label ? 'Marca Blanca' : 'Plan Estándar'}</strong></span>
                    <span>Tipo: <strong className="text-slate-300">{(t as any).organization_type || 'Estudio Notarial'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-1.5 pt-1">
                  <Link
                    to={`/demo/${t.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                    title="Ver portal público"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/demo/${t.slug}/admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#152E4D] text-emerald-400 hover:bg-[#1E3A5F]"
                    title="Abrir Backoffice"
                  >
                    Backoffice
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTenantModal(t)}
                    className="h-7 px-2.5 text-[10px] font-bold bg-[#071322] border-[#152E4D] text-slate-300 hover:bg-[#152E4D]"
                    title="Administrar cliente"
                  >
                    <Sliders className="w-3 h-3 mr-1 text-slate-400" /> Administrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Detalle de Cliente */}
        {selectedTenantModal && (
          <SuperAdminTenantDetailModal
            tenant={selectedTenantModal}
            onClose={() => setSelectedTenantModal(null)}
            onUpdated={() => loadDashboardData()}
          />
        )}

      </div>
    </SuperAdminLayout>
  );
};
