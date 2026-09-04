import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Building2,
  ChevronDown,
  DollarSign,
  Scale,
  HelpCircle,
  Calculator,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TenantBrand } from '../common/TenantBrand';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [b2bDropdownOpen, setB2bDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isSaaSRoute =
    location.pathname.startsWith('/saas') ||
    location.pathname.startsWith('/plataforma') ||
    location.pathname.startsWith('/empresas') ||
    location.pathname.startsWith('/demo');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setB2bDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setB2bDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border">
      {/* ============================================================== */}
      {/* 1. TOP AUDIENCE SELECTOR BAR (Dual Personas vs Empresas)        */}
      {/* ============================================================== */}
      <div className="bg-navy text-white text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-navy-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 hidden sm:inline">Audiencia:</span>
            <div className="inline-flex bg-navy-surface p-0.5 rounded-lg border border-navy-border">
              <Link
                to="/"
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                  !isSaaSRoute
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Para personas
              </Link>
              <Link
                to="/saas"
                className={`px-2.5 py-0.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all ${
                  isSaaSRoute
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Para empresas</span>
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
              Agendar demo B2B
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN NAVBAR                                                  */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Monograma HIPOTECALY / Tenant */}
        <Link to="/" className="flex items-center space-x-3 group">
          <TenantBrand size="md" showTagline />
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            to="/simulador"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/simulador' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Simulador
          </Link>

          <Link
            to="/como-funciona"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/como-funciona' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Cómo funciona
          </Link>

          <Link
            to="/nosotros"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/nosotros' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Nosotros
          </Link>

          {/* Menú Desplegable B2B Empresas & SaaS */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setB2bDropdownOpen(!b2bDropdownOpen)}
              onMouseEnter={() => setB2bDropdownOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all min-h-[38px] ${
                isSaaSRoute
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-navy hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-brand-green" />
              <span>Para empresas</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  b2bDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {b2bDropdownOpen && (
              <div
                onMouseLeave={() => setB2bDropdownOpen(false)}
                className="absolute top-full right-0 w-80 bg-white rounded-card shadow-floating border border-slate-200 p-3 space-y-1 animate-in fade-in slide-in-from-top-2 text-left"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Soluciones por perfil
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
                      Para prestamistas
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Originación privada con blindaje operativo.
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
                      Para financieras y fondos
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Core hipotecario White-Label y sindicación.
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
                      Para estudios notariales
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Expediente digital, titulación y coordinación.
                    </span>
                  </div>
                </Link>

                <div className="border-t border-slate-100 my-1 pt-1" />

                <Link
                  to="/saas"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-bold text-navy hover:bg-slate-50 hover:text-brand-green"
                >
                  <span>Ver plataforma SaaS completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/demo/nova"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-brand-green bg-emerald-50/60 hover:bg-emerald-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Showroom NOVA White-Label
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Demo</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/preguntas-frecuentes"
            className={`text-sm font-medium transition-colors hover:text-brand-green ${
              location.pathname === '/preguntas-frecuentes' ? 'text-brand-green font-semibold' : 'text-slate-text'
            }`}
          >
            Preguntas frecuentes
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link to="/contacto?demo=true">
            <Button variant="secondary" size="md" className="border-slate-300 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
              Solicitar demo B2B
            </Button>
          </Link>
          <Link to="/solicitar">
            <Button variant="primary" size="md" className="text-xs font-bold shadow-sm">
              Solicitar préstamo
            </Button>
          </Link>
          <Link
            to="/ingresar"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-navy hover:text-brand-green px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            <User className="w-4 h-4" />
            <span>Ingresar</span>
          </Link>
        </div>

        {/* Mobile Header: HIPOTECALY | Solicitar | Hamburger */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/solicitar">
            <Button variant="primary" size="sm" className="text-xs px-3.5 font-bold">
              Solicitar
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-btn text-navy hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE DRAWER MENU                                           */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-border px-4 pt-3 pb-6 space-y-5 shadow-xl animate-in slide-in-from-top-2 text-left max-h-[85vh] overflow-y-auto">
          
          {/* Selector de Audiencia Mobile */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-center py-2 rounded-lg text-xs font-bold transition-all ${
                !isSaaSRoute ? 'bg-white text-navy shadow-xs' : 'text-slate-600'
              }`}
            >
              Para personas
            </Link>
            <Link
              to="/saas"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-center py-2 rounded-lg text-xs font-bold transition-all ${
                isSaaSRoute ? 'bg-navy text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Para empresas
            </Link>
          </div>

          {/* BLOQUE PERSONAS */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Financiación para personas
            </div>

            <nav className="flex flex-col space-y-1">
              <Link
                to="/simulador"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-navy hover:bg-slate-50 flex items-center justify-between min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-brand-green" /> Simulador de cuotas
                </span>
                <span className="text-[10px] bg-emerald-50 text-brand-green px-2 py-0.5 rounded-full font-bold">
                  Calcular
                </span>
              </Link>

              <Link
                to="/como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-slate-400" /> Cómo funciona
              </Link>

              <Link
                to="/nosotros"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 min-h-[44px]"
              >
                <Building2 className="w-4 h-4 text-slate-400" /> Sobre nosotros
              </Link>

              <Link
                to="/preguntas-frecuentes"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 min-h-[44px]"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" /> Preguntas frecuentes
              </Link>
            </nav>
          </div>

          {/* ACCIONES Y BOTONES MÓVILES */}
          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
            <Link to="/solicitar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" fullWidth className="font-bold">
                Solicitar préstamo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/ingresar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="md" fullWidth className="text-navy font-semibold">
                <User className="w-4 h-4 mr-2" /> Ingresar a mi cuenta
              </Button>
            </Link>
          </div>

        </div>
      )}
    </header>
  );
};
