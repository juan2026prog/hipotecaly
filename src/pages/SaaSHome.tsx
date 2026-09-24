import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Globe,
  Clock,
  Lock,
  Headphones,
  Laptop,
  Workflow,
  ShieldCheck,
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
                  LA PLATAFORMA HIPOTECARIA PARA PROFESIONALES
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
                  Digitalizá todo tu negocio hipotecario en una sola plataforma.{' '}
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
                    Agendar demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a
                  href="#modalidades"
                  className="text-sm font-semibold text-navy hover:text-brand-green underline decoration-brand-green decoration-2 underline-offset-8 transition-colors text-center py-2"
                >
                  Ver cómo funciona
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
      {/* BARRA NAVY SAAS: 4 PILARES ESTRUCTURALES                       */}
      {/* ============================================================== */}
      <section className="bg-navy py-10 md:py-12 text-white border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">CAPTACIÓN</h3>
              <p className="text-xs text-slate-300">Simulador inteligente y solicitudes web parametrizadas.</p>
            </div>
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">ANÁLISIS</h3>
              <p className="text-xs text-slate-300">Evaluación crediticia y análisis registral asistido.</p>
            </div>
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">GESTIÓN</h3>
              <p className="text-xs text-slate-300">Backoffice notarial, expedientes y workflow integral.</p>
            </div>
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green">WHITE LABEL</h3>
              <p className="text-xs text-slate-300">Dominio propio, colores institucionales y marca exclusiva.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. TRES MODALIDADES DE INTEGRACIÓN CLARAMENTE DIFERENCIADAS   */}
      {/* ============================================================== */}
      <section id="modalidades" className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full">
              FLEXIBILIDAD DE IMPLEMENTACIÓN
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Elegí cómo querés integrar HIPOTECALY
            </h2>
            <p className="text-base text-slate-muted">
              Tres formas adaptadas a tu infraestructura actual para transformar tu negocio hipotecario en una experiencia digital ágil, ordenada y profesional.
            </p>
          </div>

          {/* LAS TRES GRANDES TARJETAS COMERCIALES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* MODALIDAD 01: SOLO BOTÓN */}
            <div className="bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-brand-green transition-all shadow-card flex flex-col justify-between relative group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-green-light text-brand-green">
                    <Workflow className="w-3.5 h-3.5" />
                    <span>01 — SOLO BOTÓN</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400">Sin desarrollo</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                    Botón de Solicitud
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-muted mt-2 leading-relaxed">
                    Tu organización conserva su sitio actual y agrega un botón tipo <strong>[SOLICITAR FINANCIACIÓN]</strong> que abre el simulador alojado con tu identidad.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Flujo:</div>
                  <div>Tu web actual → Botón CTA</div>
                  <div className="text-brand-green font-bold">↓ Abre simulador brandeado</div>
                  <div className="text-navy font-bold">✓ Continuar solicitud</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Cero desarrollo en tu sitio actual</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Simulador alojado bajo tu dominio/marca</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <Link to="/demo/estudio-nova/integraciones/boton">
                  <Button variant="primary" size="md" fullWidth className="shadow-md font-bold text-xs">
                    PROBAR INTEGRACIÓN <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/contacto?source=button-demo&demo=true">
                  <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
                    Consultar modalidad
                  </Button>
                </Link>
              </div>
            </div>

            {/* MODALIDAD 02: SIMULADOR EMBEBIDO */}
            <div className="bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-brand-green transition-all shadow-card flex flex-col justify-between relative group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-green-light text-brand-green">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>02 — SIMULADOR EMBEBIDO</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400">Widget / Embed</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                    Simulador Embebido
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-muted mt-2 leading-relaxed">
                    Tu organización conserva su sitio actual. El simulador interactivo se integra directamente dentro de tu propia web y conecta con el resto del flujo.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Flujo:</div>
                  <div>Tu web + Simulador embebido</div>
                  <div className="text-brand-green font-bold">↓ Usuario cotiza cuota</div>
                  <div className="text-navy font-bold">✓ Continuar solicitud</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Incrustación por script o iframe seguro</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Datos precargados sin reescritura</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <Link to="/demo/estudio-nova/integraciones/embebido">
                  <Button variant="primary" size="md" fullWidth className="shadow-md font-bold text-xs">
                    PROBAR SIMULADOR EN VIVO <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/contacto?source=embed-demo&demo=true">
                  <Button variant="outline" size="sm" fullWidth className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
                    Consultar modalidad
                  </Button>
                </Link>
              </div>
            </div>

            {/* MODALIDAD 03: SITIO COMPLETO */}
            <div className="bg-navy text-white rounded-3xl p-7 border border-navy-border shadow-floating flex flex-col justify-between relative group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-green text-navy">
                    <Globe className="w-3.5 h-3.5" />
                    <span>03 — SITIO COMPLETO</span>
                  </span>
                  <span className="text-xs font-medium text-slate-300">Llave en Mano</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Plataforma Completa
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    HIPOTECALY proporciona la experiencia completa: portal institucional, simulador, portal del solicitante y backoffice operativo.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 space-y-1.5 font-mono">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Flujo:</div>
                  <div>Portal institucional propio</div>
                  <div className="text-brand-green font-bold">↓ Cotizador + Solicitud</div>
                  <div className="text-white font-bold">✓ Expediente + Backoffice</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Ecosistema digital autónomo llave en mano</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Estudio Nova representa esta modalidad</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <Link to="/demo/estudio-nova">
                  <Button variant="primary" size="md" fullWidth className="shadow-lg font-bold text-xs">
                    VER DEMO ESTUDIO NOVA <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/saas/plataforma-completa" className="block text-center text-xs font-semibold text-slate-300 hover:text-white pt-1">
                  Ver detalles de sitio completo →
                </Link>
              </div>
            </div>

          </div>

          {/* Aclaración Transversal Obligatoria de Marca */}
          <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold text-navy">
              “En todas las modalidades, la experiencia del solicitante utiliza la identidad de tu organización.”
            </p>
          </div>

          {/* Pipeline Visual debajo de las tres modalidades */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
              EL FLUJO DIGITAL UNIFICADO QUE EXPERIMENTAN TUS CLIENTES
            </span>
            <PipelineVisual />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2.5 SOLUCIONES VERTICALES POR PERFIL COMERCIAL                 */}
      {/* ============================================================== */}
      <section className="py-16 bg-slate-50 border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
              ADAPTADO A TU ROL EN EL MERCADO
            </span>
            <h2 className="text-3xl font-extrabold text-navy tracking-tight">
              Soluciones Especializadas por Perfil
            </h2>
            <p className="text-sm text-slate-600">
              Conocé las capacidades específicas que HIPOTECALY diseñó para cada participante del ecosistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/empresas/prestamistas"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-green transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy group-hover:text-brand-green">Prestamistas Privados</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Oportunidades hipotecarias pre-calificadas con tasación de inmueble, condiciones de oferta simulables y estricto blindaje Anti-Bypass.
                </p>
              </div>
              <span className="text-xs font-bold text-brand-green flex items-center pt-2 border-t border-slate-100">
                Ver solución para prestamistas <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </span>
            </Link>

            <Link
              to="/empresas/financieras"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy group-hover:text-blue-600">Financieras & Originadores</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Core hipotecario White-Label completo con tu propia marca, scoring paramétrico de underwriting, sindicación de inversores y loan servicing.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 flex items-center pt-2 border-t border-slate-100">
                Ver solución para financieras <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </span>
            </Link>

            <Link
              to="/empresas/estudios"
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-500 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy group-hover:text-purple-600">Estudios Notariales</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Expediente digital centralizado, control de antecedentes registrales, checklist de recaudos y coordinación de agenda de escrituración.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 flex items-center pt-2 border-t border-slate-100">
                Ver solución para estudios <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </span>
            </Link>
          </div>

          {/* Banner Tenant Demo Estudio Nova */}
          <div className="mt-8 p-6 bg-gradient-to-r from-navy via-slate-900 to-navy text-white rounded-2xl border border-navy-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">TENANT DEMO EN VIVO</span>
              <h4 className="text-lg font-bold">¿Querés ver cómo opera una entidad real con HIPOTECALY?</h4>
              <p className="text-xs text-slate-300">Explorá Estudio Nova, nuestro tenant interactivo de demostración con motor de reglas en caliente.</p>
            </div>
            <Link to="/demo/estudio-nova">
              <Button variant="primary" size="md" className="shrink-0 font-bold shadow-md">
                Ver Demo Estudio Nova <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
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
              MOTOR MODULAR EMPRESARIAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Módulos del Core Tecnológico HIPOTECALY
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Módulos nativos integrados y add-ons especializados para potenciar tu operativa hipotecaria:
            </p>
          </div>

          {/* Grilla de Módulos con Badges de Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Solicitudes', desc: 'Captación estructurada y legajo digital.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Expedientes', desc: 'ID único, estados y trazabilidad completa.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Clientes', desc: 'Directorio patrimonial y perfiles de contacto.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Propiedades', desc: 'Padrones, superficie, fotos y tasación.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Documentación', desc: 'Checklists dinámicos y control de versión.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Análisis IA', desc: 'Scoring preliminar y auditoría documental.', badge: 'ADD-ON', badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
              { title: 'Decisiones', desc: 'Resoluciones fundadas de comité y actas.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Agenda y Firmas', desc: 'Coordinación notarial y minutas aprobadas.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Sindicación', desc: 'Distribución de tramos entre inversores.', badge: 'ADD-ON', badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
              { title: 'Loan Servicing', desc: 'Calendario de cuotas y conciliación.', badge: 'ADD-ON', badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
              { title: 'Recordatorios', desc: 'Avisos automáticos de vencimientos.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'Auditoría Forense', desc: 'Pistas inmutables por usuario, fecha e IP.', badge: 'INCLUDED', badgeClass: 'bg-emerald-50 text-brand-green border-emerald-200' },
              { title: 'White-Label SSL', desc: 'Dominio propio y diseño corporativo.', badge: 'ADD-ON', badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
              { title: 'Conexión DGR', desc: 'Cotejo directo con Dirección de Registros.', badge: 'COMING SOON', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
              { title: 'Firma Notarial', desc: 'Gestión de firma electrónica según proveedor habilitado.', badge: 'COMING SOON', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map((module, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-brand-green hover:shadow-sm transition-all space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-navy font-bold text-xs">{module.title}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${module.badgeClass}`}>
                      {module.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-muted leading-tight">{module.desc}</p>
                </div>
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
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                    Agendar demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/saas/plataforma-completa">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                    Ver cómo funciona
                  </Button>
                </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
