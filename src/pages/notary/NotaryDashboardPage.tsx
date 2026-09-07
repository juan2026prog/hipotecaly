import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  FileText,
  AlertTriangle,
  FileCheck,
  FileSignature,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  ShieldCheck,
  ChevronRight,
  Stamp,
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
    pendingSignatures: 3,
    profileCompleteness: 92,
  });

  const [urgentCases, setUrgentCases] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const m = await notaryService.getDashboardMetrics(user?.id || 'u-test-notary', tenant.id);
        setMetrics(m);
        const apps = await notaryService.getMyAssignedApplications(user?.id || 'u-test-notary', tenant.id);
        // Filtrar casos que requieren atención o con tareas pendientes
        setUrgentCases(apps.slice(0, 3));
      } catch {
        // Fallback
      }
    };
    loadDashboard();
  }, [user?.id, tenant.id]);

  return (
    <NotaryLayout title="Panel Notarial">
      {/* Saludo y Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Stamp className="w-4 h-4" />
            <span>Estudio Notarial Conectado</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Buenos días, Esc. María Pérez
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Tienes <span className="text-teal-300 font-bold">{metrics.requiresAttention} expedientes</span> que requieren tu revisión hoy.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`${basePath}/expedientes`}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Ver mis expedientes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`${basePath}/tareas`}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Mis Tareas</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Operativas (Sin métricas comerciales) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expedientes Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Expedientes Activos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.activeApplications}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center">
              <span>Asignados formalmente</span>
            </div>
          </div>
        </div>

        {/* Requieren mi atención */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Requieren mi atención</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-900">
              {metrics.requiresAttention}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center">
              <span>Con observaciones o faltantes</span>
            </div>
          </div>
        </div>

        {/* Documentos por revisar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Documentos por revisar</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.documentsToReview}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center">
              <span>Títulos, planos y recibos</span>
            </div>
          </div>
        </div>

        {/* Firmas pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Firmas Pendientes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.pendingSignatures}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center">
              <span>Escrituras en redacción final</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: "Requiere tu atención" + "Perfil Profesional & Firma" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Requiere tu Atención (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Requiere tu atención prioritaria</span>
            </h3>
            <Link
              to={`${basePath}/expedientes`}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Ver todos ({metrics.activeApplications})
            </Link>
          </div>

          <div className="space-y-3">
            {urgentCases.map((app) => (
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

                  <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-flex items-center space-x-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{app.next_task}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    to={`${basePath}/expedientes/${app.id}`}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Abrir expediente</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 text-teal-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Próximos Vencimientos y Calendario */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Próximos Vencimientos Registrales y Notariales</span>
              </h4>
              <Link to={`${basePath}/calendario`} className="text-xs font-bold text-teal-600 hover:underline">
                Ver calendario
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
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

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">Presentación de Declaratoria de Herederos</span>
                    <div className="text-slate-500 text-[11px]">HIP-2026-00152 · Sucesión Vázquez</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  15 Sep 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado del Perfil Profesional & Firma (1 col) */}
        <div className="space-y-6">
          {/* Tarjeta de Completitud de Perfil Notarial */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Identificación Profesional
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {metrics.profileCompleteness}% completo
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.profileCompleteness}%` }}
              />
            </div>

            {/* Lista de Verificación de Datos Profesionales */}
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Nombre y Cédula</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verificado
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">N.º Caja Notarial</span>
                <span className="font-mono font-bold text-slate-900">48.291 (Activo)</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Domicilio profesional</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completo
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Domicilio electrónico</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registrado
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Habilitación SCJ</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Habilitada
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-600">Firma Digital Avanzada</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Vigente 2028
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={`${basePath}/perfil`}
                className="w-full block text-center px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
              >
                Gestionar Perfil Notarial & Firma
              </Link>
            </div>
          </div>

          {/* Tarjeta de Estudio Notarial */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Estudio Asociado</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Estudio Fernández & Asociados</div>
              <div className="text-xs text-slate-400 mt-0.5">Rincón 487 Piso 3 Esc. 302, Montevideo</div>
              <div className="text-xs text-teal-300 font-mono mt-1">RUT: 21.849.201.0019</div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Función:</span>
              <span className="font-bold text-teal-200">Escribana Responsable</span>
            </div>
          </div>
        </div>
      </div>
    </NotaryLayout>
  );
};
