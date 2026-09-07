// ==============================================================================
// HIPOTECALY: Barra de Navegación Comercial para Demostraciones (?presentation=true)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Monitor, Sparkles, User, Shield, Sliders, X } from 'lucide-react';

export const DemoSalesModeBar: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const isPresentationQuery = location.search.includes('presentation=true');
    const isDemoRoute = location.pathname.startsWith('/demo');
    setIsVisible(isPresentationQuery || isDemoRoute);
  }, [location.pathname, location.search]);

  if (!isVisible) return null;

  const currentPath = location.pathname;

  const demoLinks = [
    { label: 'Hub Accesos', path: '/demo/estudio-nova/accesos', icon: Sparkles, desc: 'Hub de accesos demo' },
    { label: 'Estudio Nova Home', path: '/demo/estudio-nova', icon: Monitor, desc: 'Home White Label' },
    { label: 'Portal Cliente', path: '/demo/estudio-nova/cliente', icon: User, desc: 'Portal del prestatario' },
    { label: 'Backoffice Nova', path: '/demo/estudio-nova/admin', icon: Shield, desc: 'Backoffice de operaciones' },
    { label: 'Red Inversores', path: '/demo/estudio-nova/inversor', icon: Sparkles, desc: 'Módulo de fondeo e inversores' },
    { label: 'Super Admin', path: '/admin', icon: Sliders, desc: 'Consola global HIPOTECALY' },
  ];

  if (minimized) {
    return (
      <aside aria-label="Demo Bar Minimizado" className="fixed bottom-3 right-3 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="bg-navy hover:bg-navy-light text-white text-xs font-bold px-3 py-2 rounded-full shadow-2xl border border-brand-green/40 flex items-center space-x-2 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span>Demo Sales Mode</span>
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Demo Sales Mode" className="fixed bottom-0 inset-x-0 z-50 bg-navy/95 backdrop-blur-md border-t border-slate-700 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="font-mono font-bold tracking-wider text-brand-green">MODO PRESENTACIÓN</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300 text-[11px]">Navegación guiada entre experiencias SaaS</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
          {demoLinks.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path + (location.search.includes('presentation=true') ? '?presentation=true' : '')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive
                    ? 'bg-brand-green text-white font-bold shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                title={item.desc}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors text-xs"
          title="Minimizar barra"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
