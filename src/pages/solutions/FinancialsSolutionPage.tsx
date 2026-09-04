import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  PieChart,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Users,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';

export const FinancialsSolutionPage: React.FC = () => {
  useEffect(() => {
    document.title = 'HIPOTECALY para Financieras y Originadores | Core Hipotecario White-Label & Sindicación';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION PARA FINANCIERAS                                */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-navy text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Building2 className="w-3.5 h-3.5" />
                <span>SOLUCIÓN PARA FINANCIERAS, FONDOS & ORIGINADORES</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                El core operativo para escalar tu cartera de{' '}
                <span className="text-brand-green">crédito hipotecario</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Transformá tu entidad financiera con infraestructura cloud llave en mano: captación digital con tu propia marca, underwriting paramétrico con límites LTV, sindicación de inversores privados y servicing automatizado de cuotas.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link to="/contacto?demo=true&rol=financiera">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                    Solicitar Propuesta Institucional <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/nova">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                    <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Showroom NOVA
                  </Button>
                </Link>
              </div>

              {/* Badges de Confianza */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>White-Label Completo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Sindicación Multi-Inversor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Servicing & Cuotas</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Mockup Institucional de Cartera & Sindicación */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-xs font-mono text-blue-400 font-bold uppercase">Consola de Operaciones</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    TENANT: FIN-CRED-01
                  </span>
                </div>

                {/* KPIs de Cartera */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block font-medium">Volumen Colocado</span>
                    <span className="text-xl font-mono font-bold text-white">USD 8.450.000</span>
                    <span className="text-[10px] text-brand-green block mt-1">+18.4% vs q anterior</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block font-medium">LTV Promedio</span>
                    <span className="text-xl font-mono font-bold text-brand-green">38.2%</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Garantía Hipotecaria 1er Grado</span>
                  </div>
                </div>

                {/* Módulo Sindicación de Fondos */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" /> Sindicación Tranche B
                    </span>
                    <span className="text-blue-400 font-mono font-bold">100% Financiado</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-brand-green h-full w-[45%]" title="Inversor Alpha (45%)" />
                    <div className="bg-blue-500 h-full w-[35%]" title="Inversor Beta (35%)" />
                    <div className="bg-amber-500 h-full w-[20%]" title="Fondo Propio (20%)" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>3 Inversores Sindicados</span>
                    <span>USD 350.000 / Tasa 11.5%</span>
                  </div>
                </div>

                {/* Subdominio y Marca Propia */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-blue-300 font-bold">
                    <Globe className="w-3.5 h-3.5 mr-1.5" /> Portal White-Label Desplegado
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Operando en <span className="font-mono text-white">creditos.tumarca.com.uy</span> con branding y contratos propios.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. LOS 4 PILARES PARA FINANCIERAS Y FONDOS                     */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              INFRAESTRUCTURA DE ORIGINACIÓN INSTITUCIONAL
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
              Diseñado para originar, administrar y sindicar créditos a escala
            </p>
            <p className="text-base text-slate-600">
              HIPOTECALY Platform resuelve la brecha tecnológica de entidades financieras que buscan modernizar su proceso de crédito con garantía real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Pilar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">White-Label Integral</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Desplegá tu propio portal de captación y onboarding en tu dominio corporativo, con tu logo, paleta de colores y documentación legal propia.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Dominio personalizado</li>
                <li className="flex items-center">✓ Identidad corporativa 100%</li>
                <li className="flex items-center">✓ Simulador embebible</li>
              </ul>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Políticas de Underwriting</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Configurá reglas paramétricas automáticas: LTV máximo, scoring mínimo del solicitante, zonas geográficas aceptadas y tipos de inmueble admitidos.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Filtros de pre-aprobación</li>
                <li className="flex items-center">✓ Matriz de riesgo paramétrica</li>
                <li className="flex items-center">✓ Auditoría de comités</li>
              </ul>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Sindicación de Inversores</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Permití que inversores privados o fondos institucionales participen en tramos de un mismo crédito hipotecario, repartiendo capital y rendimiento.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Distribución pro-rata</li>
                <li className="flex items-center">✓ Control de participaciones</li>
                <li className="flex items-center">✓ Extractos para inversores</li>
              </ul>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Loan Servicing & Cobranzas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calendarios de pago automáticos (Francés / Alemán / Americano), cálculo de intereses compensatorios y punitorios, conciliación y reportes de mora.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Amortizaciones automatizadas</li>
                <li className="flex items-center">✓ Trazabilidad de cobros</li>
                <li className="flex items-center">✓ Alertas de vencimientos</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FLUJO OPERATIVO INSTITUCIONAL                                */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              FLUJO DE PUNTA A PUNTA
            </h2>
            <p className="text-3xl font-black text-navy tracking-tight">
              Desde la solicitud digital hasta la liquidación de cuotas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                01
              </div>
              <h4 className="text-base font-bold text-navy">Captación Digital</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                El solicitante simula y carga su carpeta completa en tu portal corporativo con validación de identidad y documentación.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                02
              </div>
              <h4 className="text-base font-bold text-navy">Scoring & Tasación</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                El motor evalúa ratios LTV, antecedentes registrales y valor del inmueble, emitiendo un score objetivo para tu comité.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                03
              </div>
              <h4 className="text-base font-bold text-navy">Asignación & Firma</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se fondea el crédito (capital propio o sindicado) y se coordina la escritura pública con el escribano en el portal notarial.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                04
              </div>
              <h4 className="text-base font-bold text-navy">Servicing de Cartera</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Administración integral de cuotas, cobranzas, liquidaciones a inversores y métricas contables consolidadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CTA BANNER INSTITUCIONAL                                     */}
      {/* ============================================================== */}
      <section className="py-16 bg-navy text-white text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Modernizá la operatoria hipotecaria de tu organización
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Agendá una sesión técnica con nuestros arquitectos para evaluar el despliegue White-Label o la integración vía API con tus sistemas existentes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link to="/contacto?demo=true&rol=financiera">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-bold shadow-floating">
                Solicitar Propuesta para Financieras <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/saas">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                Explorar Todos los Módulos SaaS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
