// ==============================================================================
// HIPOTECALY: Tenant Investor Portal Layout (/demo/:tenantSlug/inversor)
// Red Privada de Inversores exclusiva por Tenant
// ==============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  FileCheck,
  MessageSquare,
  Shield,
  LogOut,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

interface TenantInvestorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const TenantInvestorLayout: React.FC<TenantInvestorLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { tenant } = useTenant();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const accentColor = tenant.branding?.accent_color || '#f4b43b';
  const basePath = `/demo/${tenant.slug}/inversor`;

  const navItems = [
    { label: 'Dashboard', path: `${basePath}`, icon: LayoutDashboard },
    { label: 'Operaciones Asignadas', path: `${basePath}/oportunidades`, icon: Target },
    { label: 'Propuestas Emitidas', path: `${basePath}/ofertas`, icon: FileCheck },
    { label: 'Mensajes', path: `${basePath}/mensajes`, icon: MessageSquare },
  ];

  const isNavActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] flex flex-col text-slate-800">
      {/* Topbar para Red Privada de Inversores */}
      <header
        className="text-white border-b sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: primaryColor, borderColor: '#152e4d' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <Link to={basePath} className="flex items-center space-x-3 group">
              <div
                className="relative w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform text-white font-serif font-bold text-xl"
              >
                <span>{brandName.charAt(0)}</span>
                <span
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
              <div className="leading-tight text-left">
                <span className="font-serif font-extrabold text-lg sm:text-xl tracking-tight text-white block">
                  {brandName.toUpperCase()}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest block mt-0.5"
                  style={{ color: accentColor }}
                >
                  Red Privada de Inversores
                </span>
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
                    active
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfil del Inversor */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="font-bold text-white block">
                {user?.email?.split('@')[0] || 'Inversor Autorizado'}
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: accentColor }}
              >
                Inversor privado verificado
              </span>
            </div>
            <button
              onClick={() => (signOut ? signOut() : window.location.assign(`/demo/${tenant.slug}`))}
              className="p-2.5 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Aislamiento Privado */}
      <div className="bg-[#0e253e] border-b border-[#173a5e] px-4 py-2 text-[11px] text-slate-300 flex items-center justify-center space-x-2 text-center">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Entorno Privado de {brandName} — Acceso exclusivo a operaciones asignadas bajo acuerdo de confidencialidad.
        </span>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 text-left">
        {children}
      </main>

      {/* Footer Discreto White Label */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {brandName}. Red privada de estructuración financiera.
          </span>
          <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center">
            <Shield className="w-3 h-3 mr-1" />
            {tenant.branding?.powered_by_text || 'Tecnología provista por HIPOTECALY'}
          </span>
        </div>
      </footer>
    </div>
  );
};
