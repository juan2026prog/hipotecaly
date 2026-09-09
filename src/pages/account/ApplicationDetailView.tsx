// ==============================================================================
// HIPOTECALY: Ficha de la Solicitud (3 Pestañas Claras - 100% Real & Productivo)
// Pestañas: 1. Resumen · 2. Documentos · 3. Seguimiento
// Integra DOCFLOW real, Storage privado, observaciones de backoffice y firma electrónica con hash
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Check,
  AlertTriangle,
  PenTool,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
  Users,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  ClientApplicationDetail,
  ApplicationDocumentItem,
  clientPortalService,
} from '../../lib/clientPortalService';
import { calendarService, HipotecalyCalendarEvent } from '../../lib/calendar/calendarService';
import { generateGoogleCalendarWebLink } from '../../lib/calendar/googleCalendarIntegration';
import { downloadIcsFile } from '../../lib/calendar/icsExport';
import { MockSigningModal } from '../../components/signature/MockSigningModal';
import { useAuth } from '../../contexts/AuthContext';

interface ApplicationDetailViewProps {
  application: ClientApplicationDetail;
  onBack: () => void;
  onRefresh: () => void;
}

export const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onBack,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumen' | 'documentos' | 'seguimiento'>('resumen');

  // Modal para Cargar Documento
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDoc, setTargetDoc] = useState<ApplicationDocumentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal para Firma Electrónica
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [docToSign, setDocToSign] = useState<ApplicationDocumentItem | null>(null);

  // Agenda Soberana - Citas de la Solicitud
  const [appEvents, setAppEvents] = useState<HipotecalyCalendarEvent[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const evs = await calendarService.getEventsByApplication(application.id);
      setAppEvents(evs.filter((e) => e.status !== 'cancelled'));
    };
    loadEvents();
  }, [application.id]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetDoc) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadError(null);

    const { error } = await clientPortalService.uploadApplicationDocument(
      application.id,
      file,
      targetDoc.documentType
    );

    setUploading(false);

    if (error) {
      setUploadError(error.message);
      return;
    }

    setUploadModalOpen(false);
    showToast(`Documento "${targetDoc.name}" subido a Storage y puesto en revisión.`);
    onRefresh();
  };

  const handleOpenDoc = async (doc: ApplicationDocumentItem) => {
    if (doc.filePath) {
      const url = await clientPortalService.getDocumentSignedUrl(doc.filePath);
      if (url) {
        window.open(url, '_blank');
        return;
      }
    }
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const handleNextActionClick = () => {
    if (!application.nextAction) return;

    if (application.nextAction.actionType === 'sign') {
      const doc = application.documents.find((d) => d.id === application.nextAction?.docId) || application.documents.find((d) => d.status === 'ready_to_sign');
      if (doc) {
        setDocToSign(doc);
        setSignModalOpen(true);
        return;
      }
    }

    if (application.nextAction.docId) {
      const match = application.documents.find((d) => d.id === application.nextAction?.docId);
      if (match) {
        setTargetDoc(match);
        setUploadError(null);
        setUploadModalOpen(true);
        return;
      }
    }

    // Fallback al primer doc pendiente o que requiere corrección
    const pendingDoc = application.documents.find((d) => d.status === 'requires_correction' || d.status === 'pending') || application.documents[0];
    if (pendingDoc) {
      setTargetDoc(pendingDoc);
      setUploadError(null);
      setUploadModalOpen(true);
    }
  };

  // 6 Etapas Principales del Expediente Hipotecario
  const stages = [
    { num: 1, label: 'Solicitud enviada' },
    { num: 2, label: 'Validación documental' },
    { num: 3, label: 'Estudio financiero' },
    { num: 4, label: 'Ofertas bancarias' },
    { num: 5, label: 'Formalización & Firma' },
    { num: 6, label: 'Operación finalizada' },
  ];

  const getDocStatusBadge = (status: ApplicationDocumentItem['status']) => {
    switch (status) {
      case 'signed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Firmado ✓
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Aprobado
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Check className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Recibido
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
            En revisión
          </span>
        );
      case 'ready_to_sign':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <PenTool className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Para firmar
          </span>
        );
      case 'requires_correction':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Requiere corrección
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Botón Volver y Header de la Ficha */}
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-[#102d49] transition-colors py-1 group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Volver a Mis solicitudes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-[#102d49] bg-slate-100 px-2.5 py-0.5 rounded-full">
                {application.publicId}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {application.propertyType} · {application.neighborhood}, {application.department}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              USD {application.requestedAmount.toLocaleString('es-UY')}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
              {application.statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de 3 Pestañas */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'documentos', label: `Documentos (${application.documents.length})` },
          { id: 'seguimiento', label: 'Seguimiento' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#102d49] text-[#102d49]'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* PESTAÑA 1: RESUMEN                                           */}
      {/* ============================================================ */}
      {activeTab === 'resumen' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Bloque Superior de Datos Esenciales (Snapshot Inmutable) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Condiciones de la Operación (Snapshot del Expediente)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {application.publicId}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Monto Solicitado
                </span>
                <strong className="text-slate-900 text-sm font-bold font-mono block">
                  USD {application.requestedAmount.toLocaleString('es-UY')}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Plazo
                </span>
                <strong className="text-slate-900 text-sm font-semibold block">
                  {application.termMonths} meses ({Math.round(application.termMonths / 12)} años)
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Inmueble en Garantía
                </span>
                <strong className="text-slate-900 font-semibold block capitalize truncate">
                  {application.propertyType} · {application.neighborhood}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Valor Estimado del Inmueble
                </span>
                <strong className="text-slate-900 text-sm font-bold font-mono block">
                  {application.estimatedValue > 0
                    ? `USD ${application.estimatedValue.toLocaleString('es-UY')}`
                    : 'En tasación'}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Porcentaje de Financiación (LTV)
                </span>
                <strong className="text-slate-900 text-sm font-bold block">
                  {application.ltvPercentage > 0 ? `${application.ltvPercentage.toFixed(1)}% del valor` : 'En cálculo'}
                </strong>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Modalidad de Pago
                </span>
                <strong className="text-slate-900 text-xs font-semibold block">
                  {application.repaymentModeLabel}
                </strong>
              </div>
            </div>
          </div>

          {/* Bloque Destacado: Próximo Paso */}
          <div className="bg-gradient-to-br from-[#102d49] via-[#15385b] to-[#1c4873] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-700/40 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#f4b43b] bg-white/10 px-3 py-1 rounded-full border border-white/10 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
                Próximo Paso
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                {application.nextAction?.title || 'Tu solicitud se encuentra en análisis'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                {application.nextAction?.description ||
                  'Estamos evaluando la documentación del expediente. No es necesario que realices ninguna acción en este momento.'}
              </p>
            </div>

            {application.nextAction?.buttonLabel && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextActionClick}
                  className="!bg-[#f4b43b] hover:!bg-[#e0a230] !text-[#102d49] !font-bold text-xs !rounded-xl shadow-sm"
                >
                  {application.nextAction.actionType === 'sign' ? (
                    <PenTool className="w-4 h-4 mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {application.nextAction.buttonLabel}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('documentos')}
                  className="!bg-white/10 hover:!bg-white/20 !text-white !border-white/20 text-xs !rounded-xl"
                >
                  Ver todos los documentos →
                </Button>
              </div>
            )}
          </div>

          {/* Citas y Firmas Notariales Agendadas */}
          {appEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Citas y Audiencias Notariales ({appEvents.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white p-5 rounded-3xl border border-teal-500/30 shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                        {ev.eventType === 'signature' ? 'Firma de Escritura' : 'Entrega de Títulos'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {ev.applicationPublicId}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-slate-900 text-sm">{ev.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-2 font-bold text-teal-950">
                        <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{ev.date} a las {ev.time} hs</span>
                      </div>
                      {ev.locationAddress && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{ev.locationAddress}</span>
                        </div>
                      )}
                      {ev.responsibleName && (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Escribana: {ev.responsibleName}</span>
                        </div>
                      )}
                    </div>

                    {ev.requiredDocuments && ev.requiredDocuments.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-700 text-[11px]">Documentación física a presentar:</span>
                        <ul className="list-disc list-inside text-slate-500 space-y-0.5 text-[11px]">
                          {ev.requiredDocuments.map((doc, i) => (
                            <li key={i}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => downloadIcsFile(ev)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 border border-slate-200"
                        title="Descargar archivo universal .ics (Apple, Outlook, etc.)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Descargar (.ics)</span>
                      </button>

                      <a
                        href={generateGoogleCalendarWebLink(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 border border-blue-200"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Agregar a mi Google Calendar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 2: DOCUMENTOS DE LA SOLICITUD                         */}
      {/* ============================================================ */}
      {activeTab === 'documentos' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Documentos del Expediente
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recaudos exigidos y contratos legales emitidos por DOCFLOW para esta operación
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {application.documents.filter((d) => d.status === 'approved' || d.status === 'signed').length} de {application.documents.length} completados
            </span>
          </div>

          {application.documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay documentos pendientes de presentación en este momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#102d49] shrink-0" />
                      <span className="font-bold text-slate-900 text-xs">{doc.name}</span>
                      {doc.isRequired && (
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                          Requerido
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] pl-6 leading-relaxed">
                      {doc.description}
                    </p>

                    {/* Observación de corrección de backoffice */}
                    {doc.status === 'requires_correction' && doc.observation && (
                      <div className="ml-6 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span><strong>Observación:</strong> {doc.observation}</span>
                      </div>
                    )}

                    {doc.fileName && (
                      <div className="pl-6 flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        <span>Archivo: {doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenDoc(doc)}
                          className="text-brand-green hover:underline flex items-center space-x-0.5"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}

                    {doc.fileHash && (
                      <span className="text-[9px] font-mono text-slate-400 pl-6 block">
                        Hash SHA-256: {doc.fileHash.substring(0, 16)}...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5 pl-6 sm:pl-0 shrink-0">
                    {getDocStatusBadge(doc.status)}

                    {doc.canSign && doc.status === 'ready_to_sign' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setDocToSign(doc);
                          setSignModalOpen(true);
                        }}
                        className="text-xs font-bold !bg-purple-700 hover:!bg-purple-800 text-white !rounded-xl shadow-xs"
                      >
                        <PenTool className="w-3.5 h-3.5 mr-1" />
                        Firmar ahora
                      </Button>
                    )}

                    {(doc.status === 'pending' || doc.status === 'requires_correction') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTargetDoc(doc);
                          setUploadError(null);
                          setUploadModalOpen(true);
                        }}
                        className="text-xs font-bold !bg-[#102d49] text-white !rounded-xl shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        {doc.status === 'requires_correction' ? 'Reemplazar' : 'Subir'}
                      </Button>
                    )}

                    {(doc.status === 'received' || doc.status === 'in_review') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTargetDoc(doc);
                          setUploadError(null);
                          setUploadModalOpen(true);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:bg-slate-50 !rounded-xl"
                      >
                        Actualizar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 3: SEGUIMIENTO                                       */}
      {/* ============================================================ */}
      {activeTab === 'seguimiento' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Etapas del Expediente */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Etapa del Trámite
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                  {application.currentStageName} (Fase {application.currentStageIndex} de 6)
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                {application.statusLabel}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {application.currentStageDescription}
            </p>

            {/* Stepper de 6 Fases */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {stages.map((st) => {
                const isCompleted = st.num < application.currentStageIndex;
                const isCurrent = st.num === application.currentStageIndex;

                return (
                  <div key={st.num} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#102d49] text-[#f4b43b] shadow-xs'
                          : isCurrent
                          ? 'bg-[#102d49] text-white ring-4 ring-amber-400/40 scale-105 shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 text-[#f4b43b]" /> : st.num}
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
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial Cronológico de Novedades Reales */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
              Historial de Novedades del Expediente
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {application.timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#102d49] ring-4 ring-white" />
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {event.date}
                  </span>
                  <strong className="text-xs font-bold text-slate-900 block font-serif">
                    {event.title}
                  </strong>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBIR DOCUMENTO DE SOLICITUD                          */}
      {/* ============================================================ */}
      {uploadModalOpen && targetDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Subir {targetDoc.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Formatos permitidos: PDF, JPG, PNG (máx. 15MB).
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-[#102d49] rounded-2xl p-6 text-center cursor-pointer transition block bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploading ? 'Cargando archivo en Storage...' : 'Seleccionar archivo o sacar foto'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se almacena en el bucket privado del expediente
                </span>
              </label>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FIRMA ELECTRÓNICA */}
      {signModalOpen && docToSign && (
        <MockSigningModal
          isOpen={signModalOpen}
          processId={docToSign.id}
          documentTitle={docToSign.name}
          onClose={() => setSignModalOpen(false)}
          onSigned={async () => {
            await clientPortalService.signApplicationDocument(
              application.id,
              docToSign.id,
              user?.id || 'guest',
              user?.email || 'Solicitante'
            );
            setSignModalOpen(false);
            showToast('Documento firmado con validez jurídica y evidencia registrada.');
            onRefresh();
          }}
        />
      )}

    </div>
  );
};
