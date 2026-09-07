// ==============================================================================
// HIPOTECALY: Sección 3 - Mis Solicitudes
// Listado limpio y compacto de solicitudes y vista en detalle (ficha)
// ==============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  ClientApplicationDetail,
} from '../../lib/clientPortalService';
import { ApplicationDetailView } from './ApplicationDetailView';
import { useTenant } from '../../contexts/TenantContext';

interface MyApplicationsSectionProps {
  applications: ClientApplicationDetail[];
  selectedAppId?: string | null;
  onSelectApp: (publicId: string | null) => void;
  onRefresh: () => void;
}

export const MyApplicationsSection: React.FC<MyApplicationsSectionProps> = ({
  applications,
  selectedAppId,
  onSelectApp,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const isNova = tenant.slug.includes('nova');

  const selectedApplication = applications.find(
    (app) => app.publicId === selectedAppId || app.id === selectedAppId
  );

  // Si hay una solicitud seleccionada, mostramos la ficha detallada
  if (selectedApplication) {
    return (
      <ApplicationDetailView
        application={selectedApplication}
        onBack={() => onSelectApp(null)}
        onRefresh={onRefresh}
      />
    );
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#245f91]">
            Expedientes y Operaciones
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-0.5">
            Mis solicitudes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Seguimiento de tus solicitudes de crédito hipotecario y operaciones formalizadas.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(isNova ? `/demo/${tenant.slug}/solicitar` : '/solicitar')}
          className="self-start sm:self-auto text-xs font-bold flex items-center !bg-[#102d49] text-white !rounded-xl shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
          Nueva solicitud
        </Button>
      </div>

      {/* ============================================================ */}
      {/* LISTADO DE SOLICITUDES EN FILAS / TARJETAS HORIZONTALES     */}
      {/* ============================================================ */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-slate-900">
              No tenés solicitudes activas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Iniciá una solicitud para estructurar tu crédito hipotecario con garantía sobre tu inmueble.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(isNova ? `/demo/${tenant.slug}/solicitar` : '/solicitar')}
            className="!bg-[#102d49] text-white text-xs font-bold !rounded-xl"
          >
            Iniciar Solicitud →
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-left"
            >
              {/* Información Compacta del Expediente */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#102d49] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {app.publicId}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                    {app.currency} {app.requestedAmount.toLocaleString('es-UY')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {app.propertyType} · {app.neighborhood}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Financiación {app.ltvPercentage.toFixed(0)}% · {app.termMonths} meses
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 flex items-center text-[11px]">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Última actualización: {formatDate(app.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Estado y Acción Directa */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                  {app.statusLabel}
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectApp(app.publicId)}
                  className="text-xs font-bold !bg-[#102d49] text-white !rounded-xl shadow-xs"
                >
                  Ver solicitud <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
