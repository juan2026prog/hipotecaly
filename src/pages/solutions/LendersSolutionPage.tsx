import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Scale,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';

export const LendersSolutionPage: React.FC = () => {
  useEffect(() => {
    document.title = 'HIPOTECALY para Prestamistas e Inversores | Oportunidades Anonimizadas & Anti-Bypass';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION PARA PRESTAMISTAS                               */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-navy text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/20 text-brand-green border border-brand-green/30">
                <DollarSign className="w-3.5 h-3.5" />
                <span>SOLUCIÓN PARA INVERSORES & PRESTAMISTAS PRIVADOS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Originá créditos hipotecarios con{' '}
                <span className="text-brand-green">garantía real</span> y blindaje Anti-Bypass.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Accedé a un flujo constante de solicitudes pre-calificadas en Uruguay. Evaluá inmuebles tasados, simulá tus condiciones de amortización y emití ofertas sin riesgo de desintermediación ni exposición de datos privados.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link to="/contacto?demo=true&rol=prestamista">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                    Solicitar Acceso como Prestamista <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/nova/full">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                    <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Demo en Vivo
                  </Button>
                </Link>
              </div>

              {/* Badges de Confianza */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>LTV Máx. 40% - 50%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Blindaje Anti-Bypass</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Escritura Notarial</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Mockup Real de Oportunidad Anonimizada */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-xs font-mono text-brand-green font-bold uppercase">Oportunidad Activa</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    HIP-2026-00124
                  </span>
                </div>

                {/* Anti-Bypass Banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-xs text-amber-200">
                  <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-300">Protocolo Anti-Bypass Activo</strong>
                    Dirección exacta, padrón catastral y datos del prestatario protegidos por RLS.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Garantía Inmueble:</span>
                    <span className="font-bold text-white">Carrasco · Montevideo</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Tasación Preliminar:</span>
                    <span className="font-bold text-white">USD 240.000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Capital Solicitado:</span>
                    <span className="font-extrabold text-brand-green text-base">USD 80.000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">LTV de la Operación:</span>
                    <span className="font-bold text-white">33.3% (Riesgo Bajo)</span>
                  </div>
                </div>

                {/* Simulador de Oferta */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cotización Rápida
                  </span>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Modalidad:</span>
                    <span className="font-semibold text-white">Solo Intereses (Bullet)</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Cuota Mensual Estimada:</span>
                    <span className="font-bold text-brand-green">USD 633 / mes</span>
                  </div>
                </div>

                <Link to="/contacto?demo=true&rol=prestamista" className="block">
                  <Button variant="primary" size="md" fullWidth className="text-xs font-bold">
                    Ver Oportunidades Disponibles <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. PILARES DE SEGURIDAD PARA EL PRESTAMISTA                     */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full">
              PROTECCIÓN DE CAPITAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
              Diseñado para prestamistas que buscan liquidez, respaldo y cero fricción.
            </h2>
            <p className="text-slate-muted text-base">
              HIPOTECALY estandariza el proceso de colocación de capital con reglas claras, mitigando riesgos operativos y legales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pilar 1 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-border space-y-4 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-green text-white flex items-center justify-center font-bold shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy">Garantía Inmobiliaria Real</h3>
              <p className="text-sm text-slate-muted leading-relaxed">
                Todas las operaciones se garantizan con hipoteca en primer grado sobre bienes inmuebles residenciales y comerciales en Uruguay, tasados bajo criterios profesionales.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>LTV acotado (máximo 40% - 50%)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Zonas de alta liquidez y demanda</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-border space-y-4 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-navy text-brand-green flex items-center justify-center font-bold shadow-sm">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy">Cero Desintermediación (Anti-Bypass)</h3>
              <p className="text-sm text-slate-muted leading-relaxed">
                Nuestra arquitectura garantiza que ninguna parte pueda eludir el marco formal. El prestamista evalúa los números con total certeza antes de solicitar la apertura de datos para la firma notarial.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Enmascaramiento de datos personales</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Padrón catastral y calle protegidos</span>
                </li>
              </ul>
            </div>

            {/* Pilar 3 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-border space-y-4 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-green text-white flex items-center justify-center font-bold shadow-sm">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy">Formalización Notarial Completa</h3>
              <p className="text-sm text-slate-muted leading-relaxed">
                La formalización definitiva se realiza con escribano público interviniente, certificados registrales de inhibiciones y gravámenes al día e inscripción en el Registro de la Propiedad Sección Inmobiliaria.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Estudio de títulos de 30 años</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Documentación validada en backoffice</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. WORKFLOW DEL PRESTAMISTA                                     */}
      {/* ============================================================== */}
      <section className="py-16 md:py-20 bg-slate-bg border-y border-slate-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
              OPERATORIA DIGITAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
              Cómo opera un prestamista en HIPOTECALY
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-border shadow-sm space-y-3">
              <span className="text-2xl font-black text-brand-green">01</span>
              <h4 className="text-base font-bold text-navy">Acceso a Oportunidades</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Revisá el feed de solicitudes activas con tasaciones preliminares, LTV y tipo de inmueble.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-border shadow-sm space-y-3">
              <span className="text-2xl font-black text-brand-green">02</span>
              <h4 className="text-base font-bold text-navy">Simulá y Emití Oferta</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Fijá tasa anual, plazo de 12 a 60 meses y amortización francesa o solo interés. La oferta queda registrada.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-border shadow-sm space-y-3">
              <span className="text-2xl font-black text-brand-green">03</span>
              <h4 className="text-base font-bold text-navy">Aceptación del Prestatario</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                El analista valida los términos y presenta la propuesta al solicitante para su aceptación formal.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-border shadow-sm space-y-3">
              <span className="text-2xl font-black text-brand-green">04</span>
              <h4 className="text-base font-bold text-navy">Firma y Desembolso</h4>
              <p className="text-xs text-slate-muted leading-relaxed">
                Se coordinan los títulos con la escribanía, se firma la escritura pública y se desembolsa el capital.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/contacto?demo=true&rol=prestamista">
              <Button variant="primary" size="lg" className="px-8 shadow-md">
                Solicitar Acceso al Portal del Prestamista <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CTA FINAL                                                    */}
      {/* ============================================================== */}
      <section className="py-16 bg-navy text-white text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ¿Tenés capital para colocar en préstamos hipotecarios?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Coordiná una reunión confidencial con nuestro equipo para conocer las oportunidades disponibles y el funcionamiento del portal de inversores.
          </p>
          <div className="pt-2">
            <Link to="/contacto?demo=true&rol=prestamista">
              <Button variant="primary" size="lg" className="px-8 font-bold shadow-lg">
                Agendar Reunión Confidencial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
