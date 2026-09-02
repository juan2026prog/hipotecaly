import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
  Upload,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ApplicantAccount: React.FC = () => {
  const { user, borrower, signOut } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'inicio' | 'solicitud' | 'documentos' | 'mensajes' | 'cuenta'>('inicio');

  // Datos de la solicitud activa
  const publicId = (location.state as { publicId?: string } | null)?.publicId || 'HIP-2026-00124';
  const displayName = borrower?.first_name || user?.user_metadata?.first_name || 'Ignacio';

  // Timeline de estados según Regla 28
  const timelineSteps = [
    { label: 'Solicitud recibida', status: 'completed' },
    { label: 'Información en revisión', status: 'current' },
    { label: 'Propiedad en análisis', status: 'upcoming' },
    { label: 'Buscando propuesta', status: 'upcoming' },
    { label: 'Propuesta disponible', status: 'upcoming' },
    { label: 'Formalización', status: 'upcoming' },
    { label: 'Finalizada', status: 'upcoming' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg pb-16 lg:pb-0">
      <Navbar />

      <main className="flex-1 py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 w-full text-left">
        
        {/* Banner Bienvenida PWA */}
        <div className="bg-white rounded-card p-5 sm:p-7 border border-slate-border shadow-card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                Portal del Solicitante
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-1">
              Hola, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Expediente activo: <strong className="font-mono text-navy">{publicId}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link to="/solicitar" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="md" className="w-full">
                Continuar solicitud <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: INICIO & RESUMEN DE SOLICITUD                         */}
        {/* ============================================================ */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            
            {/* Timeline Horizontal / Vertical */}
            <div className="bg-white rounded-card p-6 border border-slate-border shadow-card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-navy uppercase tracking-wider">
                  Progreso del Expediente
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> En revisión preliminar
                </span>
              </div>

              {/* Steps timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step.status === 'completed'
                          ? 'bg-brand-green text-white shadow-sm'
                          : step.status === 'current'
                          ? 'bg-navy text-white ring-4 ring-navy/10'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : step.status === 'current' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-medium ${
                        step.status === 'current'
                          ? 'text-navy font-bold'
                          : step.status === 'completed'
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
                <span className="text-xs text-slate-muted font-medium block">Monto Solicitado</span>
                <div className="text-2xl font-extrabold text-navy tracking-tight mt-1">
                  USD 80.000
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Plazo: 36 meses</span>
              </div>

              <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
                <span className="text-xs text-slate-muted font-medium block">Inmueble en Garantía</span>
                <div className="text-xl font-bold text-navy tracking-tight mt-1 truncate">
                  Casa en Montevideo
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Valuación declarada: USD 240.000</span>
              </div>

              <div className="bg-white p-5 rounded-card border border-slate-border shadow-card">
                <span className="text-xs text-slate-muted font-medium block">LTV Preliminar</span>
                <div className="text-2xl font-extrabold text-brand-green-dark tracking-tight mt-1">
                  33.3%
                </div>
                <span className="text-[11px] text-brand-green font-semibold mt-1 block">Dentro del rango elegible (40%)</span>
              </div>
            </div>

            {/* Próximo Paso y Acciones Inmediatas */}
            <div className="bg-gradient-to-r from-navy to-navy-surface text-white rounded-card p-6 shadow-floating flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Próximo Paso
                </span>
                <h4 className="text-lg font-bold text-white">Subir documentación de ingresos</h4>
                <p className="text-xs text-slate-300 max-w-md">
                  Para emitir una propuesta formal, por favor adjuntá tu recibo de sueldo o certificación notarial/contable.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('documentos')}
                className="inline-flex items-center px-5 py-2.5 rounded-btn bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold shadow-sm transition-colors shrink-0"
              >
                <Upload className="w-4 h-4 mr-1.5" /> Subir documentos
              </button>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: DOCUMENTOS                                            */}
        {/* ============================================================ */}
        {activeTab === 'documentos' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-5">
            <div>
              <h3 className="text-lg font-bold text-navy">Documentación del Expediente</h3>
              <p className="text-xs text-slate-muted mt-0.5">
                Archivos privados protegidos con encriptación y acceso mediante enlaces seguros.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Cédula de Identidad (frente y dorso)', status: 'Verificado', required: true, date: 'Hoy' },
                { name: 'Recibo de sueldo / Certificado contable', status: 'Pendiente', required: true, date: '-' },
                { name: 'Fotos de la propiedad (6 fotos cargadas)', status: 'En revisión', required: true, date: 'Ayer' },
                { name: 'Título o copia de padrón inmobiliario', status: 'Opcional', required: false, date: '-' },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-brand-green shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-navy">{doc.name}</p>
                      <span className="text-[10px] text-slate-500">Última actualización: {doc.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        doc.status === 'Verificado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'Pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                    <button className="text-xs font-bold text-brand-green hover:underline">
                      Cargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MENSAJES DEL EXPEDIENTE                               */}
        {/* ============================================================ */}
        {activeTab === 'mensajes' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
            <h3 className="text-lg font-bold text-navy">Mensajes y Notificaciones</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-navy">Equipo de Análisis HIPOTECALY</span>
                  <span className="text-[10px] text-slate-400">Hace 2 horas</span>
                </div>
                <p className="text-xs text-slate-600">
                  Tu solicitud preliminar HIP-2026-00124 ha sido recibida correctamente. Ya estamos verificando las características de la propiedad.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CUENTA Y AJUSTES                                      */}
        {/* ============================================================ */}
        {activeTab === 'cuenta' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-6">
            <h3 className="text-lg font-bold text-navy">Datos de tu Cuenta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Nombre Completo</label>
                <p className="font-bold text-navy text-sm mt-0.5">{displayName}</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Email Registrado</label>
                <p className="font-bold text-navy text-sm mt-0.5">{user?.email || borrower?.email || 'ignacio@ejemplo.com'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link to="/privacidad" className="text-xs text-brand-green hover:underline">
                Gestionar privacidad de datos
              </Link>
              <button
                onClick={signOut}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* NAVEGACIÓN INFERIOR MÓVIL (PWA Mobile-First - Regla 13)       */}
      {/* ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-border lg:hidden flex items-center justify-around h-16 shadow-lg">
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'inicio' ? 'text-brand-green' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('solicitud')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'solicitud' ? 'text-brand-green' : 'text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Solicitud</span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'documentos' ? 'text-brand-green' : 'text-slate-400'
          }`}
        >
          <Upload className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Documentos</span>
        </button>

        <button
          onClick={() => setActiveTab('mensajes')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'mensajes' ? 'text-brand-green' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Mensajes</span>
        </button>

        <button
          onClick={() => setActiveTab('cuenta')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'cuenta' ? 'text-brand-green' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Cuenta</span>
        </button>
      </nav>

      <Footer />
    </div>
  );
};
