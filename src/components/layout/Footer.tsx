import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, Sparkles } from 'lucide-react';
import { TenantBrand } from '../common/TenantBrand';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white pt-16 pb-12 border-t border-navy-border text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-navy-border/60">
          
          {/* Col 1: Brand and mission */}
          <div className="space-y-4">
            <TenantBrand isWhite size="md" />
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Infraestructura tecnológica para créditos con garantía hipotecaria en Uruguay: marketplace para personas y plataforma SaaS White-Label para empresas e instituciones.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
              <span>Plataforma financiera segura y cifrada</span>
            </div>
          </div>

          {/* Col 2: Para Personas (Marketplace) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Para personas
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/simulador" className="hover:text-brand-green transition-colors">
                  Simulador de cuotas
                </Link>
              </li>
              <li>
                <Link to="/solicitar" className="hover:text-brand-green transition-colors">
                  Solicitar préstamo
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="hover:text-brand-green transition-colors">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-brand-green transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes" className="hover:text-brand-green transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/mi-cuenta" className="hover:text-brand-green transition-colors">
                  Portal mi cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Soluciones para Empresas & SaaS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Para empresas (SaaS)
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/saas" className="hover:text-brand-green transition-colors">
                  Visión general de la plataforma
                </Link>
              </li>
              <li>
                <Link to="/saas/modulos" className="hover:text-brand-green transition-colors">
                  Catálogo de módulos
                </Link>
              </li>
              <li>
                <Link to="/empresas/prestamistas" className="hover:text-brand-green transition-colors">
                  Para prestamistas privados
                </Link>
              </li>
              <li>
                <Link to="/empresas/financieras" className="hover:text-brand-green transition-colors">
                  Para financieras y fondos
                </Link>
              </li>
              <li>
                <Link to="/empresas/estudios" className="hover:text-brand-green transition-colors">
                  Para estudios notariales
                </Link>
              </li>
              <li>
                <Link to="/demo/nova" className="hover:text-brand-green transition-colors flex items-center space-x-1 font-semibold text-brand-green">
                  <Sparkles className="w-3 h-3 text-brand-green" />
                  <span>Showroom NOVA White-Label</span>
                </Link>
              </li>
              <li>
                <Link to="/saas/precios" className="hover:text-brand-green transition-colors">
                  Planes y precios
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacto & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contacto & Legal
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                <span>Montevideo, Uruguay</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span>contacto@hipotecaly.uy</span>
              </div>
              <div className="pt-3 space-y-2 text-slate-400 border-t border-navy-border/50">
                <div>
                  <Link to="/terminos" className="hover:text-white transition-colors">
                    Términos del servicio
                  </Link>
                </div>
                <div>
                  <Link to="/privacidad" className="hover:text-white transition-colors">
                    Política de privacidad
                  </Link>
                </div>
                <div>
                  <Link to="/seguridad" className="hover:text-white transition-colors">
                    Seguridad de la información
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Disclaimer Regulatorio y Legal Obligatorio */}
        <div className="pt-8 text-xs text-slate-400 space-y-3">
          <p className="leading-relaxed text-[11px]">
            <strong className="text-slate-300">Aviso Legal y Transparencia Operativa:</strong> HIPOTECALY opera como plataforma tecnológica y de intermediación digital para facilitar la presentación, análisis preliminar y gestión de solicitudes de préstamos con garantía hipotecaria. HIPOTECALY no concede préstamos directamente ni capta depósitos del público. La concesión definitiva, condiciones financieras, tasas de interés, costos y aprobación de cada operación corresponden exclusivamente al prestamista o institución financiera interviniente. Los montos calculados en el simulador son estimativos y no constituyen una oferta formal de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-navy-border/40 text-slate-400 text-[11px] space-y-2 sm:space-y-0">
            <span>© {new Date().getFullYear()} HIPOTECALY S.A. Todos los derechos reservados.</span>
            <div className="flex space-x-4">
              <Link to="/terminos" className="hover:text-slate-200 transition-colors">Términos</Link>
              <Link to="/privacidad" className="hover:text-slate-200 transition-colors">Privacidad</Link>
              <Link to="/seguridad" className="hover:text-slate-200 transition-colors">Seguridad</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
