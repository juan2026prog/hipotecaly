import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  FileSignature,
  UserCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Stamp,
  Award,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { TenantBrand } from '../common/TenantBrand';

interface NotaryNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const NotaryLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tenant } = useTenant();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const navItems: NotaryNavItem[] = [
    { name: 'Inicio', href: basePath, icon: Home },
    { name: 'Expedientes', href: `${basePath}/expedientes`, icon: FileText },
    { name: 'Firmas pendientes', href: `${basePath}/firmas`, icon: FileSignature, badge: 2 },
    { name: 'Perfil profesional', href: `${basePath}/perfil`, icon: UserCheck },
  ];

  const isItemActive = (href: string) => {
    if (href === basePath) {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/ingresar');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 antialiased">
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR NOTARIAL                                      */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-white flex-shrink-0 z-30 border-r border-slate-800 shadow-xl">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 justify-between">
          <Link to={basePath} className="flex items-center space-x-3">
            <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
          </Link>
        </div>

        {/* Notary Badge Card */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl border border-teal-500/30 bg-teal-950/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <Stamp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-teal-200 truncate">Portal Notarial</div>
                <div className="text-[10px] text-teal-400/80 font-mono truncate">Caja Notarial: 48.291</div>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Gestión Notarial
          </div>
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile & SignOut */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <Link
            to={`${basePath}/perfil`}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                MP
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-teal-300">
                  Esc. María Pérez
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1 shrink-0" />
                  Habilitada SCJ
                </div>
              </div>
            </div>
            <Award className="w-4 h-4 text-teal-400/70 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE DRAWER                                                */}
      {/* ============================================================ */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-white z-10 border-r border-slate-800">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-teal-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/30 border border-rose-900/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA                                            */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            {title && (
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>{title}</span>
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Habilitación pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Habilitación Notarial Activa</span>
            </div>

            {/* Perfil Quick Access */}
            <Link
              to={`${basePath}/perfil`}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                MP
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-700">
                Esc. María Pérez
              </span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
