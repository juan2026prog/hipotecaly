// ==============================================================================
// HIPOTECALY: Tenant Investor Portal Layout (/demo/:tenantSlug/inversor)
// Red Privada de Inversores exclusiva por Tenant
// ==============================================================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  FileCheck,
  Building,
  Shield,
  LogOut,
  Lock,
  User,
  Sliders,
  CheckCircle2,
  ChevronDown,
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
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { tenant } = useTenant();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const accentColor = tenant.branding?.accent_color || '#f4b43b';
  const basePath = `/demo/${tenant.slug}/inversor`;

  const navItems = [
    { label: 'Inicio', path: `${basePath}`, icon: LayoutDashboard },
    { label: 'Oportunidades', path: `${basePath}/oportunidades`, icon: Target },
    { label: 'Mis préstamos', path: `${basePath}/prestamos`, icon: Building },
    { label: 'Propuestas', path: `${basePath}/propuestas`, icon: FileCheck },
  ];

  const isNavActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    if (path.endsWith('/propuestas')) {
      return location.pathname.startsWith(path) || location.pathname.endsWith('/ofertas');
    }
    return location.pathname.startsWith(path);
  };

  const openProfile = (tab: 'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones' = 'datos') => {
    setIsUserMenuOpen(false);
    navigate(`${basePath}/perfil?tab=${tab}`);
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
                className="relative w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform text-white font-serif font-bold text-xl shadow-inner"
              >
                <span>{brandName.charAt(0)}</span>
                <span
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900"
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

          {/* Navegación Desktop (EXACTAMENTE LAS 4 SECCIONES PRINCIPALES) */}
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
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Avatar / Nombre del usuario → Acceso a Mi Perfil */}
          <div className="relative flex items-center space-x-2">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left min-h-[44px]"
              title="Mi perfil y cuenta"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block leading-tight pr-1">
                <span className="font-bold text-white text-xs block">
                  {user?.email?.split('@')[0] || 'Inversor Autorizado'}
                </span>
                <span
                  className="text-[10px] font-semibold flex items-center"
                  style={{ color: accentColor }}
                >
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  Mi perfil verificado
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
            </button>

            {/* Dropdown Menu de Usuario */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 text-xs animate-fadeIn text-left">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">
                      {user?.email || 'inversor@estudionova.uy'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center mt-0.5">
                      ✓ Identidad y fondos validados
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => openProfile('datos')}
                      className="w-full px-4 py-2.5 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Mi perfil</span>
                    </button>

                    <button
                      onClick={() => openProfile('criterios')}
                      className="w-full px-4 py-2.5 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-slate-500" />
                      <span>Mis criterios de inversión</span>
                    </button>

                    <button
                      onClick={() => openProfile('documentos')}
                      className="w-full px-4 py-2.5 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <FileCheck className="w-4 h-4 text-slate-500" />
                      <span>Mis documentos y KYC</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => (signOut ? signOut() : window.location.assign(`/demo/${tenant.slug}`))}
                      className="w-full px-4 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 text-left">
        {children}
      </main>

      {/* Bottom Navigation Bar en Mobile (Touch >= 44px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl px-2 py-1 flex items-center justify-around text-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[48px] w-16 py-1 text-[10px] font-semibold transition-colors ${
                active ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Discreto White Label */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
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
