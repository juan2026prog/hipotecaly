import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  DollarSign,
  UserCheck,
  Zap,
  Activity,
  Filter,
  Clock3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTenant } from '../../contexts/TenantContext';
import { isDemoMode as checkDemoMode, isDemoOrganization } from '../../lib/demoControl';

export const DashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const isOrganizationPath = location.pathname.startsWith('/org/');
  const isDemo =
    checkDemoMode({
      organizationId: tenant.id,
      isDemoMode: Boolean(tenant.demo_mode),
      pathname: location.pathname,
    }) || isDemoOrganization(tenant.id);

  const baseRoute = isOrganizationPath
    ? `/org/${tenant.slug}/admin`
    : isTenantPath
      ? `/demo/${tenant.slug || 'estudio-nova'}/admin`
      : '/app';

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState<number>(1840000);
  const [statusTableFilter, setStatusTableFilter] = useState<string>('all');

  // KPIs Operativos
  const [kpiCards, setKpiCards] = useState({
    activeRequests: 8,
    waitingDocs: 3,
    inEvaluation: 2,
    pendingValuation: 2,
    pendingSignature: 1,
    closingSoon: 1,
  });

  // Alertas de "Necesita Atención"
  const [attentionItems, setAttentionItems] = useState<any[]>([]);

  // Pipeline Counts
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({
    submitted: 2,
    info_review: 2,
    property_analysis: 1,
    evaluation: 1,
    offer_available: 1,
    formalization: 1,
    approved: 4,
  });

  const demoAttentionItems = [
    {
      id: 'att-1',
      category: 'docs',
      typeText: 'Documentación vencida',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      title: '3 documentos requieren revisión urgente o vencen hoy',
      applicationId: 'HPT-2026-00124',
      client: 'Ignacio Silva',
      severity: 'high',
      dueDate: 'Vence hoy',
      link: `${baseRoute}/documentos`,
      actionLabel: 'Ver documentos',
    },
    {
      id: 'att-2',
      category: 'stale',
      typeText: 'Expediente sin movimiento',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      title: 'Expediente sin actualización en los últimos 4 días hábiles',
      applicationId: 'NOV-2026-00072',
      client: 'Gonzalo Méndez',
      severity: 'medium',
      dueDate: '48 h sin actualización',
      link: `${baseRoute}/solicitudes/e0000000-0000-0000-0000-000000000002`,
      actionLabel: 'Revisar expediente',
    },
    {
      id: 'att-3',
      category: 'tasacion',
      typeText: 'Tasación pendiente',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      title: 'Tasación profesional pendiente de peritaje en Inmueble Pocitos',
      applicationId: 'NOV-2026-00089',
      client: 'María Eugenia Rossi',
      severity: 'medium',
      dueDate: 'Plazo 24 hs',
      link: `${baseRoute}/tasaciones`,
      actionLabel: 'Asignar tasador',
    },
    {
      id: 'att-4',
      category: 'firma',
      typeText: 'Firma pendiente',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-500',
      title: 'Minuta notarial definitiva lista para firma electrónica avanzada',
      applicationId: 'NOV-2026-00094',
      client: 'Carlos Benítez',
      severity: 'high',
      dueDate: 'Esperando firma',
      link: `${baseRoute}/documentos`,
      actionLabel: 'Gestionar firma',
    },
    {
      id: 'att-5',
      category: 'kyc',
      typeText: 'KYC pendiente',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
      title: 'Verificación biométrica de cédula de identidad no completada',
      applicationId: 'HPT-2026-00130',
      client: 'Lucía Fernández',
      severity: 'medium',
      dueDate: 'Pendiente titular',
      link: `${baseRoute}/solicitudes/e0000000-0000-0000-0000-000000000001`,
      actionLabel: 'Enviar recordatorio',
    },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const m = await getBackofficeMetrics({ organizationId: tenant.id, isDemoMode: isDemo });
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });
      setApplications(apps);

      if (isDemo) {
        setAttentionItems(demoAttentionItems);
        setTotalVolume(1840000);
        setPipelineCounts({
          submitted: 2,
          info_review: 2,
          property_analysis: 1,
          evaluation: 1,
          offer_available: 1,
          formalization: 1,
          approved: 4,
        });
        setKpiCards({
          activeRequests: 8,
          waitingDocs: 3,
          inEvaluation: 2,
          pendingValuation: 2,
          pendingSignature: 1,
          closingSoon: 1,
        });
      } else {
        // Cálculo dinámico para organizaciones de producción
        const counts: Record<string, number> = {
          submitted: apps.filter((a) => a.status === 'submitted').length,
          info_review: apps.filter((a) => a.status === 'info_review').length,
          property_analysis: apps.filter((a) => a.status === 'property_analysis').length,
          evaluation: apps.filter((a) => a.status === 'evaluation').length,
          offer_available: apps.filter((a) => a.status === 'offer_available').length,
          formalization: apps.filter((a) => a.status === 'formalization').length,
          approved: apps.filter((a) => a.status === 'approved').length,
        };
        setPipelineCounts(counts);

        const realVolume = m ? m.totalRequested : apps.reduce((sum, a) => sum + (Number(a.requested_amount) || 0), 0);
        setTotalVolume(realVolume);

        const activeCount = apps.filter((a) => a.status !== 'approved' && a.status !== 'rejected').length;
        const waitingDocsCount = apps.filter((a) => a.status === 'draft' || a.status === 'info_review' || a.status === 'submitted').length;
        const inEvalCount = apps.filter((a) => a.status === 'evaluation').length;
        const pendingValCount = apps.filter((a) => a.status === 'property_analysis').length;
        const pendingSignCount = apps.filter((a) => a.status === 'formalization').length;
        const closingSoonCount = apps.filter((a) => a.status === 'formalization').length;

        setKpiCards({
          activeRequests: activeCount,
          waitingDocs: waitingDocsCount,
          inEvaluation: inEvalCount,
          pendingValuation: pendingValCount,
          pendingSignature: pendingSignCount,
          closingSoon: closingSoonCount,
        });

        // Alertas dinámicas reales derivadas del workflow
        const dynamicAlerts: any[] = [];
        const pendingReviewApps = apps.filter((a) => a.status === 'submitted' || a.status === 'info_review').slice(0, 3);
        for (const app of pendingReviewApps) {
          const clientName = app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Titular pendiente';
          dynamicAlerts.push({
            id: `att-dyn-${app.id}`,
            category: 'docs',
            typeText: 'Documentación pendiente',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            dotColor: 'bg-amber-500',
            title: `Expediente ${app.public_id || app.id} pendiente de revisión de recaudos`,
            applicationId: app.public_id || app.id,
            client: clientName,
            severity: 'medium',
            dueDate: 'En revisión',
            link: `${baseRoute}/solicitudes/${app.id}`,
            actionLabel: 'Revisar expediente',
          });
        }
        const pendingValApps = apps.filter((a) => a.status === 'property_analysis').slice(0, 2);
        for (const app of pendingValApps) {
          const clientName = app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Titular pendiente';
          dynamicAlerts.push({
            id: `att-dyn-val-${app.id}`,
            category: 'tasacion',
            typeText: 'Tasación pendiente',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            dotColor: 'bg-amber-500',
            title: `Tasación requerida para garantía de expediente ${app.public_id || app.id}`,
            applicationId: app.public_id || app.id,
            client: clientName,
            severity: 'medium',
            dueDate: 'Pendiente peritaje',
            link: `${baseRoute}/tasaciones`,
            actionLabel: 'Tasador IA',
          });
        }
        setAttentionItems(dynamicAlerts);
      }

      setLoading(false);
    }
    loadData();
  }, [tenant.id, tenant.demo_mode, isDemo]);

  // Total de casos en pipeline para porcentajes
  const totalPipelineCases = useMemo(() => {
    return (
      (pipelineCounts.submitted || 0) +
      (pipelineCounts.info_review || 0) +
      (pipelineCounts.property_analysis || 0) +
      (pipelineCounts.evaluation || 0) +
      (pipelineCounts.offer_available || 0) +
      (pipelineCounts.formalization || 0) +
      (pipelineCounts.approved || 0)
    );
  }, [pipelineCounts]);

  const pipelineStages = [
    {
      key: 'received',
      name: 'Solicitud recibida',
      stepNum: 1,
      count: pipelineCounts.submitted || 0,
      filterStatus: 'submitted',
      color: '#3B82F6',
    },
    {
      key: 'info_review',
      name: 'Información en revisión',
      stepNum: 2,
      count: pipelineCounts.info_review || 0,
      filterStatus: 'info_review',
      color: '#0EA5E9',
    },
    {
      key: 'property_docs',
      name: 'Propiedad y recaudos',
      stepNum: 3,
      count: pipelineCounts.property_analysis || 0,
      filterStatus: 'property_analysis',
      color: '#8B5CF6',
    },
    {
      key: 'evaluation',
      name: 'Evaluación crediticia',
      stepNum: 4,
      count: pipelineCounts.evaluation || 0,
      filterStatus: 'evaluation',
      color: '#6366F1',
    },
    {
      key: 'conditions',
      name: 'Condiciones de oferta',
      stepNum: 5,
      count: pipelineCounts.offer_available || 0,
      filterStatus: 'offer_available',
      color: '#F59E0B',
    },
    {
      key: 'formalization',
      name: 'Formalización notarial',
      stepNum: 6,
      count: pipelineCounts.formalization || 0,
      filterStatus: 'formalization',
      color: '#10B981',
    },
    {
      key: 'completed',
      name: 'Finalizados',
      stepNum: 7,
      count: pipelineCounts.approved || 0,
      filterStatus: 'approved',
      color: '#059669',
    },
  ];

  // Filtrado de la tabla de expedientes recientes
  const filteredApplications = useMemo(() => {
    let list = applications;
    if (statusTableFilter !== 'all') {
      list = list.filter((a) => a.status === statusTableFilter);
    }
    return list.slice(0, 8);
  }, [applications, statusTableFilter]);

  return (
    <BackofficeLayout>
      <div className="w-full max-w-[1550px] mx-auto space-y-6 text-left pb-10">
        
        {/* ============================================================ */}
        {/* 1. CABECERA DEL DASHBOARD: TÍTULO, SUBTEXTO Y ACCIÓN PRIMARIA */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mb-1">
              <span className="font-bold text-[#102d49]">
                {isOrganizationPath ? `HIPOTECALY · ${brandName}` : `${brandName} / Backoffice`}
              </span>
              <span>•</span>
              <span>{isOrganizationPath ? 'Panel Principal' : 'Inicio'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Inicio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Estado operativo, prioridades y seguimiento de expedientes.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/solicitar">
              <Button
                variant="primary"
                size="md"
                className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-bold text-xs shadow-sm px-4 py-2.5 rounded-xl min-h-[42px] flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>+ Nuevo expediente</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. ESTRUCTURA 70% PRINCIPAL / 30% LATERAL                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================== */}
          {/* COLUMNA PRINCIPAL (70% ~ 8 de 12 columnas)                 */}
          {/* ========================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* A. BANDEJA OPERATIVA: NECESITA TU ATENCIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Necesita tu atención</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {attentionItems.length} pendientes
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Alertas operativas, expedientes con demoras y tareas críticas para hoy
                    </p>
                  </div>
                </div>
              </div>

              {attentionItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                  <p className="font-semibold text-slate-700">Sin alertas operativas pendientes</p>
                  <p className="text-slate-400">Todos los expedientes y trámites de la organización están al día.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor || 'bg-slate-400'}`} />
                            {item.typeText}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono font-bold text-[#102d49] text-xs">
                            {item.applicationId}
                          </span>
                          <span className="text-slate-600 font-medium text-xs">
                            ({item.client})
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-auto sm:ml-0 flex items-center gap-1">
                            <Clock3 className="w-3 h-3 text-slate-400" />
                            {item.dueDate}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs font-normal leading-relaxed">
                          {item.title}
                        </p>
                      </div>

                      <Link
                        to={item.link}
                        className="inline-flex items-center justify-center text-xs font-bold text-white bg-[#102d49] hover:bg-[#173a5e] px-4 py-2 rounded-xl shrink-0 shadow-xs transition min-h-[38px] w-full sm:w-auto"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-[#f4b43b]" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. 4 KPIs PRINCIPALES CLARAMENTE VISIBLES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* KPI 1: Expedientes Activos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expedientes Activos
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#102d49] font-serif tracking-tight">
                  {kpiCards.activeRequests}
                </div>
                <span className="text-xs text-slate-500 block">En gestión operativa</span>
              </div>

              {/* KPI 2: Volumen en Operación */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Volumen en Operación
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#102d49] font-serif tracking-tight">
                  USD {totalVolume.toLocaleString('es-UY')}
                </div>
                <span className="text-xs text-slate-500 block">Créditos hipotecarios</span>
              </div>

              {/* KPI 3: Próximos a Cerrar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Próximos a Cerrar
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-serif tracking-tight">
                  {kpiCards.closingSoon}
                </div>
                <span className="text-xs text-slate-500 block">En firma / formalización</span>
              </div>

              {/* KPI 4: Demorados / Fuera de SLA */}
              <div className={`p-5 rounded-2xl border shadow-sm space-y-1 ${
                kpiCards.waitingDocs > 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  kpiCards.waitingDocs > 0 ? 'text-rose-600' : 'text-slate-400'
                }`}>
                  Demorados / SLA
                </span>
                <div className={`text-2xl sm:text-3xl font-black font-serif tracking-tight ${
                  kpiCards.waitingDocs > 0 ? 'text-rose-700' : 'text-slate-700'
                }`}>
                  {kpiCards.waitingDocs}
                </div>
                <span className={`text-xs block ${
                  kpiCards.waitingDocs > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500'
                }`}>
                  {kpiCards.waitingDocs > 0 ? 'Requieren seguimiento' : 'Sin demoras críticas'}
                </span>
              </div>
            </div>

            {/* C. PIPELINE DE 7 ETAPAS (ANCHO COMPLETO EN COLUMNA PRINCIPAL) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#102d49] flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-brand-green" />
                    Pipeline Operativo ({totalPipelineCases} expedientes)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Haz click en cualquier etapa para filtrar y revisar los expedientes
                  </p>
                </div>
                <Link
                  to={`${baseRoute}/solicitudes`}
                  className="text-xs font-bold text-[#102d49] hover:underline flex items-center"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
                {pipelineStages.map((stage) => {
                  const pct = totalPipelineCases > 0 ? Math.round((stage.count / totalPipelineCases) * 100) : 0;
                  return (
                    <Link
                      key={stage.key}
                      to={`${baseRoute}/solicitudes?stage=${stage.filterStatus}`}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-[#102d49]/30 hover:shadow-xs transition text-center space-y-1.5 group cursor-pointer block flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-mono">Paso {stage.stepNum}</span>
                          <span className="font-semibold text-slate-500">{pct}%</span>
                        </div>
                        <span className="text-xs font-bold text-[#102d49] block line-clamp-2 min-h-[32px] group-hover:text-brand-green" title={stage.name}>
                          {stage.name}
                        </span>
                      </div>

                      <div className="pt-1">
                        <div className="text-2xl font-black text-[#102d49] font-serif group-hover:scale-105 transition-transform">
                          {stage.count}
                        </div>
                        {/* Barra de progreso visual por etapa */}
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(pct, 8)}%`,
                              backgroundColor: stage.color,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* D. TIEMPOS / SLA DE RESOLUCIÓN POR ETAPA */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#102d49]/10 text-[#102d49] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Ritmo de Trabajo y Cumplimiento de SLA
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tiempos promedio de resolución respecto al objetivo previsto por fase
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Últimos 30 días
                </span>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    stage: 'Documentación',
                    avgDays: '3,8',
                    humanStatus: '1 fuera de objetivo',
                    isDelayed: true,
                    targetDesc: 'Objetivo ≤ 3 días',
                    icon: '📄',
                  },
                  {
                    stage: 'Tasación',
                    avgDays: '2,1',
                    humanStatus: 'Dentro de objetivo',
                    isDelayed: false,
                    targetDesc: 'Objetivo ≤ 5 días',
                    icon: '🏠',
                  },
                  {
                    stage: 'Evaluación',
                    avgDays: '1,7',
                    humanStatus: 'Dentro de objetivo',
                    isDelayed: false,
                    targetDesc: 'Objetivo ≤ 4 días',
                    icon: '🔍',
                  },
                  {
                    stage: 'Firma Notarial',
                    avgDays: '0,9',
                    humanStatus: 'Dentro de objetivo',
                    isDelayed: false,
                    targetDesc: 'Objetivo ≤ 3 días',
                    icon: '✍️',
                  },
                ].map((item) => (
                  <div
                    key={item.stage}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                      item.isDelayed ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-base">{item.icon}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            item.isDelayed
                              ? 'text-amber-800 bg-amber-100 border-amber-200'
                              : 'text-emerald-800 bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {item.isDelayed ? '⚠️ ' + item.humanStatus : '✓ ' + item.humanStatus}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-800 truncate">
                        {item.stage}
                      </p>
                    </div>

                    <div>
                      <div className="text-lg sm:text-xl font-black font-serif text-[#102d49]">
                        {item.avgDays} días promedio
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.targetDesc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* E. RESUMEN SECUNDARIO DE ESTADOS (CARDS COMPACTAS) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Distribución Secundaria de Estados
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { label: 'Solicitudes activas', count: kpiCards.activeRequests, icon: FileText, color: 'text-[#102d49]' },
                  { label: 'Esperando docs', count: kpiCards.waitingDocs, icon: Clock, color: 'text-amber-600' },
                  { label: 'En evaluación', count: kpiCards.inEvaluation, icon: Sparkles, color: 'text-blue-600' },
                  { label: 'Pend. tasación', count: kpiCards.pendingValuation, icon: Compass, color: 'text-purple-600' },
                  { label: 'Pend. firma', count: kpiCards.pendingSignature, icon: FileCheck, color: 'text-emerald-600' },
                  { label: 'Por cerrar', count: kpiCards.closingSoon, icon: CheckCircle2, color: 'text-[#f4b43b]' },
                ].map((st, idx) => {
                  const Icon = st.icon;
                  return (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-medium truncate text-slate-600">{st.label}</span>
                        <Icon className={`w-3.5 h-3.5 ${st.color}`} />
                      </div>
                      <div className="text-xl font-black text-[#102d49] font-serif">
                        {st.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* F. EXPEDIENTES RECIENTES: TABLA OPERATIVA CON PRÓXIMA ACCIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#102d49]">
                    Expedientes Recientes & Próxima Acción
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bandeja operativa de seguimiento y gestión directa de expedientes
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={statusTableFilter}
                      onChange={(e) => setStatusTableFilter(e.target.value)}
                      className="bg-transparent border-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="submitted">Recibida</option>
                      <option value="info_review">En revisión</option>
                      <option value="property_analysis">Tasación</option>
                      <option value="evaluation">Evaluación</option>
                      <option value="offer_available">Oferta</option>
                      <option value="formalization">Formalización</option>
                      <option value="approved">Finalizada</option>
                    </select>
                  </div>

                  <Link
                    to={`${baseRoute}/solicitudes`}
                    className="text-xs font-bold text-[#102d49] hover:underline flex items-center shrink-0 pl-1"
                  >
                    <span>Ver vista completa</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Cargando expedientes...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Sin expedientes en este filtro</p>
                  <p className="text-slate-400">No hay solicitudes que coincidan con el estado seleccionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ID</th>
                        <th className="py-3 px-4 font-semibold">Cliente</th>
                        <th className="py-3 px-4 font-semibold">Monto</th>
                        <th className="py-3 px-4 font-semibold">LTV</th>
                        <th className="py-3 px-4 font-semibold">Próxima Acción</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 text-right font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => {
                        const borrowerName = app.borrower
                          ? `${app.borrower.first_name} ${app.borrower.last_name}`
                          : 'Borrador sin titular';
                        const propValue = app.property?.estimated_value || 240000;
                        const finPct = propValue > 0 ? ((Number(app.requested_amount) / propValue) * 100).toFixed(1) : '33.3';

                        const nextActionMap: Record<string, string> = {
                          draft: 'Completar datos',
                          submitted: 'Revisar documentación',
                          info_review: 'Revisar ingresos y DGI',
                          property_analysis: 'Asignar tasador',
                          evaluation: 'Revisar evaluación IA',
                          offer_available: 'Preparar condiciones',
                          formalization: 'Enviar a firma notarial',
                          approved: 'Coordinar desembolso',
                          rejected: 'Archivar expediente',
                        };
                        const nextAction = nextActionMap[app.status] || 'Revisar expediente';

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#102d49]">
                              {app.public_id}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {borrowerName}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#102d49] font-mono">
                              USD {Number(app.requested_amount).toLocaleString('es-UY')}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                              {finPct}%
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md inline-block">
                                {nextAction}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={app.status} size="sm" />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to={`${baseRoute}/solicitudes/${app.id}`}
                                className="text-xs font-bold text-[#102d49] hover:underline inline-flex items-center"
                              >
                                <span>Abrir</span>
                                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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

          </div>

          {/* ========================================================== */}
          {/* COLUMNA LATERAL (30% ~ 4 de 12 columnas)                   */}
          {/* ========================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* A. VOLUMEN OPERATIVO ESTIMADO */}
            <div className="bg-[#102d49] text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Volumen operativo estimado</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-serif tracking-tight">
                USD {totalVolume.toLocaleString('es-UY')}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Capital actualmente en expedientes activos y garantías hipotecarias estructuradas en {brandName}.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Garantías de 1º rango</span>
                <span className="font-bold text-emerald-400">100% Uruguay</span>
              </div>
            </div>

            {/* B. ACCIONES RÁPIDAS (CONECTADAS A FUNCIONALIDADES REALES) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Acciones Rápidas
                </h4>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <Link
                  to="/solicitar"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-[#102d49]" />
                    <span>+ Nuevo expediente</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to={`${baseRoute}/clientes`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>+ Gestionar clientes</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to={`${baseRoute}/tasaciones`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Compass className="w-4 h-4 text-purple-600" />
                    <span>Asignar tasación (Tasador IA)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  to={`${baseRoute}/inversores`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Red de inversores</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* C. SALUD OPERATIVA */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Salud Operativa
                </h4>
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-900 font-medium">Etapas en tiempo esperado</span>
                  <strong className="text-emerald-700 font-bold">3 de 4</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="text-amber-900 font-medium">Requieren seguimiento de recaudos</span>
                  <strong className="text-amber-800 font-bold">{kpiCards.waitingDocs} casos</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-blue-900 font-medium">Firmas y formalización al día</span>
                  <strong className="text-blue-800 font-bold">✓ 100%</strong>
                </div>
              </div>
            </div>

            {/* D. ACTIVIDAD RECIENTE */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Actividad Reciente
                </h4>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {isDemo ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-3 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">María N. actualizó la garantía</p>
                      <p className="text-[11px] text-slate-500">Expediente HYP-0094 · Inmueble Pocitos</p>
                      <span className="text-[10px] text-slate-400 font-mono">Hace 8 min</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">Tasación profesional guardada</p>
                      <p className="text-[11px] text-slate-500">Inmueble Carrasco: USD 240.000</p>
                      <span className="text-[10px] text-slate-400 font-mono">Hace 21 min</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-2.5 border-b border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">Propuesta de financiación enviada</p>
                      <p className="text-[11px] text-slate-500">Expediente NOV-2026-00089 por USD 100.000</p>
                      <span className="text-[10px] text-slate-400 font-mono">Hace 48 min</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">KYC iniciado</p>
                      <p className="text-[11px] text-slate-500">Lucía Fernández · Validación biométrica</p>
                      <span className="text-[10px] text-slate-400 font-mono">Hace 1 h</span>
                    </div>
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Sin eventos recientes registrados
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {applications.slice(0, 4).map((app) => (
                    <div key={app.id} className="flex items-start space-x-3 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-[#102d49] mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">Expediente {app.public_id || app.id}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Solicitud'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          USD {Number(app.requested_amount || 0).toLocaleString('es-UY')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </BackofficeLayout>
  );
};

