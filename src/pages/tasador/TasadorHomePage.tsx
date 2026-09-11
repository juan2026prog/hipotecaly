// ==============================================================================
// HIPOTECALY TASADOR IA - HOME OPERATIVA DE TASACIONES DE LA ORGANIZACIÓN
// Listado de tasaciones, métricas de actividad, estados y CTA '+ Nueva Tasación'
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { AppraisalService } from '../../lib/tasador/appraisal/AppraisalService';
import { AppraisalRecord, AppraisalStatus } from '../../lib/tasador/appraisal/appraisalTypes';
import {
  Compass,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const TasadorHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const baseRoute = `/demo/${tenant.slug || 'estudio-nova'}/admin`;

  useEffect(() => {
    loadAppraisals();
  }, [tenant.id]);

  const loadAppraisals = async () => {
    setLoading(true);
    try {
      const service = AppraisalService.getInstance();
      const list = await service.listAppraisals(tenant.id);
      setAppraisals(list);
    } catch (err) {
      console.error('[TasadorHomePage] Error loading appraisals:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<AppraisalStatus, { label: string; badge: string; border: string; icon: any }> = {
    DRAFT: {
      label: 'BORRADOR',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      border: 'border-l-slate-400',
      icon: Clock,
    },
    READY_FOR_COMPARABLES: {
      label: 'LISTO PARA COMPARABLES',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      border: 'border-l-blue-500',
      icon: Compass,
    },
    COMPARABLES_FOUND: {
      label: 'COMPARABLES ENCONTRADOS',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      border: 'border-l-amber-500',
      icon: Filter,
    },
    COMPARABLES_REVIEWED: {
      label: 'COMPARABLES REVISADOS',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      border: 'border-l-indigo-500',
      icon: CheckCircle2,
    },
    READY_FOR_VALUATION: {
      label: 'LISTO PARA VALUAR',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      border: 'border-l-emerald-500',
      icon: ShieldCheck,
    },
  };

  const filteredAppraisals = appraisals.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const address = `${a.location.streetName || ''} ${a.location.streetNumber || ''} ${a.location.neighborhood || ''} ${a.location.department || ''}`.toLowerCase();
    const type = (a.propertyInput.propertyType || '').toLowerCase();
    const id = a.id.toLowerCase();
    const matchesSearch = !searchTerm || address.includes(searchTerm.toLowerCase()) || type.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = appraisals.length;
  const inProgressCount = appraisals.filter((a) => a.status === 'DRAFT' || a.status === 'READY_FOR_COMPARABLES' || a.status === 'COMPARABLES_FOUND').length;
  const readyCount = appraisals.filter((a) => a.status === 'COMPARABLES_REVIEWED' || a.status === 'READY_FOR_VALUATION').length;

  return (
    <BackofficeLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        {/* Header con Branding de Organización y CTA Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center space-x-1">
                <Compass className="w-3 h-3 mr-1" />
                TASADOR IA — BASE INMOBILIARIA
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {tenant.branding?.public_name || tenant.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight mt-1.5">
              Consultas & Tasaciones Operativas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Valuación inmobiliaria certificada para garantías y colaterales con evidencia real de mercado.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`${baseRoute}/tasaciones/nueva`)}
              className="inline-flex items-center space-x-2 bg-[#102d49] hover:bg-[#153a5e] text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#f4b43b]" />
              <span>+ Nueva Tasación</span>
            </button>
          </div>
        </div>

        {/* Métricas Operativas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasaciones</p>
              <p className="text-2xl font-bold text-[#102d49] mt-1">{totalCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">En esta organización</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#102d49]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Análisis / Borrador</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pendientes de revisión de comparables</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Listas / Valuadas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{readyCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Set validado y certificado</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por dirección, barrio o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 focus:border-[#102d49]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#102d49] text-white border-[#102d49]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Todas ({totalCount})
            </button>
            {Object.entries(statusConfig).map(([statusKey, config]) => {
              const count = appraisals.filter((a) => a.status === statusKey).length;
              return (
                <button
                  key={statusKey}
                  onClick={() => setStatusFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusFilter === statusKey
                      ? 'bg-[#102d49] text-white border-[#102d49]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de Tasaciones Recientes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#102d49] uppercase tracking-wider">
              Tasaciones Recientes ({filteredAppraisals.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando tasaciones operativas...
            </div>
          ) : filteredAppraisals.length === 0 ? (
            <div className="p-14 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-700">No hay tasaciones registradas</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No se encontraron tasaciones que coincidan con los filtros aplicados.'
                    : 'Inicia una nueva tasación para consultar comparables reales de mercado y valuar colaterales con respaldo técnico.'}
                </p>
              </div>
              <div>
                <button
                  onClick={() => navigate(`${baseRoute}/tasaciones/nueva`)}
                  className="inline-flex items-center space-x-2 bg-[#102d49] hover:bg-[#153a5e] text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 text-[#f4b43b]" />
                  <span>Iniciar Primera Tasación</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAppraisals.map((appraisal) => {
                const conf = statusConfig[appraisal.status] || statusConfig.DRAFT;
                const StatusIcon = conf.icon;
                const prop = appraisal.propertyInput;
                const loc = appraisal.location;
                const fullAddress = `${loc.streetName || ''} ${loc.streetNumber || ''}`.trim() || 'Dirección sin especificar';
                const zone = [loc.neighborhood, loc.city, loc.department].filter(Boolean).join(', ') || 'Uruguay';
                const surface = prop.surfaces?.totalAreaM2 || prop.surfaces?.builtAreaM2 || 0;

                return (
                  <div
                    key={appraisal.id}
                    onClick={() => navigate(`${baseRoute}/tasaciones/${appraisal.id}`)}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors border-l-4 ${conf.border}`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#102d49] bg-slate-100 px-2 py-0.5 rounded">
                          {appraisal.id.slice(0, 16)}...
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${conf.badge}`}>
                          <StatusIcon className="w-3 h-3 mr-1 inline" />
                          <span>{conf.label}</span>
                        </span>
                        <span className="text-slate-500 text-xs font-semibold capitalize">
                          {prop.propertyType}
                        </span>
                        {surface > 0 && (
                          <span className="text-slate-400 text-xs">
                            • {surface} m²
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-800 capitalize">
                        {fullAddress}
                      </p>
                      <p className="text-xs text-slate-500">
                        {zone}
                      </p>

                      <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(appraisal.createdAt).toLocaleDateString('es-UY')}</span>
                        </span>
                        {appraisal.creatorEmail && (
                          <span>Por: {appraisal.creatorEmail}</span>
                        )}
                        {appraisal.selectedComparablesCount > 0 && (
                          <span className="text-indigo-600 font-semibold">
                            {appraisal.selectedComparablesCount} comparables seleccionados
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      {appraisal.estimatedValue ? (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Valor Estimado</span>
                          <span className="text-base font-extrabold text-[#102d49]">
                            USD {Number(appraisal.estimatedValue).toLocaleString('es-UY')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin valuar</span>
                      )}

                      <div className="inline-flex items-center space-x-1 text-xs font-bold text-[#102d49] group-hover:text-[#f4b43b] transition-colors">
                        <span>Ver detalle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
