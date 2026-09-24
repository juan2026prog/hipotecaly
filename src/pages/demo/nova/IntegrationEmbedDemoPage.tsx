// ==============================================================================
// HIPOTECALY: Integration Demo A — SIMULADOR EMBEBIDO + BOTÓN
// Página de demostración que representa el sitio web EXISTENTE de una empresa ficticia
// con el Simulador Real Canónico de Hipotecaly embebido en la página.
// ==============================================================================

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Code2,
  MousePointerClick,
} from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { CanonicalTenantSimulator } from '../../../components/simulator/CanonicalTenantSimulator';

export const IntegrationEmbedDemoPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();

  const slug = tenantSlug || tenant?.slug || 'estudio-nova';
  const brandName = tenant?.branding?.public_name || tenant?.name || 'Estudio Nova';
  const primaryColor = tenant?.branding?.primary_color || '#173a5e';
  const accentColor = tenant?.branding?.accent_color || '#f4b43b';

  useEffect(() => {
    document.title = `Demo A: Simulador Embebido + Botón | ${brandName}`;
  }, [brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans pb-28">
      
      {/* 0. BARRA DE CONTROL MODO PRESENTACIÓN COMERCIAL */}
      <div
        data-testid="presentation-bar-embed"
        className="bg-[#0b1e36] text-white text-xs py-2.5 px-4 sm:px-6 sticky top-0 z-50 border-b border-slate-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="font-mono uppercase font-bold text-blue-300 text-[11px] tracking-wide">
              DEMO A · SIMULADOR EMBEBIDO + BOTÓN
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden md:inline text-[11px]">
              La empresa ya tiene su propio sitio y aloja el simulador de Hipotecaly
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
              to={`/demo/${slug}/integraciones/boton`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MousePointerClick className="w-3.5 h-3.5 mr-1" />
              Probar Solo Botón
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-none">
                  INMOBILIARIA DEL ESTE
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-0.5">
                  Sitio Web Existente del Cliente
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <span className="hover:text-slate-900 cursor-pointer">Propiedades</span>
              <span className="hover:text-slate-900 cursor-pointer">Emprendimientos</span>
              <span className="text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5 cursor-pointer">
                Financiación
              </span>
              <span className="hover:text-slate-900 cursor-pointer">Contacto</span>
            </nav>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Tel: +598 2711 0000
            </div>
          </div>
        </header>

        {/* Hero / Introducción de la Web Externa */}
        <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
              SERVICIOS FINANCIEROS INTEGRADOS
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Financiación para nuestros clientes
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Facilitamos el acceso a préstamos con garantía hipotecaria a través de la infraestructura tecnológica de <strong>{brandName}</strong>. Simulá tu cuota y comenzá tu solicitud 100% online.
            </p>
          </div>
        </section>

        {/* 2. SECCIÓN DEL SIMULADOR EMBEBIDO */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          
          <div className="space-y-6">
            
            {/* Tarjeta explicativa del contenedor embebido */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-left">
              <Code2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <p className="font-bold">
                  Simulador Hipotecaly Embebido en la Web de Inmobiliaria del Este:
                </p>
                <p className="text-blue-800 mt-0.5">
                  El componente interactivo a continuación es el <strong>Simulador Canónico Real</strong> de Hipotecaly. Al hacer clic en <strong>CONTINUAR SOLICITUD</strong>, el usuario viaja directamente al portal del solicitante con el branding de <strong>{brandName}</strong> y todos los parámetros precalculados.
                </p>
              </div>
            </div>

            {/* Componente Canónico Real Embebido */}
            <CanonicalTenantSimulator
              tenantId={tenant.id}
              tenantSlug={slug}
              brandName={brandName}
              primaryColor={primaryColor}
              accentColor={accentColor}
              sourceMode="embed"
              source="embed_demo"
              initialPropertyValue={220000}
              initialLoanAmount={80000}
              initialTermMonths={36}
              initialRepaymentMode="solo_intereses"
              className="shadow-2xl border-slate-300"
            />

          </div>

        </main>

        {/* Footer de la Empresa Externa */}
        <footer className="bg-slate-800 text-slate-400 text-xs py-8 border-t border-slate-700 text-center mt-12">
          <div className="max-w-4xl mx-auto px-4 space-y-2">
            <p className="text-slate-300 font-semibold">
              © 2026 INMOBILIARIA DEL ESTE — Montevideo & Punta del Este, Uruguay.
            </p>
            <p className="text-slate-400 text-[11px]">
              Servicio de estructuración financiera y crediticia provisto en alianza tecnológica con {brandName} sobre HIPOTECALY Core.
            </p>
          </div>
        </footer>

      </div>

    </div>
  );
};
