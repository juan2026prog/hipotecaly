import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Layers,
  BarChart3,
  Globe,
  Clock,
  Lock,
  Headphones,
  Laptop,
  Workflow,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SaaSNavbar } from '../components/layout/SaaSNavbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { DashboardMockup } from '../components/mockups/DashboardMockup';
import { MobileTrackerMockup } from '../components/mockups/MobileTrackerMockup';
import { PipelineVisual } from '../components/saas/PipelineVisual';

export const SaaSHome: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION RENOVADO                                        */}
      {/* ============================================================== */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Columna Izquierda: Mensaje Hero Principal */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-wider text-brand-green uppercase block mb-3">
                  TECNOLOGÍA HIPOTECARIA PARA PROFESIONALES
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Digitalizá todo tu negocio hipotecario.{' '}
                  <span className="text-brand-green">Sin cambiar cómo prestás.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-muted font-normal leading-relaxed max-w-xl mt-4">
                  HIPOTECALY centraliza captación, solicitudes, documentación, análisis, firmas y seguimiento de créditos bajo tu propia marca.
                </p>
              </div>

              {/* 3 Pilares Rápidos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center mb-2.5">
                    <Laptop className="w-5 h-5 text-brand-green" />
                  </div>
                  <h4 className="font-bold text-navy text-sm">Más eficiencia</h4>
                  <p className="text-xs text-slate-muted leading-relaxed mt-1">
                    Automatizá procesos y eliminá tareas manuales.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center mb-2.5">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                  </div>
                  <h4 className="font-bold text-navy text-sm">Menos riesgo</h4>
                  <p className="text-xs text-slate-muted leading-relaxed mt-1">
                    Centralizá información, documentación y trazabilidad.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center mb-2.5">
                    <BarChart3 className="w-5 h-5 text-brand-green" />
                  </div>
                  <h4 className="font-bold text-navy text-sm">Más capacidad</h4>
                  <p className="text-xs text-slate-muted leading-relaxed mt-1">
                    Gestioná más operaciones sin multiplicar tareas.
                  </p>
                </div>
              </div>

              {/* CTAs Principales */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-5 pt-2">
                <Link to="/contacto?demo=true">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md">
                    AGENDAR DEMO <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a
                  href="#modalidades"
                  className="text-sm font-semibold text-navy hover:text-brand-green underline decoration-brand-green decoration-2 underline-offset-8 transition-colors text-center py-2"
                >
                  VER CÓMO FUNCIONA
                </a>
              </div>
            </div>

            {/* Columna Derecha: Mockup Grande (Landing + Backoffice + Mobile) */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0">
              <div className="relative">
                {/* Desktop Dashboard Mockup */}
                <div className="transform lg:translate-x-4 lg:-translate-y-2">
                  <DashboardMockup compact={false} />
                </div>

                {/* Smartphone Tracker Mockup Superpuesto */}
                <div className="hidden sm:block absolute -bottom-8 -left-4 md:-bottom-10 md:-left-8 z-20 shadow-floating rounded-[36px]">
                  <MobileTrackerMockup />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. DOS MODALIDADES COMERCIALES CLARAMENTE DIFERENCIADAS         */}
      {/* ============================================================== */}
      <section id="modalidades" className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full">
              FLEXIBILIDAD DE IMPLEMENTACIÓN
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Elegí cómo querés implementar HIPOTECALY
            </h2>
            <p className="text-base text-slate-muted">
              Dos caminos para el mismo objetivo: transformar tu gestión hipotecaria en una experiencia digital ágil, ordenada y profesional.
            </p>
          </div>

          {/* LAS DOS GRANDES TARJETAS COMERCIALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* MODALIDAD A: YA TENGO SITIO WEB */}
            <div className="bg-white rounded-3xl p-7 sm:p-9 border-2 border-slate-200 hover:border-brand-green transition-all shadow-card flex flex-col justify-between relative group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-green-light text-brand-green">
                    <Workflow className="w-3.5 h-3.5" />
                    <span>MODALIDAD A</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400">Integración Modular</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                    Integrá HIPOTECALY a tu web actual
                  </h3>
                  <p className="text-sm sm:text-base text-slate-muted mt-3 leading-relaxed">
                    No necesitás reemplazar tu sitio. Conectamos tu simulador, formulario o botón actual con todo el proceso digital de HIPOTECALY.
                  </p>
                </div>

                {/* Mensaje Comercial Destacado */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-brand-green">
                  <p className="text-sm font-bold text-navy">
                    “Tu web sigue siendo tu web. HIPOTECALY hace todo lo que viene después.”
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Pensado para estudios hipotecarios, financieras y prestamistas que ya tienen web o simulador pero después gestionan por WhatsApp, emails o planillas manuales.
                  </p>
                </div>

                {/* Pipeline Visual Resumido */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Flujo de Integración
                  </span>
                  <div className="text-xs text-slate-700 font-medium space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                      <span>Web existente / Simulador actual</span>
                    </div>
                    <div className="flex items-center space-x-2 text-brand-green font-bold">
                      <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                      <span>Click en “CONTINUAR SOLICITUD”</span>
                    </div>
                    <div className="flex items-center space-x-2 text-navy font-semibold">
                      <span className="w-5 h-5 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                      <span>HIPOTECALY White-Label: expediente, documentos, análisis IA, firma y seguimiento</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Conexión por botón, subdominio, ruta, widget o API</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Sin cambiar tu diseño, marca ni proveedor web actual</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Los datos del simulador pasan automáticamente sin reescritura</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 space-y-2">
                <Link to="/saas/integracion">
                  <Button variant="primary" size="lg" fullWidth className="shadow-md">
                    QUIERO INTEGRARLO <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/nova/legacy">
                  <Button variant="outline" size="md" fullWidth className="text-xs font-bold border-navy text-navy hover:bg-slate-50">
                    VER DEMO — INTEGRACIÓN <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/saas/integracion" className="block text-center text-xs font-semibold text-navy hover:text-brand-green pt-1">
                  Ver detalles de la modalidad de integración →
                </Link>
              </div>
            </div>

            {/* MODALIDAD B: NECESITO TODO DESDE CERO */}
            <div className="bg-navy text-white rounded-3xl p-7 sm:p-9 border border-navy-border shadow-floating flex flex-col justify-between relative group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-green text-navy">
                    <Layers className="w-3.5 h-3.5" />
                    <span>MODALIDAD B</span>
                  </span>
                  <span className="text-xs font-medium text-slate-300">Solución Llave en Mano</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Tu propia plataforma hipotecaria, lista para operar
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                    Creamos desde cero tu ecosistema digital completo: sitio, simulador, solicitud, portal cliente y backoffice bajo tu propia marca.
                  </p>
                </div>

                {/* Mensaje Comercial Destacado */}
                <div className="p-4 rounded-xl bg-white/10 border border-white/15 border-l-4 border-l-brand-green">
                  <p className="text-base font-extrabold text-brand-green tracking-wide">
                    “Tu marca. Tu dominio. Tus clientes. Nuestra tecnología.”
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Para prestamistas, financieras y estudios que quieren dar el salto digital completo sin incurrir en meses de desarrollo a medida.
                  </p>
                </div>

                {/* Componentes del Ecosistema */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Sitio Institucional</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-2">
                    <Laptop className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Simulador Propio</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Portal Cliente PWA</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Backoffice Operativo</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>100% White-Label: tu logotipo, colores, textos y dominio propio</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Parámetros comerciales adaptados a tus tasas, plazos y límites</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Aislamiento estricto de base de datos y auditoría inmutable</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 space-y-2">
                <Link to="/saas/plataforma-completa">
                  <Button variant="primary" size="lg" fullWidth className="shadow-lg">
                    QUIERO MI PLATAFORMA <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/nova/full">
                  <Button variant="outline" size="md" fullWidth className="text-xs font-bold border-white/30 text-white hover:bg-white/10">
                    VER DEMO — PLATAFORMA COMPLETA <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/saas/plataforma-completa" className="block text-center text-xs font-semibold text-slate-300 hover:text-white pt-1">
                  Ver detalles de la plataforma completa →
                </Link>
              </div>
            </div>

          </div>

          {/* Pipeline Visual debajo de las dos modalidades */}
          <div className="mt-14 pt-10 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
              EL FLUJO DIGITAL UNIFICADO QUE EXPERIMENTAN TUS CLIENTES
            </span>
            <PipelineVisual />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. EL MISMO CORE TECNOLÓGICO ROBUSTO                            */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              MOTOR COMPARTIDO DE ALTO RENDIMIENTO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Ambas modalidades utilizan el mismo core tecnológico.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              La diferencia está únicamente en cómo se implementa para cada cliente. Toda la potencia, seguridad y automatización están presentes en las dos opciones:
            </p>
          </div>

          {/* Grilla de los 15 Módulos del Core */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Solicitudes', desc: 'Captación estructurada y legajo digital del prestatario.' },
              { title: 'Expedientes', desc: 'ID único, estados, historial de cambios y notas operativas.' },
              { title: 'Clientes', desc: 'Directorio patrimonial, antecedentes y perfil de contacto.' },
              { title: 'Propiedades', desc: 'Padrones, superficie, tipo de inmueble y fotos geolocalizadas.' },
              { title: 'Documentación', desc: 'Checklists dinámicos, visor protegido y control de versión.' },
              { title: 'Análisis Asistido IA', desc: 'Scoring preliminar, revisión documental y alertas tempranas.' },
              { title: 'Decisiones', desc: 'Resoluciones fundadas de comité, observaciones y condiciones.' },
              { title: 'Agenda y Firmas', desc: 'Coordinación con escribano e inspección ocular de títulos.' },
              { title: 'Créditos Activos', desc: 'Control de cartera viva, estados de cumplimiento y saldos.' },
              { title: 'Pagos y Comprobantes', desc: 'Calendario de cuotas, subida de transferencias y recibos.' },
              { title: 'Recordatorios', desc: 'Avisos automáticos de vencimientos y requerimientos pendientes.' },
              { title: 'Cancelaciones', desc: 'Trámite de cancelación anticipada y liberación hipotecaria.' },
              { title: 'Auditoría Inmutable', desc: 'Pistas forenses de cada acción, usuario, fecha e IP.' },
              { title: 'Notificaciones', desc: 'Emails y alertas al solicitante y al equipo del estudio.' },
              { title: 'Configuración', desc: 'Políticas de riesgo, branding, roles y aranceles notariales.' },
            ].map((module, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-brand-green hover:shadow-sm transition-all space-y-1">
                <div className="flex items-center space-x-1.5 text-navy font-bold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  <span>{module.title}</span>
                </div>
                <p className="text-[11px] text-slate-muted leading-tight">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. GRAN SECCIÓN WHITE LABEL Y MARCA PROPIA                     */}
      {/* ============================================================== */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-navy text-white shadow-2xl border border-navy-border">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-5 h-72 sm:h-80 lg:h-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80"
                  alt="Oficina contemporánea para estudios y financieras"
                  className="w-full h-full object-cover object-center brightness-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy/80 hidden lg:block" />
              </div>

              <div className="lg:col-span-7 p-8 md:p-14 text-left space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                    Tu estudio. Tu marca.{' '}
                    <span className="text-brand-green">Nuestra tecnología.</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed mt-3 max-w-xl">
                    HIPOTECALY es 100% white-label. Vos tenés tu marca, tus clientes y nosotros la tecnología que impulsa tu negocio.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Globe className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">100% White-Label</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Con tu marca, logotipo, colores y dominio propio.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Clock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Puesta en Marcha Asistida</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Acompañamiento guiado de nuestros especialistas técnicos.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Lock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Aislamiento RLS Estricto</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bases de datos blindadas por organización y permisos.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Headphones className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Soporte Continuo</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Acompañamiento operativo y evoluciones de producto.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Link to="/contacto?plan=whitelabel">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                      Quiero mi plataforma <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link
                    to="/contacto?demo=true"
                    className="text-sm font-semibold text-white hover:text-brand-green text-center py-2 transition-colors"
                  >
                    Agendar demo personalizada
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CTA FINAL NAVY                                              */}
      {/* ============================================================== */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
            TRANSFORMÁ TU OPERACIÓN HIPOTECARIA
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Empezá a operar de forma digital hoy mismo.
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            Ya sea integrando HIPOTECALY a tu sitio actual o creando tu plataforma completa desde cero, te ayudamos a escalar tus operaciones con orden y seguridad.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contacto?demo=true">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating">
                AGENDAR DEMO <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/plataforma/precios">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                VER PLANES Y PRECIOS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
