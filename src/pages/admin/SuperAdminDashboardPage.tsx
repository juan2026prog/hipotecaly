// ==============================================================================
// HIPOTECALY: Super Admin Dashboard Principal (/admin)
// Vista de inicio: salud operativa, indicadores clave y elementos que requieren atención
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
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { SuperAdminTenantDetailModal } from '../../components/admin/SuperAdminTenantDetailModal';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';

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

  useEffect(() => {
    document.title = 'HIPOTECALY | Inicio Super Admin';
    setTenants(getAllRegisteredTenants());
  }, []);

  // Situaciones accionables que requieren atención
  const attentionItems: AttentionItem[] = [
    {
      id: 'att-1',
      title: 'Firma Digital',
      description: 'Falta completar homologación en ambiente notarial de pruebas.',
      severity: 'high',
      serviceName: 'Firma Digital',
      timeAgo: 'Hace 15 min',
      actionLabel: 'Resolver',
      actionLink: '/admin/servicios',
    },
    {
      id: 'att-2',
      title: 'Cliente Estudio Nova',
      description: 'Quedan 3 casos de Inteligencia Artificial disponibles para este ciclo.',
      severity: 'medium',
      serviceName: 'Inteligencia Artificial',
      timeAgo: 'Hoy 09:30',
      actionLabel: 'Ver cliente',
      tenantSlug: 'estudio-nova',
    },
    {
      id: 'att-3',
      title: 'Estudio Notarial del Este',
      description: 'Dominio creditos.estudiodeleste.uy pendiente de validación DNS CNAME.',
      severity: 'medium',
      serviceName: 'Clientes',
      timeAgo: 'Hace 2 horas',
      actionLabel: 'Ver cliente',
      tenantSlug: 'estudio-notarial-este',
    },
  ];

  // Métricas del negocio simplificadas
  const activeTenantsCount = tenants.filter((t) => t.status !== 'suspended').length || 4;

  return (
    <SuperAdminLayout title="Inicio" activeSection="overview">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
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
                Todos los servicios operativos
              </span>
            </div>
          </div>

          {/* Acciones Rápidas Principales */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/admin/tenants/new">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo cliente
              </Button>
            </Link>

            <Link to="/admin/ver-como-cliente">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Ver como cliente
              </Button>
            </Link>

            <Link to="/admin/servicios">
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
              INDICADORES PRINCIPALES
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Actualizado en tiempo real</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Clientes activos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Clientes activos</span>
                <Users2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{activeTenantsCount}</div>
              <span className="text-[10px] text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Funcionando
              </span>
            </div>

            {/* Expedientes activos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Expedientes activos</span>
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">8</div>
              <span className="text-[10px] text-slate-400">En proceso de crédito</span>
            </div>

            {/* Casos IA utilizados */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Casos IA utilizados</span>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-300">37 <span className="text-xs font-normal text-slate-400">/ 100</span></div>
              <span className="text-[10px] text-teal-400">37% consumo mensual</span>
            </div>

            {/* Firmas realizadas */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Firmas realizadas</span>
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">12</div>
              <span className="text-[10px] text-slate-400">Documentos oficiales</span>
            </div>

            {/* Validaciones KYC */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Validaciones KYC</span>
                <Fingerprint className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">18</div>
              <span className="text-[10px] text-purple-300">Identidades verificadas</span>
            </div>

            {/* Documentos generados */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-4 shadow-sm space-y-1.5 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Documentos</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">46</div>
              <span className="text-[10px] text-slate-400">Minutas y contratos</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. REQUIERE TU ATENCIÓN (ACCIONABLE)                         */}
        {/* ============================================================ */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Requiere tu atención</h2>
                <p className="text-xs text-slate-400">Situaciones pendientes que precisan intervención o configuración</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {attentionItems.length} alertas activas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                  <span className="inline-block text-[10px] font-mono text-emerald-400">
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
        </div>

        {/* ============================================================ */}
        {/* 4. CLIENTES DESTACADOS & ACCESOS DIRECTOS                    */}
        {/* ============================================================ */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Clientes de HIPOTECALY</h2>
              <p className="text-xs text-slate-400">Organizaciones activas en la plataforma y accesos de operación</p>
            </div>
            <Link to="/admin/clientes" className="text-xs font-bold text-emerald-400 hover:underline flex items-center space-x-1">
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
                        <span className="text-[10px] text-slate-400 font-mono">/demo/{t.slug}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {t.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#152E4D]/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Plan: <strong className="text-slate-200">{t.is_white_label ? 'White Label' : 'Core'}</strong></span>
                    <span>Servicios: <strong className="text-emerald-400">6 activos</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-1.5 pt-1">
                  <Link
                    to={`/demo/${t.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                    title="Ver sitio público"
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
                    className="h-7 px-2 text-[10px] font-bold bg-[#071322] border-[#152E4D] text-slate-300 hover:bg-[#152E4D]"
                    title="Administrar cliente"
                  >
                    <Sliders className="w-3 h-3 mr-1 text-slate-400" /> Administrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Detalle de Tenant / Cliente */}
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
