// ==============================================================================
// HIPOTECALY: Tenant Client Portal Layout (/demo/:tenantSlug/cliente)
// Layout White-Label para el portal de solicitantes/clientes de un tenant
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  FileText,
  FileCheck,
  MessageSquare,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

interface TenantClientLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: 'inicio' | 'ofertas' | 'solicitud' | 'documentos' | 'mensajes' | 'cuenta' | 'creditos') => void;
}

export const TenantClientLayout: React.FC<TenantClientLayoutProps> = ({
  children,
  activeTab = 'inicio',
  onTabChange,
}) => {
  const { user, borrower, signOut } = useAuth();
  const { tenant } = useTenant();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const accentColor = tenant.branding?.accent_color || '#f4b43b';
  const poweredBy = tenant.branding?.powered_by_text || 'Tecnología provista por HIPOTECALY';

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'solicitud', label: 'Mi Solicitud', icon: FileText },
    { id: 'documentos', label: 'Documentos', icon: FileCheck },
    { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f9] text-[#27384a]">
      {/* Topbar White Label */}
      <header
        className="border-b sticky top-0 z-30 shadow-sm"
        style={{ backgroundColor: '#ffffff', borderColor: '#dfe5ea' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3">
          {/* Brand & Monogram */}
          <Link to={`/demo/${tenant.slug}`} className="flex items-center space-x-3 group">
            <div
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white font-serif font-black text-xl shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{brandName.charAt(0)}</span>
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <div className="text-left">
              <span
                className="text-lg font-serif font-extrabold tracking-tight block leading-none"
                style={{ color: primaryColor }}
              >
                {brandName.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mt-0.5">
                Mi financiación
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {onTabChange && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as any)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-100 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    style={isActive ? { color: primaryColor } : {}}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* User & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right text-xs">
              <span className="font-bold text-slate-800 block">
                {borrower?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cliente'}
              </span>
              <span className="text-[10px] text-slate-500">Solicitante verificado</span>
            </div>
            <button
              onClick={() => (signOut ? signOut() : window.location.assign(`/demo/${tenant.slug}`))}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 text-left">
        {children}
      </main>

      {/* Footer Discreto White Label */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {brandName}. Todos los derechos reservados.
          </span>
          <span className="text-[11px] font-medium text-slate-400 flex items-center justify-center">
            <Shield className="w-3 h-3 mr-1 text-slate-400" />
            {poweredBy}
          </span>
        </div>
      </footer>
    </div>
  );
};
