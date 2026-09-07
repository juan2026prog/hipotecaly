import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  UserCheck,
  FileSignature,
  Building2,
  Lock,
  Check,
  ChevronDown,
  ArrowUpRight,
  Database,
  KeyRound,
  FileSearch,
  Scale,
  DollarSign,
  Cpu,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export const MarketplaceHome: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: '¿Tengo que reemplazar mi web actual?',
      a: 'No. Podés conservar tu sitio web actual y adoptar HIPOTECALY mediante un simple botón de acceso o integrando el simulador paramétrico interactivo sin modificar tu infraestructura.',
    },
    {
      q: '¿Las tres modalidades usan sistemas diferentes?',
      a: 'No. Todas las modalidades operan sobre el mismo HIPOTECALY Core (DocFlow, KYC, expediente único y backoffice). Lo único que cambia es la forma de entrada y el nivel de personalización de marca.',
    },
    {
      q: '¿El simulador puede usar reglas distintas por organización?',
      a: 'Sí. Cada organización configura sus propios parámetros de LTV máximo, plazos, tasas, sistemas de amortización (Francés o Solo Interés) y requisitos documentales.',
    },
    {
      q: '¿Qué demuestra Estudio Nova?',
      a: 'Estudio Nova es un tenant demostrativo con identidad propia, pensado para probar y mostrar la experiencia real de simulación, solicitud, portal y White Label sobre el mismo core.',
    },
    {
      q: '¿El Marketplace forma parte de la propuesta actual?',
      a: 'No públicamente. El Marketplace B2C se encuentra congelado para enfocar el 100% de la plataforma en infraestructura y software tecnológico B2B para organizaciones.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text antialiased selection:bg-brand-green selection:text-white">
      <Navbar />

      <main className="flex-grow">
        {/* ============================================================== */}
        {/* 1. HERO SECTION                                               */}
        {/* ============================================================== */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-[#F7F9FC] via-white to-white border-b border-slate-200/70">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center text-left">
              
              {/* Columna Izquierda: Mensaje Central */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/10 text-brand-green-dark border border-brand-green/20">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  <span>Infraestructura hipotecaria B2B</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-navy leading-[1.12]">
                  Digitalizá la operación hipotecaria{' '}
                  <span className="text-brand-green">de punta a punta.</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-muted font-normal leading-relaxed max-w-xl">
                  HIPOTECALY conecta simulación, solicitud, expediente, documentación, identidad, firma, valuación y backoffice en una única infraestructura modular para organizaciones que gestionan financiación con garantía hipotecaria.
                </p>

                {/* CTAs Principales */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <a href="#integraciones" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto px-7 font-bold shadow-md">
                      Ver formas de integración <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                  <Link to="/demo/estudio-nova" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold border-slate-300 text-navy hover:bg-slate-50">
                      <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Estudio Nova
                    </Button>
                  </Link>
                </div>

                {/* 3 Bullets de Confianza */}
                <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Multi-tenant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Trazabilidad completa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-brand-green shrink-0" />
                    <span>Módulos configurables</span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Mockup Visual de Software HIPOTECALY */}
              <div className="lg:col-span-5">
                <div className="bg-[#071A35] text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-navy-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Window Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2">Expediente #EXP-2026-8941</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-green/20 text-brand-green font-bold">
                      EN PROCESO NOTARIAL
                    </span>
                  </div>

                  {/* Software Modules Grid */}
                  <div className="space-y-2.5 text-xs">
                    {/* Item 1: Garantía & LTV */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-medium">Garantía Inmueble</span>
                        <span className="text-[10px] text-brand-green font-bold">LTV 33.3%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Padrón 41.208 · Pocitos</span>
                        <span className="font-mono text-slate-200">USD 60.000 / 180.000</span>
                      </div>
                    </div>

                    {/* Item 2: DocFlow Engine */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">DocFlow Engine</div>
                          <div className="text-[10px] text-slate-400">Minuta de Hipoteca & Pagaré v2</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        100% Autollenado
                      </span>
                    </div>

                    {/* Item 3: KYC & Identidad */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Identidad & KYC</div>
                          <div className="text-[10px] text-slate-400">Biometría Didit aprobada</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        Match 99.4%
                      </span>
                    </div>

                    {/* Item 4: Firma Digital & Hash */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <FileSignature className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Firma & Trazabilidad</div>
                          <div className="text-[10px] text-slate-400">Hash SHA-256 inmutable</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">
                        Listo para firma
                      </span>
                    </div>
                  </div>

                  {/* Mockup Footer Link */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Multi-Tenant RLS Aislado</span>
                    <span className="text-brand-green font-semibold">PostgreSQL Dedicated</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. MÉTRICAS STRIP                                             */}
        {/* ============================================================== */}
        <section className="py-12 md:py-16 bg-[#F7F9FC] border-b border-slate-200/80 text-left">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
            <div className="space-y-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-1">
                  Arquitectura Probada
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                  Una sola infraestructura. Tres formas de incorporarla a tu operación.
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-navy tracking-tight">3</div>
                  <div className="text-sm font-bold text-navy">modalidades de integración</div>
                  <p className="text-xs text-slate-muted">Botón directo, Simulador embebido o White Label completo.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-brand-green tracking-tight">100%</div>
                  <div className="text-sm font-bold text-navy">trazabilidad del expediente</div>
                  <p className="text-xs text-slate-muted">Registro unificado desde la simulación hasta la titulación.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-navy tracking-tight">−70%</div>
                  <div className="text-sm font-bold text-navy">tiempo operativo potencial*</div>
                  <p className="text-xs text-slate-muted">Automatización de legajo, redacción de minutas y validaciones.</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                *Reducción estimada en tiempos de originación, autollenado documental y validación frente a procesos manuales tradicionales.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. LAS 3 MODALIDADES DE INTEGRACIÓN                           */}
        {/* ============================================================== */}
        <section id="integraciones" className="py-16 md:py-24 bg-white text-left scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                MODALIDADES DE INTEGRACIÓN
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight">
                Tu web puede quedarse exactamente donde está.
              </h2>
              <p className="text-sm sm:text-base text-slate-muted leading-relaxed">
                HIPOTECALY se adapta al nivel de integración que necesita cada organización: desde un acceso simple hasta una plataforma completa con identidad propia.
              </p>
            </div>

            {/* 3 Cards de Igual Altura, Ancho y Alineación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Card 01 — BOTÓN */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      01 — BOTÓN
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Rápido
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-navy">
                    Botón de Solicitud
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                    Conservás tu sitio actual y agregás un acceso directo al flujo digital de HIPOTECALY.
                  </p>

                  {/* Mini Ejemplo Visual */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Snippet en tu sitio</span>
                    <div className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold shadow-xs inline-flex items-center space-x-1.5">
                      <span>Solicitar financiación</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-green" />
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 pt-1">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Sin reemplazar tu web actual</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Flujo de solicitud existente</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Configuración por organización</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/contacto?mode=boton" className="w-full block">
                    <Button variant="outline" size="sm" className="w-full font-semibold border-slate-200">
                      Consultar integración
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Card 02 — SIMULADOR + BOTÓN */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      02 — SIMULADOR + BOTÓN
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green-dark">
                      Interactivo
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-navy">
                    Simulador Embebido
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                    El usuario simula dentro de tu experiencia y continúa directamente al proceso de solicitud.
                  </p>

                  {/* Mini Ejemplo Visual */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Monto simulación</span>
                      <span className="font-bold text-navy">USD 50.000</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-green h-full w-2/3" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Plazo: 36 meses</span>
                      <span className="text-brand-green font-semibold">LTV 35%</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 pt-1">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Simulador parametrizable</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Continuidad sin duplicar datos</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Integración más profunda</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/simulador" className="w-full block">
                    <Button variant="outline" size="sm" className="w-full font-semibold border-slate-200">
                      Probar simulador en vivo
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Card 03 — WHITE LABEL */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-brand-green/40 shadow-card flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-green text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Integral
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">
                      03 — WHITE LABEL
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-navy">
                    White Label Completo
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                    Experiencia completa con tu marca, dominio, reglas y configuración utilizando HIPOTECALY como motor.
                  </p>

                  {/* Mini Ejemplo Visual */}
                  <div className="p-3.5 rounded-xl bg-navy text-white text-left space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">portal.tuempresa.com</span>
                      <span className="text-[9px] font-mono text-brand-green bg-brand-green/20 px-1.5 py-0.2 rounded">WL</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200">Plataforma con tu identidad</div>
                    <div className="text-[10px] text-slate-400">Simulador + Portal + Backoffice</div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 pt-1">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Simulador, solicitud y portal</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Backoffice multi-rol & IA</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-brand-green shrink-0" />
                      <span>Branding y reglas por tenant</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/demo/estudio-nova" className="w-full block">
                    <Button variant="primary" size="sm" className="w-full font-bold shadow-xs">
                      Ver demo Estudio Nova
                    </Button>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. HIPOTECALY CORE                                            */}
        {/* ============================================================== */}
        <section id="core" className="py-16 md:py-24 bg-[#F7F9FC] border-y border-slate-200/80 text-left scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
                EXPEDIENTE DIGITAL UNIFICADO
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight">
                Menos sistemas aislados. Un expediente único.
              </h2>
              <p className="text-sm sm:text-base text-slate-muted leading-relaxed">
                En lugar de sumar herramientas separadas para cada etapa, HIPOTECALY conecta la información de la operación y la mantiene disponible a lo largo de todo el proceso.
              </p>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 inline-block font-medium">
                💡 <strong className="text-navy">Aclaración:</strong> Las modalidades cambian la forma de presentar el producto. El motor central es el mismo.
              </div>
            </div>

            {/* 4 Bloques Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bloque 1: DocFlow */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">DocFlow</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Plantillas, autollenado, versiones, snapshots y trazabilidad documental sin fricciones operativas.
                </p>
              </div>

              {/* Bloque 2: Identidad & Firma */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Identidad & Firma</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  KYC biométrico, validaciones de identidad y preparación de firma digital con validez jurídica.
                </p>
              </div>

              {/* Bloque 3: Garantía & Valuación */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Garantía & Valuación</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Propiedad, fotografías, documentación, valuación preliminar por padrón y cálculo dinámico de LTV.
                </p>
              </div>

              {/* Bloque 4: Backoffice & AI */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Backoffice & AI</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Operación multi-rol, tareas, consistencia documental, extracción asistida y trazabilidad completa.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. FLUJO OPERATIVO (DARK NAVY)                                */}
        {/* ============================================================== */}
        <section className="py-16 md:py-24 bg-navy text-white text-left">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
                CICLO OPERATIVO INTEGRAL
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Una operación continua, sin saltos entre herramientas.
              </h2>
            </div>

            {/* 5 Pasos Horizontal en Desktop / Vertical en Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6">
              
              <div className="p-5 rounded-xl bg-navy-surface border border-navy-border space-y-2">
                <div className="text-xs font-mono font-bold text-brand-green">01</div>
                <h3 className="text-sm font-bold text-white">Simulación</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cálculo de cuotas, LTV y plazos según las políticas del originador.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-surface border border-navy-border space-y-2">
                <div className="text-xs font-mono font-bold text-brand-green">02</div>
                <h3 className="text-sm font-bold text-white">Solicitud</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Carga estructurada de datos del solicitante y antecedentes del inmueble.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-surface border border-navy-border space-y-2">
                <div className="text-xs font-mono font-bold text-brand-green">03</div>
                <h3 className="text-sm font-bold text-white">Expediente</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Legajo digital 360°, OCR documental y control de versiones.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-surface border border-navy-border space-y-2">
                <div className="text-xs font-mono font-bold text-brand-green">04</div>
                <h3 className="text-sm font-bold text-white">Validación</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  KYC biométrico, tasación y análisis de riesgo en backoffice.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-navy-surface border border-navy-border space-y-2">
                <div className="text-xs font-mono font-bold text-brand-green">05</div>
                <h3 className="text-sm font-bold text-white">Formalización</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DocFlow autollenado de minutas, pagarés y firma electrónica.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. SOLUCIONES / INDUSTRIAS                                    */}
        {/* ============================================================== */}
        <section id="soluciones" className="py-16 md:py-24 bg-white text-left scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                SECTORES & ADOPCIÓN
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight">
                Infraestructura diseñada para tu modelo de negocio
              </h2>
            </div>

            {/* 3 Grupos Discretos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Financieras y prestamistas</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Digitalización de solicitudes, expedientes, documentación y operación crediticia con garantía inmobiliaria.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Estudios y profesionales</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Gestión de documentos notariales, tareas operativas, validaciones de títulos y formalización ágil de minutas.
                </p>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">Bancos y plataformas</h3>
                <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
                  Integración modular sin necesidad de reemplazar completamente la experiencia digital o infraestructura existente.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 7. SEGURIDAD ENTERPRISE (NAVY)                                */}
        {/* ============================================================== */}
        <section id="seguridad" className="py-16 md:py-24 bg-navy text-white text-left scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/20 text-brand-green">
                <ShieldCheck className="w-4 h-4" />
                <span>SEGURIDAD DE INFORMACIÓN</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Diseñado para operar información sensible.
              </h2>
            </div>

            {/* 4 Pilares de Seguridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl bg-navy-surface border border-navy-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">RLS Multi-Tenant</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Políticas Row Level Security estrictas en PostgreSQL para aislamiento total de expedientes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-navy-surface border border-navy-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center font-bold">
                  <FileSearch className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Auditoría inmutable</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Registro cronológico y trazabilidad forense de cada evento, cambio de estado y descarga.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-navy-surface border border-navy-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Storage privado</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Títulos y comprobantes protegidos con URLs firmadas temporales y cifrado en reposo.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-navy-surface border border-navy-border space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Roles y permisos</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Control granular de accesos para analistas de riesgo, escribanos, oficiales y directivos.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 8. ESTUDIO NOVA                                               */}
        {/* ============================================================== */}
        <section className="py-16 md:py-24 bg-[#EEF3F8] border-b border-slate-200/80 text-left">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green-dark">
                  <Sparkles className="w-3.5 h-3.5 text-brand-green" />
                  <span>TENANT DEMO EN VIVO</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
                  Estudio Nova muestra HIPOTECALY funcionando como cliente real.
                </h2>

                <p className="text-sm sm:text-base text-slate-muted leading-relaxed">
                  No es un showroom técnico. Es un tenant demostrativo con identidad propia, pensado para probar y mostrar la experiencia de simulación, solicitud, portal y White Label sobre el mismo core.
                </p>

                <div className="pt-2">
                  <Link to="/demo/estudio-nova">
                    <Button variant="primary" size="lg" className="font-bold shadow-md px-7">
                      Abrir Estudio Nova <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-navy flex items-center justify-between">
                  <span>Estudio Nova Tenant</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">DEMO</span>
                </div>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Branding notarial independiente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Simulador customizado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span>Portal de expedientes activo</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 9. FAQ CORPORATIVA                                            */}
        {/* ============================================================== */}
        <section id="faq" className="py-16 md:py-24 bg-white text-left scroll-mt-20">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                PREGUNTAS FRECUENTES
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight">
                Respuestas directas sobre la plataforma
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-bold text-navy text-sm sm:text-base">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-brand-green' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-5 sm:p-6 pt-0 text-xs sm:text-sm text-slate-muted leading-relaxed bg-white border-t border-slate-100">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 10. CTA FINAL                                                 */}
        {/* ============================================================== */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[#F7F9FC] to-white border-t border-slate-200/80 text-center">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy tracking-tight">
              Elegí el nivel de integración. El core ya está resuelto.
            </h2>
            <p className="text-base sm:text-lg text-slate-muted font-normal max-w-2xl mx-auto">
              Botón, Simulador + Botón o White Label completo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link to="/contacto?demo=true" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-bold shadow-md">
                  Solicitar demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/demo/estudio-nova" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold border-slate-300 text-navy hover:bg-slate-50">
                  <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Estudio Nova
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

