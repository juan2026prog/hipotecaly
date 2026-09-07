import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getBackofficeMetrics, getApplicationsList } from '../../lib/backofficeService';
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Compass,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTenant } from '../../contexts/TenantContext';

export const DashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const baseRoute = isTenantPath ? `/demo/${tenant.slug || 'estudio-nova'}/admin` : '/app';

  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 6 KPIs Operativos del Backoffice
  const [kpiCards, setKpiCards] = useState({
    activeRequests: 8,
    waitingDocs: 3,
    inEvaluation: 2,
    pendingValuation: 2,
    pendingSignature: 1,
    closingSoon: 1,
  });

  // Alertas de "Necesita Atención"
  const [attentionItems] = useState([
    {
      id: 'att-1',
      type: 'documentos',
      title: 'Recibo de sueldo / Certificado contable faltante',
      applicationId: 'HPT-2026-00124',
      client: 'Ignacio Silva',
      severity: 'high',
      dueDate: 'Vence hoy',
      link: `${baseRoute}/solicitudes/e0000000-0000-0000-0000-000000000001`,
    },
    {
      id: 'att-2',
      type: 'tasacion',
      title: 'Tasación profesional pendiente de emisión',
      applicationId: 'NOV-2026-00089',
      client: 'María Eugenia Rossi',
      severity: 'medium',
      dueDate: 'En plazo (24hs)',
      link: `${baseRoute}/tasaciones`,
    },
    {
      id: 'att-3',
      type: 'firma',
      title: 'Minuta notarial lista para firma electrónica',
      applicationId: 'NOV-2026-00094',
      client: 'Carlos Benítez',
      severity: 'high',
      dueDate: 'Pendiente de firma',
      link: `${baseRoute}/documentos`,
    },
  ]);

  // 7 Etapas del Pipeline
  const pipelineStages = [
    { key: 'received', name: 'Solicitud recibida', count: 2, percent: '25%' },
    { key: 'info_review', name: 'Información en revisión', count: 2, percent: '25%' },
    { key: 'property_docs', name: 'Propiedad y docs', count: 1, percent: '12%' },
    { key: 'evaluation', name: 'Evaluación', count: 1, percent: '12%' },
    { key: 'conditions', name: 'Condiciones', count: 1, percent: '12%' },
    { key: 'formalization', name: 'Formalización', count: 1, percent: '12%' },
    { key: 'completed', name: 'Finalizada', count: 4, percent: 'Completadas' },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const m = await getBackofficeMetrics({ organizationId: tenant.id, isDemoMode: isDemo });
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });
      setRecentApplications(apps.slice(0, 6));

      if (m) {
        setKpiCards({
          activeRequests: apps.filter((a) => a.status !== 'completed' && a.status !== 'rejected').length || 8,
          waitingDocs: apps.filter((a) => a.status === 'draft' || a.status === 'info_review').length || 3,
          inEvaluation: apps.filter((a) => a.status === 'in_analysis' || a.status === 'submitted').length || 2,
          pendingValuation: 2,
          pendingSignature: apps.filter((a) => a.status === 'approved').length || 1,
          closingSoon: 1,
        });
      }
      setLoading(false);
    }
    loadData();
  }, [tenant.id, tenant.demo_mode]);

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';

  return (
    <BackofficeLayout>
      <div className="space-y-7 text-left max-w-7xl mx-auto">
        
        {/* 1. Header con Branding y CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider">
                {brandName} BACKOFFICE
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Gestión de Crédito Hipotecario</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight mt-1">
              Panel de Control Operativo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Supervisión de expedientes, recaudos notariales, tasaciones y formalización de préstamos.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link to="/solicitar">
              <Button variant="primary" size="md" className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-bold text-xs shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" /> Nueva Solicitud
              </Button>
            </Link>
          </div>
        </div>

        {/* 2. KPI Cards (6 Cards Obligatorias de Operación) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Solicitudes activas</span>
              <FileText className="w-4 h-4 text-[#102d49]" />
            </div>
            <div className="text-2xl font-black text-[#102d49] mt-2 font-serif">
              {kpiCards.activeRequests}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">En cartera activa</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Esperando docs</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2 font-serif">
              {kpiCards.waitingDocs}
            </div>
            <span className="text-[10px] text-amber-700/80 mt-1 block">Recaudos pendientes</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">En evaluación</span>
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800 mt-2 font-serif">
              {kpiCards.inEvaluation}
            </div>
            <span className="text-[10px] text-blue-700/80 mt-1 block">Análisis crediticio</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Pend. tasación</span>
              <Compass className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-800 mt-2 font-serif">
              {kpiCards.pendingValuation}
            </div>
            <span className="text-[10px] text-purple-700/80 mt-1 block">Peritaje inmueble</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Pend. de firma</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-2 font-serif">
              {kpiCards.pendingSignature}
            </div>
            <span className="text-[10px] text-emerald-700/80 mt-1 block">DocFlow / Notaría</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold">Por cerrar</span>
              <CheckCircle2 className="w-4 h-4 text-[#f4b43b]" />
            </div>
            <div className="text-2xl font-black text-[#102d49] mt-2 font-serif">
              {kpiCards.closingSoon}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Escrituración próxima</span>
          </div>
        </div>

        {/* 3. Pipeline de Solicitudes (7 Etapas Oficiales) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#102d49] flex items-center">
                <Layers className="w-4 h-4 mr-2 text-[#f4b43b]" />
                Pipeline de Solicitudes y Formalización
              </h3>
              <p className="text-xs text-slate-500">Distribución de operaciones según su etapa de maduración</p>
            </div>
            <Link to={`${baseRoute}/solicitudes`} className="text-xs font-bold text-[#102d49] hover:underline flex items-center">
              Ver todas <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
            {pipelineStages.map((stage, idx) => (
              <div
                key={stage.key}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition text-center space-y-1"
              >
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Etapa {idx + 1}</span>
                <span className="text-xs font-bold text-[#102d49] block truncate" title={stage.name}>
                  {stage.name}
                </span>
                <div className="text-lg font-black text-[#102d49] font-serif pt-1">
                  {stage.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Sección: Necesita Atención (Triage Operativo) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Necesita Atención</h3>
                <p className="text-xs text-slate-500">Recaudos faltantes, tareas vencidas y expedientes pendientes</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {attentionItems.length} alertas activas
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {attentionItems.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#102d49] text-xs">{item.applicationId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-800">{item.client}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {item.dueDate}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{item.title}</p>
                </div>

                <Link
                  to={item.link}
                  className="inline-flex items-center text-xs font-bold text-[#102d49] hover:underline shrink-0"
                >
                  Resolver acción <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Solicitudes Recientes & Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Solicitudes Recientes (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102d49]">Solicitudes Recientes</h3>
                <p className="text-xs text-slate-500">Últimos expedientes ingresados en {brandName}</p>
              </div>
              <Link to={`${baseRoute}/solicitudes`} className="text-xs font-bold text-[#102d49] hover:underline flex items-center">
                Ver listado completo <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Cargando expedientes...</div>
            ) : recentApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay solicitudes registradas aún en esta organización.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Cliente</th>
                      <th className="py-3 px-4 font-semibold">Monto Solicitado</th>
                      <th className="py-3 px-4 font-semibold">Inmueble</th>
                      <th className="py-3 px-4 font-semibold">Financiación</th>
                      <th className="py-3 px-4 font-semibold">Estado</th>
                      <th className="py-3 px-4 text-right font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentApplications.map((app) => {
                      const borrowerName = app.borrower
                        ? `${app.borrower.first_name} ${app.borrower.last_name}`
                        : 'Borrador sin titular';
                      const propDesc = app.property
                        ? `${app.property.property_type} en ${app.property.department}`
                        : 'Inmueble pendiente';
                      const propValue = app.property?.estimated_value || 240000;
                      const finPct = propValue > 0 ? ((Number(app.requested_amount) / propValue) * 100).toFixed(1) : '33.3';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#102d49]">
                            {app.public_id}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {borrowerName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#102d49]">
                            USD {Number(app.requested_amount).toLocaleString('es-UY')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 capitalize truncate max-w-[140px]">
                            {propDesc}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            {finPct}%
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`${baseRoute}/solicitudes/${app.id}`}
                              className="text-xs font-bold text-[#102d49] hover:underline inline-flex items-center"
                            >
                              Ver expediente <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actividad Reciente & Resumen (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#102d49] text-white rounded-2xl p-6 shadow-sm space-y-3">
              <span className="text-xs text-slate-300 font-medium block">
                Volumen Operativo Gestionado
              </span>
              <div className="text-3xl font-extrabold text-white font-serif tracking-tight">
                USD 1.840.000
              </div>
              <p className="text-xs text-slate-300">
                Operaciones estructuradas con garantía hipotecaria de primer rango en Uruguay.
              </p>
            </div>

            {/* Feed de Actividad */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Actividad Reciente
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3 pb-2 border-b border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Minuta Notarial Generada</p>
                    <p className="text-[11px] text-slate-400">Expediente HPT-2026-00124 (DocFlow)</p>
                    <span className="text-[10px] text-slate-400 font-mono">Hace 12 min</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pb-2 border-b border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Tasación Profesional Guardada</p>
                    <p className="text-[11px] text-slate-400">Inmueble Carrasco: USD 240.000</p>
                    <span className="text-[10px] text-slate-400 font-mono">Hace 45 min</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Propuesta de Financiación Enviada</p>
                    <p className="text-[11px] text-slate-400">Expediente NOV-2026-00089 por USD 100.000</p>
                    <span className="text-[10px] text-slate-400 font-mono">Hace 2 horas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </BackofficeLayout>
  );
};
