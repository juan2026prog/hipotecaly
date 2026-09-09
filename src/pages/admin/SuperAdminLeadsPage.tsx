// ==============================================================================
// HIPOTECALY: Leads Comerciales B2B — Super Admin (/admin/leads)
// Gestión centralizada de prospectos comerciales de la plataforma HIPOTECALY
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';
import { leadsService, SaaSLead } from '../../lib/leadsService';

export const SuperAdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<SaaSLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    const data = await leadsService.getLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Leads Comerciales';
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: SaaSLead['status']) => {
    const ok = await leadsService.updateLeadStatus(leadId, newStatus);
    if (ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      setToastMessage('Estado del lead actualizado correctamente.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesType = typeFilter === 'all' || lead.organization_type === typeFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      lead.full_name.toLowerCase().includes(term) ||
      lead.company_name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      (lead.phone && lead.phone.includes(term));
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusBadge = (status: SaaSLead['status']) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
            Nuevo
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
            Contactado
          </span>
        );
      case 'qualified':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase">
            Calificado
          </span>
        );
      case 'demo':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">
            Demo Agendada
          </span>
        );
      case 'proposal':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">
            Propuesta
          </span>
        );
      case 'won':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
            Ganado
          </span>
        );
      case 'lost':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 uppercase">
            Perdido
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 uppercase">
            {status || 'Nuevo'}
          </span>
        );
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'financiera':
        return 'Financiera';
      case 'prestamista':
        return 'Prestamista';
      case 'estudio_notarial':
        return 'Estudio Notarial';
      case 'estudio_juridico':
        return 'Estudio Jurídico';
      case 'inmobiliaria':
        return 'Inmobiliaria';
      default:
        return type ? type.replace(/_/g, ' ') : 'Empresa';
    }
  };

  const newCount = leads.filter((l) => l.status === 'new' || !l.status).length;
  const inPipelineCount = leads.filter((l) => ['contacted', 'qualified', 'demo', 'proposal'].includes(l.status || '')).length;
  const wonCount = leads.filter((l) => l.status === 'won').length;

  return (
    <SuperAdminLayout title="Leads Comerciales" activeSection="leads">
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PIPELINE COMERCIAL HIPOTECALY
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">B2B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Leads Comerciales
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Prestamistas, financieras y estudios interesados en HIPOTECALY.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-300 bg-[#09182C] border border-[#152E4D] px-3.5 py-2 rounded-xl">
              Total: {leads.length} leads
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              disabled={loading}
              className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
              Nuevos Prospectos
            </span>
            <div className="text-2xl font-black text-white font-serif">{newCount}</div>
            <span className="text-[11px] text-slate-400">Pendientes de primer contacto</span>
          </div>
          <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              En Negociación / Demos
            </span>
            <div className="text-2xl font-black text-white font-serif">{inPipelineCount}</div>
            <span className="text-[11px] text-slate-400">Contactados, calificados o con propuesta</span>
          </div>
          <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              Convertidos a Clientes
            </span>
            <div className="text-2xl font-black text-white font-serif">{wonCount}</div>
            <span className="text-[11px] text-slate-400">Contratos cerrados exitosamente</span>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevos</option>
              <option value="contacted">Contactados</option>
              <option value="qualified">Calificados</option>
              <option value="demo">Demo Agendada</option>
              <option value="proposal">Propuesta</option>
              <option value="won">Ganados</option>
              <option value="lost">Perdidos</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los tipos de empresa</option>
              <option value="financiera">Financieras</option>
              <option value="prestamista">Prestamistas Privados</option>
              <option value="estudio_notarial">Estudios Notariales</option>
              <option value="estudio_juridico">Estudios Jurídicos</option>
              <option value="inmobiliaria">Inmobiliarias</option>
            </select>
          </div>
        </div>

        {/* Tabla Central de Leads */}
        <div className="bg-[#09182C] rounded-xl border border-[#152E4D] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#152E4D] flex items-center justify-between">
            <span className="font-bold text-xs text-white">
              Leads comerciales registrados ({filteredLeads.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
              Cargando prospectos comerciales...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No hay prospectos que coincidan con los filtros aplicados.'
                  : 'No hay prospectos comerciales registrados aún.'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Las solicitudes de contacto y solicitudes de demo recibidas desde el portal institucional de HIPOTECALY se registran aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#071322] text-slate-400 border-b border-[#152E4D] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Empresa / Contacto</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Mensaje</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152E4D]">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {lead.company_name}
                        </div>
                        <div className="text-slate-300 font-medium">
                          {lead.full_name} {lead.job_title ? `· ${lead.job_title}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="flex items-center text-emerald-400">
                            <Mail className="w-3 h-3 mr-1" /> {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center text-slate-400">
                              <Phone className="w-3 h-3 mr-1" /> {lead.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center text-xs text-slate-300 font-medium capitalize bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                          <Building2 className="w-3 h-3 mr-1.5 text-slate-400" />
                          {getTypeLabel(lead.organization_type)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 truncate" title={lead.message || ''}>
                          {lead.message || 'Sin mensaje adicional'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-500" />
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-UY') : 'Reciente'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleStatusChange(lead.id!, e.target.value as any)}
                          className="text-[11px] font-bold border border-[#152E4D] rounded-lg px-2.5 py-1 bg-[#071322] text-slate-200 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="new">Nuevo</option>
                          <option value="contacted">Contactado</option>
                          <option value="qualified">Calificado</option>
                          <option value="demo">Demo Agendada</option>
                          <option value="proposal">Propuesta</option>
                          <option value="won">Ganado</option>
                          <option value="lost">Perdido</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};
