import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { TenantClientLayout } from '../../components/layout/TenantClientLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  FileText,
  CheckCircle2,
  Upload,
  User,
  Sparkles,
  Fingerprint,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { getActiveDraft } from '../../lib/applicationService';
import { supabase } from '../../lib/supabase';

export const ApplicantAccount: React.FC = () => {
  const { user, borrower } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'inicio' | 'ofertas' | 'solicitud' | 'documentos' | 'mensajes' | 'cuenta' | 'creditos'>('inicio');

  // Solicitud activa
  const [activeApp, setActiveApp] = useState<{ publicId: string; status: string } | null>(null);

  // DocFlow Estados y Modal
  const [docCategory, setDocCategory] = useState<'todos' | 'necesitamos' | 'recibidos' | 'revision' | 'aprobados' | 'firmar' | 'firmados'>('necesitamos');

  // Modal para simular carga de documentos
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadedSuccessToast, setUploadedSuccessToast] = useState(false);

  React.useEffect(() => {
    async function resolveActiveApp() {
      const stateId = (location.state as { publicId?: string } | null)?.publicId;
      if (stateId) {
        setActiveApp({ publicId: stateId, status: 'info_review' });
        return;
      }

      if (tenant.demo_mode) {
        setActiveApp({ publicId: 'HPT-2026-00124', status: 'info_review' });
        return;
      }

      const draft = await getActiveDraft();
      if (draft && draft.publicId) {
        setActiveApp({ publicId: draft.publicId, status: 'draft' });
        return;
      }

      try {
        const { data } = await supabase
          .from('applications')
          .select('public_id, status')
          .eq('organization_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setActiveApp({ publicId: data.public_id, status: data.status });
        } else {
          setActiveApp(null);
        }
      } catch {
        setActiveApp(null);
      }
    }
    resolveActiveApp();
  }, [tenant.id, tenant.demo_mode, location.state]);

  const displayName = borrower?.first_name || user?.user_metadata?.first_name || 'Ignacio';

  // 7 Etapas en Lenguaje Humano
  const timelineSteps = [
    { step: 1, label: 'Solicitud recibida', status: 'completed' },
    { step: 2, label: 'Información en revisión', status: 'completed' },
    { step: 3, label: 'Propiedad y documentación', status: 'completed' },
    { step: 4, label: 'Evaluación', status: 'current' },
    { step: 5, label: 'Condiciones', status: 'upcoming' },
    { step: 6, label: 'Formalización', status: 'upcoming' },
    { step: 7, label: 'Finalizada', status: 'upcoming' },
  ];

  // Documentos del cliente con estados humanos
  const clientDocs = [
    {
      id: 'doc-1',
      name: 'Recibo de sueldo / Certificado de ingresos',
      category: 'necesitamos',
      humanStatus: 'Necesitamos de vos',
      statusType: 'action_required',
      desc: 'Por favor adjuntá tu último recibo de sueldo o certificado de contador.',
    },
    {
      id: 'doc-2',
      name: 'Cédula de Identidad (frente y dorso)',
      category: 'aprobados',
      humanStatus: 'Aprobado',
      statusType: 'success',
      desc: 'Validada mediante biometría e identidad oficial.',
    },
    {
      id: 'doc-3',
      name: 'Fotos de la propiedad en garantía',
      category: 'revision',
      humanStatus: 'Lo estamos revisando',
      statusType: 'in_progress',
      desc: 'El perito tasador está evaluando el estado del inmueble.',
    },
    {
      id: 'doc-4',
      name: 'Autorización de consulta Clearing / DGI',
      category: 'firmados',
      humanStatus: 'Firmado',
      statusType: 'success',
      desc: 'Firma electrónica completada el 02/09/2026.',
    },
    {
      id: 'doc-5',
      name: 'Minuta de Formalización Notarial',
      category: 'firmar',
      humanStatus: 'Listo para firmar',
      statusType: 'ready_to_sign',
      desc: 'Disponible para firma electrónica notarial una vez finalizada la evaluación.',
    },
  ];

  // Ayuda Contextual según etapa (Máx 3 ayudas)
  const contextualHelp = [
    {
      question: '¿Qué ocurre durante la evaluación?',
      answer: 'Nuestro equipo analiza la tasación de la propiedad y tu capacidad financiera para estructurar las mejores condiciones con un porcentaje de financiación seguro.',
    },
    {
      question: '¿Por qué necesitamos tu recibo de sueldo?',
      answer: 'Es el comprobante oficial que nos permite verificar tu margen de repago mensual y asegurar que la cuota no supere el 35% de tus ingresos.',
    },
    {
      question: '¿Qué validez legal tiene la firma electrónica?',
      answer: 'Todas las firmas se realizan bajo la Ley N° 18.600 de Uruguay, contando con plena validez notarial y jurídica.',
    },
  ];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadModalOpen(false);
    setUploadedSuccessToast(true);
    setTimeout(() => setUploadedSuccessToast(false), 4000);
  };

  const isWhiteLabel = location.pathname.startsWith('/demo/') || tenant.is_white_label;

  const innerContent = (
    <div className="space-y-7 max-w-4xl mx-auto text-left">
      
      {/* Toast de Éxito de Carga */}
      {uploadedSuccessToast && (
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Documento recibido correctamente. Ya lo estamos revisando.</span>
          </div>
          <button onClick={() => setUploadedSuccessToast(false)} className="text-emerald-200">✕</button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. CARD PROTAGONISTA: PRÓXIMO PASO                           */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-br from-[#102d49] via-[#15385b] to-[#1c4873] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/40 space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#f4b43b] bg-white/10 px-3 py-1 rounded-full border border-white/10 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
            Próximo Paso Requerido
          </span>
          <span className="text-xs text-slate-300 font-mono">Hola, {displayName} · Expediente {activeApp?.publicId || 'HPT-2026-00124'}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Necesitamos tu recibo de sueldo
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
            Para finalizar la evaluación y preparar las condiciones de tu crédito hipotecario, por favor adjuntá tu recibo de sueldo reciente o certificado contable.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setUploadDocName('Recibo de sueldo / Certificado contable');
              setUploadModalOpen(true);
            }}
            className="!bg-[#f4b43b] hover:!bg-[#e0a230] !text-[#102d49] !font-bold text-xs !rounded-xl shadow-md flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" /> Subir Documento
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setActiveTab('documentos')}
            className="!bg-white/10 hover:!bg-white/20 !text-white !border-white/20 !font-semibold text-xs !rounded-xl"
          >
            Ver todos los recaudos →
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. ESTADO DE SOLICITUD EN LENGUAJE HUMANO                    */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de tu trámite</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-[#102d49] bg-slate-100 px-2.5 py-0.5 rounded-full">
                Etapa 4 de 7
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-1">
              Tu solicitud está en evaluación
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Estamos revisando tu información, la propiedad y los documentos recibidos para estructurar la financiación.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shrink-0">
            En análisis
          </span>
        </div>

        {/* Timeline Humano de 7 Pasos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {timelineSteps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div key={step.step} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#102d49] text-[#f4b43b] shadow-sm'
                      : isCurrent
                      ? 'bg-[#102d49] text-white ring-4 ring-amber-400/40 scale-105'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-[#f4b43b]" />
                  ) : (
                    step.step
                  )}
                </div>
                <span
                  className={`text-[11px] leading-tight font-medium ${
                    isCurrent
                      ? 'text-[#102d49] font-bold'
                      : isCompleted
                      ? 'text-slate-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 9. TUS PENDIENTES (SECCIÓN DEDICADA SEPARADA)                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tus Pendientes</h3>
            <p className="text-xs text-slate-500">Acciones que requieren tu intervención directa</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            2 pendientes
          </span>
        </div>

        <div className="space-y-3">
          {/* Pendiente 1 */}
          <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 flex items-center">
                <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-700" /> Subir documento de ingresos
              </span>
              <p className="text-xs text-slate-600">Adjuntá recibo de sueldo o certificado de contador público.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setUploadDocName('Recibo de sueldo');
                setUploadModalOpen(true);
              }}
              className="!bg-[#102d49] text-white text-xs font-bold shrink-0"
            >
              Subir ahora
            </Button>
          </div>

          {/* Pendiente 2 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <Fingerprint className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Verificar identidad digital
              </span>
              <p className="text-xs text-slate-600">Completá la confirmación facial desde tu teléfono celular.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert('Abriendo validación biométrica segura Didit.')}
              className="text-xs font-bold shrink-0"
            >
              Verificar identidad
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 10. TUS DOCUMENTOS (CATEGORIZACIÓN Y ESTADOS CLAROS)          */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tus Documentos</h3>
            <p className="text-xs text-slate-500">Legajo oficial y recaudos asociados a tu solicitud</p>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'necesitamos', label: 'Necesitamos de vos' },
              { id: 'revision', label: 'En revisión' },
              { id: 'aprobados', label: 'Aprobados' },
              { id: 'firmar', label: 'Para firmar' },
              { id: 'firmados', label: 'Firmados' },
              { id: 'todos', label: 'Ver todos' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setDocCategory(cat.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  docCategory === cat.id
                    ? 'bg-[#102d49] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Documentos con estados humanos */}
        <div className="divide-y divide-slate-100 text-xs">
          {clientDocs
            .filter((d) => docCategory === 'todos' || d.category === docCategory)
            .map((doc) => (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#102d49] shrink-0" />
                    <span className="font-bold text-slate-900 text-xs">{doc.name}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] pl-6">{doc.desc}</p>
                </div>

                <div className="flex items-center space-x-3 pl-6 sm:pl-0 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      doc.statusType === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : doc.statusType === 'action_required'
                        ? 'bg-amber-50 text-amber-900 border-amber-200 font-extrabold'
                        : doc.statusType === 'ready_to_sign'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {doc.humanStatus}
                  </span>

                  {doc.category === 'necesitamos' && (
                    <button
                      onClick={() => {
                        setUploadDocName(doc.name);
                        setUploadModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#102d49] hover:underline"
                    >
                      Cargar archivo
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 11. AYUDA CONTEXTUAL INTELIGENTE (MÁX 2-3 CÁPSULAS)           */}
      {/* ============================================================ */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-[#102d49]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Preguntas Frecuentes sobre esta Etapa
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contextualHelp.map((help, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <strong className="text-xs text-[#102d49] block font-serif">{help.question}</strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">{help.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para Subir Documento */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <h3 className="text-lg font-serif font-bold text-slate-900">
              Subir {uploadDocName || 'Documento'}
            </h3>
            <p className="text-xs text-slate-500">
              Formatos aceptados: PDF, JPG, PNG (hasta 15 MB). Tus archivos quedan encriptados y protegidos.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-[#102d49] rounded-2xl p-6 text-center cursor-pointer transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  Arrastrá tu archivo o hacé click para seleccionar
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Documento cifrado bajo RLS multi-tenant
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="!bg-[#102d49] text-white font-bold"
                >
                  Confirmar y Subir
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navegación Inferior Móvil (PWA) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 lg:hidden flex items-center justify-around h-16 shadow-lg">
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'inicio' ? 'text-[#102d49] font-bold' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'documentos' ? 'text-[#102d49] font-bold' : 'text-slate-400'
          }`}
        >
          <Upload className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Documentos</span>
        </button>

        <button
          onClick={() => setActiveTab('cuenta')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'cuenta' ? 'text-[#102d49] font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Cuenta</span>
        </button>
      </nav>

    </div>
  );

  if (isWhiteLabel) {
    return (
      <TenantClientLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {innerContent}
      </TenantClientLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg pb-16 lg:pb-0">
      <Navbar />
      <main className="flex-1 py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 w-full text-left">
        {innerContent}
      </main>
      <Footer />
    </div>
  );
};

