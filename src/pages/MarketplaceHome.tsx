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
  Building2,
  Sparkles,
  ChevronRight,
  Briefcase,
  Code,
  Laptop,
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
      {/* 1. HERO SECTION CON SELECTOR DUAL DE ENTRADA                  */}
      {/* ============================================================== */}
      <section className="relative pt-6 pb-16 md:pt-10 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Selector Dual de Entrada Rápida (Personas vs Empresas) */}
          <div className="mb-8 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 inline-flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
            <Link
              to="/simulador"
              className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white text-navy font-bold text-xs shadow-sm border border-slate-200/80 hover:text-brand-green transition-colors w-full sm:w-auto"
            >
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span>Para Personas (Simular Crédito)</span>
            </Link>
            <Link
              to="/saas"
              className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-navy text-white font-bold text-xs shadow-sm hover:bg-navy-light transition-colors w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
              <span>Para Empresas (Plataforma SaaS & White-Label)</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Columna Izquierda: Mensaje Central */}
            <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/10 text-brand-green border border-brand-green/20">
                  <span>MARKETPLACE HIPOTECARIO & PLATAFORMA B2B</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Convertimos tu propiedad en la{' '}
                  <span className="text-brand-green">oportunidad</span> que necesitás.
                </h1>
                <p className="text-lg sm:text-xl text-slate-muted font-normal leading-relaxed max-w-xl">
                  Préstamos con garantía hipotecaria para personas en Uruguay, respaldados por la infraestructura tecnológica más avanzada del mercado.
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
                  to="/saas"
                  className="text-sm font-semibold text-navy hover:text-brand-green underline decoration-brand-green decoration-2 underline-offset-8 transition-colors text-center py-2"
                >
                  ¿Sos empresa o prestamista? Conocé el SaaS
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Fotografía Inmobiliaria + Card Flotante */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0">
              <div className="relative rounded-2xl md:rounded-[24px] overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] sm:aspect-[16/11] bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                  alt="Propiedad residencial contemporánea en Uruguay"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 brightness-95"
                  loading="eager"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent pointer-events-none" />

                {/* Card Financiera Superpuesta Flotante */}
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

                  <p className="text-[11px] text-slate-300 leading-snug mt-1">
                    Garantía evaluada sobre inmueble en Montevideo
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
      {/* 2. GRAN BARRA NAVY DE BENEFICIOS                              */}
      {/* ============================================================== */}
      <section className="bg-navy py-12 md:py-16 text-white border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            
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

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 text-brand-green">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wide uppercase text-white mb-1">
                  ACOMPAÑAMIENTO
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Profesionales notariales y financieros junto a vos en cada etapa.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. PROCESO PASO A PASO + MOCKUP TECNOLÓGICO                    */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-1">
                  PROCESO CLARO Y ORDENADO
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
                  Cómo funciona, paso a paso
                </h2>
                <p className="text-slate-muted text-sm sm:text-base mt-2">
                  Un proceso simple, digital desde el comienzo. Diseñado para brindarte transparencia y previsibilidad en todo momento.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-9 h-9 rounded-full bg-brand-green text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-navy">Simulá tu solicitud</h4>
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

              <div className="pt-2">
                <DashboardMockup />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECCIÓN B2B DEDICADA: HIPOTECALY PARA EMPRESAS & ESTUDIOS    */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-900 text-white text-left relative overflow-hidden border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-green/20 text-brand-green border border-brand-green/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>HIPOTECALY PARA EMPRESAS · SAAS WHITE-LABEL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Tu negocio hipotecario. <span className="text-brand-green">Tu marca.</span> Nuestra tecnología.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              La infraestructura de software especializada para digitalizar la captación de clientes, análisis registral con IA,
              backoffice notarial y administración de carteras de crédito en Uruguay.
            </p>
          </div>

          {/* 3 Modalidades de Implementación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            
            {/* Modalidad 1 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 hover:border-brand-green/50 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
                  <Code className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-brand-green uppercase">Modalidad A</span>
                <h3 className="text-xl font-bold text-white">Integración a tu Web Existente</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ¿Ya tenés sitio institucional? Embebemos el simulador inteligente y conectamos la pasarela digital con tu backoffice sin rehacer tu portal.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Botón y widget de solicitud parametrizado</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Conexión directa a bandeja operativa</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Instalación ágil en pocos días</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/saas/integracion">
                  <Button variant="secondary" size="sm" fullWidth className="bg-slate-700 hover:bg-slate-600 text-white border-0 text-xs">
                    Ver Integración <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Modalidad 2 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 hover:border-brand-green/50 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-brand-green uppercase">Modalidad B</span>
                <h3 className="text-xl font-bold text-white">Plataforma Completa Llave en Mano</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Portal web para solicitantes + wizard documental de 4 pasos + backoffice notarial y panel de autogestión de clientes listo para operar.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Landing comercial optimizada para conversión</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Portal de autogestión del solicitante</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Copiloto de IA para estudio registral</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/saas/plataforma-completa">
                  <Button variant="secondary" size="sm" fullWidth className="bg-slate-700 hover:bg-slate-600 text-white border-0 text-xs">
                    Ver Plataforma <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Modalidad 3 */}
            <div className="bg-navy-surface rounded-2xl p-6 border-2 border-brand-green/50 shadow-2xl flex flex-col justify-between relative">
              <div className="absolute top-4 right-4">
                <span className="bg-brand-green text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  100% Personalizado
                </span>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green text-white flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-brand-green uppercase">Modalidad C</span>
                <h3 className="text-xl font-bold text-white">Full White-Label Institucional</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tu propio dominio web (ej. creditos.tuempresa.uy), tu logo, paleta de colores CSS, políticas crediticias propias y aislamiento RLS.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Dominio propio con certificado SSL emitido</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Límites, LTV y tasas configurables en caliente</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Cero mención de marcas externas</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/demo/nova/full">
                  <Button variant="primary" size="sm" fullWidth className="text-xs">
                    Probar Demo NOVA <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          {/* Segmentos Comerciales */}
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-800">
            <h4 className="text-sm font-bold text-brand-green uppercase tracking-wider mb-6 text-center">
              Soluciones Diseñadas para Operadores del Mercado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <Link
                to="/empresas/prestamistas"
                className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 hover:border-brand-green transition-all group space-y-2 block"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-green group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <strong className="text-sm text-white block group-hover:text-brand-green">Prestamistas Privados</strong>
                <p className="text-[11px] text-slate-400">Canal seguro de originación, evaluación de garantías y blindaje Anti-Bypass.</p>
                <span className="text-[11px] text-brand-green font-bold flex items-center pt-1">
                  Ver solución <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </Link>

              <Link
                to="/empresas/financieras"
                className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 hover:border-blue-400 transition-all group space-y-2 block"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <strong className="text-sm text-white block group-hover:text-blue-400">Financieras y Fondos</strong>
                <p className="text-[11px] text-slate-400">Core hipotecario White-Label, scoring paramétrico y sindicación de inversores.</p>
                <span className="text-[11px] text-blue-400 font-bold flex items-center pt-1">
                  Ver solución <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </Link>

              <Link
                to="/empresas/estudios"
                className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 hover:border-purple-400 transition-all group space-y-2 block"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <strong className="text-sm text-white block group-hover:text-purple-400">Estudios Notariales</strong>
                <p className="text-[11px] text-slate-400">Expediente digital, estudio de títulos registrales y coordinación de escrituras.</p>
                <span className="text-[11px] text-purple-400 font-bold flex items-center pt-1">
                  Ver solución <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </Link>
            </div>

            {/* CTAs B2B Finales */}
            <div className="mt-10 pt-8 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contacto?demo=true">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-lg">
                  <Building2 className="w-4 h-4 mr-2" /> Solicitar Demostración Guiada
                </Button>
              </Link>
              <Link to="/demo/nova">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-slate-200 border-slate-600 hover:text-white">
                  <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Showroom NOVA
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. BANNER CTA FINAL DE MARKETPLACE                             */}
      {/* ============================================================== */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-navy text-white p-8 md:p-14 shadow-2xl border border-navy-border">
            <div className="relative z-10 max-w-2xl text-left space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                RESPALDO NOTARIAL Y PROFESIONAL
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                ¿Querés conocer cuánto podrías solicitar por tu propiedad?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Completá el simulador gratuito en minutos, conocé condiciones preliminares y recibí orientación técnica personalizada.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link to="/simulador">
                  <Button variant="primary" size="lg">
                    Comenzar simulación gratuita <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contacto">
                  <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10">
                    <Phone className="w-4 h-4 mr-2 text-brand-green" /> Hablar con un asesor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
