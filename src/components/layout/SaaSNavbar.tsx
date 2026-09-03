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
    location.pathname === '/saas/integracion' ||
    location.pathname === '/saas/plataforma-completa' ||
    location.pathname === '/plataforma/integracion' ||
    location.pathname === '/plataforma/plataforma-completa';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border">
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
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-muted uppercase tracking-wider block mt-0.5">
              SaaS & White-Label Hipotecario
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-6">
          {/* Producto */}
          <Link
            to="/saas"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/saas' || location.pathname === '/plataforma'
                ? 'text-brand-green font-semibold'
                : 'text-slate-text'
            }`}
          >
            Producto
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
                className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-floating border border-slate-200 p-3 space-y-1 animate-in fade-in slide-in-from-top-2"
              >
                <Link
                  to="/saas/integracion"
                  className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy text-xs block group-hover:text-brand-green">
                      Ya tengo sitio web
                    </span>
                    <span className="text-[11px] text-slate-muted leading-tight block mt-0.5">
                      Conectá tu simulador o formulario existente con el proceso digital.
                    </span>
                  </div>
                </Link>

                <Link
                  to="/saas/plataforma-completa"
                  className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-navy text-brand-green flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-navy text-xs block group-hover:text-brand-green">
                      Necesito todo desde cero
                    </span>
                    <span className="text-[11px] text-slate-muted leading-tight block mt-0.5">
                      Sitio, simulador, portal cliente y panel bajo tu propia marca.
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Integración */}
          <Link
            to="/saas/integracion"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/saas/integracion'
                ? 'text-brand-green font-semibold'
                : 'text-slate-text'
            }`}
          >
            Integración
          </Link>

          {/* White-Label */}
          <Link
            to="/saas/plataforma-completa#white-label"
            className="text-sm font-medium text-slate-text transition-colors hover:text-brand-green"
          >
            White-Label
          </Link>

          {/* IA */}
          <Link
            to="/saas/plataforma-completa#ia"
            className="text-sm font-medium text-slate-text transition-colors hover:text-brand-green flex items-center space-x-1"
          >
            <span>IA</span>
            <Sparkles className="w-3 h-3 text-brand-green" />
          </Link>

          {/* Seguridad */}
          <Link
            to="/saas/integracion#seguridad"
            className="text-sm font-medium text-slate-text transition-colors hover:text-brand-green"
          >
            Seguridad
          </Link>

          {/* Contacto */}
          <Link
            to="/contacto"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/contacto' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Contacto
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

        {/* Mobile menu trigger */}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-border px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 text-left">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/saas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-brand-green"
            >
              Producto
            </Link>

            <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Modalidades Comerciales
            </div>

            <Link
              to="/saas/integracion"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green flex items-center space-x-2"
            >
              <Workflow className="w-4 h-4 text-brand-green" />
              <span>Ya tengo sitio web (Integración)</span>
            </Link>

            <Link
              to="/saas/plataforma-completa"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-brand-green" />
              <span>Necesito todo desde cero (White-Label)</span>
            </Link>

            <div className="border-t border-slate-100 my-1 pt-1" />

            <Link
              to="/saas/plataforma-completa#white-label"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green"
            >
              White-Label
            </Link>

            <Link
              to="/saas/plataforma-completa#ia"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green flex items-center space-x-1.5"
            >
              <span>IA Asistente</span>
              <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            </Link>

            <Link
              to="/saas/integracion#seguridad"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green"
            >
              Seguridad & Privacidad
            </Link>

            <Link
              to="/contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green"
            >
              Contacto
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
              ¿Sos solicitante de crédito? Ir al Marketplace HIPOTECALY →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
