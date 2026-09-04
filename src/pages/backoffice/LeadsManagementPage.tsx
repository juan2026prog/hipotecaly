// ==============================================================================
// HIPOTECALY: Bandeja Administrativa de Leads Comerciales B2B (/app/leads)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { leadsService, SaaSLead } from '../../lib/leadsService';
import {
  Users,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LeadsManagementPage: React.FC = () => {
  const [leads, setLeads] = useState<SaaSLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<SaaSLead | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    const data = await leadsService.getLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: SaaSLead['status']) => {
    const ok = await leadsService.updateLeadStatus(leadId, newStatus);
    if (ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      lead.full_name.toLowerCase().includes(term) ||
      lead.company_name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: SaaSLead['status']) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">Nuevo</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">Contactado</span>;
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 uppercase">Calificado</span>;
      case 'demo':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase">Demo Agendada</span>;
      case 'proposal':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 uppercase">Propuesta</span>;
      case 'won':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">Ganado</span>;
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">Perdido</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">{status}</span>;
    }
  };

  return (
    <BackofficeLayout title="Bandeja de Prospectos Comerciales SaaS">
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Leads Comerciales SaaS
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Gestión y seguimiento de consultas de prestamistas, financieras y estudios notariales.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-navy bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              Total: {leads.length} leads
            </span>
            <Button variant="secondary" size="sm" onClick={fetchLeads}>
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-card p-4 border border-slate-border shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por empresa, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-navy bg-white focus:outline-none"
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
        </div>

        {/* Tabla de Leads */}
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Cargando prospectos...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay prospectos registrados aún.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Las solicitudes de contacto recibidas desde la Home y la landing SaaS se registrarán aquí de forma automática.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Empresa / Contacto</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Mensaje</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy text-sm">{lead.company_name}</div>
                        <div className="text-slate-600 font-medium">{lead.full_name} {lead.job_title ? `· ${lead.job_title}` : ''}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.email} {lead.phone ? `· ${lead.phone}` : ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-slate-600 font-medium">
                          {lead.organization_type?.replace('_', ' ') || 'Financiera'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-500 truncate" title={lead.message || ''}>
                          {lead.message || 'Sin mensaje adicional'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-UY') : 'Reciente'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleStatusChange(lead.id!, e.target.value as any)}
                          className="text-[11px] font-bold border border-slate-200 rounded px-2 py-1 bg-white text-navy focus:outline-none"
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
    </BackofficeLayout>
  );
};
