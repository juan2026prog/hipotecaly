import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  Shield,
  ChevronDown,
  Layers,
  Sparkles,
  Workflow,
  DollarSign,
  Building2,
  Scale,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const SaaSNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSolutionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setSolutionsDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isSolutionsActive =
    location.pathname.startsWith('/empresas') ||
    location.pathname === '/saas/integracion' ||
    location.pathname === '/saas/plataforma-completa';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border">
      {/* ============================================================== */}
      {/* 1. TOP AUDIENCE SELECTOR BAR                                   */}
      {/* ============================================================== */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 hidden sm:inline">Audiencia:</span>
            <div className="inline-flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <Link
                to="/"
                className="px-2.5 py-0.5 rounded-md font-semibold text-slate-300 hover:text-white transition-all"
              >
                Para Personas
              </Link>
              <Link
                to="/saas"
                className="px-2.5 py-0.5 rounded-md font-semibold bg-brand-green text-white shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <span>Para Empresas & Estudios</span>
                <span className="bg-white/20 text-[9px] uppercase tracking-wider px-1 rounded">SaaS</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/demo/nova"
              className="text-slate-300 hover:text-brand-green transition-colors flex items-center space-x-1 font-medium"
            >
              <Sparkles className="w-3 h-3 text-brand-green" />
              <span>Showroom NOVA</span>
            </Link>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <Link
              to="/contacto?demo=true"
              className="text-brand-green hover:text-brand-green-light transition-colors font-bold hidden sm:inline"
            >
              Agendar Demo B2B
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN SAAS NAVBAR                                             */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Monograma HIPOTECALY con subtítulo B2B */}
        <Link to="/saas" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center border border-navy-border shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
              <path
                d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z"
                stroke="#2DA674"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78"
                stroke="#2DA674"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-xl font-extrabold tracking-tight text-navy block leading-none">
              HIPOTECALY
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-brand-green uppercase tracking-wider block mt-0.5">
              Platform & White-Label
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            to="/saas"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/saas' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Plataforma
          </Link>

          {/* Soluciones Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-brand-green py-2 ${
                isSolutionsActive ? 'text-brand-green font-semibold' : 'text-slate-text'
              }`}
            >
              <span>Soluciones</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  solutionsDropdownOpen ? 'rotate-180 text-brand-green' : ''
                }`}
              />
            </button>

            {solutionsDropdownOpen && (
              <div
                onMouseLeave={() => setSolutionsDropdownOpen(false)}
                className="absolute top-full left-0 w-84 bg-white rounded-2xl shadow-floating border border-slate-200 p-3 space-y-1 animate-in fade-in slide-in-from-top-2 text-left"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Por Tipo de Organización
                </div>

                <Link
                  to="/empresas/prestamistas"
                  className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy text-xs block group-hover:text-brand-green">
                      Para Prestamistas Privados
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Oportunidades anonimizadas y blindaje Anti-Bypass.
                    </span>
                  </div>
                </Link>

                <Link
                  to="/empresas/financieras"
                  className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy text-xs block group-hover:text-brand-green">
                      Para Financieras y Fondos
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Core hipotecario, scoring paramétrico y sindicación.
                    </span>
                  </div>
                </Link>

                <Link
                  to="/empresas/estudios"
                  className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy text-xs block group-hover:text-brand-green">
                      Para Estudios Notariales
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Expediente digital, titulación y coordinación notarial.
                    </span>
                  </div>
                </Link>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Modalidad de Despliegue
                  </div>

                  <Link
                    to="/saas/integracion"
                    className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy"
                  >
                    <span>Integración Embebida (Tengo web)</span>
                    <Workflow className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    to="/saas/plataforma-completa"
                    className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy"
                  >
                    <span>Plataforma Completa (White-Label)</span>
                    <Layers className="w-3.5 h-3.5 text-brand-green" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Showroom NOVA */}
          <Link
            to="/demo/nova"
            className={`text-sm font-medium transition-colors hover:text-brand-green flex items-center space-x-1.5 ${
              location.pathname.startsWith('/demo') ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <span>Showroom NOVA</span>
          </Link>

          {/* Precios y Planes */}
          <Link
            to="/saas/precios"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/saas/precios' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Planes
          </Link>

          {/* Contacto */}
          <Link
            to="/contacto?demo=true"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/contacto' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Contacto B2B
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link to="/app">
            <Button variant="ghost" size="sm" className="text-xs text-navy font-semibold">
              <Shield className="w-3.5 h-3.5 mr-1 text-brand-green" /> Backoffice
            </Button>
          </Link>
          <Link to="/contacto?demo=true">
            <Button variant="primary" size="md" className="rounded-btn px-6 font-bold shadow-sm">
              AGENDAR DEMO
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/contacto?demo=true">
            <Button variant="primary" size="sm" className="text-xs px-3 font-bold">
              Demo
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-btn text-navy hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú SaaS"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE DRAWER MENU                                           */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-border px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 text-left max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/saas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-navy hover:bg-slate-50"
            >
              Visión General de la Plataforma
            </Link>

            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Soluciones por Perfil
            </div>

            <Link
              to="/empresas/prestamistas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
            >
              <DollarSign className="w-3.5 h-3.5 text-brand-green" />
              <span>Para Prestamistas Privados</span>
            </Link>

            <Link
              to="/empresas/financieras"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Para Financieras y Fondos</span>
            </Link>

            <Link
              to="/empresas/estudios"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
            >
              <Scale className="w-3.5 h-3.5 text-purple-500" />
              <span>Para Estudios Notariales</span>
            </Link>

            <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Modalidades de Adopción
            </div>

            <Link
              to="/saas/integracion"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
            >
              <Workflow className="w-3.5 h-3.5 text-brand-green" />
              <span>Integración Embebida (Widget)</span>
            </Link>

            <Link
              to="/saas/plataforma-completa"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
            >
              <Layers className="w-3.5 h-3.5 text-brand-green" />
              <span>White-Label Completo (Standalone)</span>
            </Link>

            <Link
              to="/demo/nova"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold text-brand-green bg-emerald-50/70 hover:bg-emerald-50 flex items-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
              <span>Showroom NOVA (Demo Interactiva)</span>
            </Link>

            <Link
              to="/saas/precios"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Planes y Precios
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
            <Link to="/contacto?demo=true" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" fullWidth className="font-bold shadow-md">
                AGENDAR DEMO <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="md" fullWidth className="text-navy font-semibold">
                <Shield className="w-4 h-4 mr-2 text-brand-green" /> Acceso Backoffice Operativo
              </Button>
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-xs font-medium text-slate-500 hover:text-navy pt-2"
            >
              ¿Buscás un préstamo hipotecario? Ir al Marketplace →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
