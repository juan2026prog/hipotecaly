// ==============================================================================
// HIPOTECALY: Clientes de HIPOTECALY (/admin/clientes y /admin/tenants)
// Gestión centralizada de organizaciones clientes, marcas y consumo
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Eye,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const list = getAllRegisteredTenants();
    setTenants(list);
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Clientes';
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
    setToastMessage('Cliente demo Estudio Nova restablecido a valores iniciales.');
    setTimeout(() => setToastMessage(null), 3000);
    loadData();
  };

  return (
    <SuperAdminLayout title="Clientes" activeSection="clientes">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ORGANIZACIONES ACTIVAS
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">PANEL DE CLIENTES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Clientes de HIPOTECALY
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Administración de estudios, financieras, marcas personalizadas y consumo de servicios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetNova}
              className="bg-[#09182C] border-[#1E3A5F] text-amber-300 hover:bg-[#152E4D] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Restablecer Demo Nova
            </Button>
            <Link to="/superadmin/tenants/new">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                + Nuevo cliente
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
              placeholder="Buscar cliente por nombre o dominio..."
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
              <option value="all">Todos los estados</option>
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
              <option value="all">Todos los planes</option>
              <option value="whitelabel">Marca Blanca (White Label)</option>
              <option value="core">Estándar (Core)</option>
            </select>
          </div>
        </div>

        {/* Tabla Central de Clientes */}
        <div className="bg-[#09182C] rounded-xl border border-[#152E4D] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#152E4D] flex items-center justify-between">
            <span className="font-bold text-xs text-white">Clientes registrados ({filteredTenants.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#071322] text-slate-400 border-b border-[#152E4D] font-semibold">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Usuarios</th>
                  <th className="py-3 px-4">Expedientes</th>
                  <th className="py-3 px-4">Servicios activos</th>
                  <th className="py-3 px-4">Última actividad</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152E4D]">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <p className="font-semibold text-slate-300">No existen clientes que coincidan con la búsqueda.</p>
                      <Link to="/superadmin/tenants/new" className="mt-2 inline-block text-emerald-400 font-bold hover:underline">
                        + Crear nuevo cliente
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t: Tenant) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: t.branding?.primary_color || '#102d49' }}
                          >
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-white block">{t.name}</strong>
                            <span className="text-[11px] text-slate-400">
                              {t.custom_domain || `/demo/${t.slug}`}
                            </span>
                          </div>
                        </div>
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          {t.is_white_label ? 'Marca Blanca' : 'Plan Estándar'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200">
                        {t.slug === 'estudio-nova' ? '14 usuarios' : '6 usuarios'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-200">
                        {t.slug === 'estudio-nova' ? '5 activos' : '2 activos'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300">Documentos</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300">KYC</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300">IA</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        Hace 10 min
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Ver cliente / Sitio público */}
                          <Link
                            to={`/demo/${t.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver portal público"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 bg-[#09182C] border-[#1E3A5F] text-slate-300 hover:text-white text-[11px] font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                            </Button>
                          </Link>

                          {/* Ver como cliente */}
                          <Link
                            to={`/demo/${t.slug}/cliente`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver como cliente"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 bg-[#09182C] border-[#1E3A5F] text-blue-400 hover:text-blue-300 text-[11px] font-semibold"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> Ver como cliente
                            </Button>
                          </Link>

                          {/* Administrar */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTenantModal(t)}
                            className="h-7 px-2.5 text-[10px] font-bold bg-[#152E4D] border-transparent text-emerald-400 hover:bg-[#1E3A5F]"
                            title="Administrar configuración del cliente"
                          >
                            <Sliders className="w-3 h-3 mr-1" /> Administrar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalle de Cliente */}
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
