// ==============================================================================
// HIPOTECALY: Platform Admin Super Console (/platform-admin)
// Hub central para Super Administradores con Acceso QA, Control Multi-Tenant e IA
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Cpu,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { SuperAdminQaToolsCard } from '../../components/admin/SuperAdminQaToolsCard';
import { Button } from '../../components/ui/Button';

export const PlatformAdminPage: React.FC = () => {
  return (
    <BackofficeLayout title="Super Admin — Consola de Control de Plataforma">
      <div className="space-y-8 text-left max-w-7xl mx-auto">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                Super Admin Global
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[11px] font-mono text-slate-500">/platform-admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-1">
              Consola Maestra de Plataforma
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Herramientas de inspección QA, control multi-inquilino, bóveda de secretos y orquestación de IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/tenants">
              <Button variant="outline" size="md" className="text-xs">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Gestionar Tenants
              </Button>
            </Link>
            <Link to="/admin/ai">
              <Button variant="outline" size="md" className="text-xs">
                <Cpu className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                Copiloto IA & Bóveda
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. SECCIÓN PRINCIPAL: ACCESO QA / INSPECCIÓN CONTROLADA */}
        <SuperAdminQaToolsCard />

        {/* 2. ATAJOS DE ADMINISTRACIÓN GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card Multi-Tenancy */}
          <div className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A60]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-navy">Clientes SaaS y Multi-Tenancy</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Administrá marcas white-label, feature flags modulares, subdominios y reglas crediticias en caliente.
              </p>
            </div>
            <Link to="/admin/tenants">
              <Button variant="outline" size="sm" fullWidth className="text-xs">
                Abrir Gestión de Tenants <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Card Hipotecaly AI */}
          <div className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand-green">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-navy">HIPOTECALY AI & Vault</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Control del Master Switch de IA, cifrado de OpenAI API Key en Supabase Vault y métricas de razonamiento.
              </p>
            </div>
            <Link to="/admin/ai">
              <Button variant="outline" size="sm" fullWidth className="text-xs">
                Configurar Inteligencia <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Card Operaciones Directas */}
          <div className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-navy">Bandeja Operativa Central</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ingresá directamente al backoffice operativo con rol transversal para auditar expedientes y tasaciones.
              </p>
            </div>
            <Link to="/app">
              <Button variant="outline" size="sm" fullWidth className="text-xs">
                Ir al Backoffice (/app) <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </BackofficeLayout>
  );
};
