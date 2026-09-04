import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { TenantBrand } from '../common/TenantBrand';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-bg text-slate-text">
      {/* Minimal Header */}
      <header className="h-20 border-b border-slate-border bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <TenantBrand size="md" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 text-left">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center mx-auto shadow-sm border border-navy-border">
              <Shield className="w-6 h-6 text-brand-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-muted max-w-sm mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white rounded-card p-6 sm:p-8 border border-slate-border shadow-card">
            {children}
          </div>

          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <span>Conexión cifrada de extremo a extremo SSL/TLS</span>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 border-t border-slate-border text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} HIPOTECALY S.A. Todos los derechos reservados.</span>
          <div className="flex space-x-4">
            <Link to="/terminos" className="hover:text-slate-600 transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-slate-600 transition-colors">Privacidad</Link>
            <Link to="/seguridad" className="hover:text-slate-600 transition-colors">Seguridad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
