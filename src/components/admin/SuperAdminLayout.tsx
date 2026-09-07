// ==============================================================================
// HIPOTECALY: Super Admin Layout (/admin)
// Layout maestro de infraestructura y administración global
// ==============================================================================

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Cpu,
  LogOut,
  Menu,
  X,
  KeyRound,
  ExternalLink,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SuperAdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface SuperAdminNavGroup {
  title: string;
  items: SuperAdminNavItem[];
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

  const navGroups: SuperAdminNavGroup[] = [
    {
      title: 'PLATAFORMA',
      items: [
        { name: 'Dashboard Global', href: '/admin', icon: Activity },
        { name: 'Gestión de Tenants', href: '/admin/tenants', icon: Building2 },
      ],
    },
    {
      title: 'CONFIGURACIÓN & IA',
      items: [
        { name: 'Copiloto IA & Vault', href: '/admin/ai', icon: Cpu },
        { name: 'Integraciones & Conectores', href: '/admin?tab=integrations', icon: KeyRound },
      ],
    },
    {
      title: 'OPERACIÓN, QA & AUDITORÍA',
      items: [
        { name: 'Acceso QA & Sesiones', href: '/admin?tab=qa', icon: ShieldCheck },
        { name: 'Registro de Auditoría', href: '/admin?tab=audit', icon: Activity },
        { name: 'Seguridad & RLS', href: '/admin?tab=security', icon: Layers },
      ],
    },
    {
      title: 'DEMOSTRACIONES',
      items: [
        { name: 'Estudio Nova (Home)', href: '/demo/estudio-nova', icon: ExternalLink, external: true },
        { name: 'Nova Backoffice', href: '/demo/estudio-nova/admin', icon: Layers, external: true },
      ],
    },
  ];

  const isItemActive = (href: string) => {
    if (activeSection) {
      if (href.includes(`tab=${activeSection}`)) return true;
    }
    if (href === '/admin') {
      return location.pathname === '/admin' && (!location.search || location.search === '?tab=overview');
    }
    if (href.startsWith('/admin?tab=')) {
      return location.pathname === '/admin' && location.search.includes(href.split('?')[1]);
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop Super Admin */}
      <aside className="hidden md:flex flex-col w-64 bg-[#09182C] border-r border-[#152E4D] shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#152E4D] flex items-center justify-between">
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-emerald-400 tracking-widest uppercase block">
                CORE SYSTEM
              </span>
              <span className="font-extrabold text-base tracking-tight text-white block">
                SUPER ADMIN
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={iIdx}
                      to={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noreferrer' : undefined}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#152E4D] bg-[#071322]/80 flex items-center justify-between">
          <div className="text-left overflow-hidden">
            <span className="text-[10px] font-mono text-emerald-400 block font-bold">SUPER ADMINISTRADOR</span>
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
        <Link to="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">SUPER ADMIN</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Drawer Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#09182C] border-b border-[#152E4D] p-4 space-y-4 text-left">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">{group.title}</div>
              {group.items.map((item, iIdx) => (
                <Link
                  key={iIdx}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-xs font-semibold text-slate-200 hover:bg-white/5"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          ))}
          <button
            onClick={() => (signOut ? signOut() : window.location.assign('/ingresar'))}
            className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-[#0A1A2F] min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto text-left">
        {children}
      </main>
    </div>
  );
};
