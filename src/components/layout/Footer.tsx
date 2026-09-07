import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, Sparkles } from 'lucide-react';
import { TenantBrand } from '../common/TenantBrand';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white pt-16 pb-12 border-t border-navy-border text-left">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-navy-border/60">
          
          {/* Col 1: HIPOTECALY Brand */}
          <div className="space-y-4">
            <TenantBrand isWhite size="md" />
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Infraestructura tecnológica modular para digitalizar y gestionar operaciones con garantía hipotecaria.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
              <span>Aislamiento seguro multi-tenant (RLS)</span>
            </div>
          </div>

          {/* Col 2: Integraciones */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Integraciones
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <a href="/#integraciones" className="hover:text-brand-green transition-colors">
                  Botón de Solicitud
                </a>
              </li>
              <li>
                <a href="/#integraciones" className="hover:text-brand-green transition-colors">
                  Simulador + Botón
                </a>
              </li>
              <li>
                <a href="/#integraciones" className="hover:text-brand-green transition-colors">
                  White Label Completo
                </a>
              </li>
              <li>
                <Link to="/simulador" className="hover:text-brand-green transition-colors">
                  Simulador en vivo
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Plataforma */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <a href="/#core" className="hover:text-brand-green transition-colors">
                  DocFlow Notarial
                </a>
              </li>
              <li>
                <a href="/#core" className="hover:text-brand-green transition-colors">
                  Identidad & Firma Digital
                </a>
              </li>
              <li>
                <a href="/#core" className="hover:text-brand-green transition-colors">
                  Valuación & LTV
                </a>
              </li>
              <li>
                <a href="/#core" className="hover:text-brand-green transition-colors">
                  Backoffice & AI Core
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: HIPOTECALY / Soluciones */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              HIPOTECALY
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <a href="/#soluciones" className="hover:text-brand-green transition-colors">
                  Soluciones
                </a>
              </li>
              <li>
                <a href="/#seguridad" className="hover:text-brand-green transition-colors">
                  Seguridad
                </a>
              </li>
              <li>
                <Link to="/demo/estudio-nova" className="hover:text-brand-green transition-colors flex items-center space-x-1 font-semibold text-brand-green">
                  <Sparkles className="w-3.5 h-3.5 text-brand-green" />
                  <span>Estudio Nova</span>
                </Link>
              </li>
              <li>
                <Link to="/contacto?demo=true" className="hover:text-brand-green transition-colors">
                  Contacto & Demo
                </Link>
              </li>
            </ul>
            <div className="pt-2 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span>Montevideo, Uruguay</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span>contacto@hipotecaly.uy</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} HIPOTECALY. Infraestructura Tecnológica Hipotecaria.</p>
          <div className="flex items-center space-x-6">
            <Link to="/terminos" className="hover:text-slate-200 transition-colors">
              Términos
            </Link>
            <Link to="/privacidad" className="hover:text-slate-200 transition-colors">
              Privacidad
            </Link>
            <Link to="/seguridad" className="hover:text-slate-200 transition-colors">
              Seguridad
            </Link>
            <span className="inline-flex items-center space-x-1.5 text-brand-green font-medium">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span>Sistemas 100% operativos</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

