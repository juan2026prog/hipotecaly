import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  FileCheck,
  MessageSquare,
  Shield,
  LogOut,
  Building,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LenderLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const LenderLayout: React.FC<LenderLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/lender', icon: LayoutDashboard },
    { label: 'Oportunidades', path: '/lender/oportunidades', icon: Target },
    { label: 'Ofertas', path: '/lender/ofertas', icon: FileCheck },
    { label: 'Mensajes', path: '/lender/mensajes', icon: MessageSquare },
  ];

  const isNavActive = (path: string) => {
    if (path === '/lender') {
      return location.pathname === '/lender';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-bg flex flex-col text-slate-text">
      {/* Topbar Navy para Prestamistas */}
      <header className="bg-navy text-white border-b border-navy-border sticky top-0 z-30 shadow-sm h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/lender" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-navy-surface border border-brand-green/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building className="w-5 h-5 text-brand-green" />
              </div>
              <div className="leading-tight text-left">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
                  HIPOTECALY
                </span>
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                  Portal Prestamista
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
                      ? 'bg-navy-surface text-brand-green border border-navy-border'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfil del Prestamista */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="font-bold text-white block">
                {user?.email?.split('@')[0] || 'Prestamista Asociado'}
              </span>
              <span className="text-[10px] text-brand-green font-medium">Prestamista verificado</span>
            </div>
            <button
              onClick={() => signOut ? signOut() : window.location.assign('/ingresar')}
              className="p-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Banner Anti-Bypass Permanente */}
      <div className="bg-navy-surface border-b border-navy-border px-4 py-2 text-[11px] text-slate-300 flex items-center justify-center space-x-2">
        <Shield className="w-3.5 h-3.5 text-brand-green shrink-0" />
        <span>
          <strong>Protección de Intermediación:</strong> Toda la información de expedientes está estrictamente anonimizada para análisis técnico.
        </span>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
        <div className="mb-6 text-left">
          <h1 className="text-xl sm:text-2xl font-black text-navy">{title}</h1>
        </div>
        {children}
      </main>

      {/* Bottom Navigation Bar en Mobile (Touch >= 44px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-border shadow-floating px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[48px] w-16 py-1 text-[10px] font-semibold transition-colors ${
                active ? 'text-brand-green' : 'text-slate-400 hover:text-navy'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
