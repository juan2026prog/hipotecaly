import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white pt-16 pb-12 border-t border-navy-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-navy-border/60">
          {/* Col 1 & 2: Brand and description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center font-bold text-white shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                  <path d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">HIPOTECALY</span>
            </div>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              Plataforma tecnológica y de intermediación para facilitar y gestionar solicitudes de préstamos con garantía hipotecaria en Uruguay.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
              <span>Plataforma segura con encriptación y aislamiento estricto</span>
            </div>
          </div>

          {/* Col 3: Solicitantes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Para Propietarios</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/simulador" className="hover:text-brand-green transition-colors">Simulador de Préstamo</Link></li>
              <li><Link to="/solicitar" className="hover:text-brand-green transition-colors">Solicitar Financiación</Link></li>
              <li><Link to="/como-funciona" className="hover:text-brand-green transition-colors">Cómo funciona</Link></li>
              <li><Link to="/preguntas-frecuentes" className="hover:text-brand-green transition-colors">Preguntas frecuentes</Link></li>
              <li><Link to="/mi-cuenta" className="hover:text-brand-green transition-colors">Portal del Solicitante</Link></li>
            </ul>
          </div>

          {/* Col 4: Profesionales & SaaS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Para Profesionales</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/plataforma" className="hover:text-brand-green transition-colors">HIPOTECALY SaaS</Link></li>
              <li><Link to="/plataforma/funcionalidades" className="hover:text-brand-green transition-colors">Funcionalidades</Link></li>
              <li><Link to="/plataforma/white-label" className="hover:text-brand-green transition-colors">Solución White Label</Link></li>
              <li><Link to="/plataforma/precios" className="hover:text-brand-green transition-colors">Planes y Precios</Link></li>
              <li><Link to="/app" className="hover:text-brand-green transition-colors">Acceso Backoffice</Link></li>
            </ul>
          </div>

          {/* Col 5: Contacto institucional */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contacto</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                <span>Montevideo, Uruguay</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span>contacto@hipotecaly.uy</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Atención comercial: Lun a Vie de 9:00 a 18:00 hs.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Regulatorio y Legal Obligatorio */}
        <div className="pt-8 text-xs text-slate-400 space-y-3">
          <p className="leading-relaxed">
            <strong className="text-slate-300">Aviso Legal y Transparencia Operativa:</strong> HIPOTECALY opera como plataforma tecnológica y de intermediación digital para facilitar la presentación, análisis preliminar y gestión de solicitudes de préstamos con garantía hipotecaria. HIPOTECALY no concede los préstamos directamente ni capta depósitos del público. La concesión definitiva, condiciones financieras, tasas de interés, costos y aprobación de cada operación corresponden exclusivamente al prestamista o institución financiera interviniente. Los montos calculados en el simulador son estimativos y no constituyen una oferta formal de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-navy-border/40 text-slate-400 text-[11px] space-y-2 sm:space-y-0">
            <span>© {new Date().getFullYear()} HIPOTECALY S.A. Todos los derechos reservados.</span>
            <div className="flex space-x-4">
              <Link to="/terminos" className="hover:text-slate-200 transition-colors">Términos del Servicio</Link>
              <Link to="/privacidad" className="hover:text-slate-200 transition-colors">Política de Privacidad</Link>
              <Link to="/seguridad" className="hover:text-slate-200 transition-colors">Seguridad de la Información</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
