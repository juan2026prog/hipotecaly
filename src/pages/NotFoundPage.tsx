import React from 'react';
import { Link } from 'react-router-dom';
import { Home, User, Shield, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TenantBrand } from '../components/common/TenantBrand';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-bg text-slate-text">
      {/* Header */}
      <header className="h-20 border-b border-slate-border bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/">
          <TenantBrand size="md" />
        </Link>
        <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-brand-green flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Ir a Inicio
        </Link>
      </header>

      {/* 404 Body */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-lg w-full bg-white rounded-card border border-slate-border shadow-card p-8 sm:p-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 text-2xl font-black mx-auto shadow-xs">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Página no encontrada
            </h1>
            <p className="text-sm text-slate-muted leading-relaxed">
              La dirección que ingresaste no existe, fue reubicada o ya no está disponible en la plataforma.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" fullWidth>
                <Home className="w-4 h-4 mr-2" /> Volver al inicio
              </Button>
            </Link>
            <Link to="/mi-cuenta" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" fullWidth>
                <User className="w-4 h-4 mr-2" /> Ir a mi cuenta
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <Link
              to="/app"
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4 text-brand-green" /> Backoffice
            </Link>
            <Link
              to="/preguntas-frecuentes"
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" /> Ayuda & FAQ
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-border">
        © {new Date().getFullYear()} HIPOTECALY S.A.
      </footer>
    </div>
  );
};
