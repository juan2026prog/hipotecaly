import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTenant } from '../../contexts/TenantContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { tenant } = useTenant();

  const isSaaSRoute = location.pathname.startsWith('/saas') || location.pathname.startsWith('/plataforma');

  const navLinks = [
    { label: 'Cómo funciona', path: '/como-funciona' },
    { label: 'Préstamos', path: '/prestamos' },
    { label: 'Simulador', path: '/simulador' },
    { label: 'Plataforma SaaS', path: '/saas', isSpecial: true },
    { label: 'Preguntas frecuentes', path: '/preguntas-frecuentes' },
    { label: 'Nosotros', path: '/nosotros' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border">
      {/* Top Audience Bar: Selector Dual Personas vs Empresas */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 hidden sm:inline">Modo:</span>
            <div className="inline-flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <Link
                to="/"
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                  !isSaaSRoute
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Para Personas
              </Link>
              <Link
                to="/saas"
                className={`px-2.5 py-0.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all ${
                  isSaaSRoute
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Para Empresas & Estudios</span>
                <span className="bg-white/20 text-[9px] uppercase tracking-wider px-1 rounded">SaaS</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/demo/nova/full"
              className="text-slate-300 hover:text-brand-green transition-colors flex items-center space-x-1 font-medium"
            >
              <Sparkles className="w-3 h-3 text-brand-green" />
              <span>Ver Demo NOVA</span>
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

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Monograma HIPOTECALY / White-Label */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center border border-navy-border shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
              <path d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z" stroke="var(--brand-green, #2DA674)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78" stroke="var(--brand-green, #2DA674)" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-navy block leading-none truncate max-w-[170px] sm:max-w-none">
              {tenant.branding.public_name}
            </span>
            <span className="text-[10px] font-semibold text-slate-muted uppercase tracking-wider hidden sm:block mt-0.5 truncate max-w-[220px]">
              {tenant.branding.tag_line || 'Financiación con garantía hipotecaria'}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-brand-green flex items-center space-x-1.5 ${
                  isActive ? 'text-brand-green font-semibold' : 'text-slate-text'
                } ${link.isSpecial ? 'bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-navy font-bold' : ''}`}
              >
                <span>{link.label}</span>
                {link.isSpecial && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link to="/contacto?demo=true">
            <Button variant="secondary" size="md" className="border-slate-300 text-xs">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
              Solicitar Demo
            </Button>
          </Link>
          <Link to="/solicitar">
            <Button variant="primary" size="md" className="text-xs shadow-sm">
              Solicitar préstamo
            </Button>
          </Link>
          <Link
            to="/ingresar"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-navy hover:text-brand-green px-2 py-2 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Ingresar</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/solicitar">
            <Button variant="primary" size="sm" className="text-xs px-3">
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-border px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          {/* Tarjeta destacada SaaS para Móvil */}
          <div className="p-3.5 bg-navy text-white rounded-xl border border-navy-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-brand-green tracking-wider">
                Para Empresas & Estudios
              </span>
              <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">
                SaaS White-Label
              </span>
            </div>
            <p className="text-xs text-slate-200">
              Digitalizá tu captación, legajos y evaluación crediticia con tecnología hipotecaria.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/saas"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-1.5 text-xs font-bold bg-brand-green text-white rounded-lg"
              >
                Conocer SaaS
              </Link>
              <Link
                to="/demo/nova/full"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-1.5 text-xs font-bold bg-white/10 text-slate-200 rounded-lg hover:text-white"
              >
                Ver Demo
              </Link>
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-text hover:bg-slate-50 hover:text-brand-green flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.isSpecial && (
                  <span className="text-[10px] font-bold text-brand-green bg-brand-green-light px-2 py-0.5 rounded-full">
                    SaaS B2B
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
            <Link to="/solicitar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" fullWidth>
                Solicitar préstamo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/contacto?demo=true" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" size="lg" fullWidth>
                <Building2 className="w-4 h-4 mr-2 text-brand-green" /> Solicitar Demo B2B
              </Button>
            </Link>
            <Link to="/ingresar" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="md" fullWidth className="text-slate-600">
                <User className="w-4 h-4 mr-2" /> Ingresar a Mi Cuenta
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
