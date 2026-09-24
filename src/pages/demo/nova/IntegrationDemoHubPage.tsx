// ==============================================================================
// HIPOTECALY: Integration Demo Hub (/demo/:tenantSlug/integraciones)
// Selector visual de las dos modalidades de integración para empresas con web existente
// ==============================================================================

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Code2,
  MousePointerClick,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { Button } from '../../../components/ui/Button';

export const IntegrationDemoHubPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();

  const slug = tenantSlug || tenant?.slug || 'estudio-nova';
  const brandName = tenant?.branding?.public_name || tenant?.name || 'Estudio Nova';
  const primaryColor = tenant?.branding?.primary_color || '#173a5e';
  const secondaryColor = tenant?.branding?.secondary_color || '#102d49';

  useEffect(() => {
    document.title = `Modos de Integración | Demo ${brandName} · HIPOTECALY`;
  }, [brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans pb-28">
      
      {/* 0. TOPBAR DE NAVEGACIÓN COMERCIAL / PRESENTACIÓN */}
      <div className="bg-[#0b1e36] text-white text-xs py-2.5 px-4 sm:px-6 border-b border-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono uppercase tracking-wider font-bold text-emerald-400 text-[11px]">
              DEMOSTRACIÓN DE INTEGRACIONES
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-300 font-medium">
              Demostración comercial para empresas con sitio web existente
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/demo/${slug}`}
              className="inline-flex items-center text-xs text-slate-300 hover:text-white font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver a {brandName} (Sitio Completo)
            </Link>
          </div>
        </div>
      </div>

      {/* 1. HEADER HERO DEL SELECTOR */}
      <header className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#173a5e]/10 text-[#173a5e]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODOS DE INTEGRACIÓN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#173a5e] tracking-tight">
            Tu empresa ya tiene página web.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Probá cómo se puede integrar Hipotecaly sin reemplazar tu sitio actual.
          </p>

          {/* Recuadro de Contexto Comercial */}
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 text-left max-w-3xl mx-auto space-y-2">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  {brandName} representa cómo funciona una implementación completa (Sitio completo / FULL).
                </p>
                <p className="text-slate-600 mt-1">
                  A continuación podés probar las <strong>dos alternativas</strong> para empresas que <em>ya tienen</em> una página web y únicamente desean conectar la originación y gestión hipotecaria de Hipotecaly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SELECTOR DE DEMOSTRACIÓN: LAS DOS MODALIDADES */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* TARJETA 1: SIMULADOR EMBEBIDO + BOTÓN */}
          <div
            data-testid="integration-card-embed"
            className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#173a5e] shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-7 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Code2 className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                  OPCIÓN A · EMBED
                </span>
              </div>

              <div className="space-y-2 text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-[#245f91] block">
                  Modalidad 02
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#173a5e]">
                  Simulador Embebido
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  El cotizador paramétrico de Hipotecaly se incrusta visualmente dentro de la web existente de la empresa. El usuario simula en el sitio y continúa hacia el portal brandeado.
                </p>
              </div>

              {/* Diagrama de Flujo Conceptual */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 text-left font-mono">
                <div className="font-sans font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                  Flujo de experiencia:
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-medium">Web del cliente</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 font-bold">Simulador embebido</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400">↓</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-bold">Continuar solicitud</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold">Portal {brandName}</span>
                </div>
              </div>

              <ul className="text-xs text-slate-600 space-y-2.5 text-left pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Simulador canónico con fórmulas y reglas reales</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Cálculo inmediato de cuota, LTV y condiciones</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Transmisión transparente de datos al portal de la organización</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-2">
              <Link to={`/demo/${slug}/integraciones/embebido`}>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-white font-bold py-3.5 shadow-md uppercase tracking-wider flex items-center justify-center space-x-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>PROBAR SIMULADOR EN VIVO</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contacto?source=embed-demo&demo=true" className="block text-center text-xs font-semibold text-[#173a5e] hover:underline pt-1">
                Consultar integración embebida →
              </Link>
            </div>
          </div>

          {/* TARJETA 2: SOLO BOTÓN */}
          <div
            data-testid="integration-card-button"
            className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#173a5e] shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-7 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <MousePointerClick className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  01 · SOLO BOTÓN
                </span>
              </div>

              <div className="space-y-2 text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-[#245f91] block">
                  Modalidad 01
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#173a5e]">
                  Solo Botón
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  La web de la empresa únicamente incluye un botón como "Solicitar Financiación". Al hacer clic, el usuario ingresa a la página pública del simulador alojado bajo la marca del cliente.
                </p>
              </div>

              {/* Diagrama de Flujo Conceptual */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 text-left font-mono">
                <div className="font-sans font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                  Flujo de experiencia:
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-medium">Web del cliente</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold">Botón CTA</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-400">↓</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 font-bold">Simulador alojado {brandName}</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold">Portal del solicitante</span>
                </div>
              </div>

              <ul className="text-xs text-slate-600 space-y-2.5 text-left pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Cero integración técnica: solo un enlace o botón web</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Carga inmediata con logo, nombre y colores de la organización</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Mismo core canónico de cálculo y expediente digital</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-2">
              <Link to={`/demo/${slug}/integraciones/boton`}>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-white font-bold py-3.5 shadow-md uppercase tracking-wider flex items-center justify-center space-x-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <span>PROBAR INTEGRACIÓN</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/contacto?source=button-demo&demo=true" className="block text-center text-xs font-semibold text-[#173a5e] hover:underline pt-1">
                Consultar modalidad solo botón →
              </Link>
            </div>
          </div>

        </div>

        {/* 3. RESUMEN DE ARQUITECTURA */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-left space-y-4">
          <div className="flex items-center space-x-3">
            <Layers className="w-5 h-5 text-[#173a5e]" />
            <h3 className="text-base font-bold text-slate-900">
              Núcleo tecnológico unificado (Mismo Simulador · Mismo Core · Mismo Portal)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ambas modalidades de integración utilizan exactamente la misma lógica de cálculo financiero, los mismos validadores de riesgo y el mismo portal de autogestión de expedientes de <strong>{brandName}</strong>. La experiencia del solicitante siempre mantiene la identidad de la organización y nunca cae en interfaces genéricas de Hipotecaly.
          </p>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        HIPOTECALY · Entorno de Demostración Comercial para {brandName}
      </footer>
    </div>
  );
};
