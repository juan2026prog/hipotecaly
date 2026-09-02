import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  Clock,
  ShieldCheck,
  Search,
  Lock,
  Compass,
  Headphones,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { DashboardMockup } from '../components/mockups/DashboardMockup';

export const MarketplaceHome: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION (Fiel a Imagen 1 de Referencia)                 */}
      {/* ============================================================== */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50/70 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Columna Izquierda: Mensaje Central */}
            <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Convertimos tu propiedad en la{' '}
                  <span className="text-brand-green">oportunidad</span> que necesitás.
                </h1>
                <p className="text-lg sm:text-xl text-slate-muted font-normal leading-relaxed max-w-xl">
                  Préstamos con garantía hipotecaria para lo que realmente importa.
                </p>
              </div>

              {/* 3 Beneficios en Cards Estilizadas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-muted block">Hasta el</span>
                    <span className="font-bold text-navy text-sm block leading-snug">40% del valor</span>
                    <span className="text-[11px] text-slate-500 block">de tu propiedad</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-muted block">Hasta</span>
                    <span className="font-bold text-navy text-sm block leading-snug">5 años</span>
                    <span className="text-[11px] text-slate-500 block">para devolver</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-muted block">Proceso</span>
                    <span className="font-bold text-navy text-sm block leading-snug">simple y seguro</span>
                    <span className="text-[11px] text-slate-500 block">100% acompañado</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-5 pt-2">
                <Link to="/simulador">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md">
                    Simular mi préstamo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link
                  to="/como-funciona"
                  className="text-sm font-semibold text-navy hover:text-brand-green underline decoration-brand-green decoration-2 underline-offset-8 transition-colors text-center py-2"
                >
                  Quiero saber más
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Fotografía Inmobiliaria + Card Flotante (Idéntica a Imagen 1) */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0">
              <div className="relative rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] sm:aspect-[16/11] bg-slate-900">
                {/* Imagen Arquitectónica Contemporánea */}
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                  alt="Propiedad residencial contemporánea en Uruguay"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 brightness-95"
                  loading="eager"
                />
                
                {/* Gradiente de sombra */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent pointer-events-none" />

                {/* Card Financiera Superpuesta Flotante (Navy Dark + Emerald Green) */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 bg-navy/95 backdrop-blur-md text-white p-5 rounded-xl border border-navy-border shadow-floating animate-in fade-in slide-in-from-bottom-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-medium">Monto estimado disponible</span>
                    <div className="w-7 h-7 rounded-full bg-brand-green/20 flex items-center justify-center">
                      <Home className="w-4 h-4 text-brand-green" />
                    </div>
                  </div>
                  
                  <div className="text-2xl sm:text-3xl font-extrabold text-brand-green tracking-tight">
                    USD 120.000
                  </div>

                  {/* Barra de progreso verde */}
                  <div className="w-full bg-white/10 rounded-full h-2 my-2.5 overflow-hidden">
                    <div className="bg-brand-green h-full rounded-full w-2/3"></div>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Hasta el 40% del valor estimado de tu propiedad.
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-1 italic">
                    Ejemplo ilustrativo sujeto a análisis preliminar.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. GRAN BARRA NAVY DE BENEFICIOS (Regla 23 - Sin métricas falsas) */}
      {/* ============================================================== */}
      <section className="bg-navy py-12 md:py-16 text-white border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            
            {/* Pilar 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  ANÁLISIS DIGITAL
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Evaluación ágil y análisis inicial de las condiciones de tu inmueble.
                </p>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  PRIVACIDAD
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Protegemos tu información con estricto enmascaramiento de datos personales.
                </p>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Compass className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  SEGUIMIENTO
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conocé el estado de tu expediente en tiempo real desde tu celular o web.
                </p>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  ACOMPAÑAMIENTO
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Un proceso ordenado y asistido por especialistas de principio a fin.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CÓMO FUNCIONA + PANEL TECNOLÓGICO (Fiel a Imagen 1)         */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            
            {/* Columna Izquierda: Pasos del Proceso */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
                  CÓMO FUNCIONA
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                  Un proceso simple, digital desde el comienzo.
                </h2>
              </div>

              {/* 4 Pasos según Regla 24 */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Completá tu solicitud</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Contanos cuánto necesitás y los datos básicos de tu propiedad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Analizamos tu propiedad</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Revisamos información, documentación y características del inmueble.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Recibí una propuesta</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Si la solicitud califica, podremos presentarte condiciones disponibles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Avanzá con la operación</h4>
                    <p className="text-sm text-slate-muted leading-relaxed mt-0.5">
                      Si decidís continuar, coordinamos los pasos notariales para formalizarla.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/como-funciona">
                  <Button variant="outline" size="md">
                    Conocé más sobre el proceso <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Mockup del Panel Tecnológico */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-1">
                  TECNOLOGÍA QUE SIMPLIFICA
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                  Gestionamos todo, para que no tengas que preocuparte.
                </h3>
                <p className="text-sm text-slate-muted leading-relaxed mt-1.5 max-w-2xl">
                  Nuestra plataforma digital analiza, organiza y gestiona cada paso de tu solicitud de forma ágil, segura y transparente.
                </p>
              </div>

              {/* Render del Mockup HTML/CSS */}
              <div className="pt-2">
                <DashboardMockup />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. BANNER CTA FINAL (Fiel a Imagen 1)                           */}
      {/* ============================================================== */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-navy text-white p-8 md:p-14 shadow-2xl border border-navy-border">
            {/* Sutil imagen arquitectónica de fondo */}
            <div className="absolute inset-0 opacity-15 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
              
              <div className="lg:col-span-7 space-y-5">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  Tu propiedad puede ser el comienzo de tu{' '}
                  <span className="text-brand-green">próximo gran proyecto</span>.
                </h2>
                <p className="text-sm md:text-base text-slate-300 max-w-lg leading-relaxed">
                  Evaluá tu capacidad crediticia preliminar en menos de 2 minutos sin compromiso legal ni costo inicial.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                  <Link to="/simulador">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                      Simular mi préstamo
                    </Button>
                  </Link>
                  <a
                    href="https://wa.me/59899000000?text=Hola,%20quisiera%20consultar%20sobre%20un%20préstamo%20con%20garantía%20hipotecaria"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-2 text-sm font-semibold text-white hover:text-brand-green px-4 py-3 transition-colors"
                  >
                    <span>o hablá con un asesor</span>
                    <Phone className="w-4 h-4 text-brand-green" />
                  </a>
                </div>
              </div>

              {/* 3 Badges */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 pt-4 lg:pt-0">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-green/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Seguridad</span>
                    <span className="text-xs text-slate-400">Protegemos tus datos e información</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-green/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Rapidez</span>
                    <span className="text-xs text-slate-400">Respuestas ágiles y sin vueltas</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-green/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">Acompañamiento</span>
                    <span className="text-xs text-slate-400">Te asesoramos en cada etapa</span>
                  </div>
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
