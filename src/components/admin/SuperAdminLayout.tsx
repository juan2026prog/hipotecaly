// ==============================================================================
// HIPOTECALY: Super Admin Layout (/admin)
// Layout maestro simplificado de centro de control y administración global
// ==============================================================================

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users2,
  Boxes,
  UserCheck,
  Activity,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SuperAdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  activeSection?: string;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  activeSection,
}) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Las 6 áreas maestras de primer nivel
  const primaryNavItems: SuperAdminNavItem[] = [
    { name: 'Inicio', href: '/admin', icon: Home },
    { name: 'Clientes', href: '/admin/clientes', icon: Users2 },
    { name: 'Servicios', href: '/admin/servicios', icon: Boxes },
    { name: 'Ver como cliente', href: '/admin/ver-como-cliente', icon: UserCheck },
    { name: 'Actividad', href: '/admin/actividad', icon: Activity },
    { name: 'Configuración técnica', href: '/admin/configuracion', icon: Sliders },
  ];

  const isItemActive = (href: string) => {
    if (activeSection) {
      if (activeSection === 'overview' && href === '/admin') return true;
      if (activeSection === 'clientes' && (href === '/admin/clientes' || href === '/admin/tenants')) return true;
      if (activeSection === 'servicios' && (href === '/admin/servicios' || href === '/admin/ai' || href.includes('tab=integrations'))) return true;
      if (activeSection === 'impersonate' && (href === '/admin/ver-como-cliente' || href.includes('tab=qa'))) return true;
      if (activeSection === 'actividad' && (href === '/admin/actividad' || href.includes('tab=audit'))) return true;
      if (activeSection === 'configuracion' && (href === '/admin/configuracion' || href.includes('tab=security'))) return true;
    }

    const currentPath = location.pathname;
    if (href === '/admin') {
      return currentPath === '/admin' && (!location.search || location.search === '?tab=overview');
    }
    if (href === '/admin/clientes') {
      return currentPath === '/admin/clientes' || currentPath === '/admin/tenants' || currentPath.startsWith('/admin/tenants/');
    }
    if (href === '/admin/servicios') {
      return currentPath === '/admin/servicios' || currentPath === '/admin/ai' || location.search.includes('tab=integrations');
    }
    if (href === '/admin/ver-como-cliente') {
      return currentPath === '/admin/ver-como-cliente' || currentPath === '/admin/qa' || location.search.includes('tab=qa');
    }
    if (href === '/admin/actividad') {
      return currentPath === '/admin/actividad' || location.search.includes('tab=audit');
    }
    if (href === '/admin/configuracion') {
      return currentPath === '/admin/configuracion' || location.search.includes('tab=security');
    }
    return currentPath.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop Super Admin */}
      <aside className="hidden md:flex flex-col w-64 bg-[#09182C] border-r border-[#152E4D] shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#152E4D]">
          <Link to="/admin" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-emerald-400 tracking-widest uppercase block">
                HIPOTECALY
              </span>
              <span className="font-extrabold text-base tracking-tight text-white block">
                SUPER ADMIN
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Principal */}
        <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">
            PANEL DE CONTROL
          </div>
          <nav className="space-y-1.5">
            {primaryNavItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={idx}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Enlace Directo a Demostración */}
          <div className="pt-6 mt-6 border-t border-[#152E4D]/80">
            <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-2">
              DEMOSTRACIÓN EN VIVO
            </div>
            <Link
              to="/demo/estudio-nova"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
            >
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Estudio Nova (Demo)</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#152E4D] bg-[#071322]/80 flex items-center justify-between">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] font-mono text-emerald-400 block font-bold">ADMINISTRADOR</span>
            <span className="text-xs font-medium text-slate-300 truncate block max-w-[140px]">
              {user?.email || 'admin@hipotecaly.uy'}
            </span>
          </div>
          <button
            onClick={() => (signOut ? signOut() : window.location.assign('/ingresar'))}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Header Móvil */}
      <div className="md:hidden bg-[#09182C] border-b border-[#152E4D] p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/admin" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">HIPOTECALY ADMIN</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Drawer Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#09182C] border-b border-[#152E4D] p-4 space-y-3 text-left">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2">MENÚ PRINCIPAL</div>
          <div className="space-y-1">
            {primaryNavItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              return (
                <Link
                  key={idx}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#152E4D] flex items-center justify-between">
            <Link
              to="/demo/estudio-nova"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
            >
              <span>Ver Demo Estudio Nova</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
            <button
              onClick={() => (signOut ? signOut() : window.location.assign('/ingresar'))}
              className="text-xs font-semibold text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-[#0A1A2F] min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto text-left">
        {children}
      </main>
    </div>
  );
};
