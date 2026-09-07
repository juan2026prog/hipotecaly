import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { SuperAdminTenantDetailModal } from '../../components/admin/SuperAdminTenantDetailModal';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';
import { resetNovaDemoTenant } from '../../lib/tenantOnboardingService';

export const SuperAdminTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'whitelabel' | 'core'>('all');
  const [selectedTenantModal, setSelectedTenantModal] = useState<Tenant | null>(null);

  // Mensajes y Modales
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const list = getAllRegisteredTenants();
    setTenants(list);
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Gestión de Tenants';
    loadData();
  }, []);

  const filteredTenants = tenants.filter((t: Tenant) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.custom_domain && t.custom_domain.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? t.status === 'active' : t.status === 'suspended');
    const matchesPlan =
      planFilter === 'all' || (planFilter === 'whitelabel' ? t.is_white_label : !t.is_white_label);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleResetNova = async () => {
    await resetNovaDemoTenant();
    setToastMessage('Tenant demo Estudio Nova restablecido a valores iniciales.');
    setTimeout(() => setToastMessage(null), 3000);
    loadData();
  };

  return (
    <SuperAdminLayout title="Gestión de Tenants y Organizaciones">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                MULTI-TENANCY CORE
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">AISLAMIENTO RLS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Organizaciones y Tenants B2B
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Administración centralizada de clientes White Label, reglas financieras, branding y módulos en caliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetNova}
              className="bg-[#09182C] border-[#1E3A5F] text-amber-300 hover:bg-[#152E4D] text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Reset Demo Nova
            </Button>
            <Link to="/admin/tenants/new">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo Tenant
              </Button>
            </Link>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tenant por nombre, slug o dominio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </div>

          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los Planes</option>
              <option value="whitelabel">Full White Label</option>
              <option value="core">Core Enterprise</option>
            </select>
          </div>
        </div>

        {/* Tabla Central de Tenants */}
        <div className="bg-[#09182C] rounded-xl border border-[#152E4D] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#152E4D] flex items-center justify-between">
            <span className="font-bold text-xs text-white">Tenants Registrados ({filteredTenants.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#071322] text-slate-400 font-mono border-b border-[#152E4D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tenant / Organización</th>
                  <th className="py-3 px-4 font-semibold">Slug / Dominio</th>
                  <th className="py-3 px-4 font-semibold">Tipo / Plan</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold">Módulos Activos</th>
                  <th className="py-3 px-4 font-semibold">Última Actividad</th>
                  <th className="py-3 px-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152E4D]">
                {filteredTenants.map((t: Tenant) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: t.branding?.primary_color || '#102d49' }}
                        >
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-white block">{t.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">{t.id.slice(0, 18)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      <div>/demo/{t.slug}</div>
                      <div className="text-[10px] text-slate-500">{t.custom_domain || 'Subdominio estándar'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {t.is_white_label ? 'White Label' : 'Enterprise Core'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.status === 'active' ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Suspendido
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">DocFlow</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">Tasaciones</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">IA</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      Hace 5 min
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTenantModal(t)}
                          className="h-7 text-[10px] bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D]"
                        >
                          <Sliders className="w-3 h-3 mr-1 text-emerald-400" /> Detalle
                        </Button>
                        <a
                          href={`/demo/${t.slug}/admin`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2 py-1 rounded text-[10px] font-bold bg-[#152E4D] text-emerald-400 hover:bg-[#1E3A5F] flex items-center"
                        >
                          Backoffice <ExternalLink className="w-2.5 h-2.5 ml-1" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalle de Tenant */}
        {selectedTenantModal && (
          <SuperAdminTenantDetailModal
            tenant={selectedTenantModal}
            onClose={() => setSelectedTenantModal(null)}
            onUpdated={loadData}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
};
