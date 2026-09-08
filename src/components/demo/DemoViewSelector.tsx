// ==============================================================================
// HIPOTECALY: Selector de Vistas de Modo Prueba (DemoViewSelector.tsx)
// Barra superior interactiva para recorrer todo HIPOTECALY con la cuenta universal
// ==============================================================================

import React, { useState } from 'react';
import {
  FlaskConical,
  ChevronDown,
  User,
  TrendingUp,
  FileCheck2,
  LayoutDashboard,
  Building2,
  LogOut,
  Check,
} from 'lucide-react';
import { useDemoView, DEMO_VIEW_OPTIONS, DemoViewType } from '../../contexts/DemoViewContext';
import { useAuth } from '../../contexts/AuthContext';

export const DemoViewSelector: React.FC = () => {
  const { isUniversalTestSession, isTestMode, activeView, currentOption, switchView } = useDemoView();
  const { signOut, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Si no está en modo prueba o no es usuario universal, no mostrar
  if (!isTestMode || !isUniversalTestSession) {
    return null;
  }

  const iconMap: Record<DemoViewType, React.ComponentType<{ className?: string }>> = {
    cliente: User,
    inversor: TrendingUp,
    escribano: FileCheck2,
    backoffice: LayoutDashboard,
    tenant_admin: Building2,
  };

  const CurrentIcon = iconMap[activeView] || User;

  return (
    <div
      data-testid="demo-view-selector-bar"
      className="sticky top-0 z-50 bg-[#0B1E36] text-white border-b border-amber-500/50 shadow-lg px-3 py-1.5 text-xs font-sans"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Identificador de Modo Prueba */}
        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] tracking-wide border border-amber-500/40">
            <FlaskConical className="w-3.5 h-3.5 mr-1 text-amber-400 animate-pulse" />
            🧪 MODO PRUEBA
          </span>

          <span className="text-slate-400 hidden sm:inline">|</span>

          <span className="text-slate-300 hidden md:inline text-[11px]">
            Los datos mostrados son de demostración (Estudio Nova)
          </span>
        </div>

        {/* Selector de Vistas Rápido */}
        <div className="flex items-center space-x-3 ml-auto">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#152E4D] hover:bg-[#1E3E66] border border-amber-400/40 text-white font-bold transition-all text-xs shadow-sm"
              title="Seleccionar vista demo de la plataforma"
            >
              <span className="text-slate-400 font-normal">Vista actual:</span>
              <CurrentIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-200 font-bold">{currentOption.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Menú Desplegable con las 5 opciones */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-[#09182C] border border-[#1E3E66] text-white rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-[#152E4D] text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Vistas disponibles (Estudio Nova)
                </div>

                <div className="py-1 space-y-0.5">
                  {DEMO_VIEW_OPTIONS.map((option) => {
                    const Icon = iconMap[option.id] || User;
                    const isSelected = option.id === activeView;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => switchView(option.id)}
                        className={`w-full text-left px-3 py-2 flex items-start space-x-2.5 transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{option.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-[#152E4D] px-3 pb-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Usuario: <strong className="text-slate-200">{user?.email || 'admin@estudionova.uy'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Botón Salir */}
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition-colors text-xs"
            title="Cerrar sesión de prueba"
          >
            <LogOut className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
};
