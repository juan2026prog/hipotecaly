import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Compass,
  FileCheck,
  CheckSquare,
  Settings,
  Menu,
  X,
  Building2,
  LogOut,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { TenantBrand } from '../common/TenantBrand';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const BackofficeLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
  const location = useLocation();
  const { signOut, user, isSuperAdmin } = useAuth();
  const { tenant } = useTenant();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navigationGroups: NavGroup[] = [
    {
      title: 'OPERACIONES',
      items: [
        { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
        { name: 'Solicitudes y Expedientes', href: '/app/solicitudes', icon: FileText },
        { name: 'Clientes', href: '/app/clientes', icon: Users },
        { name: 'Propiedades', href: '/app/propiedades', icon: Building2 },
      ],
    },
    {
      title: 'ANÁLISIS',
      items: [
        { name: 'Valuaciones', href: '/app/tasaciones', icon: Compass },
        { name: 'Documentos', href: '/app/documentos', icon: FileCheck },
        { name: 'Prestamistas', href: '/app/prestamistas', icon: UserCheck },
        { name: 'Tareas', href: '/app/tareas', icon: CheckSquare },
      ],
    },
    {
      title: 'COMERCIAL',
      items: [
        { name: 'Leads', href: '/app/leads', icon: Users },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { name: 'Usuarios', href: '/app/usuarios', icon: Users },
        { name: 'Organización', href: '/app/organizacion', icon: Building2 },
        { name: 'Configuración', href: '/app/configuracion', icon: Settings },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'HERRAMIENTAS DE QA',
            items: [
              { name: 'Acceso QA / Inspección', href: '/platform-admin', icon: UserCheck },
              { name: 'Clientes White-Label', href: '/admin/tenants', icon: Building2 },
            ],
          },
        ]
      : []),
  ];

  const isItemActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(href);
  };

  const userDisplayName = user?.email?.split('@')[0] || 'Usuario Operativo';
  const userEmail = user?.email || 'operaciones@plataforma';

  return (
    <div className="min-h-screen flex bg-slate-bg text-slate-text">
      
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR NAVY                                         */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-navy text-white flex-shrink-0 z-30 border-r border-navy-border shadow-xl">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-navy-border/70 justify-between">
          <Link to="/app" className="flex items-center space-x-3">
            <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
          </Link>
        </div>

        {/* Tenant Selector Pill Dinámico */}
        <div className="px-4 py-3 border-b border-navy-border/40">
          <div className="bg-navy-surface p-2.5 rounded-xl border border-navy-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span className="font-semibold text-white truncate">
                {tenant.branding.public_name || tenant.name}
              </span>
            </div>
            <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[80px]">
              {tenant.slug}
            </span>
          </div>
        </div>

        {/* Navigation Menu Agrupado */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[40px] ${
                      isActive
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Sidebar / Profile */}
        <div className="p-4 border-t border-navy-border/70 space-y-3">
          <div className="flex items-center justify-between pt-1 text-xs text-slate-300 px-1">
            <div className="truncate text-left">
              <p className="font-bold text-white truncate capitalize">{userDisplayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
            <button
              onClick={() => signOut ? signOut() : window.location.assign('/ingresar')}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
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
        <header className="h-16 md:h-20 bg-white border-b border-slate-border px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Abrir navegación"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-bold text-navy">Backoffice</span>
              <span>/</span>
              <span className="capitalize font-medium">
                {location.pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-brand-green transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 min-h-[44px]"
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
      {/* MOBILE DRAWER                                                */}
      {/* ============================================================ */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-72 max-w-full bg-navy text-white flex flex-col justify-between py-6 px-4 shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-border">
                <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-4">
                {navigationGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase text-left">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const isActive = isItemActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] ${
                            isActive
                              ? 'bg-brand-green text-white'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-navy-border space-y-3">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between text-xs text-slate-400 hover:text-white py-2 min-h-[44px]"
              >
                <span>Ir al Marketplace</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (signOut) signOut();
                }}
                className="w-full py-2.5 rounded-lg bg-white/5 text-rose-300 font-semibold text-xs text-center min-h-[44px] flex items-center justify-center"
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
