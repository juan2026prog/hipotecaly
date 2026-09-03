import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import { ShieldCheck, CheckCircle2, Calculator, ListTodo } from 'lucide-react';

// ----------------------------------------------------------------------
// /app/tasaciones
// ----------------------------------------------------------------------
export const ValuationsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [valuations, setValuations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadValuations() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
      });

      const vals = apps
        .filter((a) => a.valuation)
        .map((a) => ({
          appId: a.id,
          publicId: a.public_id,
          propDesc: a.property ? `${a.property.property_type} en ${a.property.department}` : 'Propiedad en análisis',
          applicantVal: a.valuation.applicant_estimated_value || a.property?.estimated_value || 0,
          preliminaryVal: a.valuation.preliminary_value || a.property?.estimated_value || 0,
          minVal: a.valuation.valuation_min || ((a.valuation.preliminary_value || 200000) * 0.9),
          maxVal: a.valuation.valuation_max || ((a.valuation.preliminary_value || 200000) * 1.1),
          confidence: a.valuation.confidence || 'media',
          methodology: a.valuation.methodology || 'comparables_de_mercado',
        }));

      setValuations(vals);
      setLoading(false);
    }
    loadValuations();
  }, [tenant.id, tenant.demo_mode]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Valuaciones Preliminares
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Estimaciones técnicas del valor de los inmuebles garantizados para {tenant.name}.
          </p>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-navy">
            <span>Valuaciones Registradas ({valuations.length})</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando valuaciones...</div>
          ) : valuations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay valuaciones registradas aún.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Las tasaciones y rangos preliminares se listarán aquí para cada expediente evaluado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {valuations.map((v, i) => (
                <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-navy text-sm">{v.publicId}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-green-light text-brand-green-dark capitalize">
                        Confianza {v.confidence}
                      </span>
                    </div>
                    <p className="text-slate-600 capitalize mt-1">{v.propDesc}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Metodología: {String(v.methodology).replace('_', ' ')}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Preliminar</span>
                    <span className="text-lg font-extrabold text-navy">USD {Number(v.preliminaryVal).toLocaleString('es-UY')}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Rango: USD {Number(v.minVal).toLocaleString('es-UY')} - {Number(v.maxVal).toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};

// ----------------------------------------------------------------------
// /app/tareas
// ----------------------------------------------------------------------
export const TasksPage: React.FC = () => {
  const { tenant } = useTenant();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
      });

      const t = apps.flatMap((a) =>
        (a.tasks || []).map((task: any) => ({
          ...task,
          publicId: a.public_id,
          appId: a.id,
        }))
      );

      setTasks(t);
      setLoading(false);
    }
    loadTasks();
  }, [tenant.id, tenant.demo_mode]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Tareas Operativas
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Seguimiento de checklists, verificaciones y fechas límite para {tenant.name}.
          </p>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando tareas...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay tareas pendientes registradas.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Las tareas y recordatorios notariales se generarán automáticamente por expediente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${t.status === 'completed' ? 'text-brand-green' : 'text-slate-300'}`}
                    />
                    <div>
                      <p className={`font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-navy'}`}>
                        {t.title}
                      </p>
                      <span className="text-[11px] text-slate-400 font-mono">Expediente {t.publicId}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium">Vence: {t.due_date || 'Sin fecha'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};

// ----------------------------------------------------------------------
// /app/reportes
// ----------------------------------------------------------------------
export const ReportsPage: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Reportes Operacionales
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Indicadores de conversión, volumen y tiempos promedio de análisis para {tenant.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
            <span className="text-xs text-slate-400 font-bold uppercase">Tasa de Aprobación</span>
            <div className="text-3xl font-extrabold text-navy mt-1">68.4%</div>
            <span className="text-xs text-brand-green mt-1 block">Operaciones viables en Uruguay</span>
          </div>

          <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
            <span className="text-xs text-slate-400 font-bold uppercase">Tiempo Promedio Análisis</span>
            <div className="text-3xl font-extrabold text-navy mt-1">48 hs</div>
            <span className="text-xs text-slate-500 mt-1 block">Desde envío hasta propuesta</span>
          </div>

          <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
            <span className="text-xs text-slate-400 font-bold uppercase">% Financiado Promedio</span>
            <div className="text-3xl font-extrabold text-navy mt-1">32.8%</div>
            <span className="text-xs text-slate-500 mt-1 block">Margen seguro sobre garantía</span>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};

// ----------------------------------------------------------------------
// /app/configuracion
// ----------------------------------------------------------------------
export const SettingsPage: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Configuración de la Organización
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Parámetros del tenant, branding y reglas operativas.
          </p>
        </div>

        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-navy">Datos de la Organización</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nombre de la Organización</label>
                <input
                  type="text"
                  readOnly
                  value={tenant.name}
                  className="w-full p-2.5 rounded-btn border border-slate-border bg-slate-50 font-bold text-navy"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Identificador Único (Slug)</label>
                <input
                  type="text"
                  readOnly
                  value={tenant.slug}
                  className="w-full p-2.5 rounded-btn border border-slate-border bg-slate-50 font-mono text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-navy">Seguridad y Aislamiento RLS</h4>
            <div className="flex items-center space-x-2 text-xs text-brand-green-dark">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Row Level Security activa en PostgreSQL multi-tenant.</span>
            </div>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};
