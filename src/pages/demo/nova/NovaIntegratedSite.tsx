import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ClientPortalMockup } from '../../../components/saas/ClientPortalMockup';
import { PipelineVisual } from '../../../components/saas/PipelineVisual';

export const NovaIntegratedSite: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Web Existente de NOVA',
      description: 'El cliente ya cuenta con su sitio web corporativo o institucional alojado en su propio servidor.',
      route: '/demo/nova/legacy#inicio',
    },
    {
      step: 2,
      title: 'Simulador en su Web',
      description: 'El solicitante ingresa monto, valor de inmueble y plazo en el simulador del sitio existente.',
      route: '/demo/nova/legacy#simulador',
    },
    {
      step: 3,
      title: 'Botón "Continuar Solicitud"',
      description: 'Acción que transmite de forma sanitizada los datos calculados hacia la pasarela digital.',
      route: '/demo/nova/legacy#simulador',
    },
    {
      step: 4,
      title: 'Wizard Digital HIPOTECALY',
      description: 'El formulario de solicitud recibe los datos precargados manteniendo el branding de NOVA.',
      route: '/solicitar?source=nova_integrated',
    },
    {
      step: 5,
      title: 'Registro y Login del Cliente',
      description: 'Se habilita un portal de autogestión para el solicitante sin que NOVA haya tenido que programarlo.',
      route: '/ingresar',
    },
    {
      step: 6,
      title: 'Portal de Autogestión del Solicitante',
      description: 'El cliente consulta el avance de su expediente, pagos y notificaciones desde su cuenta.',
      route: '/mi-cuenta',
    },
    {
      step: 7,
      title: 'Backoffice Notarial y Financiero',
      description: 'El equipo de NOVA recibe el expediente estructurado con métricas, tareas y análisis.',
      route: '/app',
    },
    {
      step: 8,
      title: 'Gestión Documental Privada',
      description: 'Checklist de requisitos, subida a storage privado y circuito de observación/aprobación.',
      route: '/app/expedientes',
    },
    {
      step: 9,
      title: 'Monitoreo de Operación en Tiempo Real',
      description: 'Trazabilidad completa desde la captación online hasta la firma e inicio de cobros.',
      route: '/app',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* 0. DISCRETO BANNER DE MODO DEMOSTRACIÓN */}
      <div className="bg-navy text-white text-xs py-2 px-4 border-b border-navy-light/40 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="font-mono uppercase tracking-wider font-semibold text-slate-300">
              MODO DEMOSTRACIÓN HIPOTECALY
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300 font-medium">
              Caso B: Demostración Interactiva del Flujo Integrado Progresivo
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/saas" className="text-brand-green hover:underline text-xs font-bold">
              ← Volver a Hipotecaly SaaS
            </Link>
          </div>
        </div>
      </div>

      {/* NAVBAR NAVEGACIÓN MODOS DEMO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-[#0A3A60] flex items-center justify-center text-white font-serif font-black text-lg">
              N
            </div>
            <div>
              <span className="font-serif font-bold text-slate-900 text-sm block">NOVA Crédito Hipotecario</span>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Modo Integración Progresiva</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-bold">
            <Link
              to="/demo/nova/legacy"
              className="px-3 py-1.5 rounded text-slate-600 hover:text-navy hover:bg-slate-100 transition-colors"
            >
              1. Ver Web Tradicional
            </Link>
            <Link
              to="/demo/nova/integrado"
              className="px-3 py-1.5 rounded bg-blue-50 text-[#0A3A60] border border-blue-200"
            >
              2. Flujo Integrado
            </Link>
            <Link
              to="/demo/nova/full"
              className="px-3 py-1.5 rounded text-slate-600 hover:text-navy hover:bg-slate-100 transition-colors"
            >
              3. Ver Full White-Label
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              INTEGRACIÓN SIN RECONSTRUIR TU WEB
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight">
              Así se conecta la web actual de NOVA con HIPOTECALY.
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              El cliente conserva su sitio institucional intacto. Al hacer click en <strong>"Continuar Solicitud"</strong>, se activa el motor hipotecario digital bajo su propia marca.
            </p>
          </div>

          {/* Pipeline Visual Component */}
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <PipelineVisual />
          </div>

          {/* Stepper de 9 Etapas Interactivo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Lista de pasos */}
            <div className="lg:col-span-5 space-y-3 text-left">
              <h3 className="text-base font-bold text-navy mb-4 flex items-center">
                <Layers className="w-5 h-5 text-brand-green mr-2" />
                Los 9 Pasos de la Integración
              </h3>
              {steps.map((s) => {
                const isActive = activeStep === s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActiveStep(s.step)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-start space-x-3.5 ${
                      isActive
                        ? 'bg-blue-50/80 border-[#0A3A60] shadow-sm ring-1 ring-[#0A3A60]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isActive ? 'bg-[#0A3A60] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-navy truncate">{s.title}</h4>
                        <ChevronRight className={`w-4 h-4 text-slate-400 ${isActive ? 'text-[#0A3A60]' : ''}`} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vista previa en vivo del paso seleccionado */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm text-left space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">
                    Paso {activeStep} de 9
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-navy mt-0.5">
                    {steps[activeStep - 1].title}
                  </h3>
                </div>
                <Link
                  to={steps[activeStep - 1].route}
                  className="bg-[#0A3A60] hover:bg-[#072844] text-white text-xs font-bold px-4 py-2 rounded transition-colors flex items-center shrink-0 shadow-sm"
                >
                  Probar Paso Real <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {steps[activeStep - 1].description}
              </p>

              {/* Módulos visuales contextuales */}
              {activeStep <= 3 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Sitio de Origen: demo.novacredito.uy</span>
                    <span className="text-emerald-600 font-bold">✓ CNAME Verificado</span>
                  </div>
                  <div className="p-4 bg-white rounded border border-slate-200 text-xs text-slate-700 space-y-2">
                    <p className="font-semibold text-navy">Payload simulado que se transmite hacia HIPOTECALY:</p>
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded text-[11px] overflow-x-auto font-mono">
{`{
  "tenant_id": "nova-demo",
  "requested_amount": 70000,
  "property_estimated_value": 200000,
  "term_months": 36,
  "repayment_mode": "solo_intereses",
  "source": "nova_legacy"
}`}
                    </pre>
                  </div>
                  <Link to="/demo/nova/legacy#simulador">
                    <Button variant="primary" size="md" className="w-full bg-[#0A3A60] hover:bg-[#072844]">
                      Ir al Simulador de NOVA Legacy <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}

              {activeStep >= 4 && activeStep <= 6 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Los datos del solicitante se vinculan automáticamente a la organización <strong>NOVA</strong>.</span>
                  </div>
                  <div className="scale-95 origin-top">
                    <ClientPortalMockup />
                  </div>
                </div>
              )}

              {activeStep >= 7 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 text-white rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-mono font-bold">PANEL OPERATIVO NOVA</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">RLS Activo</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      El equipo del estudio accede a los expedientes en tiempo real, verifica el análisis preliminar de IA, aprueba o solicita reemplazo de documentos.
                    </p>
                    <div className="pt-2">
                      <Link to="/app">
                        <Button variant="primary" size="sm" className="w-full">
                          Abrir Backoffice Real de NOVA <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

    </div>
  );
};
