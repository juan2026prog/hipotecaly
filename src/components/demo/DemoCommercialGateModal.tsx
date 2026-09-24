// ==============================================================================
// HIPOTECALY: Demo Commercial Gate Component (Modal / Inline / Access Guard)
// Punto canónico de conversión comercial para la demo pública
// Permite solicitar demo personalizada sin destruir la simulación en curso
// ==============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  X,
  FileCheck2,
  FolderKanban,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';

export type DemoCommercialGateSource =
  | 'simulador'
  | 'button-demo'
  | 'embed-demo'
  | 'estudio-nova'
  | 'backoffice'
  | 'applicant-portal'
  | 'documents'
  | 'notary'
  | 'investor';

export interface DemoCommercialGateProps {
  isOpen: boolean;
  onClose: () => void;
  source?: DemoCommercialGateSource;
  tenantSlug?: string;
  brandName?: string;
  simulationSummary?: {
    requestedAmount?: number;
    propertyValue?: number;
    termMonths?: number;
    currency?: string;
    monthlyPayment?: number;
  };
}

export const DemoCommercialGateModal: React.FC<DemoCommercialGateProps> = ({
  isOpen,
  onClose,
  source = 'simulador',
  tenantSlug = 'estudio-nova',
  brandName = 'Estudio Nova',
  simulationSummary,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isBackofficeSource = source === 'backoffice' || source === 'notary' || source === 'investor';
  const isPortalSource = source === 'applicant-portal' || source === 'documents';

  const handleSolicitarDemo = () => {
    onClose();
    const params = new URLSearchParams({
      demo: 'true',
      source: source,
      tenant: tenantSlug,
    });

    if (simulationSummary?.requestedAmount) {
      params.set('monto', simulationSummary.requestedAmount.toString());
    }
    if (simulationSummary?.propertyValue) {
      params.set('valor_propiedad', simulationSummary.propertyValue.toString());
    }

    navigate(`/contacto?${params.toString()}`);
  };

  // Título y subtítulos contextuales según el origen
  let eyebrow = 'DEMOSTRACIÓN PÚBLICA DE HIPOTECALY';
  let title = 'La simulación es solo el comienzo';
  let subtitle =
    'A partir de este punto, Hipotecaly conecta la simulación con todo el proceso de solicitud y gestión:';

  if (isBackofficeSource) {
    eyebrow = `CONSOLA DE GESTIÓN · ${brandName.toUpperCase()}`;
    title = 'Conocé el backoffice de HIPOTECALY';
    subtitle =
      `Ya viste cómo funciona la experiencia del solicitante en ${brandName}. El siguiente paso es conocer cómo tu equipo gestiona:`;
  } else if (isPortalSource) {
    eyebrow = `EXPERIENCIA DIGITAL · ${brandName.toUpperCase()}`;
    title = 'Portal de seguimiento y expediente';
    subtitle =
      `Así es como los clientes de ${brandName} cargan documentación, resuelven observaciones y siguen el estado de su crédito:`;
  }

  return (
    <div
      data-testid="demo-commercial-gate-modal"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-9 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 text-left relative my-8">
        
        {/* Botón Cerrar (Seguir Explorando) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal y seguir explorando"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="space-y-2 pr-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider bg-brand-green-light text-brand-green">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight leading-tight">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Resumen opcional de la simulación activa (para que sepa que sus datos están intactos) */}
        {simulationSummary?.requestedAmount && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Simulación actual:</span>
              <span className="font-bold text-navy text-sm">
                USD {simulationSummary.requestedAmount.toLocaleString()}
              </span>
              {simulationSummary.propertyValue && (
                <span className="text-slate-500 text-[11px] ml-1.5">
                  (Garantía: USD {simulationSummary.propertyValue.toLocaleString()})
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Datos preservados ✓
            </span>
          </div>
        )}

        {/* Lista de Capacidades del Flujo Completo */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <FileCheck2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-navy block font-bold">Solicitud digital y checklist documental</strong>
              <span className="text-slate-500 leading-tight">Formularios inteligentes para titulares, garantías y padrones.</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <FolderKanban className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-navy block font-bold">Seguimiento del expediente en tiempo real</strong>
              <span className="text-slate-500 leading-tight">Trazabilidad completa entre cliente, analistas y escribanía.</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-navy block font-bold">Validaciones y scoring paramétrico</strong>
              <span className="text-slate-500 leading-tight">Reglas crediticias, LTV y políticas a medida de tu organización.</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <Building2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-navy block font-bold">Backoffice operativo y coordinación notarial</strong>
              <span className="text-slate-500 leading-tight">Titulación, generación de minutas (DocFlow) y firma electrónica.</span>
            </div>
          </div>
        </div>

        {/* Mensaje de Llamado a la Acción */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-xs text-emerald-950 font-medium">
          Conocé el flujo completo de punta a punta en una demostración personalizada para tu equipo.
        </div>

        {/* Acciones del Gate */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            data-testid="btn-gate-solicitar-demo"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSolicitarDemo}
            className="font-bold text-sm shadow-md flex items-center justify-center space-x-2 py-3.5 !rounded-xl"
          >
            <span>SOLICITAR DEMO</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            data-testid="btn-gate-seguir-explorando"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-navy hover:bg-slate-50 py-2.5 !rounded-xl"
          >
            Seguir explorando la demo
          </Button>
        </div>

      </div>
    </div>
  );
};
