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

interface LenderLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const LenderLayout: React.FC<LenderLayoutProps> = ({ children, title }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/lender', icon: LayoutDashboard },
    { label: 'Oportunidades', path: '/lender/oportunidades', icon: Target },
    { label: 'Ofertas', path: '/lender/ofertas', icon: FileCheck },
    { label: 'Mensajes', path: '/lender/mensajes', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-bg flex flex-col">
      {/* Topbar Navy para Prestamistas */}
      <header className="bg-navy text-white border-b border-navy-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/lender" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-navy-surface border border-brand-green/30 flex items-center justify-center">
                <Building className="w-4 h-4 text-brand-green" />
              </div>
              <div className="leading-tight">
                <span className="font-black text-sm tracking-tight text-white block">HIPOTECALY</span>
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block">
                  Portal Prestamista
                </span>
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy-surface text-brand-green'
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
              <span className="font-bold text-white block">Hipotecaly Capital</span>
              <span className="text-[10px] text-slate-400">Prestamista Piloto Activo</span>
            </div>
            <Link
              to="/ingresar"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </Link>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-navy">{title}</h1>
        </div>
        {children}
      </main>

      {/* Bottom Navigation Bar en Mobile (Regla Touch >= 44px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-border shadow-floating px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[48px] w-16 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-green' : 'text-slate-400 hover:text-navy'
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
