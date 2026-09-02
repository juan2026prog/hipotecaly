import React from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { DEMO_APPLICATIONS } from '../../lib/backofficeService';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

// ----------------------------------------------------------------------
// /app/tasaciones
// ----------------------------------------------------------------------
export const ValuationsPage: React.FC = () => {
  const valuations = DEMO_APPLICATIONS.map((a) => ({
    appId: a.id,
    publicId: a.public_id,
    propDesc: `${a.property.property_type} en ${a.property.department}`,
    applicantVal: a.valuation.applicant_estimated_value,
    preliminaryVal: a.valuation.preliminary_value,
    minVal: a.valuation.valuation_min,
    maxVal: a.valuation.valuation_max,
    confidence: a.valuation.confidence,
    methodology: a.valuation.methodology,
  }));

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Valuaciones Preliminares
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Estimaciones técnicas del valor de los inmuebles garantizados.
          </p>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-navy">
            <span>Valuaciones Registradas ({valuations.length})</span>
          </div>

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
                  <p className="text-[11px] text-slate-400 mt-0.5">Metodología: {v.methodology.replace('_', ' ')}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Preliminar</span>
                  <span className="text-lg font-extrabold text-navy">USD {v.preliminaryVal.toLocaleString('es-UY')}</span>
                  <span className="text-[11px] text-slate-500 block">Rango: USD {v.minVal.toLocaleString('es-UY')} - {v.maxVal.toLocaleString('es-UY')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};

// ----------------------------------------------------------------------
// /app/tareas
// ----------------------------------------------------------------------
export const TasksPage: React.FC = () => {
  const allTasks = DEMO_APPLICATIONS.flatMap((a) =>
    (a.tasks || []).map((t: any) => ({
      ...t,
      publicId: a.public_id,
      appId: a.id,
    }))
  );

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Tareas Operativas
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Seguimiento de checklists, verificaciones y fechas límite.
          </p>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {allTasks.map((t: any) => (
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
        </div>
      </div>
    </BackofficeLayout>
  );
};

// ----------------------------------------------------------------------
// /app/reportes
// ----------------------------------------------------------------------
export const ReportsPage: React.FC = () => {
  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Reportes Operacionales
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Indicadores de conversión, volumen y tiempos promedio de análisis.
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
            <span className="text-xs text-slate-400 font-bold uppercase">LTV Promedio Cartera</span>
            <div className="text-3xl font-extrabold text-navy mt-1">32.8%</div>
            <span className="text-xs text-slate-500 mt-1 block">Margen seguro sobre tope 40%</span>
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
                <label className="text-slate-400 block mb-1 font-medium">Razón Social</label>
                <input
                  type="text"
                  readOnly
                  value="HIPOTECALY S.A."
                  className="w-full p-2.5 rounded-btn border border-slate-border bg-slate-50 font-bold text-navy"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Identificador Único (Slug)</label>
                <input
                  type="text"
                  readOnly
                  value="hipotecaly"
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
