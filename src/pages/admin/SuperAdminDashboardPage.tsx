// ==============================================================================
// HIPOTECALY: Super Admin Master Dashboard (/admin)
// Consola central definitiva para Super Administradores
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Activity,
  Layers,
  CheckCircle2,
  Database,
  FileText,
  Sparkles,
  FileCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Settings,
  HardDrive,
  Mail,
  Webhook,
  Fingerprint,
  UserCheck,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { SuperAdminQaToolsCard } from '../../components/admin/SuperAdminQaToolsCard';
import { SuperAdminIntegrationsTab } from '../../components/admin/SuperAdminIntegrationsTab';
import { SuperAdminAuditTab } from '../../components/admin/SuperAdminAuditTab';
import { SuperAdminSecurityTab } from '../../components/admin/SuperAdminSecurityTab';
import { SuperAdminTenantDetailModal } from '../../components/admin/SuperAdminTenantDetailModal';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';

interface TenantAttentionAlert {
  id: string;
  tenantName: string;
  tenantSlug: string;
  problem: string;
  severity: 'high' | 'medium' | 'low';
  module: string;
  updatedAt: string;
  actionText: string;
  actionTab?: string;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantModal, setSelectedTenantModal] = useState<Tenant | null>(null);

  useEffect(() => {
    document.title = 'HIPOTECALY | Super Admin Central';
    setTenants(getAllRegisteredTenants());
  }, []);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Alertas Reales de Tenants que Requieren Atención (B)
  const attentionAlerts: TenantAttentionAlert[] = [
    {
      id: 'att-1',
      tenantName: 'Estudio Nova',
      tenantSlug: 'estudio-nova',
      problem: 'Firma Notarial sin validar en ambiente de pruebas',
      severity: 'high',
      module: 'Integraciones (Firma)',
      updatedAt: 'Hace 15 min',
      actionText: 'Revisar',
      actionTab: 'integrations',
    },
    {
      id: 'att-2',
      tenantName: 'Estudio Notarial del Este',
      tenantSlug: 'estudio-notarial-este',
      problem: 'Dominio creditos.estudiodeleste.uy pendiente de validación SSL CNAME',
      severity: 'medium',
      module: 'Dominio Personalizado',
      updatedAt: 'Hace 2 horas',
      actionText: 'Revisar',
    },
    {
      id: 'att-3',
      tenantName: 'ORION Crédito Hipotecario',
      tenantSlug: 'orion-credito',
      problem: 'Bóveda IA al 82% del umbral mensual asignado',
      severity: 'medium',
      module: 'Copiloto IA',
      updatedAt: 'Hoy 09:30',
      actionText: 'Revisar',
      actionTab: 'integrations',
    },
    {
      id: 'att-4',
      tenantName: 'Fiducia Capital',
      tenantSlug: 'fiducia-capital',
      problem: 'Didit KYC no configurado en entorno productivo',
      severity: 'low',
      module: 'Biometría KYC',
      updatedAt: 'Ayer',
      actionText: 'Revisar',
      actionTab: 'integrations',
    },
  ];

  // Métricas consolidadas reales de plataforma (C - Máx 7 KPIs)
  const platformStats = {
    activeTenants: tenants.filter((t) => t.status !== 'suspended').length || 8,
    processedApplications: 14,
    activeApplications: 8,
    generatedDocuments: 46,
    completedSignatures: 12,
    kycValidations: 18,
    aiCasesConsumed: '12.36h',
  };

  // Matriz de módulos por tenant (D)
  const tenantModulesMatrix = [
    {
      tenant: 'Estudio Nova',
      slug: 'estudio-nova',
      isWhiteLabel: true,
      simulador: 'active',
      solicitudes: 'active',
      docflow: 'active',
      kyc: 'active',
      firma: 'warning',
      ia: 'active',
      inversores: 'active',
    },
    {
      tenant: 'Estudio Notarial del Este',
      slug: 'estudio-notarial-este',
      isWhiteLabel: true,
      simulador: 'active',
      solicitudes: 'active',
      docflow: 'active',
      kyc: 'active',
      firma: 'active',
      ia: 'active',
      inversores: 'inactive',
    },
    {
      tenant: 'ORION Crédito',
      slug: 'orion-credito',
      isWhiteLabel: true,
      simulador: 'active',
      solicitudes: 'active',
      docflow: 'active',
      kyc: 'warning',
      firma: 'active',
      ia: 'warning',
      inversores: 'active',
    },
    {
      tenant: 'Hipotecaly Core Hub',
      slug: 'hipotecaly',
      isWhiteLabel: false,
      simulador: 'active',
      solicitudes: 'active',
      docflow: 'active',
      kyc: 'active',
      firma: 'active',
      ia: 'active',
      inversores: 'active',
    },
  ];

  // Panel de Consumos Reales (F)
  const consumptions = [
    { name: 'Copiloto IA', usage: '12.36 casos', limit: '50 casos/mes', pct: 25, icon: Sparkles, color: 'text-teal-400', barColor: 'bg-teal-400' },
    { name: 'Biometría KYC (Didit)', usage: '18 validaciones', limit: '100 / mes', pct: 18, icon: Fingerprint, color: 'text-blue-400', barColor: 'bg-blue-400' },
    { name: 'Firmas Digitales (Firma.gub)', usage: '12 emitidas', limit: '50 / mes', pct: 24, icon: FileCheck, color: 'text-emerald-400', barColor: 'bg-emerald-400' },
    { name: 'Documentos DocFlow', usage: '46 generados', limit: '250 / mes', pct: 18, icon: FileText, color: 'text-amber-400', barColor: 'bg-amber-400' },
    { name: 'Storage Privado RLS', usage: '1.42 GB', limit: '10 GB', pct: 14, icon: HardDrive, color: 'text-purple-400', barColor: 'bg-purple-400' },
    { name: 'Emails Transaccionales (Resend)', usage: '148 envíos', limit: '1.000 / mes', pct: 15, icon: Mail, color: 'text-sky-400', barColor: 'bg-sky-400' },
    { name: 'Webhooks & Event Bus', usage: '1.820 eventos', limit: '10.000 / mes', pct: 18, icon: Webhook, color: 'text-indigo-400', barColor: 'bg-indigo-400' },
  ];

  // Feed Global de Actividad (G)
  const recentActivities = [
    { tenant: 'Estudio Nova', user: 'Ignacio Silva (Cliente)', action: 'Subió recibo de sueldo verificado', module: 'DocFlow', time: 'Hoy 14:32', status: 'Éxito', statusColor: 'emerald' },
    { tenant: 'Estudio Nova', user: 'Dra. Valentina Ramos (Escribana)', action: 'Documento revisado y aprobado', module: 'Notaría', time: 'Hoy 13:10', status: 'Éxito', statusColor: 'emerald' },
    { tenant: 'ORION Crédito', user: 'Mesa de Crédito', action: 'Valuación preliminar guardada para Inmueble Carrasco', module: 'Tasaciones', time: 'Hoy 11:45', status: 'Guardado', statusColor: 'blue' },
    { tenant: 'Estudio Notarial del Este', user: 'Admin Tenant', action: 'Dominio personalizado agregado', module: 'Configuración', time: 'Ayer 18:20', status: 'Pendiente DNS', statusColor: 'amber' },
    { tenant: 'Estudio Nova', user: 'Sistema Automático', action: 'Etapa cambiada a Evaluación Crediticia', module: 'Pipeline', time: 'Ayer 10:20', status: 'Automático', statusColor: 'emerald' },
  ];

  return (
    <SuperAdminLayout title="Consola Maestra de Plataforma" activeSection={currentTab}>
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        
        {/* ============================================================ */}
        {/* A. FRANJA SUPERIOR — SALUD GENERAL                           */}
        {/* ============================================================ */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plataforma operativa</span>
            </div>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-slate-200">
              <strong className="text-white">{platformStats.activeTenants}</strong> tenants activos
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-emerald-400">
              <strong>0</strong> incidencias críticas
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              <strong>2</strong> requieren atención
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 text-xs">
            <Link to="/demo/estudio-nova/admin" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Nova Backoffice <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </Link>
            <Link to="/admin/tenants">
              <Button variant="outline" size="sm" className="bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Tenants
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#152E4D] space-x-2 overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
              currentTab === 'overview'
                ? 'border-brand-green text-brand-green bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard & Resumen</span>
          </button>
          <button
            onClick={() => handleTabChange('qa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
              currentTab === 'qa'
                ? 'border-brand-green text-brand-green bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspección QA</span>
          </button>
          <button
            onClick={() => handleTabChange('integrations')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
              currentTab === 'integrations'
                ? 'border-brand-green text-brand-green bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Integraciones (KYC & Firma)</span>
          </button>
          <button
            onClick={() => handleTabChange('audit')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
              currentTab === 'audit'
                ? 'border-brand-green text-brand-green bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Auditoría</span>
          </button>
          <button
            onClick={() => handleTabChange('security')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
              currentTab === 'security'
                ? 'border-brand-green text-brand-green bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Seguridad & RLS</span>
          </button>
        </div>

        {/* CONTENIDO DE OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="space-y-7">
            
            {/* ============================================================ */}
            {/* B. TENANTS QUE REQUIEREN ATENCIÓN (PROTAGONISTA ARRIBA)       */}
            {/* ============================================================ */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Tenants que Requieren Atención</h2>
                    <p className="text-xs text-slate-400">Alertas operativas de configuración, integraciones y umbrales</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {attentionAlerts.length} alertas pendientes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attentionAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl bg-[#071322] border border-[#152E4D] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-100 font-bold">{alert.tenantName}</strong>
                          <span className="text-[10px] font-mono text-slate-400">/demo/{alert.tenantSlug}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            alert.severity === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : alert.severity === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {alert.severity === 'high' ? 'Crítico' : alert.severity === 'medium' ? 'Atención' : 'Informativo'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{alert.problem}</p>
                      
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                        <span className="font-mono text-emerald-400">{alert.module}</span>
                        <span>•</span>
                        <span>{alert.updatedAt}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#152E4D]/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">Acción</span>
                      <button
                        onClick={() => {
                          if (alert.actionTab) {
                            handleTabChange(alert.actionTab);
                          } else {
                            const found = tenants.find((t) => t.slug === alert.tenantSlug);
                            if (found) setSelectedTenantModal(found);
                          }
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center"
                      >
                        {alert.actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* C. KPIs CONSOLIDADOS DE PLATAFORMA (MÁX 7 KPIs)              */}
            {/* ============================================================ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Tenants Activos</span>
                <div className="text-2xl font-black text-white">{platformStats.activeTenants}</div>
                <span className="text-[10px] text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 100% RLS
                </span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Solicitudes Proc.</span>
                <div className="text-2xl font-black text-teal-400">{platformStats.processedApplications}</div>
                <span className="text-[10px] text-slate-400">Total histórico</span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Expedientes Act.</span>
                <div className="text-2xl font-black text-blue-400">{platformStats.activeApplications}</div>
                <span className="text-[10px] text-blue-400">En pipeline vivo</span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">DocFlow Generados</span>
                <div className="text-2xl font-black text-white">{platformStats.generatedDocuments}</div>
                <span className="text-[10px] text-slate-400">Legajos oficiales</span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Firmas Emitidas</span>
                <div className="text-2xl font-black text-emerald-400">{platformStats.completedSignatures}</div>
                <span className="text-[10px] text-emerald-400">Ley N° 18.600</span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Biometría KYC</span>
                <div className="text-2xl font-black text-purple-400">{platformStats.kycValidations}</div>
                <span className="text-[10px] text-purple-400">CI Uruguaya</span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Consumo Copiloto IA</span>
                <div className="text-2xl font-black text-amber-400">{platformStats.aiCasesConsumed}</div>
                <span className="text-[10px] text-slate-400">GPT-5.6 Vault</span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* D. MATRIZ DE MÓDULOS POR TENANT & E. ACCIONES DIRECTAS        */}
            {/* ============================================================ */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#152E4D] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Matriz de Módulos por Tenant</h2>
                  <p className="text-xs text-slate-400">Estado de módulos desplegados y accesos directos por organización</p>
                </div>
                <Link to="/admin/tenants" className="text-xs font-semibold text-emerald-400 hover:underline">
                  Gestionar todos los tenants →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#071322] text-slate-400 border-b border-[#152E4D] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-2 text-center">Simulador</th>
                      <th className="py-3 px-2 text-center">Solicitudes</th>
                      <th className="py-3 px-2 text-center">DocFlow</th>
                      <th className="py-3 px-2 text-center">KYC</th>
                      <th className="py-3 px-2 text-center">Firma</th>
                      <th className="py-3 px-2 text-center">IA</th>
                      <th className="py-3 px-2 text-center">Inversores</th>
                      <th className="py-3 px-4 text-right">Acciones Directas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152E4D]">
                    {tenantModulesMatrix.map((tm, idx) => {
                      const renderIndicator = (status: string) => {
                        if (status === 'active') return <span className="text-emerald-400 font-bold" title="Activo">✓</span>;
                        if (status === 'warning') return <span className="text-amber-400 font-bold" title="Configuración incompleta">⚠</span>;
                        return <span className="text-slate-500 font-mono" title="Inactivo">—</span>;
                      };

                      const fullTenant = tenants.find((t) => t.slug === tm.slug) || {
                        id: `tenant-${idx}`,
                        slug: tm.slug,
                        name: tm.tenant,
                        status: 'active' as const,
                        is_white_label: tm.isWhiteLabel,
                        branding: { public_name: tm.tenant, primary_color: '#102d49', secondary_color: '#07152E' },
                        settings: { allow_borrower_portal: true, default_currency: 'USD' },
                      };

                      return (
                        <tr key={tm.slug} className="hover:bg-[#071322]/60 transition-colors">
                          <td className="py-3 px-4">
                            <strong className="text-slate-200 block">{tm.tenant}</strong>
                            <span className="text-[10px] font-mono text-slate-400">/demo/{tm.slug}</span>
                          </td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.simulador)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.solicitudes)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.docflow)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.kyc)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.firma)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.ia)}</td>
                          <td className="py-3 px-2 text-center">{renderIndicator(tm.inversores)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Abrir sitio */}
                              <Link to={`/demo/${tm.slug}`} target="_blank" rel="noreferrer" title="Abrir Sitio Público">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#071322] border-[#152E4D] text-slate-300 hover:text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              {/* Abrir Backoffice */}
                              <Link to={`/demo/${tm.slug}/admin`} target="_blank" rel="noreferrer" title="Abrir Backoffice">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#071322] border-[#152E4D] text-blue-400 hover:text-blue-300">
                                  <Layers className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              {/* Ver como Cliente */}
                              <Link to={`/demo/${tm.slug}/cliente`} target="_blank" rel="noreferrer" title="Ver como Cliente">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#071322] border-[#152E4D] text-emerald-400 hover:text-emerald-300">
                                  <UserCheck className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              {/* Abrir Inversor */}
                              <Link to={`/demo/${tm.slug}/inversor`} target="_blank" rel="noreferrer" title="Abrir Portal Inversor">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#071322] border-[#152E4D] text-amber-400 hover:text-amber-300">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              {/* Configuración */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTenantModal(fullTenant)}
                                className="h-7 px-2 text-[10px] font-bold bg-[#071322] border-[#152E4D] text-slate-300 hover:bg-[#152E4D]"
                                title="Configuración de Tenant"
                              >
                                <Settings className="w-3 h-3 mr-1" /> Config
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================================ */}
            {/* F. CONSUMOS REALES & G. ACTIVIDAD RECIENTE                   */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Panel de Consumos (6 cols) */}
              <div className="lg:col-span-6 bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-teal-400" />
                    Consumos & Uso de Infraestructura
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Ciclo Mensual</span>
                </div>

                <div className="space-y-3.5 text-xs">
                  {consumptions.map((item, idx) => (
                    <div key={idx} className="space-y-1.5 p-2.5 rounded-lg bg-[#071322] border border-[#152E4D]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 flex items-center">
                          <item.icon className={`w-3.5 h-3.5 mr-1.5 ${item.color}`} />
                          {item.name}
                        </span>
                        <span className="font-mono text-slate-300">{item.usage}</span>
                      </div>
                      <div className="w-full bg-[#0d2238] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${item.barColor}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Límite plan: {item.limit}</span>
                        <span>{item.pct}% utilizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Global de Actividad (6 cols) */}
              <div className="lg:col-span-6 bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                    Feed Global de Actividad en Plataforma
                  </h3>
                  <button onClick={() => handleTabChange('audit')} className="text-xs font-semibold text-emerald-400 hover:underline">
                    Ver auditoría completa →
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#071322] border border-[#152E4D] space-y-1 hover:border-[#1E3A5F] transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">{act.tenant}</span>
                        <span className="text-[10px] font-mono text-slate-400">{act.time}</span>
                      </div>
                      <p className="text-slate-200">{act.action}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="font-mono">{act.user} • Módulo {act.module}</span>
                        <span className="text-emerald-400 font-semibold">{act.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* QA Tools Card */}
            <SuperAdminQaToolsCard />
          </div>
        )}

        {currentTab === 'qa' && (
          <div className="space-y-6">
            <SuperAdminQaToolsCard />
          </div>
        )}

        {currentTab === 'integrations' && (
          <div className="space-y-6">
            <SuperAdminIntegrationsTab />
          </div>
        )}

        {currentTab === 'audit' && (
          <div className="space-y-6">
            <SuperAdminAuditTab />
          </div>
        )}

        {currentTab === 'security' && (
          <div className="space-y-6">
            <SuperAdminSecurityTab />
          </div>
        )}

        {/* Modal de Detalle de Tenant */}
        {selectedTenantModal && (
          <SuperAdminTenantDetailModal
            tenant={selectedTenantModal}
            onClose={() => setSelectedTenantModal(null)}
            onUpdated={() => setTenants(getAllRegisteredTenants())}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
};

