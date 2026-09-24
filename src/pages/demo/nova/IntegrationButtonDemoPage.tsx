// ==============================================================================
// HIPOTECALY: Integration Demo B — SOLO BOTÓN
// Página de demostración que representa la web externa de una empresa ficticia
// que únicamente incluye un botón CTA hacia el simulador alojado de la organización.
// ==============================================================================

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  MousePointerClick,
  Code2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';

export const IntegrationButtonDemoPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();

  const slug = tenantSlug || tenant?.slug || 'estudio-nova';
  const brandName = tenant?.branding?.public_name || tenant?.name || 'Estudio Nova';
  const primaryColor = tenant?.branding?.primary_color || '#173a5e';

  useEffect(() => {
    document.title = `Demo B: Solo Botón | ${brandName}`;
  }, [brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans pb-28">
      
      {/* 0. BARRA DE CONTROL MODO PRESENTACIÓN COMERCIAL */}
      <div
        data-testid="presentation-bar-button"
        className="bg-[#0b1e36] text-white text-xs py-2.5 px-4 sm:px-6 sticky top-0 z-50 border-b border-slate-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono uppercase font-bold text-emerald-300 text-[11px] tracking-wide">
              DEMO B · SOLO BOTÓN
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden md:inline text-[11px]">
              La web externa no tiene simulador: deriva mediante botón al simulador alojado
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/demo/${slug}/integraciones`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver a Modos de Integración
            </Link>
            <Link
              to={`/demo/${slug}/integraciones/embebido`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 mr-1" />
              Probar Simulador Embebido
            </Link>
            <Link
              to={`/demo/${slug}`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors"
            >
              Sitio Completo ({brandName})
            </Link>
          </div>
        </div>
      </div>

      {/* 1. SITIO WEB EXTERNO FICTICIO */}
      <div className="flex-1">
        
        {/* Header de la Empresa Externa Ficticia */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Building className="w-5 h-5 text-teal-200" />
              </div>
              <div className="text-left">
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-none">
                  DESARROLLOS DEL SUR
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-0.5">
                  Sitio Web de la Empresa
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <span className="hover:text-slate-900 cursor-pointer">Proyectos</span>
              <span className="hover:text-slate-900 cursor-pointer">Obras en Curso</span>
              <span className="hover:text-slate-900 cursor-pointer">Novedades</span>
              <span className="text-teal-800 font-bold border-b-2 border-teal-800 pb-0.5 cursor-pointer">
                Créditos
              </span>
            </nav>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              info@desarrollosdelsur.uy
            </div>
          </div>
        </header>

        {/* 2. SECCIÓN PRINCIPAL: ¿NECESITÁS FINANCIACIÓN? */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          
          <div className="space-y-8 text-center">
            
            {/* Tarjeta explicativa de la modalidad */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-left max-w-2xl mx-auto">
              <MousePointerClick className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold">
                  Modalidad Solo Botón:
                </p>
                <p className="text-emerald-800 mt-0.5">
                  Esta empresa <strong>NO</strong> tiene el simulador embebido en su código. Al hacer clic en el botón a continuación, el usuario es redirigido a la página de cotización alojada con la identidad visual completa de <strong>{brandName}</strong>.
                </p>
              </div>
            </div>

            {/* Contenedor Ficticio de Llamada a la Acción */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 max-w-2xl mx-auto space-y-6 text-center">
              
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                <span>LÍNEA DE CRÉDITO HIPOTECARIO</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight leading-tight">
                ¿Necesitás financiación?
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
                Podés iniciar tu solicitud online en simples pasos con respuesta preliminar inmediata y asesoramiento notarial.
              </p>

              {/* Botón Principal de Integración */}
              <div className="pt-4">
                <Link
                  to={`/demo/${slug}/simulador?source=button_demo&source_mode=button`}
                  data-testid="btn-solicitar-financiacion"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl text-white font-bold text-base uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all inline-flex items-center justify-center space-x-3 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>SOLICITAR FINANCIACIÓN</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Simulación inmediata
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Portal brandeado de {brandName}
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Gestión digital segura
                </span>
              </div>

            </div>

          </div>

        </main>

        {/* Footer de la Empresa Externa */}
        <footer className="bg-slate-800 text-slate-400 text-xs py-8 border-t border-slate-700 text-center mt-12">
          <div className="max-w-4xl mx-auto px-4 space-y-2">
            <p className="text-slate-300 font-semibold">
              © 2026 DESARROLLOS DEL SUR — Montevideo, Uruguay.
            </p>
            <p className="text-slate-400 text-[11px]">
              Solución crediticia operada por {brandName} con tecnología Hipotecaly Core.
            </p>
          </div>
        </footer>

      </div>

    </div>
  );
};
