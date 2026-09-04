import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  Sliders,
  ShieldCheck,
  FileCheck2,
  Lock,
  Layers,
  Settings,
  CheckSquare,
  Shield,
  Smartphone,
  BarChart3,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { DashboardMockup } from '../../components/mockups/DashboardMockup';
import { MobileTrackerMockup } from '../../components/mockups/MobileTrackerMockup';
import { ClientPortalMockup } from '../../components/saas/ClientPortalMockup';
import { AiAnalysisScorecard } from '../../components/saas/AiAnalysisScorecard';
import { BrandComparisonMockup } from '../../components/saas/BrandComparisonMockup';
import { CostBreakdownSimulator } from '../../components/saas/CostBreakdownSimulator';

export const SaaSFullPlatformPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION ASPIRACIONAL: MODALIDAD B (DESDE CERO)         */}
      {/* ============================================================== */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green-light text-brand-green">
              <Layers className="w-3.5 h-3.5" />
              <span>MODALIDAD B · WHITE-LABEL COMPLETO DESDE CERO</span>
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.12]">
              Tu propia plataforma hipotecaria,{' '}
              <span className="text-brand-green">lista para operar.</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-muted font-normal leading-relaxed max-w-2xl mx-auto">
              Creamos desde cero tu negocio hipotecario digital: sitio web institucional, simulador, solicitudes, portal cliente, panel de gestión y seguimiento bajo tu propia marca.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <Link to="/contacto?plan=whitelabel">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                  Quiero mi plataforma <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/contacto?demo=true">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                  Ver demo en vivo
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-400 pt-2 font-medium">
              “Tu marca. Tu dominio. Tus clientes. Nuestra tecnología.”
            </p>
          </div>

          {/* Visual Hero Combinado: Laptop Landing + Desktop Backoffice + Smartphone Portal */}
          <div className="relative mx-auto max-w-5xl mt-8">
            <div className="relative z-10">
              <DashboardMockup compact={false} />
            </div>

            {/* Smartphone superpuesto a la derecha en pantallas medianas/grandes */}
            <div className="hidden sm:block absolute -bottom-10 -right-4 md:-right-8 z-20 shadow-floating rounded-[36px]">
              <MobileTrackerMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. SECCIÓN "MUCHO MÁS QUE UNA PÁGINA WEB" (6 MÓDULOS)          */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              ECOSISTEMA INTEGRAL LLAVE EN MANO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Mucho más que una página web.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              No es una simple plantilla estética: es una infraestructura de operaciones hipotecarias completa lista para producir desde el primer día.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Módulo 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 01</span>
              <h3 className="font-bold text-navy text-lg">Sitio Institucional</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Landing page corporativa moderna, presentación de servicios, quiénes somos, preguntas frecuentes, formularios de contacto y captación optimizada para conversión.
              </p>
            </div>

            {/* Módulo 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <Sliders className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 02</span>
              <h3 className="font-bold text-navy text-lg">Simulador Parametrizable</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Herramienta interactiva para que el cliente calcule cuotas y montos con tus propias tasas de interés, plazos de gracia y porcentajes de financiación permitidos.
              </p>
            </div>

            {/* Módulo 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 03</span>
              <h3 className="font-bold text-navy text-lg">Solicitud Digital</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Asistente paso a paso para carga de datos de titulares, garantías inmobiliarias, padrones catastrales, situación jurídica y subida de archivos adjuntos.
              </p>
            </div>

            {/* Módulo 4 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 04</span>
              <h3 className="font-bold text-navy text-lg">Portal Cliente</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Área de autogestión para los prestatarios: seguimiento en vivo del expediente, carga de subsanaciones, calendario de cuotas, comprobantes y recordatorios.
              </p>
            </div>

            {/* Módulo 5 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 05</span>
              <h3 className="font-bold text-navy text-lg">Panel del Estudio (Backoffice)</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Gestión integral de expedientes, asignación de escribanos y analistas, evaluación asistida por IA, coordinación de firmas y control de cartera de créditos activos.
              </p>
            </div>

            {/* Módulo 6 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-green hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-bold">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Módulo 06</span>
              <h3 className="font-bold text-navy text-lg">Administración y Seguridad</h3>
              <p className="text-xs text-slate-muted leading-relaxed">
                Configuración de marca (logo, colores, dominio CNAME), gestión de usuarios y roles, matriz de costos arancelarios, notificaciones y logs de auditoría inmutables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. "LA PLATAFORMA SE ADAPTA A CÓMO VOS PRESTÁS"                */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              PARAMETRIZACIÓN TOTAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              La plataforma se adapta a cómo vos prestás.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Cada prestamista, fondo o estudio tiene sus propias políticas de riesgo y condiciones. En HIPOTECALY vos definís las reglas:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Límites de Capital',
                desc: 'Definí monto mínimo y monto máximo a financiar (ej. desde USD 15.000 hasta USD 300.000).',
              },
              {
                title: 'Porcentaje Financiado Máximo',
                desc: 'Establecé el tope máximo sobre el valor del inmueble (por ejemplo, hasta el 40% o 50% de la tasación).',
              },
              {
                title: 'Tasa de Interés y Moneda',
                desc: 'Tasas fijas o variables en Dólares (USD) o Unidades Indexadas (UI) según tus líneas comerciales.',
              },
              {
                title: 'Modalidad de Amortización',
                desc: 'Elegí si ofrecés esquema de Solo Intereses con amortización al vencimiento o cuotas con amortización periódica.',
              },
              {
                title: 'Plazos Flexibles',
                desc: 'Configurá los plazos admitidos (12, 24, 36, 48 o 60 meses) con o sin períodos de gracia de capital.',
              },
              {
                title: 'Tipos de Inmueble Aceptados',
                desc: 'Seleccioná garantías elegibles: casas residenciales, apartamentos en propiedad horizontal, oficinas o terrenos.',
              },
              {
                title: 'Zonas Geográficas',
                desc: 'Habilitá departamentos y barrios específicos donde tu equipo o tasadores de confianza tengan cobertura.',
              },
              {
                title: 'Checklist Documental a Medida',
                desc: 'Definí qué títulos, certificados y constancias impositivas son obligatorias antes del análisis.',
              },
              {
                title: 'Aranceles y Gastos Notariales',
                desc: 'Configurá honorarios de escribanía, costo de tasación, timbres de registro y gastos de formalización.',
              },
              {
                title: 'Cancelación Anticipada',
                desc: 'Establecé si la amortización extraordinaria tiene período mínimo o penalidad, con total transparencia.',
              },
              {
                title: 'Políticas de Clearing / Antecedentes',
                desc: 'Configurá si admitís solicitantes con registros previos priorizando el respaldo de la garantía inmobiliaria.',
              },
              {
                title: 'Asignación de Escribanos',
                desc: 'Derivá expedientes automáticamente a los profesionales o notarías vinculadas a tu red de confianza.',
              },
            ].map((param, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center space-x-2 text-navy font-bold text-sm">
                  <CheckSquare className="w-4 h-4 text-brand-green shrink-0" />
                  <span>{param.title}</span>
                </div>
                <p className="text-xs text-slate-muted leading-relaxed pl-6">{param.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. ASÍ FUNCIONA UNA OPERACIÓN (TIMELINE DE 13 PASOS)          */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              TRAZABILIDAD DE CICLO COMPLETO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Así funciona una operación.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Desde la simulación inicial hasta la cancelación formal del crédito, cada hito queda registrado en un expediente digital unificado:
            </p>
          </div>

          <div className="relative border-l-2 border-brand-green/30 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8">
            {[
              { n: '01', title: 'El cliente simula', detail: 'Ingresa a tu sitio web y calcula cuota estimada según el valor de su inmueble.' },
              { n: '02', title: 'Inicia solicitud', detail: 'Hace click en continuar y completa sus datos básicos en un asistente intuitivo.' },
              { n: '03', title: 'Carga información patrimonial', detail: 'Declara ingresos, estado civil, copropietarios e información del padrón.' },
              { n: '04', title: 'Presenta documentación', detail: 'Adjunta fotos del inmueble, cédulas y testimonios de propiedad en el visor.' },
              { n: '05', title: 'Se genera expediente digital', detail: 'El sistema asigna un ID único de operación y activa las pistas de auditoría.' },
              { n: '06', title: 'IA realiza análisis preliminar', detail: 'El copiloto verifica consistencia documental, tasación estimada y semáforo.' },
              { n: '07', title: 'El estudio revisa', detail: 'Tus analistas y escribanos examinan los títulos y observaciones técnicas.' },
              { n: '08', title: 'Se aprueba, observa o rechaza', detail: 'Comité emite resolución fundada con comunicación automática al cliente.' },
              { n: '09', title: 'Se coordinan condiciones', detail: 'Se fija la tasa definitiva, aranceles notariales y liquidación de gastos.' },
              { n: '10', title: 'Se agenda firma notarial', detail: 'Se coordina fecha y hora con el escribano para la firma de la escritura de hipoteca.' },
              { n: '11', title: 'Crédito activo y desembolso', detail: 'La operación pasa a estado activa y se habilita el plan de pagos en el portal.' },
              { n: '12', title: 'Seguimiento y cobranza', detail: 'Registro de comprobantes, calendario de vencimientos y avisos automáticos.' },
              { n: '13', title: 'Cancelación e hipoteca liberada', detail: 'Al finalizar los pagos, se emite carta notarial de pago y liberación registral.' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[35px] md:-left-[43px] top-0 w-6 h-6 rounded-full bg-navy text-brand-green flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-sm">
                  {idx + 1}
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-navy text-sm">{step.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Paso {step.n}</span>
                  </div>
                  <p className="text-xs text-slate-muted mt-1 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECCIÓN PORTAL CLIENTE                                      */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              EXPERIENCIA DEL PRESTATARIO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Tus clientes también tienen su propia plataforma.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Dales acceso a un portal transparente con su estado en tiempo real, próxima acción requerida, comprobantes y calendario de pagos.
            </p>
            <p className="text-sm font-bold text-brand-green mt-2">
              “Menos WhatsApp. Menos llamadas. Más claridad.”
            </p>
          </div>

          <ClientPortalMockup />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SECCIÓN PANEL PROFESIONAL (BACKOFFICE DEL ESTUDIO)          */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              CONTROL CENTRALIZADO PARA TU EQUIPO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Todo tu negocio en un solo panel.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Supervisá la cartera completa: solicitudes entrantes, expedientes en evaluación, observaciones notariales, operaciones aprobadas, agenda de firmas y créditos en cobro.
            </p>
          </div>

          <div className="space-y-6">
            {/* Quick status bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
              {[
                { label: 'Nuevas Solicitudes', val: '8', color: 'text-navy' },
                { label: 'En Evaluación', val: '14', color: 'text-amber-600' },
                { label: 'Observadas', val: '3', color: 'text-rose-600' },
                { label: 'Aprobadas', val: '6', color: 'text-brand-green' },
                { label: 'Firmas Notariales', val: '4', color: 'text-indigo-600' },
                { label: 'Créditos Activos', val: '38', color: 'text-navy' },
                { label: 'Pagos Pendientes', val: '2', color: 'text-amber-600' },
                { label: 'Cancelaciones', val: '1', color: 'text-emerald-600' },
              ].map((st, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 block font-medium leading-tight">{st.label}</span>
                  <span className={`text-xl font-extrabold block mt-1 ${st.color}`}>{st.val}</span>
                </div>
              ))}
            </div>

            <DashboardMockup compact={false} />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. SECCIÓN IA (ASISTENTE PRELIMINAR, NUNCA DECISOR FINAL)     */}
      {/* ============================================================== */}
      <section id="ia" className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              INTELIGENCIA ARTIFICIAL APLICADA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              La IA hace el trabajo preliminar. Tu equipo decide.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Automatizá la lectura documental, cotejo de datos registrales y estimación de tasaciones preliminares. La decisión de crédito, la tasación presencial y el estudio notarial de títulos siempre quedan bajo el control de tus profesionales.
            </p>
          </div>

          <AiAnalysisScorecard />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. SECCIÓN COSTOS Y TRANSPARENCIA                              */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              REGLAS FINANCIERAS CLARAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Mostrá el costo completo de la operación.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              Evitá malentendidos o sorpresas de último momento. Configurá y mostrá el desglose integral con intereses, honorarios de escribano, tasación y gastos registrales.
            </p>
          </div>

          <CostBreakdownSimulator />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. SECCIÓN WHITE-LABEL (COMPARATIVA DE 2 MARCAS)               */}
      {/* ============================================================== */}
      <section id="white-label" className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              PERSONALIZACIÓN INSTITUCIONAL INTEGRAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Tu marca. Tu dominio. Tu experiencia.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              El frontend de cara a tus clientes es 100% tuyo: logotipo, paleta cromática, dominio propio, favicon, textos, imágenes y remitente de correos sin menciones a terceros.
            </p>
          </div>

          <BrandComparisonMockup />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. SECCIÓN SEGURIDAD Y AUDITORÍA                              */}
      {/* ============================================================== */}
      <section id="seguridad" className="py-16 md:py-24 bg-navy text-white text-left border-y border-navy-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              SEGURIDAD Y COMPLIANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Aislamiento estricto y trazabilidad inmutable.
            </h2>
            <p className="text-slate-300 text-base mt-3">
              Construido sobre infraestructura de nivel financiero con políticas RLS (Row Level Security) que garantizan que tu base de datos esté blindada y aislada de cualquier otra organización.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Shield className="w-6 h-6 text-brand-green" />
              <h4 className="font-bold text-white text-base">Roles y Permisos Granulares</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asigná perfiles diferenciados para Administradores, Analistas de Crédito, Escribanos y Observadores con accesos restringidos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Lock className="w-6 h-6 text-brand-green" />
              <h4 className="font-bold text-white text-base">Almacenamiento Privado Seguro</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Los títulos de propiedad y documentos confidenciales residen en buckets encriptados con tokens de lectura temporales.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <FileCheck2 className="w-6 h-6 text-brand-green" />
              <h4 className="font-bold text-white text-base">Auditoría Inmutable</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada cambio de estado, nota interna, consulta o aprobación queda registrado en una tabla de auditoría protegida contra manipulación.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <ShieldCheck className="w-6 h-6 text-brand-green" />
              <h4 className="font-bold text-white text-base">Control de Descargas y Visor</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evitá fugas de información habilitando lectura protegida sin descarga directa para usuarios con permisos limitados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 11. SECCIÓN IMPLEMENTACIÓN ACOMPAÑADA                          */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block mb-2">
              PUESTA EN MARCHA GUIADA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Nosotros configuramos todo.
            </h2>
            <p className="text-base text-slate-muted mt-3">
              No necesitás conocimientos técnicos ni lidiar con servidores. Nuestro equipo de ingenieros y especialistas hipotecarios te acompaña en cada fase:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {[
              { step: '1', title: 'Definimos tu marca', desc: 'Colores, logos y tipografías' },
              { step: '2', title: 'Configuramos reglas', desc: 'Tasas, montos y porcentajes' },
              { step: '3', title: 'Personalizamos formularios', desc: 'Campos y preguntas clave' },
              { step: '4', title: 'Configuramos documentos', desc: 'Checklists y requisitos' },
              { step: '5', title: 'Configuramos usuarios', desc: 'Escribanos y analistas' },
              { step: '6', title: 'Realizamos pruebas', desc: 'Simulaciones de punta a punta' },
              { step: '7', title: 'Publicamos', desc: 'Conexión DNS y dominio activo' },
            ].map((p) => (
              <div key={p.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="w-7 h-7 rounded-lg bg-navy text-brand-green flex items-center justify-center font-bold text-xs mb-2">
                    {p.step}
                  </span>
                  <h4 className="font-bold text-navy text-xs leading-snug">{p.title}</h4>
                  <p className="text-[11px] text-slate-muted mt-1 leading-tight">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 12. CTA FINAL NAVY                                             */}
      {/* ============================================================== */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
            CONCENTRÁ TODA TU OPERACIÓN
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            No necesitás contratar una web, un CRM y varios sistemas separados.
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            Tu operación hipotecaria completa puede funcionar desde una sola plataforma profesional, bajo tu propia marca y con el respaldo de nuestra infraestructura.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contacto?plan=whitelabel">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                Agendar una demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/saas/integracion" className="text-sm font-semibold text-slate-300 hover:text-white underline decoration-slate-500 underline-offset-4">
              ¿Ya tenés sitio web? Mirá la modalidad de integración →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
