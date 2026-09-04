import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getBackofficeMetrics, getApplicationsList } from '../../lib/backofficeService';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { aiService } from '../../lib/aiService';
import { AiWalletState } from '../../lib/ai/types';
import { useTenant } from '../../contexts/TenantContext';

export const DashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const [metrics, setMetrics] = useState<{
    newRequests: number;
    inAnalysis: number;
    waitingDocs: number;
    offerAvailable: number;
    approved: number;
    totalRequested: number;
    isDemo: boolean;
  }>({
    newRequests: 0,
    inAnalysis: 0,
    waitingDocs: 0,
    offerAvailable: 0,
    approved: 0,
    totalRequested: 0,
    isDemo: false,
  });

  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiWallet, setAiWallet] = useState<AiWalletState | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const m = await getBackofficeMetrics({ organizationId: tenant.id, isDemoMode: isDemo });
      setMetrics(m);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });
      setRecentApplications(apps.slice(0, 6));

      // Cargar billetera AI del tenant
      try {
        const w = await aiService.getWalletState(tenant.id);
        setAiWallet(w);
      } catch {
        // Silencioso
      }

      setLoading(false);
    }
    loadData();
  }, [tenant.id, tenant.demo_mode]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        
        {/* 1. Header con CTA Operativo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
              OPERACIONES & CRÉDITO
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Panel Operativo
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Control general de solicitudes, expedientes y garantías en tiempo real.
            </p>
          </div>

          <Link to="/solicitar">
            <Button variant="primary" size="md" className="shadow-sm font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Nueva solicitud
            </Button>
          </Link>
        </div>

        {/* Demo Tag si aplica */}
        {metrics.isDemo && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo demostrativo activo:</strong> Mostrando dataset de pruebas separado de producción.
              </span>
            </div>
            <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded font-bold">
              DEMO
            </span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. STAT CARDS (KPIs Operativos)                              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs">
            <div className="flex items-center justify-between text-slate-muted text-xs">
              <span>Nuevas</span>
              <FileText className="w-4 h-4 text-brand-green" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">
              {metrics.newRequests}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Por evaluar</span>
          </div>

          <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs">
            <div className="flex items-center justify-between text-slate-muted text-xs">
              <span>En análisis</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">
              {metrics.inAnalysis}
            </div>
            <span className="text-[10px] text-amber-600 font-medium mt-1 block">Revisión técnica</span>
          </div>

          <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs">
            <div className="flex items-center justify-between text-slate-muted text-xs">
              <span>Esperando docs</span>
              <AlertCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">
              {metrics.waitingDocs}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Borradores activos</span>
          </div>

          <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs">
            <div className="flex items-center justify-between text-slate-muted text-xs">
              <span>Con propuesta</span>
              <TrendingUp className="w-4 h-4 text-brand-green" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">
              {metrics.offerAvailable}
            </div>
            <span className="text-[10px] text-brand-green font-medium mt-1 block">Oferta emitida</span>
          </div>

          <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-muted text-xs">
              <span>Aprobadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">
              {metrics.approved}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 block">En formalización</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. SECCIÓN CENTRAL: SOLICITUDES RECIENTES & WIDGETS LATERALES */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Solicitudes Recientes (Desktop Tabla / Mobile Cards) */}
          <div className="lg:col-span-8 bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-navy">Solicitudes recientes</h3>
                <p className="text-xs text-slate-muted">Últimos expedientes ingresados</p>
              </div>
              <Link
                to="/app/solicitudes"
                className="text-xs font-bold text-brand-green hover:underline flex items-center"
              >
                Ver todas <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Cargando expedientes...</div>
            ) : recentApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Todavía no hay solicitudes registradas en la base de datos.
              </div>
            ) : (
              <div>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">ID</th>
                        <th className="py-3 px-4 font-semibold">Solicitante</th>
                        <th className="py-3 px-4 font-semibold">Propiedad</th>
                        <th className="py-3 px-4 font-semibold">Monto</th>
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

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-navy">
                              {app.public_id}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {borrowerName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 capitalize">
                              {propDesc}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-navy">
                              USD {Number(app.requested_amount).toLocaleString('es-UY')}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={app.status} size="sm" />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to={`/app/solicitudes/${app.id}`}
                                className="text-xs font-bold text-brand-green hover:underline inline-flex items-center min-h-[36px]"
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

                {/* Mobile Responsive Cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      to={`/app/solicitudes/${app.id}`}
                      className="p-4 block hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-navy block">
                            {app.public_id}
                          </span>
                          <span className="text-xs text-slate-600 mt-0.5 block">
                            {app.borrower
                              ? `${app.borrower.first_name} ${app.borrower.last_name}`
                              : 'Borrador'}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-navy">
                          USD {Number(app.requested_amount).toLocaleString('es-UY')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50 text-[11px]">
                        <span className="text-slate-500 capitalize">
                          {app.property?.property_type} · {app.property?.department}
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Widgets Compactos */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Volumen Total Gestionado Card */}
            <div className="bg-navy text-white rounded-card p-6 border border-navy-border shadow-card">
              <span className="text-xs text-slate-300 font-medium block">
                Volumen total gestionado
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                USD {metrics.totalRequested.toLocaleString('es-UY')}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-brand-green mt-2 font-semibold">
                <ArrowUpRight className="w-4 h-4" />
                <span>Flujo de cartera en Uruguay</span>
              </div>
            </div>

            {/* Widget Compacto: HIPOTECALY AI */}
            <div className="bg-navy-surface text-white rounded-card p-5 border border-navy-border shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-green" />
                  <span className="text-xs font-bold tracking-wider text-slate-200">
                    HIPOTECALY AI
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand-green/20 text-brand-green border border-brand-green/30">
                  Activo
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-brand-green tracking-tight">
                  {aiWallet?.totalCaseBalance ?? 8.64} casos
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  1.36 utilizados este mes
                </p>
              </div>

              <div className="pt-2 border-t border-navy-border/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(true)}
                  className="text-brand-green hover:underline font-semibold"
                >
                  Cargar saldo
                </button>
                <Link
                  to="/admin/ai"
                  className="text-slate-300 hover:text-white font-medium flex items-center"
                >
                  Ver consumo <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Actividad Operativa Reciente */}
            <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Actividad reciente
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Solicitud HIP-DEMO-00124</p>
                    <p className="text-[11px] text-slate-400">Revisión de documentos iniciada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Valuación preliminar guardada</p>
                    <p className="text-[11px] text-slate-400">Inmueble Carrasco: USD 235.000</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal para Recargar Saldo */}
        {showRechargeModal && (
          <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-card shadow-2xl max-w-md w-full p-6 border border-slate-200 text-left space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand-green" />
                  <h3 className="font-bold text-base text-navy">Recarga de saldo AI</h3>
                </div>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Los créditos AI comprados <strong>nunca vencen</strong> y se consumen únicamente después de agotar los
                créditos promocionales del mes.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Paquete 10 casos:</span>
                  <span className="font-bold text-navy">USD 5.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Paquete 25 casos:</span>
                  <span className="font-bold text-navy">USD 12.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Paquete 100 casos:</span>
                  <span className="font-bold text-navy">USD 50.00</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <span className="font-bold">Nota de facturación:</span> La estructura del ledger y billetera está
                operativa. La facturación automatizada se liquida mensualmente con tu plan.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowRechargeModal(false)}
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </BackofficeLayout>
  );
};
