import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  Sliders,
  FileCheck2,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Database,
  Code2,
  Workflow,
  Check,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { PipelineVisual } from '../../components/saas/PipelineVisual';

export const SaaSIntegrationPage: React.FC = () => {
  // Simulador conceptual interactivo para mostrar el paso de parámetros
  const [propertyVal, setPropertyVal] = useState<number>(250000);
  const [loanAmount, setLoanAmount] = useState<number>(80000);
  const loanTerm = 36;
  const [simForwarded, setSimForwarded] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION: MODALIDAD INTEGRACIÓN                          */}
      {/* ============================================================== */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Columna Izquierda: Mensaje Comercial */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green-light text-brand-green mb-4">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>MODALIDAD A · YA TENGO SITIO WEB</span>
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Tu web ya genera interés.{' '}
                  <span className="text-brand-green">Convertí ese interés en operaciones.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-muted font-normal leading-relaxed max-w-xl mt-4">
                  Conectamos tu sitio actual con un proceso completo de solicitud, documentación, análisis y seguimiento sin cambiar tu marca ni rehacer tu web.
                </p>
              </div>

              {/* Tagline Comercial */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-brand-green">
                <p className="text-sm font-semibold text-navy">
                  “Tu web sigue siendo tu web. HIPOTECALY hace todo lo que viene después.”
                </p>
              </div>

              {/* CTAs Principales */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Link to="/contacto?plan=integracion&demo=true">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md font-bold">
                    Agendar demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a
                  href="#flujo"
                  className="px-6 py-3 rounded-btn border border-slate-300 text-sm font-semibold text-navy hover:bg-slate-50 text-center transition-colors min-h-[44px] inline-flex items-center justify-center"
                >
                  Ver flujo
                </a>
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-brand-green mr-1" /> Sin reprogramar tu web
                </span>
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-brand-green mr-1" /> Configuración guiada
                </span>
                <span className="flex items-center">
                  <Check className="w-4 h-4 text-brand-green mr-1" /> Marca 100% propia
                </span>
              </div>
            </div>

            {/* Columna Derecha: Mockup Visual de Conexión Web -> HIPOTECALY */}
            <div className="lg:col-span-6 relative">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-500 ml-2">tu-sitio-actual.com</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Frontend del Cliente
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-navy block">
                    1. Tu cliente simula en tu página web:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Propiedad</span>
                      <span className="font-bold text-navy">USD 250.000</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Préstamo</span>
                      <span className="font-bold text-brand-green">USD 80.000</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Plazo</span>
                      <span className="font-bold text-navy">36 meses</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button className="w-full py-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]">
                      <span>CONTINUAR SOLICITUD</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Flecha hacia expediente HIPOTECALY */}
                <div className="text-center py-1">
                  <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    ↓ Pasa sin fricción los datos al motor HIPOTECALY White-Label
                  </span>
                </div>

                {/* Mockup del expediente que se genera */}
                <div className="p-4 rounded-xl bg-navy text-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-green">
                      Expediente Digital Generado Automáticamente
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">#EXP-2026-9912</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <span className="text-slate-300 block text-[10px]">Garantía</span>
                      <span className="font-bold text-white">USD 250.000 (32% financiado)</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <span className="text-slate-300 block text-[10px]">Estado</span>
                      <span className="font-bold text-brand-green">Carga de Documentos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. SECCIÓN PROBLEMA: "EL SIMULADOR ES SOLO EL COMIENZO"        */}
      {/* ============================================================== */}
      <section id="flujo" className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-2">
              EL CUELLO DE BOTELLA OPERATIVO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              El simulador es solo el comienzo.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Hoy muchas empresas reciben consultas digitales, pero inmediatamente después caen en un proceso manual disperso, lento y vulnerable.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Flujo Tradicional Disperso (El Problema) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Cómo trabajan hoy la mayoría de las empresas:</span>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { step: 'Simulación web', detail: 'El usuario calcula en el sitio' },
                  { step: 'WhatsApp desordenado', detail: 'Chats con información personal y fotos sueltas' },
                  { step: 'Emails dispersos', detail: 'Hilos infinitos con adjuntos pesados' },
                  { step: 'Documentos sueltos', detail: 'Archivos en escritorios sin versión oficial' },
                  { step: 'Llamadas constantes', detail: '“¿En qué está mi trámite?”' },
                  { step: 'Planillas de Excel', detail: 'Datos copiados a mano con riesgo de error' },
                  { step: 'Seguimiento manual', detail: 'Falta de trazabilidad y retrasos en la firma' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                    <span className="font-semibold text-rose-950 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-[10px] font-bold mr-2">
                        {i + 1}
                      </span>
                      {item.step}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flujo HIPOTECALY (La Solución Digital) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-green/40 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-brand-green font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Con HIPOTECALY todo continúa dentro de un expediente digital:</span>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { step: 'Simulación', detail: 'Tu cliente calcula en tu propia web' },
                  { step: 'Continuar solicitud', detail: 'Un click pasa todos los datos sin reescribir' },
                  { step: 'Solicitud completa', detail: 'Formulario estructurado de titulares y propiedad' },
                  { step: 'Documentos', detail: 'Checklist asistido con carga y visor protegido' },
                  { step: 'Análisis asistido', detail: 'Scoring preliminar con reglas y valuación' },
                  { step: 'Decisión', detail: 'Tu equipo aprueba, observa o ajusta montos' },
                  { step: 'Firma notarial', detail: 'Coordinación directa con el escribano interviniente' },
                  { step: 'Crédito activo', detail: 'Portal de pagos, comprobantes y cancelación' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-xs">
                    <span className="font-bold text-navy flex items-center">
                      <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center text-[10px] font-bold mr-2">
                        ✓
                      </span>
                      {item.step}
                    </span>
                    <span className="text-[11px] text-slate-600 hidden sm:inline">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Visual completo */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
              FLUJO DE PUNTA A PUNTA
            </span>
            <PipelineVisual />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECCIÓN FORMAS DE INTEGRACIÓN                               */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              FLEXIBILIDAD TÉCNICA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Elegí cómo conectar tu sitio actual con HIPOTECALY.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              No importa si tu web está hecha en WordPress, Webflow, React, HTML tradicional o un CMS a medida. Disponemos de métodos simples y directos para cada necesidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <ArrowRight className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">Botón o Enlace Directo</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Agregá un botón tipo “Continuar Solicitud” en tu simulador existente. Al hacer click, redirige fluidamente al expediente digital.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">Formulario Embebido / Widget</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Insertá el componente de solicitud directamente en una página de tu sitio web mediante una línea de script o iframe seguro.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">Subdominio Dedicado</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Configuramos un CNAME bajo tu propio dominio (por ejemplo, <code className="font-mono text-navy font-semibold">solicitudes.tudominio.uy</code>) con certificado SSL.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">Paso de Parámetros URL</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Si tu cliente ya ingresó el valor del inmueble y el monto en tu simulador, esos datos viajan encriptados para evitar doble carga.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">Ruta dentro del Dominio</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Podés apuntar una ruta específica de tu arquitectura (ej. <code className="font-mono text-navy font-semibold">/credito-online</code>) hacia el portal de HIPOTECALY.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-card transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy text-base">API & Webhooks</h4>
              <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                Para arquitecturas avanzadas: enviá solicitudes vía REST API y recibí notificaciones automáticas por webhooks ante cambios de estado.
              </p>
            </div>
          </div>

          {/* Ejemplo Conceptual Interactivo de Integración */}
          <div className="mt-12 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-green">
                  Demostración Práctica
                </span>
                <h4 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Cómo se transfiere la información desde tu simulador
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">Simulador de tu web → HIPOTECALY</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Simulador Interactivo */}
              <div className="lg:col-span-6 space-y-4 bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                <span className="text-xs font-bold text-slate-300 block">
                  Paso 1: El usuario simula en tu sitio web
                </span>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Valor del Inmueble</span>
                    <span className="font-bold text-brand-green">USD {propertyVal.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={500000}
                    step={10000}
                    value={propertyVal}
                    onChange={(e) => {
                      setPropertyVal(Number(e.target.value));
                      setSimForwarded(false);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Monto Solicitado</span>
                    <span className="font-bold text-brand-green">USD {loanAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={propertyVal * 0.4}
                    step={5000}
                    value={loanAmount}
                    onChange={(e) => {
                      setLoanAmount(Number(e.target.value));
                      setSimForwarded(false);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSimForwarded(true)}
                    className="w-full py-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-transform active:scale-95"
                  >
                    <span>CONTINUAR SOLICITUD</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Payload que recibe HIPOTECALY */}
              <div className="lg:col-span-6 bg-black/50 p-5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span>Datos recibidos automáticamente por HIPOTECALY:</span>
                  <span className="text-brand-green font-bold">
                    {simForwarded ? 'Conectado ✓' : 'Esperando click...'}
                  </span>
                </div>

                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
{`{
  "property_valuation": ${propertyVal},
  "requested_amount": ${loanAmount},
  "percentage_financed": "${((loanAmount / propertyVal) * 100).toFixed(1)}%",
  "term_months": ${loanTerm},
  "source_site": "tu-sitio-actual.com",
  "status": "ready_for_borrower_data"
}`}
                </pre>

                <p className="text-[11px] text-slate-400 pt-2 font-sans">
                  El solicitante llega a tu portal White-Label con sus datos pre-cargados. No tiene que repetir montos ni plazos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECCIÓN "SIN PERDER TU IDENTIDAD"                            */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              WHITE-LABEL REAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Sin perder tu identidad.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Tus clientes no tienen por qué saber qué software utilizas por detrás. La experiencia visual continúa siendo 100% tuya.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <span className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-xs">
                01
              </span>
              <h4 className="font-bold text-navy text-sm">Tu Logo y Colores</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Paleta primaria y secundaria adaptada fielmente al manual de marca de tu empresa.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <span className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-xs">
                02
              </span>
              <h4 className="font-bold text-navy text-sm">Tu Dominio Propio</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Tus clientes navegan bajo tu URL (ej. <code className="font-mono text-navy">solicitudes.tuempresa.uy</code>).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <span className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-xs">
                03
              </span>
              <h4 className="font-bold text-navy text-sm">Emails Personalizados</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Las notificaciones, estados y avisos se envían desde tu casilla corporativa institucional.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <span className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-xs">
                04
              </span>
              <h4 className="font-bold text-navy text-sm">Textos y Contacto</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Mensajes, términos, teléfonos de guardia y nombres de tus escribanos o asesores a medida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECCIÓN "TODO LO QUE PASA DESPUÉS" (8 CARDS)               */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              ETAPAS DEL EXPEDIENTE DIGITAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Todo lo que pasa después.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Una vez que el usuario hace click en tu web, HIPOTECALY orquesta automáticamente el ciclo completo de la operación:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '1',
                title: 'Solicitud Completa',
                desc: 'Datos personales, estado civil, ingresos, profesión y antecedentes de los solicitantes con validación estructurada.',
              },
              {
                num: '2',
                title: 'Datos de la Propiedad',
                desc: 'Padrón, departamento, localidad, superficie, fotos, plano de mensura y estado de ocupación del inmueble.',
              },
              {
                num: '3',
                title: 'Gestión Documental',
                desc: 'Checklist dinámico: títulos de propiedad, cédulas, contribución y recibos con visor privado y control de versiones.',
              },
              {
                num: '4',
                title: 'Análisis Asistido',
                desc: 'Copiloto de análisis que contrasta parámetros crediticios, inconsistencias y tasación preliminar orientativa.',
              },
              {
                num: '5',
                title: 'Decisión del Equipo',
                desc: 'Tu comité aprueba, observa o ajusta condiciones comerciales con registro inmutable de auditoría.',
              },
              {
                num: '6',
                title: 'Agenda y Firma',
                desc: 'Coordinación formal con el escribano público para la titulación e inscripción de la garantía hipotecaria.',
              },
              {
                num: '7',
                title: 'Seguimiento del Crédito',
                desc: 'Control de cuotas, calendario de vencimientos, comprobantes de pago y recordatorios automáticos.',
              },
              {
                num: '8',
                title: 'Cancelación Formal',
                desc: 'Gestión del finiquito, carta de pago notarial y liberación de la hipoteca ante los registros públicos.',
              },
            ].map((card) => (
              <div key={card.num} className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-brand-green hover:shadow-card transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center font-extrabold text-sm mb-4">
                    {card.num}
                  </div>
                  <h4 className="font-bold text-navy text-base">{card.title}</h4>
                  <p className="text-xs text-slate-muted mt-2 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SECCIÓN PROTECCIÓN DE DATOS Y PRIVACIDAD OPERATIVA          */}
      {/* ============================================================== */}
      <section id="seguridad" className="py-16 md:py-24 bg-navy text-white text-left border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
                  CONTROL OPERATIVO Y PRIVACIDAD
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Vos decidís cuándo se muestran los datos sensibles.
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-3">
                  Configurá qué información puede ver cada actor del proceso según la etapa en que se encuentre el expediente. Mayor control, confidencialidad y trazabilidad para tu negocio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center space-x-2 text-brand-green font-bold text-xs">
                    <EyeOff className="w-4 h-4" />
                    <span>Teléfono Oculto por Etapa</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Evita contactos prematuros hasta que el expediente esté evaluado formalmente.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center space-x-2 text-brand-green font-bold text-xs">
                    <EyeOff className="w-4 h-4" />
                    <span>Email Oculto por Etapa</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Centraliza la comunicación inicial dentro de los canales formales del sistema.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center space-x-2 text-brand-green font-bold text-xs">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Visor Protegido</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Lectura de títulos y documentos con control de descarga y permisos selectivos.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center space-x-2 text-brand-green font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>ID Único de Operación</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Identificación codificada sin exponer datos nominales en reportes externos.
                  </p>
                </div>
              </div>

              {/* Disclaimer de control operativo */}
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-300">
                <p>
                  <strong>Claridad operativa:</strong> Estas herramientas brindan orden, control interno y trazabilidad de accesos conforme a tus políticas de compliance.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Mockup Visual de Control de Privacidad */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Matriz de Privacidad por Rol</span>
                  <span className="text-[10px] text-brand-green bg-brand-green/20 px-2 py-0.5 rounded font-mono">
                    Aislamiento RLS Activo
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Etapa 1: Análisis Preliminar</span>
                      <span className="text-[10px] text-slate-400">Teléfono: Oculto · Email: Oculto · Ubicación: Aproximada</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Protegido
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Etapa 2: Propuesta Aprobada</span>
                      <span className="text-[10px] text-slate-400">Datos nominales liberados para redacción de hipoteca</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Habilitado
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Etapa 3: Firma Notarial</span>
                      <span className="text-[10px] text-slate-400">Acceso completo al escribano asignado con log inmutable</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Auditado
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Registro de accesos con timestamp y dirección IP
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. SECCIÓN CTA FINAL NAVY                                      */}
      {/* ============================================================== */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
            INTEGRACIÓN RÁPIDA Y ACOMPAÑADA
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            No cambies lo que ya funciona.{' '}
            <span className="text-brand-green">Digitalizá lo que viene después.</span>
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            Coordiná una llamada de 20 minutos con nuestro equipo técnico para analizar tu web actual y mostrarte cómo se conectaría con HIPOTECALY.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contacto?plan=integracion">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating">
                QUIERO INTEGRAR HIPOTECALY <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/saas/plataforma-completa" className="text-sm font-semibold text-slate-300 hover:text-white underline decoration-slate-500 underline-offset-4">
              ¿No tenés sitio web? Conocé la Plataforma Completa Desde Cero →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
