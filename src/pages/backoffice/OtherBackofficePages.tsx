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
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function loadValuations() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });

      const vals = apps
        .filter((a) => a.property)
        .map((a) => {
          // Determinar estado de la valuación
          let valuationStatus = 'pending';
          if (a.status === 'property_analysis') valuationStatus = 'assigned';
          else if (a.valuation?.preliminary_value && a.valuation.preliminary_value > 0) valuationStatus = 'in_progress';
          else if (a.valuation?.preliminary_value && a.status === 'evaluation') valuationStatus = 'for_review';
          else if (a.status === 'offer_available' || a.status === 'formalization' || a.status === 'approved') valuationStatus = 'approved';
          
          // Tipo de valuación
          const valuationType = a.valuation?.preliminary_value > 0
            ? (a.valuation?.methodology === 'pericia_profesional' ? 'professional' : 'preliminary')
            : 'pending';
          
          return {
            appId: a.id,
            publicId: a.public_id,
            propDesc: a.property ? `${a.property.property_type} en ${a.property.department}${a.property.neighborhood ? ', ' + a.property.neighborhood : ''}` : 'Propiedad en análisis',
            applicantVal: a.property?.estimated_value || 0,
            preliminaryVal: a.valuation?.preliminary_value || 0,
            minVal: a.valuation?.valuation_min || 0,
            maxVal: a.valuation?.valuation_max || 0,
            confidence: a.valuation?.confidence || 'pendiente',
            methodology: a.valuation?.methodology || 'Sin metodología definida',
            borrowerName: a.borrower ? `${a.borrower.first_name} ${a.borrower.last_name}` : 'Sin titular',
            valuationStatus,
            valuationType,
          };
        });

      setValuations(vals);
      setLoading(false);
    }
    loadValuations();
  }, [tenant.id, tenant.demo_mode]);

  const statusConfig: Record<string, { label: string; badge: string; border: string }> = {
    pending: { label: 'PENDIENTE', badge: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
    assigned: { label: 'ASIGNADA', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
    in_progress: { label: 'EN PROCESO', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
    for_review: { label: 'PARA REVISAR', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-200' },
    approved: { label: 'APROBADA', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
    observed: { label: 'OBSERVADA', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-200' },
  };

  const typeConfig: Record<string, string> = {
    pending: '⏳ Sin valuar',
    preliminary: '📊 Estimación preliminar',
    professional: '🏛️ Tasación profesional',
    approved_val: '✅ Valor aprobado',
  };

  const filtered = statusFilter === 'all' ? valuations : valuations.filter((v) => v.valuationStatus === statusFilter);

  const statusCounts = Object.fromEntries(
    ['pending', 'assigned', 'in_progress', 'for_review', 'approved', 'observed'].map((s) => [
      s,
      valuations.filter((v) => v.valuationStatus === s).length,
    ])
  );

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
            TASACIONES & VALUACIONES
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
            Work Queue — Valuaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestión operativa de tasaciones y estimaciones de garantías hipotecarias para {tenant.name}.
          </p>
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap items-center gap-2">
          {[['all', 'Todas', valuations.length], ...Object.entries(statusCounts).map(([k, v]) => [k, statusConfig[k]?.label || k, v])].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as string)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                statusFilter === key
                  ? 'bg-[#102d49] text-white border-[#102d49]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-navy">
            <span>Valuaciones ({filtered.length})</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando valuaciones...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                {statusFilter === 'all' ? 'No hay valuaciones registradas aún.' : `No hay valuaciones con estado "${statusConfig[statusFilter]?.label}".`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((v, i) => {
                const sc = statusConfig[v.valuationStatus];
                return (
                  <div key={i} className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 text-xs border-l-4 ${sc.border}`}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[#102d49] text-sm">{v.publicId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.badge}`}>{sc.label}</span>
                        <span className="text-slate-400 text-[10px]">{typeConfig[v.valuationType] || ''}</span>
                      </div>
                      <p className="text-slate-600 capitalize">{v.propDesc}</p>
                      <p className="text-[11px] text-slate-400">Titular: {v.borrowerName}</p>
                      {v.methodology !== 'Sin metodología definida' && (
                        <p className="text-[11px] text-slate-400">Metodología: {String(v.methodology).replace(/_/g, ' ')}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {v.preliminaryVal > 0 ? (
                        <>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Preliminar</span>
                          <span className="text-lg font-extrabold text-[#102d49]">USD {Number(v.preliminaryVal).toLocaleString('es-UY')}</span>
                          {v.minVal > 0 && (
                            <span className="text-[11px] text-slate-500 block">
                              Rango: USD {Number(v.minVal).toLocaleString('es-UY')} — {Number(v.maxVal).toLocaleString('es-UY')}
                            </span>
                          )}
                          {v.confidence !== 'pendiente' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                              Confianza {v.confidence}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Valor declarado</span>
                          <span className="font-bold text-slate-600">USD {Number(v.applicantVal).toLocaleString('es-UY')}</span>
                          <p className="text-[10px] text-amber-600 mt-1">Sin peritaje registrado</p>
                        </div>
                      )}
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

// ----------------------------------------------------------------------
// /app/tareas
// ----------------------------------------------------------------------
export const TasksPage: React.FC = () => {
  const { tenant } = useTenant();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });

      const today = new Date();
      const t = apps.flatMap((a) =>
        (a.tasks || []).map((task: any) => ({
          ...task,
          publicId: a.public_id,
          appId: a.id,
          isOverdue: task.due_date && new Date(task.due_date) < today && task.status !== 'completed',
          isDueToday: task.due_date && new Date(task.due_date).toDateString() === today.toDateString(),
          isUpcoming: task.due_date && new Date(task.due_date) > today && new Date(task.due_date) <= new Date(today.getTime() + 7 * 86400000),
        }))
      );
      setTasks(t);
      setLoading(false);
    }
    loadTasks();
  }, [tenant.id, tenant.demo_mode]);

  const views = [
    { id: 'all', label: 'Todas', count: tasks.length },
    { id: 'today', label: 'Hoy', count: tasks.filter((t) => t.isDueToday && t.status !== 'completed').length },
    { id: 'overdue', label: 'Vencidas', count: tasks.filter((t) => t.isOverdue).length },
    { id: 'upcoming', label: 'Próximos 7 días', count: tasks.filter((t) => t.isUpcoming && !t.isDueToday && t.status !== 'completed').length },
    { id: 'completed', label: 'Completadas', count: tasks.filter((t) => t.status === 'completed').length },
  ] as const;

  const filtered = tasks.filter((t) => {
    if (viewFilter === 'all') return t.status !== 'completed';
    if (viewFilter === 'today') return t.isDueToday && t.status !== 'completed';
    if (viewFilter === 'overdue') return t.isOverdue;
    if (viewFilter === 'upcoming') return t.isUpcoming && !t.isDueToday && t.status !== 'completed';
    if (viewFilter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
            TAREAS OPERATIVAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">Bandeja de Tareas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Checklists, verificaciones y fechas límite por expediente en {tenant.name}.</p>
        </div>

        {/* Vistas / Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewFilter(v.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                viewFilter === v.id
                  ? v.id === 'overdue'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-[#102d49] text-white border-[#102d49]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {v.label}
              {v.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  viewFilter === v.id ? 'bg-white/20 text-white' : v.id === 'overdue' && v.count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>{v.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando tareas...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay tareas pendientes.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Las tareas se generan automáticamente cuando los expedientes avanzan en el proceso.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay tareas en esta vista.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((t: any) => (
                <div
                  key={t.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    t.isOverdue ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle2
                      className={`w-5 h-5 mt-0.5 shrink-0 ${t.status === 'completed' ? 'text-brand-green' : t.isOverdue ? 'text-rose-400' : 'text-slate-300'}`}
                    />
                    <div className="space-y-0.5">
                      <p className={`font-bold ${
                        t.status === 'completed' ? 'line-through text-slate-400' : t.isOverdue ? 'text-rose-700' : 'text-navy'
                      }`}>
                        {t.title}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span className="font-mono font-bold text-[#102d49]">{t.publicId}</span>
                        {t.isOverdue && (
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">VENCIDA</span>
                        )}
                        {t.isDueToday && t.status !== 'completed' && (
                          <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">HOY</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 shrink-0">
                    {t.due_date ? (
                      <span className={t.isOverdue ? 'text-rose-600 font-bold' : ''}>
                        Vence: {new Date(t.due_date).toLocaleDateString('es-UY')}
                      </span>
                    ) : (
                      <span>Sin fecha límite</span>
                    )}
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
// /app/reportes
// ----------------------------------------------------------------------
export const AnalyticsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const data = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });
      setApps(data);
      setLoading(false);
    }
    load();
  }, [tenant.id, tenant.demo_mode]);

  // Métricas derivadas de datos reales
  const total = apps.length;
  const active = apps.filter((a) => a.status !== 'rejected' && a.status !== 'approved' && a.status !== 'completed').length;
  const approved = apps.filter((a) => a.status === 'approved' || a.status === 'completed').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;
  const inEval = apps.filter((a) => a.status === 'evaluation' || a.status === 'in_analysis').length;
  const pendingDocs = apps.filter((a) => a.status === 'info_review' || a.status === 'draft').length;
  const pendingSign = apps.filter((a) => a.status === 'formalization').length;
  const totalAmount = apps.reduce((sum, a) => sum + (Number(a.requested_amount) || 0), 0);
  const approvedAmount = apps.filter((a) => a.status === 'approved' || a.status === 'completed').reduce((sum, a) => sum + (Number(a.requested_amount) || 0), 0);
  const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';
  const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0';

  // Pipeline por etapa
  const pipelineData = [
    { stage: 'Solicitud recibida', status: 'submitted', count: apps.filter((a) => a.status === 'submitted').length },
    { stage: 'Revisión info', status: 'info_review', count: pendingDocs },
    { stage: 'Tasación', status: 'property_analysis', count: apps.filter((a) => a.status === 'property_analysis').length },
    { stage: 'Evaluación', status: 'evaluation', count: inEval },
    { stage: 'Oferta', status: 'offer_available', count: apps.filter((a) => a.status === 'offer_available').length },
    { stage: 'Formalización', status: 'formalization', count: pendingSign },
    { stage: 'Aprobadas', status: 'approved', count: approved },
  ];
  const maxPipelineCount = Math.max(...pipelineData.map((p) => p.count), 1);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              INTELIGENCIA
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">Analítica Operativa</h1>
            <p className="text-xs text-slate-500 mt-0.5">Indicadores derivados de los datos reales de {tenant.name}.</p>
          </div>
          <div className="flex items-center space-x-2">
            {([['week', 'Esta semana'], ['month', 'Este mes'], ['quarter', 'Últimos 3 meses']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  period === val ? 'bg-[#102d49] text-white border-[#102d49]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando analítica...</div>
        ) : total === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No hay datos suficientes aún.</p>
            <p className="text-xs text-slate-400">La analítica se poblará automáticamente a medida que ingresen solicitudes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* OPERACIONES */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Operaciones</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total solicitudes', value: total, color: 'text-[#102d49]' },
                  { label: 'Activas', value: active, color: 'text-blue-700' },
                  { label: 'Aprobadas', value: approved, color: 'text-emerald-700' },
                  { label: 'Rechazadas', value: rejected, color: 'text-rose-700' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-medium block">{stat.label}</span>
                    <div className={`text-2xl font-black font-serif mt-1 ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-medium block">Tasa de conversión</span>
                  <div className="text-2xl font-black font-serif mt-1 text-emerald-700">{conversionRate}%</div>
                  <span className="text-[10px] text-slate-400">Solicitudes → Aprobadas</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-medium block">Monto total solicitado</span>
                  <div className="text-xl font-black font-serif mt-1 text-[#102d49]">USD {(totalAmount / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-medium block">Monto aprobado</span>
                  <div className="text-xl font-black font-serif mt-1 text-emerald-700">USD {(approvedAmount / 1000).toFixed(0)}K</div>
                  <span className="text-[10px] text-slate-400">Tasa rechazo: {rejectionRate}%</span>
                </div>
              </div>
            </section>

            {/* PIPELINE */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pipeline por Etapa</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                {pipelineData.map((item) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.stage}</span>
                      <span className="font-bold text-[#102d49]">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#102d49] transition-all"
                        style={{ width: `${(item.count / maxPipelineCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DOCUMENTOS */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Documentos & Revisión</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Pendientes de docs', value: pendingDocs, color: 'text-amber-700' },
                  { label: 'En evaluación', value: inEval, color: 'text-blue-700' },
                  { label: 'Pend. de firma', value: pendingSign, color: 'text-purple-700' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-medium block">{stat.label}</span>
                    <div className={`text-2xl font-black font-serif mt-1 ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};

// Alias para compatibilidad con rutas existentes
export const ReportsPage = AnalyticsPage;

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

          {/* Configuración DocFlow por Tenant (Regla 34) */}
          <div className="border-b border-slate-100 pb-4 space-y-4">
            <div>
              <h3 className="text-base font-bold text-navy flex items-center space-x-2">
                <span>HIPOTECALY DOCFLOW — Configuración del Tenant</span>
                <span className="text-[10px] font-bold bg-brand-green-light text-brand-green-dark px-2 py-0.5 rounded-full">
                  Módulo Activo
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Datos legales, membretes institucionales y reglas documentales para {tenant.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-bold">Razón Social Legal</label>
                <input
                  type="text"
                  defaultValue={`${tenant.name} S.A.S.`}
                  className="w-full p-2.5 rounded-btn border border-slate-border text-navy focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-bold">Representante Legal Firmante</label>
                <input
                  type="text"
                  defaultValue="Dr. Alejandro Méndez"
                  className="w-full p-2.5 rounded-btn border border-slate-border text-navy focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-bold">Dirección Legal Notarial</label>
                <input
                  type="text"
                  defaultValue="Plaza Independencia 848, Montevideo"
                  className="w-full p-2.5 rounded-btn border border-slate-border text-navy focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-bold">Zona Horaria e Idioma</label>
                <input
                  type="text"
                  readOnly
                  value="America/Montevideo (es-UY)"
                  className="w-full p-2.5 rounded-btn border border-slate-border bg-slate-50 text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-bold text-xs">Pie de Página Estándar para Documentos</label>
              <textarea
                rows={2}
                defaultValue="Documento oficial emitido electrónicamente por HIPOTECALY DOCFLOW. Validez legal según Ley N° 18.600 de la República Oriental del Uruguay."
                className="w-full p-2.5 rounded-btn border border-slate-border text-xs text-navy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-navy">Seguridad y Aislamiento RLS</h4>
            <div className="flex items-center space-x-2 text-xs text-brand-green-dark">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Row Level Security activa en PostgreSQL multi-tenant y Storage Privado.</span>
            </div>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};
