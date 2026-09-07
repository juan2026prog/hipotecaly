// ==============================================================================
// HIPOTECALY: App Shell Exclusivo del Portal Cliente
// Navegación clara de 3 secciones principales + White Label nativo
// ==============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calculator,
  FileText,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

export type ClientPortalTab = 'datos' | 'simulaciones' | 'solicitudes';

interface ClientPortalShellProps {
  children: React.ReactNode;
  activeTab: ClientPortalTab;
  onTabChange: (tab: ClientPortalTab) => void;
  simulationsCount?: number;
  applicationsCount?: number;
}

export const ClientPortalShell: React.FC<ClientPortalShellProps> = ({
  children,
  activeTab,
  onTabChange,
  simulationsCount = 0,
  applicationsCount = 0,
}) => {
  const { user, borrower, signOut } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const brandName = tenant.branding?.public_name || tenant.name || (tenant.slug.includes('nova') ? 'Estudio Nova' : 'HIPOTECALY');
  const primaryColor = tenant.branding?.primary_color || (tenant.slug.includes('nova') ? '#173a5e' : '#071A35');
  const accentColor = tenant.branding?.accent_color || '#f4b43b';
  const poweredBy = tenant.branding?.powered_by_text || 'Tecnología provista por HIPOTECALY';

  const displayName = borrower?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cliente';
  const displayLastName = borrower?.last_name || user?.user_metadata?.last_name || '';

  const navItems = [
    {
      id: 'datos' as ClientPortalTab,
      label: 'Datos personales',
      icon: User,
      badge: null,
    },
    {
      id: 'simulaciones' as ClientPortalTab,
      label: 'Mis simulaciones',
      icon: Calculator,
      badge: simulationsCount > 0 ? simulationsCount : null,
    },
    {
      id: 'solicitudes' as ClientPortalTab,
      label: 'Mis solicitudes',
      icon: FileText,
      badge: applicationsCount > 0 ? applicationsCount : null,
    },
  ];

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f9] text-[#27384a]">
      {/* Topbar Autenticada y Limpia */}
      <header className="bg-white border-b border-[#dfe5ea] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between">
          {/* Logo / Monograma del Tenant o Hipotecaly */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onTabChange('solicitudes')}>
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white font-serif font-black text-xl shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{brandName.charAt(0)}</span>
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
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
                Portal Cliente
              </span>
            </div>
          </div>

          {/* Navegación Desktop: 3 Pestañas Principales */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-[#102d49] shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  style={isActive ? { color: primaryColor } : {}}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#f4b43b]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive
                          ? 'bg-[#102d49] text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Identidad de Usuario y Cierre de Sesión */}
          <div className="flex items-center space-x-3">
            <div className="text-right text-xs hidden sm:block">
              <span className="font-bold text-slate-800 block">
                {displayName} {displayLastName}
              </span>
              <span className="text-[10px] text-slate-500">
                Titular / Solicitante
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 text-left pb-24 md:pb-8">
        {children}
      </main>

      {/* Navegación Inferior Móvil (PWA / Responsive Touch) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden flex items-center justify-around h-16 shadow-lg px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors relative ${
                isActive ? 'text-[#102d49] font-bold' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#102d49]' : 'text-slate-400'}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 bg-[#102d49] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-t-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Discreto White Label */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-xs text-slate-400 hidden md:block">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {brandName}. Área privada del cliente.
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
