import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TenantBrand } from '../common/TenantBrand';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Integraciones', href: '/#integraciones' },
    { label: 'Plataforma', href: '/#core' },
    { label: 'Soluciones', href: '/#soluciones' },
    { label: 'Seguridad', href: '/#seguridad' },
    { label: 'Estudio Nova', href: '/demo/estudio-nova', isSpecial: true },
    { label: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Logo HIPOTECALY / Tenant */}
        <Link to="/" className="flex items-center space-x-3 group">
          <TenantBrand size="md" />
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-brand-green ${
                link.isSpecial
                  ? 'text-brand-green font-semibold flex items-center space-x-1.5'
                  : 'text-slate-text'
              }`}
            >
              {link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-brand-green" />}
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-navy"
            >
              <User className="w-3.5 h-3.5 mr-1.5" /> Ingresar
            </Button>
          </Link>

          <Link to="/contacto?demo=true">
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold shadow-xs px-4"
            >
              Solicitar demo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs px-2.5">
              <User className="w-4 h-4" />
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 text-left animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors ${
                  link.isSpecial
                    ? 'text-brand-green flex items-center space-x-2'
                    : 'text-slate-text'
                }`}
              >
                {link.isSpecial && <Sparkles className="w-4 h-4 text-brand-green" />}
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link to="/contacto?demo=true" className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full font-bold">
                Solicitar demo <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="md" className="w-full font-semibold border-slate-200">
                <User className="w-4 h-4 mr-2" /> Ingresar a la plataforma
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

