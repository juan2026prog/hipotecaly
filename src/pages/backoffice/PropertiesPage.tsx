import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import { MapPin, ChevronRight, Home, AlertTriangle, Filter } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const { tenant } = useTenant();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });

      const props = apps
        .filter((app) => app.property)
        .map((app) => {
          const estValue = app.property.estimated_value || 0;
          const reqAmount = Number(app.requested_amount) || 0;
          const financingPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : null;
          const appDate = new Date(app.created_at || Date.now());
          const monthsDiff = (Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return {
            id: app.property.id || app.id,
            appId: app.id,
            publicId: app.public_id,
            type: app.property.property_type || 'Inmueble',
            department: app.property.department || 'Montevideo',
            neighborhood: app.property.neighborhood || '',
            estimatedValue: estValue,
            surfaceM2: app.property.surface_m2 || 0,
            cadastralNumber: app.property.cadastral_number || 'A definir',
            legalStatus: app.property.legal_status || 'libre_gravamenes',
            financingPct,
            appStatus: app.status,
            oldValuation: monthsDiff > 6,
          };
        });

      setProperties(props);
      setLoading(false);
    }
    loadProperties();
  }, [tenant.id, tenant.demo_mode]);

  const departments = ['all', ...Array.from(new Set(properties.map((p) => p.department)))];
  const types = ['all', ...Array.from(new Set(properties.map((p) => p.type)))];

  const filtered = properties.filter((p) => {
    if (deptFilter !== 'all' && p.department !== deptFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
            GARANTÍAS & PROPIEDADES
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
            Registro de Garantías Hipotecarias
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inmuebles asociados como garantía en solicitudes hipotecarias de {tenant.name}.
          </p>
        </div>

        {/* Filtros */}
        {properties.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg h-9 px-3 font-semibold text-navy bg-white"
              >
                {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'Todos los departamentos' : d}</option>)}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg h-9 px-3 font-semibold text-navy bg-white"
              >
                {types.map((t) => <option key={t} value={t}>{t === 'all' ? 'Todos los tipos' : t}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-400">{filtered.length} propiedad(es)</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando garantías...</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
            <Home className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No hay garantías registradas aún.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Las propiedades vinculadas a solicitudes hipotecarias se listarán aquí automáticamente.
            </p>
            <Link to="/" target="_blank" className="inline-flex items-center text-xs font-bold text-[#102d49] hover:text-brand-green">
              Ver portal de solicitudes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((prop) => (
              <div key={prop.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-green-light text-brand-green-dark">
                      {prop.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-navy">{prop.publicId}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy capitalize">
                      {prop.type} en {prop.neighborhood || prop.department}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.department}, Uruguay</span>
                      {prop.surfaceM2 > 0 && <span className="text-slate-300">·</span>}
                      {prop.surfaceM2 > 0 && <span>{prop.surfaceM2} m²</span>}
                    </div>
                  </div>

                  {/* Alerta tasación antigua */}
                  {prop.oldValuation && (
                    <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Valuación podría necesitar actualización (+6 meses)</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Valor Estimado</span>
                      <span className="font-bold text-navy">USD {Number(prop.estimatedValue).toLocaleString('es-UY')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Padrón</span>
                      <span className="font-bold text-slate-700">{prop.cadastralNumber}</span>
                    </div>
                    {prop.financingPct && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">% Financiación</span>
                        <span className={`font-bold ${parseFloat(prop.financingPct) > 60 ? 'text-amber-700' : 'text-emerald-700'}`}>{prop.financingPct}%</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Estado legal</span>
                      <span className="font-bold text-slate-700 capitalize">{String(prop.legalStatus).replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/app/solicitudes/${prop.appId}`}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center border border-slate-200"
                >
                  Ver expediente <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};
