import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sliders,
  ExternalLink,
  Laptop,
  Code2,
  Building2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { SaaSNavbar } from '../../../components/layout/SaaSNavbar';
import { Footer } from '../../../components/layout/Footer';
import { Button } from '../../../components/ui/Button';

export const NovaShowroomPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Showroom NOVA | Demostración Interactiva White-Label HIPOTECALY';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION SHOWROOM NOVA                                  */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-navy text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/20 text-brand-green border border-brand-green/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SHOWROOM INTERACTIVO WHITE-LABEL</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Así se vería una financiera operando con <span className="text-brand-green">HIPOTECALY</span> bajo su propia marca.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                NOVA Créditos Hipotecarios es una entidad financiera ficticia desplegada sobre el motor White-Label de HIPOTECALY para demostrar cómo una organización opera con su propia marca, políticas crediticias y flujo de originación.
              </p>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-start space-x-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <p>
                  <strong>Entorno interactivo activo:</strong> Podés probar la simulación en vivo, inspeccionar el portal del solicitante y verificar la personalización completa de marca y reglas.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link to="/demo/nova/full">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                    Lanzar portal NOVA White-Label <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contacto?demo=true">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                    Solicitar demo guiada
                  </Button>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Tenant NOVA */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-lg">
                      N
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">NOVA Créditos</h3>
                      <p className="text-[11px] text-slate-400">Entidad de demostración</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-brand-green/20 text-brand-green border border-brand-green/30 px-2 py-0.5 rounded font-mono font-bold">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-slate-400">Modalidad:</span>
                    <span className="text-white font-medium">Standalone White-Label</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-slate-400">LTV Máximo Configurado:</span>
                    <span className="text-brand-green font-mono font-bold">50%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-slate-400">Monto Máximo Crédito:</span>
                    <span className="text-white font-mono font-bold">USD 300.000</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-slate-400">Moneda Operativa:</span>
                    <span className="text-white font-mono font-bold">USD</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-slate-400">Amortización:</span>
                    <span className="text-white">Solo intereses / Francés</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/demo/nova/full" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full text-brand-green border-brand-green/40 hover:bg-brand-green/10 justify-center">
                      Abrir experiencia del solicitante NOVA <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. LOS 3 NIVELES DE INTEGRACIÓN DISPONIBLES                     */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              FLEXIBILIDAD DE ADOPCIÓN
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
              3 formas de desplegar HIPOTECALY en tu empresa
            </p>
            <p className="text-base text-slate-600">
              Podés comparar cómo luce y funciona NOVA en cada uno de los 3 esquemas de integración tecnológica disponibles:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Modo 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODO 1</span>
                  <h3 className="text-xl font-bold text-navy">Marketplace Participant</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Operá como inversor o prestamista dentro del marketplace general de HIPOTECALY. Recibí carpetas pre-aprobadas bajo anonimato con blindaje Anti-Bypass.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center">✓ Sin costo de infraestructura propio</li>
                  <li className="flex items-center">✓ Panel de prestamista dedicado</li>
                  <li className="flex items-center">✓ Operación 100% asistida</li>
                </ul>
              </div>

              <Link to="/demo/nova/legacy">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Ver Vista Marketplace <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Modo 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <Code2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">MODO 2</span>
                  <h3 className="text-xl font-bold text-navy">Widget Embebido</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Incrustá el simulador y formulario de pre-calificación dentro del sitio web existente de tu empresa manteniendo tu diseño y cabezal institucional.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center">✓ Integración mediante script o iframe</li>
                  <li className="flex items-center">✓ Captación directa de leads</li>
                  <li className="flex items-center">✓ Envío automático a tu pipeline</li>
                </ul>
              </div>

              <Link to="/demo/nova/integrado">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Ver Sitio con Widget Embebido <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Modo 3 */}
            <div className="bg-gradient-to-b from-white to-emerald-50/40 p-8 rounded-2xl border-2 border-brand-green shadow-md flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-6 bg-brand-green text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                RECOMENDADO
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-brand-green flex items-center justify-center font-black">
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">MODO 3</span>
                  <h3 className="text-xl font-bold text-navy">Full White-Label Standalone</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Portal independiente llave en mano bajo tu dominio personalizado (<span className="font-mono text-xs">creditos.tuempresa.com</span>). Branding total, políticas de crédito reactivas y portal de solicitante propio.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-emerald-100">
                  <li className="flex items-center font-medium">✓ Dominio y certificados propios</li>
                  <li className="flex items-center font-medium">✓ Motor de políticas de crédito en caliente</li>
                  <li className="flex items-center font-medium">✓ Portal "Mi Cuenta" para tus clientes</li>
                </ul>
              </div>

              <Link to="/demo/nova/full">
                <Button variant="primary" size="sm" className="w-full justify-center shadow-floating font-bold">
                  Probar Demo Full White-Label <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CAPACIDADES INTERACTIVAS DEMOSTRADAS                         */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              TECNOLOGÍA REAL COMPLETA
            </h2>
            <p className="text-3xl font-black text-navy tracking-tight">
              Qué podés verificar en el showroom de NOVA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Sliders className="w-8 h-8 text-brand-green" />
              <h4 className="text-base font-bold text-navy">Motor de Reglas Reactivas</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                El simulador valida en tiempo real los topes de financiamiento según el inmueble (LTV 50%, máximo USD 300k). Si un solicitante intenta exceder el tope, el sistema bloquea y explica la condición.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              <h4 className="text-base font-bold text-navy">Aislamiento Criptográfico RLS</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Las solicitudes y métricas de NOVA viven en esquemas protegidos por Row-Level Security en Supabase. Ningún otro tenant ni prestamista puede acceder a su base de clientes.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Globe className="w-8 h-8 text-purple-600" />
              <h4 className="text-base font-bold text-navy">Desglose de Gastos Locales</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cálculo automatizado de honorarios notariales, timbres profesionales, certificaciones y seguro de saldo deudor según la reglamentación uruguaya vigente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CTA BANNER                                                  */}
      {/* ============================================================== */}
      <section className="py-16 bg-navy text-white text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            ¿Listo para desplegar tu propio tenant White-Label?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Configuramos la instancia de tu empresa en menos de 48 horas con tus parámetros de crédito, marca corporativa y equipo de evaluación.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link to="/contacto?demo=true">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-bold shadow-floating">
                Solicitar Demostración Guiada <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/demo/nova/full">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                Probar NOVA en Vivo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
