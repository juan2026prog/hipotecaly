import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

export const SaaSNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Producto', path: '/plataforma' },
    { label: 'Funcionalidades', path: '/plataforma/funcionalidades' },
    { label: 'Para quién es', path: '/plataforma/para-quien-es' },
    { label: 'Precios', path: '/plataforma/precios' },
    { label: 'Contacto', path: '/contacto' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Monograma HIPOTECALY con subtítulo B2B */}
        <Link to="/plataforma" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center border border-navy-border shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
              <path d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z" stroke="#2DA674" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78" stroke="#2DA674" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-navy block leading-none">
              HIPOTECALY
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-muted uppercase tracking-wider block mt-0.5">
              Plataforma hipotecaria para estudios y prestamistas
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
                className={`text-sm font-medium transition-colors hover:text-brand-green ${
                  isActive ? 'text-brand-green font-semibold' : 'text-slate-text'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/contacto?demo=true">
            <Button variant="secondary" size="md" className="rounded-full px-5 border-slate-300 font-semibold">
              Agendar demo
            </Button>
          </Link>
          <Link to="/contacto?plan=whitelabel">
            <Button variant="primary" size="md">
              Quiero mi plataforma
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/contacto?demo=true">
            <Button variant="primary" size="sm" className="text-xs px-3">
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
        <div className="lg:hidden bg-white border-b border-slate-border px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-text hover:bg-slate-50 hover:text-brand-green"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
            <Link to="/contacto?plan=whitelabel" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" fullWidth>
                Quiero mi plataforma <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/contacto?demo=true" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" size="lg" fullWidth>
                Agendar demo personalizada
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
