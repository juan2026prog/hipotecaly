import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Layers,
  BarChart3,
  Globe,
  Sparkles,
  FileCheck2,
  CalendarDays,
  CheckCircle,
  Clock,
  Lock,
  Headphones,
  Laptop,
} from 'lucide-react';
import { SaaSNavbar } from '../components/layout/SaaSNavbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { DashboardMockup } from '../components/mockups/DashboardMockup';
import { MobileTrackerMockup } from '../components/mockups/MobileTrackerMockup';

export const SaaSHome: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SAAS SECTION (Fiel a Imagen 2 de Referencia)            */}
      {/* ============================================================== */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Columna Izquierda: Mensaje B2B */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-wider text-brand-green uppercase block mb-3">
                  LA PLATAFORMA HIPOTECARIA PARA PROFESIONALES
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Digitalizá, analizá y gestioná préstamos hipotecarios en{' '}
                  <span className="text-brand-green">una sola plataforma</span>.
                </h1>
                <p className="text-base sm:text-lg text-slate-muted font-normal leading-relaxed max-w-xl mt-4">
                  HIPOTECALY centraliza la captación, análisis y gestión de solicitudes hipotecarias para que tu estudio, financiera o empresa trabaje con más orden, velocidad y control.
                </p>
              </div>

              {/* 3 Beneficios Rápidos en Cards */}
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
                    <Shield className="w-5 h-5 text-brand-green" />
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

              {/* CTAs B2B */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-5 pt-2">
                <Link to="/contacto?plan=whitelabel">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md">
                    Quiero mi plataforma <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link
                  to="#funcionalidades"
                  className="text-sm font-semibold text-navy hover:text-brand-green underline decoration-brand-green decoration-2 underline-offset-8 transition-colors text-center py-2"
                >
                  Ver cómo funciona
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Mockup Realista Dashboard + Smartphone (Idéntico a Imagen 2) */}
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
      {/* 2. GRAN BARRA NAVY DE PILARES SAAS (Regla 49 - Sin números inventados) */}
      {/* ============================================================== */}
      <section className="bg-navy py-12 md:py-16 text-white border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            
            {/* Pilar 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  CAPTACIÓN
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Recibí solicitudes desde tu propia web o portal con formularios a medida.
                </p>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  ANÁLISIS
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Centralizá información patrimonial, documentación y reglas crediticias.
                </p>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  GESTIÓN
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Administrá el expediente completo, estados, tareas y asignaciones.
                </p>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  WHITE LABEL
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tu marca, tu logo, tus clientes y dominio bajo nuestra tecnología.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FUNCIONALIDADES Y BENEFICIOS (Fiel a Imagen 2)               */}
      {/* ============================================================== */}
      <section id="funcionalidades" className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
            
            {/* Columna Izquierda: Todo lo que necesitás en un solo lugar */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
                  TODO LO QUE NECESITÁS, EN UN SOLO LUGAR
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                  Una plataforma completa para cada etapa del préstamo.
                </h2>
              </div>

              {/* 5 Funcionalidades según Regla 50 */}
              <div className="space-y-5">
                <div className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-base">Captación y gestión de solicitudes</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Recibí solicitudes desde tu web o las cargás vos. Toda la información centralizada y organizada desde el primer contacto.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-base">Análisis inteligente</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Scoring preliminar, verificación de documentación, valuación del inmueble y control de parámetros crediticios.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-base">Gestión documental</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Checklists personalizados, carga de fotos y certificados, almacenamiento privado seguro con trazabilidad total.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-base">Seguimiento y control</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Calendario de tareas, alertas automáticas y seguimiento del estado del expediente en cada paso de la operación.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-brand-green-light flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-base">Reportes y métricas operacionales</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Dashboards en tiempo real para evaluar volumen solicitado, tasas de conversión y crecimiento de tu cartera.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/plataforma/funcionalidades">
                  <Button variant="outline" size="md">
                    Ver todas las funcionalidades <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Beneficios para tu negocio */}
            <div className="lg:col-span-6 space-y-8 lg:pl-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
                  BENEFICIOS PARA TU NEGOCIO
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                  Más control, más productividad, más resultados.
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-navy text-base">Ahorrá tiempo valioso</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Automatizá hasta el 80% de las tareas administrativas recurrentes y eliminá el desorden de planillas dispersas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-navy text-base">Reducí costos operativos</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Menos papeles físicos, menos retrabajo y procesos estandarizados para todo tu equipo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-navy text-base">Mejorá la experiencia de tus clientes</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Brindá a los solicitantes un portal moderno, transparente y ágil donde cargar fotos y consultar su estado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-navy text-base">Tomá mejores decisiones</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Información clara, valuaciones preliminares e indicadores confiables para evaluar cada garantía inmobiliaria.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-navy text-base">Escalá tu volumen de operaciones</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Atendé y gestioná más expedientes sin necesidad de sobredimensionar tu estructura de costos fijos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonio / Cita institucional */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6">
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  “HIPOTECALY moderniza la gestión de créditos hipotecarios unificando la captación web, el análisis documental y la evaluación de garantías en una única plataforma profesional.”
                </p>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                    HE
                  </div>
                  <div>
                    <span className="font-bold text-navy text-sm block">Solución Corporativa</span>
                    <span className="text-xs text-slate-500">Para estudios jurídicos, inmobiliarias y financieras</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. GRAN SECCIÓN WHITE LABEL (Fiel a Imagen 2)                  */}
      {/* ============================================================== */}
      <section id="white-label" className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-navy text-white shadow-2xl border border-navy-border">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              
              {/* Imagen Fotográfica Arquitectónica / Lounge Nocturno */}
              <div className="lg:col-span-5 h-72 sm:h-80 lg:h-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80"
                  alt="Oficina contemporánea para estudios y financieras"
                  className="w-full h-full object-cover object-center brightness-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy/80 hidden lg:block" />
              </div>

              {/* Contenido White Label */}
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

                {/* 4 Cards de características White Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Globe className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">100% white-label</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Con tu marca, logotipo, colores y dominio propio.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Clock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Implementación rápida</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Listo para operar y recibir solicitudes en pocos días.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Lock className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Seguro y confiable</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Aislamiento estricto de base de datos y respaldos continuos.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3.5">
                    <Headphones className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-sm">Soporte prémium</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Acompañamiento técnico y evoluciones de producto constantes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTAs White Label */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-5 pt-4">
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

      <Footer />
    </div>
  );
};
