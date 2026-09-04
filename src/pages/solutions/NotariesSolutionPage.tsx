import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  FileCheck2,
  Calendar,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';

export const NotariesSolutionPage: React.FC = () => {
  useEffect(() => {
    document.title = 'HIPOTECALY para Estudios Notariales y Escribanías | Portal de Titulación & Escrituración';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION PARA ESTUDIOS NOTARIALES                        */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-navy text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Scale className="w-3.5 h-3.5" />
                <span>SOLUCIÓN PARA ESCRIBANÍAS & ESTUDIOS JURÍDICOS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Gestión documental y titulación hipotecaria{' '}
                <span className="text-brand-green">sin fricciones</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Centralizá el estudio de títulos, la revisión registral y la coordinación de escrituración en un entorno digital colaborativo. Olvidate de cadenas de emails, documentos perdidos y demoras operativas antes de la firma.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link to="/contacto?demo=true&rol=estudio">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-floating font-bold">
                    Sumar mi Estudio Notarial <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo/nova">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                    <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Expediente en Demo
                  </Button>
                </Link>
              </div>

              {/* Badges de Confianza */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Expediente Digital 100%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Checklist Notarial Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Coordinación de Firma</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Mockup de Expediente Notarial */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Expediente Notarial</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    PADRÓN 142.890 - MONTEVIDEO
                  </span>
                </div>

                {/* Resumen del Inmueble */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Inmueble:</span>
                    <span className="text-white font-medium">Apartamento en Pocitos</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estado de Título:</span>
                    <span className="text-brand-green font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Apto para Hipoteca
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Gravámenes Registrales:</span>
                    <span className="text-slate-300 font-mono">Sin embargos ni prendas</span>
                  </div>
                </div>

                {/* Checklist Documental */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Documentos Auditados (4/4)
                  </span>
                  
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileCheck2 className="w-4 h-4 text-brand-green" />
                      <span className="text-slate-200">Título de Propiedad Digitalizado</span>
                    </div>
                    <span className="text-[10px] text-brand-green font-mono">VERIFICADO</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileCheck2 className="w-4 h-4 text-brand-green" />
                      <span className="text-slate-200">Certificados Registrales (DGR)</span>
                    </div>
                    <span className="text-[10px] text-brand-green font-mono">VIGENTE (28d)</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileCheck2 className="w-4 h-4 text-brand-green" />
                      <span className="text-slate-200">Cédula Catastral & Contribución</span>
                    </div>
                    <span className="text-[10px] text-brand-green font-mono">AL DÍA</span>
                  </div>
                </div>

                {/* Fecha de Escritura */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-emerald-300 font-bold">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> Escrituración Coordinada
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Firma programada para el <strong className="text-white">Jueves 15:00 hs</strong> en Estudio Notarial. Minutas aprobadas por ambas partes.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. PILARES PARA ESTUDIOS Y ESCRIBANÍAS                          */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              SEGURIDAD JURÍDICA Y EFICIENCIA OPERATIVA
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
              Una plataforma creada para respaldar la labor notarial
            </p>
            <p className="text-base text-slate-600">
              HIPOTECALY no reemplaza al escribano: le brinda una herramienta especializada para ordenar recaudos, auditar antecedentes y coordinar operaciones con total respaldo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Pilar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Expediente Centralizado</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Toda la documentación antecedente, cédulas, planos y certificados en una única carpeta digital de alta resolución, accesible para los autorizantes.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Repositorio seguro en la nube</li>
                <li className="flex items-center">✓ Descargas consolidadas</li>
                <li className="flex items-center">✓ Historial de versiones</li>
              </ul>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Checklist de Requisitos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Flujo paso a paso con validación de partidas de estado civil, tributos de intendencia, BPS, DGI y certificados de la Dirección General de Registros.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Verificación paramétrica</li>
                <li className="flex items-center">✓ Alertas de caducidad</li>
                <li className="flex items-center">✓ Estado en tiempo real</li>
              </ul>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Coordinación de Firma</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Módulo interactivo para fijar fecha de otorgamiento, compartir minutas preliminares entre partes y confirmar asistencia de comparecientes.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Aprobación de minutas</li>
                <li className="flex items-center">✓ Recordatorios automatizados</li>
                <li className="flex items-center">✓ Protocolo de desembolso</li>
              </ul>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy">Trazabilidad & Respaldo</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bitácora inmutable de accesos, descargas y dictámenes. Cumplimiento de normas de debida diligencia y prevención de lavado de activos.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center">✓ Logs de auditoría criptográfica</li>
                <li className="flex items-center">✓ Cumplimiento normativo</li>
                <li className="flex items-center">✓ Respaldo a largo plazo</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FLUJO DE TRABAJO NOTARIAL                                   */}
      {/* ============================================================== */}
      <section className="py-16 md:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-green uppercase tracking-widest">
              COLABORACIÓN ÁGIL
            </h2>
            <p className="text-3xl font-black text-navy tracking-tight">
              Cómo trabaja un estudio en HIPOTECALY
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                01
              </div>
              <h4 className="text-base font-bold text-navy">Recepción de Expediente</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se te asigna la operación aceptada con la ficha del inmueble y los recaudos aportados por el solicitante.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                02
              </div>
              <h4 className="text-base font-bold text-navy">Estudio de Títulos</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Revisás antecedentes, solicitás ampliaciones si hiciera falta y emitís tu informe de aptitud hipotecaria en la plataforma.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                03
              </div>
              <h4 className="text-base font-bold text-navy">Minuta & Coordinación</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Subís el borrador de la escritura para validación del prestamista e inversor, y fijás día y hora para la suscripción.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-full bg-navy text-white font-black text-xs flex items-center justify-center">
                04
              </div>
              <h4 className="text-base font-bold text-navy">Firma & Cierre</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se suscribe la hipoteca en tu protocolo notarial, se registra la inscripción y se habilita la liquidación de fondos.
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
            Optimizá los tiempos de escrituración de tus clientes
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Sumate como escribanía de referencia en la red HIPOTECALY o utilizá el módulo notarial para tus propias operaciones hipotecarias.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link to="/contacto?demo=true&rol=estudio">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-bold shadow-floating">
                Sumar mi Estudio Notarial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/contacto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                Contactar a Soporte Notarial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
