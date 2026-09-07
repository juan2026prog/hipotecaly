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
import { useTenant } from '../../contexts/TenantContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { tenant } = useTenant();

  const isNova = tenant.slug === 'estudio-nova' || tenant.slug === 'nova' || tenant.slug === 'estudio_nova';
  const isWhiteLabel = tenant.is_white_label || isNova;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  interface NavItem {
    label: string;
    href: string;
    isSpecial?: boolean;
  }

  const hipotecalyLinks: NavItem[] = [
    { label: 'Integraciones', href: '/#integraciones' },
    { label: 'Plataforma', href: '/#core' },
    { label: 'Soluciones', href: '/#soluciones' },
    { label: 'Seguridad', href: '/#seguridad' },
    { label: 'Estudio Nova', href: '/demo/estudio-nova', isSpecial: true },
    { label: 'FAQ', href: '/#faq' },
  ];

  const tenantLinks: NavItem[] = [
    { label: 'Inicio', href: isNova ? '/demo/estudio-nova#inicio' : `/org/${tenant.slug}` },
    { label: 'Financiación', href: isNova ? '/demo/estudio-nova#financiacion' : `/org/${tenant.slug}` },
    { label: 'Cómo Funciona', href: isNova ? '/demo/estudio-nova#como-funciona' : `/org/${tenant.slug}` },
    { label: 'Simulador', href: `/simulador?source=${tenant.slug}` },
    { label: 'Contacto', href: isNova ? '/demo/estudio-nova#contacto' : `/org/${tenant.slug}` },
  ];

  const navLinks: NavItem[] = isWhiteLabel ? tenantLinks : hipotecalyLinks;
  const homeLink = isWhiteLabel ? (isNova ? '/demo/estudio-nova' : `/org/${tenant.slug}`) : '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#dfe5ea] transition-all">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Logo Tenant / HIPOTECALY */}
        <Link to={homeLink} className="flex items-center space-x-3 group">
          <TenantBrand size="md" />
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center space-x-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isWhiteLabel
                  ? 'text-[#27384a] hover:text-[#173a5e] font-semibold text-xs tracking-wider uppercase'
                  : link.isSpecial
                  ? 'text-brand-green font-semibold flex items-center space-x-1.5'
                  : 'text-slate-text hover:text-brand-green'
              }`}
            >
              {!isWhiteLabel && link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-brand-green" />}
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link to="/mi-cuenta">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs font-semibold ${isWhiteLabel ? 'text-[#173a5e] hover:bg-[#f5f7f9]' : 'text-slate-700 hover:text-navy'}`}
            >
              <User className="w-3.5 h-3.5 mr-1.5" /> Portal de clientes
            </Button>
          </Link>

          <Link to={`/solicitar?source=${tenant.slug}`}>
            <Button
              variant={isWhiteLabel ? 'navy' : 'primary'}
              size="sm"
              className={`text-xs font-bold shadow-xs px-4 ${isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider' : ''}`}
            >
              {isWhiteLabel ? 'Solicitar Financiación' : 'Solicitar demo'} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link to="/mi-cuenta">
            <Button variant="ghost" size="sm" className="text-xs px-2.5">
              <User className="w-4 h-4 text-[#173a5e]" />
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
        <div className="lg:hidden bg-white border-b border-[#dfe5ea] px-4 pt-2 pb-6 space-y-3 text-left animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors ${
                  !isWhiteLabel && link.isSpecial
                    ? 'text-brand-green flex items-center space-x-2'
                    : 'text-slate-text'
                }`}
              >
                {!isWhiteLabel && link.isSpecial && <Sparkles className="w-4 h-4 text-brand-green" />}
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link to={`/solicitar?source=${tenant.slug}`} className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={isWhiteLabel ? 'navy' : 'primary'}
                size="md"
                className={`w-full font-bold ${isWhiteLabel ? 'bg-[#173a5e] text-white uppercase tracking-wider' : ''}`}
              >
                {isWhiteLabel ? 'Solicitar Financiación' : 'Solicitar demo'} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/mi-cuenta" className="w-full" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="md" className="w-full font-semibold border-slate-200">
                <User className="w-4 h-4 mr-2" /> Portal de clientes
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

