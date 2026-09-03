import React, { useState } from 'react';
import {
  Globe,
  Building,
  Briefcase,
  ShieldCheck,
  Palette,
  ArrowRight,
} from 'lucide-react';

interface BrandComparisonMockupProps {
  className?: string;
}

export const BrandComparisonMockup: React.FC<BrandComparisonMockupProps> = ({ className = '' }) => {
  const [selectedBrand, setSelectedBrand] = useState<'brandA' | 'brandB'>('brandA');

  const brandA = {
    name: 'Estudio Notarial del Plata',
    short: 'ENP',
    tagline: 'Soluciones Fiduciarias e Hipotecarias',
    domain: 'creditos.estudiodelplata.uy',
    primaryColor: '#0A2540',
    accentColor: '#D97706',
    headerBg: 'bg-[#0A2540]',
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-600',
    accentBorder: 'border-amber-600',
    accentBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'Estudio Notarial & Jurídico',
    phone: '+598 2900 1122',
    address: 'Plaza Independencia 810, Montevideo',
    maxPct: '40%',
    rate: '11.5%',
    term: 'Hasta 60 meses',
  };

  const brandB = {
    name: 'Fondo Hipotecario del Este',
    short: 'FHE',
    tagline: 'Créditos Privados con Respaldo Inmobiliario',
    domain: 'portal.fondodeleste.uy',
    primaryColor: '#064E3B',
    accentColor: '#10B981',
    headerBg: 'bg-[#064E3B]',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-600',
    accentBorder: 'border-emerald-600',
    accentBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'Fondo de Inversión Inmobiliaria',
    phone: '+598 4248 9900',
    address: 'Av. Roosevelt y Parada 12, Punta del Este',
    maxPct: '45%',
    rate: '10.8%',
    term: 'Hasta 48 meses',
  };

  const active = selectedBrand === 'brandA' ? brandA : brandB;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Brand Switcher Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 border border-slate-200">
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Demostración White-Label en Vivo
          </span>
          <p className="text-sm font-semibold text-navy">
            Seleccioná una marca ficticia para ver cómo se transforma la plataforma:
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setSelectedBrand('brandA')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              selectedBrand === 'brandA'
                ? 'bg-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Marca A: Estudio Jurídico</span>
          </button>
          <button
            onClick={() => setSelectedBrand('brandB')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              selectedBrand === 'brandB'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Marca B: Financiera Privada</span>
          </button>
        </div>
      </div>

      {/* Main Comparative Window Mockup */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden text-left">
        {/* Browser Top Header */}
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="flex items-center space-x-1.5 ml-3 px-3 py-1 bg-slate-800 rounded-md text-[11px] text-slate-300 font-mono">
              <Globe className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-white">{active.domain}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            100% White-Label · Sin mención a HIPOTECALY
          </span>
        </div>

        {/* Dynamic Tenant Navigation */}
        <header className={`${active.headerBg} text-white px-6 py-4 flex items-center justify-between transition-colors duration-300`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-navy flex items-center justify-center font-extrabold text-sm shadow-md">
              {active.short}
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block leading-tight">
                {active.name}
              </span>
              <span className="text-[10px] text-slate-300 block">
                {active.tagline}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-200">
            <span className="font-medium hover:text-white cursor-pointer">Simulador</span>
            <span className="font-medium hover:text-white cursor-pointer">Requisitos</span>
            <span className="font-medium hover:text-white cursor-pointer">Quiénes Somos</span>
            <span className="font-medium hover:text-white cursor-pointer">Contacto</span>
            <span className="px-3.5 py-1.5 rounded-lg bg-white/15 text-white font-bold border border-white/20">
              Portal Clientes
            </span>
          </div>
        </header>

        {/* Dynamic Tenant Hero / Simulator Mockup */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Columna Izquierda: Presentación de la Marca */}
            <div className="lg:col-span-6 space-y-4">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${active.accentBadge}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{active.badgeText}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight leading-tight">
                Préstamos con respaldo de tu propiedad bajo las mejores condiciones.
              </h3>

              <p className="text-slate-muted text-xs sm:text-sm leading-relaxed">
                Obtené liquidez de forma rápida, segura y transparente, asesorado por nuestro equipo profesional en {active.address}.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Financiamos</span>
                  <span className="text-base font-bold text-navy block mt-0.5">{active.maxPct}</span>
                  <span className="text-[9px] text-slate-400">del valor</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tasa anual</span>
                  <span className={`text-base font-bold block mt-0.5 ${active.accentText}`}>{active.rate}</span>
                  <span className="text-[9px] text-slate-400">en USD</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Plazo</span>
                  <span className="text-base font-bold text-navy block mt-0.5">{active.term}</span>
                  <span className="text-[9px] text-slate-400">flexible</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Simulador personalizado del Tenant */}
            <div className="lg:col-span-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-navy text-sm">Simulador Oficial</span>
                  <span className="text-[11px] text-slate-400 font-mono">Reglas {active.short}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Valor estimado del inmueble</span>
                      <span className="font-bold text-navy">USD 200.000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${active.accentBg} w-3/5`} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Monto solicitado ({active.maxPct} máx)</span>
                      <span className="font-bold text-navy">USD 75.000</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${active.accentBg} w-2/5`} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Cuota mensual estimada</span>
                      <span className="text-lg font-extrabold text-navy">USD 687</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Solo intereses</span>
                  </div>

                  <button className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-colors ${active.accentBg} flex items-center justify-center space-x-2`}>
                    <span>Iniciar Solicitud Digital</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info showing White-Label features */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-brand-green" />
            <span>Configuración activa: <strong>Logotipo, Colores primarios, Dominio CNAME, Textos institucionales y Tasas</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-navy">
            1 solo core de software · Múltiples identidades independientes
          </span>
        </div>
      </div>
    </div>
  );
};
