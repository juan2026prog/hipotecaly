import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  AlertTriangle,
  FileSignature,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  ShieldCheck,
  ChevronRight,
  Stamp,
  Check,
} from 'lucide-react';
import { getNotaryStatusLabel } from '../../lib/types';

export const NotaryDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [metrics, setMetrics] = useState({
    activeApplications: 5,
    requiresAttention: 2,
    documentsToReview: 9,
    pendingSignatures: 2,
    upcomingDeadlines: 1,
    profileCompleteness: 100,
  });

  const [urgentCases, setUrgentCases] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const m = await notaryService.getDashboardMetrics(user?.id || 'u-test-notary', tenant.id);
        setMetrics((prev) => ({ ...prev, ...m }));
        const apps = await notaryService.getMyAssignedApplications(user?.id || 'u-test-notary', tenant.id);
        setUrgentCases(apps.slice(0, 3));
      } catch {
        // Fallback
      }
    };
    loadDashboard();
  }, [user?.id, tenant.id]);

  return (
    <NotaryLayout title="Mesa de Revisión Notarial">
      {/* Saludo y Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Stamp className="w-4 h-4" />
            <span>Mesa de Revisión Notarial · HIPOTECALY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Buenos días, Esc. María Pérez
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Revisión jurídica, control de títulos por IA y formalización de escrituras con FEA (Ley 18.600).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`${basePath}/expedientes`}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Ver Expedientes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`${basePath}/firmas`}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <FileSignature className="w-3.5 h-3.5 text-teal-400" />
            <span>Firmas Pendientes</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Operativas Prioritarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Requiere tu atención */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Requiere tu atención</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-900">
              {metrics.requiresAttention} expedientes
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center">
              <span>Con excepciones o revisiones pendientes</span>
            </div>
          </div>
        </div>

        {/* Firmas pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-purple-900 text-xs font-bold uppercase tracking-wider">
            <span>Firmas pendientes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-purple-950">
              {metrics.pendingSignatures} escrituras
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center">
              <span>Listas para Firma Electrónica Avanzada</span>
            </div>
          </div>
        </div>

        {/* Vencimientos próximos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Vencimientos próximos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.upcomingDeadlines} certificado
            </div>
            <div className="text-[11px] text-rose-700 font-semibold mt-1 flex items-center">
              <span>Certificado DGR vence en 48 hs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Lista de Acciones Concretas + Estado Profesional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Acciones Concretas Inmediatas (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Acciones Concretas Inmediatas</span>
            </h3>
            <Link
              to={`${basePath}/expedientes`}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Ver todos ({metrics.activeApplications})
            </Link>
          </div>

          <div className="space-y-3">
            {urgentCases.map((app, index) => {
              const actionText =
                index === 0
                  ? 'Revisar capitulaciones matrimoniales'
                  : index === 1
                  ? 'Escritura lista para firma electrónica'
                  : 'Cotejar cédula catastral y plano de mensura';
              const isReadyToSign = app.notary_status === 'ready_to_sign' || index === 1;

              return (
                <div
                  key={app.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        {app.public_id}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {app.borrower.first_name} {app.borrower.last_name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {getNotaryStatusLabel(app.notary_status)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{app.property.address || 'Inmueble en garantía'} · Padrón {app.property.cadastral_number}</span>
                      </span>
                    </div>

                    <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center space-x-1.5 ${
                      isReadyToSign
                        ? 'text-purple-800 bg-purple-50 border-purple-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}>
                      {isReadyToSign ? (
                        <FileSignature className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{actionText}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to={`${basePath}/expedientes/${app.id}`}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm ${
                        isReadyToSign
                          ? 'bg-purple-700 hover:bg-purple-600'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <span>{isReadyToSign ? 'Firmar' : 'Revisar'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1 text-teal-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Próximos Vencimientos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Próximos Vencimientos Registrales</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">Vencimiento certificado DGR (Inmobiliaria)</span>
                    <div className="text-slate-500 text-[11px]">HIP-2026-00158 · Padrón 145.892 (Carrasco)</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Vence en 48 hs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado Profesional Conciso (Sin porcentajes gigantes) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Estado Profesional
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
                <Check className="w-3 h-3 mr-0.5" /> Habilitada
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Escribana:</span>
                <span className="font-bold text-slate-900">Esc. María Pérez</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">N.º Caja Notarial:</span>
                <span className="font-mono font-bold text-teal-800">48.291</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Habilitación SCJ:</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activa
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Firma Avanzada (FEA):</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Vigente 2028 (Abitab)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={`${basePath}/perfil`}
                className="w-full block text-center px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
              >
                Ver Perfil Notarial & Certificados
              </Link>
            </div>
          </div>

          {/* Tarjeta de Estudio Notarial */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Estudio Notarial Asociado</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Estudio Fernández & Asociados</div>
              <div className="text-xs text-slate-400 mt-0.5">Rincón 487 Piso 3 Esc. 302, Montevideo</div>
              <div className="text-xs text-teal-300 font-mono mt-1">RUT: 21.849.201.0019</div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Organización contratante:</span>
              <span className="font-bold text-teal-200">{tenant.branding?.public_name || tenant.name || 'Estudio Nova'}</span>
            </div>
          </div>
        </div>
      </div>
    </NotaryLayout>
  );
};