// ==============================================================================
// HIPOTECALY: Super Admin Master Dashboard (/admin)
// Consola central definitiva para Super Administradores
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Cpu,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { SuperAdminQaToolsCard } from '../../components/admin/SuperAdminQaToolsCard';
import { SuperAdminIntegrationsTab } from '../../components/admin/SuperAdminIntegrationsTab';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';

export const SuperAdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    document.title = 'HIPOTECALY | Super Admin Central';
    setTenants(getAllRegisteredTenants());
  }, []);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <SuperAdminLayout title="Consola Maestra de Plataforma" activeSection={currentTab}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Encabezado Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PRODUCCIÓN ACTIVA
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">HIPOTECALY CORE V2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Consola Maestra Super Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Control global de infraestructura, inquilinos, inspección QA, bóveda de IA y seguridad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/demo/estudio-nova/admin" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Nova Backoffice <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </Link>
            <Link to="/admin/tenants">
              <Button variant="outline" size="sm" className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Tenants
              </Button>
            </Link>
            <Link to="/admin/ai">
              <Button variant="outline" size="sm" className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs">
                <Cpu className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Copiloto IA
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#152E4D] space-x-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 ${
              currentTab === 'overview'
                ? 'bg-[#09182C] text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Resumen & Tenants</span>
          </button>
          <button
            onClick={() => handleTabChange('qa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 ${
              currentTab === 'qa'
                ? 'bg-[#09182C] text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspección QA</span>
          </button>
          <button
            onClick={() => handleTabChange('integrations')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 ${
              currentTab === 'integrations'
                ? 'bg-[#09182C] text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Integraciones (KYC & Firma)</span>
          </button>
        </div>

        {/* CONTENIDO SEGÚN TAB */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* Métricas Globales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Tenants Registrados</span>
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">{tenants.length}</div>
                <span className="text-[11px] text-emerald-400 flex items-center mt-1">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Multi-Tenant RLS Activo
                </span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Aislamiento de Datos</span>
                  <Database className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">100%</div>
                <span className="text-[11px] text-slate-400 flex items-center mt-1">
                  PostgreSQL Row-Level Security
                </span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Copiloto IA</span>
                  <Cpu className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">Habilitado</div>
                <span className="text-[11px] text-blue-400 flex items-center mt-1">
                  Supabase Vault Encrypted
                </span>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Estado de Infraestructura</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-2">Operativo</div>
                <span className="text-[11px] text-slate-400 flex items-center mt-1">
                  Vercel Edge & Supabase Cloud
                </span>
              </div>
            </div>

            {/* Accesos Rápidos a Módulos y Tenants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Tenants Activos */}
              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-emerald-400" />
                    Tenants y Organizaciones
                  </h3>
                  <Link to="/admin/tenants" className="text-xs font-semibold text-emerald-400 hover:underline">
                    Ver todos →
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {tenants.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-[#071322] border border-[#152E4D] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block">{t.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">/demo/{t.slug}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link to={`/demo/${t.slug}`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#09182C] border-[#1E3A5F] text-slate-300">
                            Home
                          </Button>
                        </Link>
                        <Link to={`/demo/${t.slug}/admin`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] bg-[#09182C] border-[#1E3A5F] text-emerald-400">
                            Backoffice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Capacidades del Sistema */}
              <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-teal-400" />
                    Capacidades Principales
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D]">
                    <div className="text-xs font-bold text-white">White Label Dinámico</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Branding personalizado por tenant (paletas, logos, dominios y reglas financieras).
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D]">
                    <div className="text-xs font-bold text-white">Red Privada de Inversores</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Portal privado de inversores por tenant con aislamiento estricto y feature flag modular.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D]">
                    <div className="text-xs font-bold text-white">Portal de Solicitantes</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Seguimiento en tiempo real de solicitudes de préstamos con firma digital y carga documental.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D]">
                    <div className="text-xs font-bold text-white">Consola QA de Inspección</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Herramienta para simular sesiones con cualquier rol en cualquier tenant de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QA Tools Card en Overview también para acceso directo */}
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
      </div>
    </SuperAdminLayout>
  );
};
