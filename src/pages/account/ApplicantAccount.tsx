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
  FileCheck,
} from 'lucide-react';
import { acceptOffer, getPresentedOffersForBorrower, Offer } from '../../lib/offersService';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { getActiveDraft } from '../../lib/applicationService';
import { supabase } from '../../lib/supabase';
import { DocumentCard } from '../../components/docflow/DocumentCard';
import { DocumentPreviewModal } from '../../components/docflow/DocumentPreviewModal';
import { useCaseDocuments } from '../../lib/docflow/hooks';
import { GeneratedDocument } from '../../lib/docflow/types';
import { isMarketplaceEnabled } from '../../config/features';

export const ApplicantAccount: React.FC = () => {
  const { user, borrower, signOut } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const [modules, setModules] = useState(DEFAULT_MODULES_MAP);

  const [activeTab, setActiveTab] = useState<'inicio' | 'ofertas' | 'solicitud' | 'documentos' | 'mensajes' | 'cuenta' | 'creditos'>('inicio');
  const [acceptedOfferId, setAcceptedOfferId] = useState<string | null>(null);

  // Solicitud activa
  const [activeApp, setActiveApp] = useState<{ publicId: string; status: string } | null>(null);
  const [hasLoadedApp, setHasLoadedApp] = useState(false);

  // DocFlow Estados
  const [docSubFilter, setDocSubFilter] = useState<'todos' | 'firmas' | 'cargados'>('todos');
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const { documents: docFlowDocs } = useCaseDocuments(activeApp?.publicId || 'HPT-2026-00124');

  React.useEffect(() => {
    getTenantModules(tenant.id).then((m) => setModules(m));
  }, [tenant.id]);

  React.useEffect(() => {
    async function resolveActiveApp() {
      const stateId = (location.state as { publicId?: string } | null)?.publicId;
      if (stateId) {
        setActiveApp({ publicId: stateId, status: 'info_review' });
        setHasLoadedApp(true);
        return;
      }

      if (tenant.demo_mode) {
        setActiveApp({ publicId: 'HPT-2026-00124', status: 'info_review' });
        setHasLoadedApp(true);
        return;
      }

      const draft = await getActiveDraft();
      if (draft && draft.publicId) {
        setActiveApp({ publicId: draft.publicId, status: 'draft' });
        setHasLoadedApp(true);
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
      setHasLoadedApp(true);
    }
    resolveActiveApp();
  }, [tenant.id, tenant.demo_mode, location.state]);

  // Ofertas presentadas disponibles para el solicitante
  const [presentedOffers, setPresentedOffers] = useState<Offer[]>([
    {
      id: 'off-1',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      lender_id: 'c0000000-0000-0000-0000-000000000001',
      lender_name: 'Prestamista Asociado Hipotecaly',
      amount: 80000,
      currency: 'USD',
      term_months: 36,
      interest_rate: 9.5,
      rate_type: 'fixed',
      repayment_type: 'amortizing',
      estimated_monthly_payment: 2562,
      estimated_costs: 1800,
      lender_fees: 1500,
      other_costs: 300,
      early_cancellation_terms: 'Permite cancelación anticipada sin penalización a partir del mes 12.',
      notes_for_borrower: 'Propuesta de financiamiento con amortización mensual en dólares.',
      expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'presented',
      created_at: new Date().toISOString(),
    },
  ]);

  React.useEffect(() => {
    async function loadOffersFromDb() {
      if (!activeApp?.publicId) return;
      try {
        const { data: appRow } = await supabase
          .from('applications')
          .select('id')
          .eq('public_id', activeApp.publicId)
          .maybeSingle();

        const targetAppId = appRow?.id || 'e0000000-0000-0000-0000-000000000001';
        const { offers: dbOffers } = await getPresentedOffersForBorrower(targetAppId);
        if (dbOffers && dbOffers.length > 0) {
          setPresentedOffers(dbOffers);
        }
      } catch {
        // En caso de fallo de red, mantener fallback
      }
    }
    loadOffersFromDb();
  }, [activeApp?.publicId]);

  const displayName = borrower?.first_name || user?.user_metadata?.first_name || 'Solicitante';

  // Timeline de estados según Regla 28 neutralizada (White Label)
  const timelineSteps = [
    { label: 'Solicitud recibida', status: 'completed' },
    { label: 'Información en revisión', status: 'current' },
    { label: 'Propiedad y documentación', status: 'upcoming' },
    { label: 'Evaluación técnica', status: 'upcoming' },
    { label: 'Condiciones de financiamiento', status: 'upcoming' },
    { label: 'Formalización notarial', status: 'upcoming' },
    { label: 'Finalizada', status: 'upcoming' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg pb-16 lg:pb-0">
      <Navbar />

      <main className="flex-1 py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 w-full text-left">
        
        {/* Banner Bienvenida PWA */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Portal del Solicitante
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight mt-1">
              Hola, {displayName}
            </h1>
            {activeApp ? (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Expediente activo: <strong className="font-mono text-slate-800">{activeApp.publicId}</strong>
              </p>
            ) : hasLoadedApp ? (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                No tenés solicitudes activas en este momento.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Cargando expediente...</p>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link to="/solicitar" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="md" className="w-full !bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-semibold !rounded-xl !shadow-sm">
                {activeApp ? 'Continuar solicitud' : 'Iniciar solicitud'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop Tabs Header */}
        <div className="hidden lg:flex space-x-2 border-b border-slate-200 mb-6">
          {[
            { id: 'inicio', label: 'Inicio', icon: Home, visible: true },
            { id: 'ofertas', label: 'Propuestas de Financiamiento', icon: FileCheck, visible: isMarketplaceEnabled() },
            { id: 'solicitud', label: 'Mi Solicitud', icon: FileText, visible: true },
            { id: 'documentos', label: 'Documentación', icon: Upload, visible: modules.documents_enabled },
            { id: 'mensajes', label: 'Mensajes', icon: MessageSquare, visible: modules.notifications_enabled },
            { id: 'cuenta', label: 'Cuenta', icon: User, visible: true },
          ]
            .filter((t) => t.visible)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === t.id
                    ? 'border-amber-500 text-[#102d49]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
        </div>

        {/* ============================================================ */}
        {/* TAB: OFERTAS (Fase 4: Comparador y Aceptación de Ofertas)     */}
        {/* ============================================================ */}
        {activeTab === 'ofertas' && isMarketplaceEnabled() && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center font-serif">
                  <FileCheck className="w-5 h-5 mr-2 text-amber-600" />
                  Propuestas de Financiamiento Disponibles
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Revisá y compará las condiciones y alternativas disponibles para tu expediente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presentedOffers.map((off) => {
                  const isAccepted = acceptedOfferId === off.id || off.status === 'accepted';
                  return (
                    <div
                      key={off.id}
                      className={`p-5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'border-amber-400 bg-amber-50/40 shadow-md'
                          : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {off.lender_name || 'Propuesta de Financiamiento'}
                          </span>
                          <div className="text-2xl font-black text-slate-900 mt-0.5">
                            USD {off.amount.toLocaleString('es-UY')}
                          </div>
                        </div>
                        {isAccepted ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-amber-600" /> Propuesta Aceptada
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            Disponible
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-lg text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tasa Anual</span>
                          <strong className="text-slate-900">{off.interest_rate}% ({off.rate_type})</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Plazo</span>
                          <strong className="text-slate-900">{off.term_months} meses</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Cuota Est.</span>
                          <strong className="text-amber-800">USD {off.estimated_monthly_payment}</strong>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pb-4 border-b border-slate-100">
                        <div><strong>Tipo de amortización:</strong> {off.repayment_type === 'amortizing' ? 'Mensual (Capital + Interés)' : 'Solo intereses'}</div>
                        <div><strong>Gastos estimativos:</strong> USD {off.estimated_costs}</div>
                        <div><strong>Condición de prepago:</strong> {off.early_cancellation_terms}</div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Válida hasta: {new Date(off.expires_at || Date.now()).toLocaleDateString('es-UY')}
                        </span>
                        {!isAccepted && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-semibold !rounded-lg"
                            onClick={async () => {
                              setAcceptedOfferId(off.id);
                              setPresentedOffers((prev) =>
                                prev.map((o) =>
                                  o.id === off.id ? { ...o, status: 'accepted' } : o
                                )
                              );
                              try {
                                await acceptOffer(off.id, off.application_id);
                              } catch {
                                // fallback en entorno de prueba
                              }
                            }}
                          >
                            Aceptar Propuesta <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
                <strong>Aviso sobre la aceptación:</strong> La aceptación de una propuesta de financiamiento no constituye aún contrato definitivo ni escritura pública. A continuación se coordinará la revisión notarial de títulos y certificados de la propiedad para la formalización del préstamo con garantía hipotecaria.
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: INICIO & RESUMEN DE SOLICITUD                         */}
        {/* ============================================================ */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            
            {/* Timeline Horizontal / Vertical */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
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
                          ? 'bg-[#102d49] text-[#f4b43b] shadow-sm'
                          : step.status === 'current'
                          ? 'bg-[#102d49] text-white ring-4 ring-amber-400/30'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#f4b43b]" />
                      ) : step.status === 'current' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f4b43b] animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-medium ${
                        step.status === 'current'
                          ? 'text-[#102d49] font-bold'
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
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Monto Solicitado</span>
                <div className="text-2xl font-black text-[#102d49] tracking-tight mt-1 font-serif">
                  USD 80.000
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Plazo: 36 meses</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Inmueble en Garantía</span>
                <div className="text-xl font-bold text-slate-900 tracking-tight mt-1 truncate">
                  Casa en Montevideo
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Valuación declarada: USD 240.000</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">LTV Preliminar</span>
                <div className="text-2xl font-black text-amber-700 tracking-tight mt-1 font-serif">
                  33.3%
                </div>
                <span className="text-[11px] text-amber-800 font-semibold mt-1 block">Dentro del rango elegible (40%)</span>
              </div>
            </div>

            {/* Próximo Paso y Acciones Inmediatas */}
            <div className="bg-gradient-to-r from-[#102d49] to-[#173a5e] text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#f4b43b] uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#f4b43b]" /> Próximo Paso
                </span>
                <h4 className="text-lg font-serif font-bold text-white">Subir documentación de ingresos</h4>
                <p className="text-xs text-slate-300 max-w-md">
                  Para emitir una propuesta formal, por favor adjuntá tu recibo de sueldo o certificación notarial/contable.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('documentos')}
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#f4b43b] hover:bg-[#e0a230] text-[#102d49] text-xs font-bold shadow-sm transition-colors shrink-0"
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
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900">Documentación del Expediente</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Legajo oficial autollenado y respaldado con validez legal según Ley N° 18.600.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full">
                    ✓ Encriptación RLS
                  </span>
                </div>
              </div>

              {/* Sub-pestañas */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setDocSubFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    docSubFilter === 'todos' ? 'bg-[#102d49] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Documentos Generados ({docFlowDocs.length})
                </button>
                <button
                  onClick={() => setDocSubFilter('firmas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    docSubFilter === 'firmas' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Para Firmar ({docFlowDocs.filter((d) => d.status === 'ready_for_signature' || d.status === 'sent_for_signature').length})
                </button>
                <button
                  onClick={() => setDocSubFilter('cargados')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    docSubFilter === 'cargados' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Recaudos Solicitados
                </button>
              </div>

              {/* Lista según filtro */}
              {docSubFilter !== 'cargados' ? (
                <div className="space-y-3 pt-2">
                  {docFlowDocs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        Aún no se han generado formularios oficiales para este expediente.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Aparecerán aquí tus autorizaciones de clearing, consentimientos y solicitudes de crédito.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(docSubFilter === 'firmas'
                        ? docFlowDocs.filter((d) => d.status === 'ready_for_signature' || d.status === 'sent_for_signature')
                        : docFlowDocs
                      ).map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onPreview={(d) => setPreviewDoc(d)}
                          onDownload={(d) => setPreviewDoc(d)}
                          onSign={(d) => setPreviewDoc(d)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
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
                        <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{doc.name}</p>
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
                        <button className="text-xs font-bold text-amber-800 hover:underline">
                          Cargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DocumentPreviewModal
              isOpen={Boolean(previewDoc)}
              document={previewDoc}
              onClose={() => setPreviewDoc(null)}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MENSAJES DEL EXPEDIENTE                               */}
        {/* ============================================================ */}
        {activeTab === 'mensajes' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-slate-900">Mensajes y Notificaciones</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">Equipo de Análisis Hipotecario</span>
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-serif font-bold text-slate-900">Datos de tu Cuenta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Nombre Completo</label>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{displayName}</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Email Registrado</label>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.email || borrower?.email || 'ignacio@ejemplo.com'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link to="/privacidad" className="text-xs text-amber-800 hover:underline font-semibold">
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
      {/* NAVEGACIÓN INFERIOR MÓVIL (PWA Mobile-First)                  */}
      {/* ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 lg:hidden flex items-center justify-around h-16 shadow-lg">
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'inicio' ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        {isMarketplaceEnabled() && (
          <button
            onClick={() => setActiveTab('ofertas')}
            className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
              activeTab === 'ofertas' ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            <FileCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Propuestas</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('solicitud')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'solicitud' ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Solicitud</span>
        </button>

        {modules.documents_enabled && (
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
              activeTab === 'documentos' ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            <Upload className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Documentos</span>
          </button>
        )}

        {modules.notifications_enabled && (
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
              activeTab === 'mensajes' ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Mensajes</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('cuenta')}
          className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
            activeTab === 'cuenta' ? 'text-amber-600' : 'text-slate-400'
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
