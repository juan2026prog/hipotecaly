import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Compass,
  FileCheck,
  CheckSquare,
  Settings,
  Menu,
  X,
  Database,
  Building2,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const BackofficeLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [useDemoDataset, setUseDemoDataset] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'Solicitudes', href: '/app/solicitudes', icon: FileText },
    { name: 'Expedientes', href: '/app/solicitudes', icon: FolderKanban },
    { name: 'Clientes', href: '/app/clientes', icon: Users },
    { name: 'Propiedades', href: '/app/propiedades', icon: Building2 },
    { name: 'Prestamistas', href: '/app/prestamistas', icon: Users },
    { name: 'Valuaciones', href: '/app/tasaciones', icon: Compass },
    { name: 'Documentos', href: '/app/documentos', icon: FileCheck },
    { name: 'Tareas', href: '/app/tareas', icon: CheckSquare },
    { name: 'Usuarios', href: '/app/usuarios', icon: Users },
    { name: 'Organización', href: '/app/organizacion', icon: Building2 },
    { name: 'Configuración', href: '/app/configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-bg text-slate-text">
      
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR NAVY (Regla 35)                              */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-navy text-white flex-shrink-0 z-30 border-r border-navy-border shadow-xl">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-navy-border/70 justify-between">
          <Link to="/app" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center font-bold text-white shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                <path d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                HIPOTECALY
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                Backoffice Multi-Tenant
              </span>
            </div>
          </Link>
        </div>

        {/* Tenant Selector Pill */}
        <div className="px-4 py-3 border-b border-navy-border/40">
          <div className="bg-navy-surface p-2.5 rounded-xl border border-navy-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-2 h-2 rounded-full bg-brand-green"></div>
              <span className="font-semibold text-white truncate">HIPOTECALY Matriz</span>
            </div>
            <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              Tenant #1
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.href === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar / Profile & Switch */}
        <div className="p-4 border-t border-navy-border/70 space-y-3">
          {/* Demo Toggle */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-navy-surface/80 rounded-lg border border-navy-border text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-brand-green" />
              <span>Modo DEMO</span>
            </div>
            <button
              type="button"
              onClick={() => setUseDemoDataset(!useDemoDataset)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                useDemoDataset ? 'bg-brand-green' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  useDemoDataset ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-slate-300 px-1">
            <div className="truncate">
              <p className="font-bold text-white truncate">Analista Hipotecario</p>
              <p className="text-[10px] text-slate-400">operaciones@hipotecaly.uy</p>
            </div>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* CONTENIDO PRINCIPAL                                          */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-border px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Abrir navegación"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-bold text-navy">Backoffice</span>
              <span>/</span>
              <span className="capitalize">{location.pathname.split('/')[2] || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-brand-green transition-colors"
            >
              <span>Ver Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-brand-green-dark border border-brand-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green mr-1.5 animate-pulse" />
              PostgreSQL Online
            </span>
          </div>
        </header>

        {/* Contenedor de la página */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MOBILE DRAWER (Regla 37)                                     */}
      {/* ============================================================ */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-72 max-w-full bg-navy text-white flex flex-col justify-between py-6 px-4 shadow-2xl z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-border">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center font-bold text-white text-sm">
                    H
                  </div>
                  <span className="font-extrabold text-sm text-white">HIPOTECALY</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive =
                    item.href === '/app'
                      ? location.pathname === '/app'
                      : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-semibold min-h-[46px] ${
                        isActive
                          ? 'bg-brand-green text-white'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-navy-border space-y-3">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between text-xs text-slate-400 hover:text-white py-2"
              >
                <span>Ir al Marketplace</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={signOut}
                className="w-full py-2.5 rounded-lg bg-white/5 text-rose-300 font-semibold text-xs text-center"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
