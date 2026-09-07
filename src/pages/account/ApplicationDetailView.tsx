// ==============================================================================
// HIPOTECALY: Ficha de la Solicitud (3 Pestañas Claras)
// Pestañas: 1. Resumen · 2. Documentos · 3. Seguimiento
// ==============================================================================

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  ClientApplicationDetail,
  ApplicationDocumentItem,
  clientPortalService,
} from '../../lib/clientPortalService';
import { MockSigningModal } from '../../components/signature/MockSigningModal';

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
  const [activeTab, setActiveTab] = useState<'resumen' | 'documentos' | 'seguimiento'>('resumen');

  // Modal para Cargar Documento
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDoc, setTargetDoc] = useState<ApplicationDocumentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal para Firma Electrónica
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [docToSign, setDocToSign] = useState<ApplicationDocumentItem | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetDoc) return;
    const file = e.target.files[0];
    setUploading(true);

    await clientPortalService.uploadApplicationDocument(
      application.publicId,
      targetDoc.id,
      file.name
    );

    setUploading(false);
    setUploadModalOpen(false);
    showToast(`Documento "${targetDoc.name}" cargado correctamente.`);
    onRefresh();
  };

  const handleNextActionUpload = () => {
    if (application.nextAction?.docId) {
      const match = application.documents.find((d) => d.id === application.nextAction?.docId);
      if (match) {
        setTargetDoc(match);
        setUploadModalOpen(true);
        return;
      }
    }
    // Fallback al primer doc pendiente
    const pendingDoc = application.documents.find((d) => d.status === 'pending') || application.documents[1];
    setTargetDoc(pendingDoc);
    setUploadModalOpen(true);
  };

  // 7 Etapas del Expediente
  const stages = [
    { num: 1, label: 'Solicitud recibida' },
    { num: 2, label: 'Documentación' },
    { num: 3, label: 'Evaluación' },
    { num: 4, label: 'Condiciones' },
    { num: 5, label: 'Formalización' },
    { num: 6, label: 'Firma' },
    { num: 7, label: 'Finalizada' },
  ];

  const getDocStatusBadge = (status: ApplicationDocumentItem['status']) => {
    switch (status) {
      case 'approved':
      case 'signed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {status === 'signed' ? 'Firmado' : 'Aprobado'}
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
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200">✕</button>
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
          
          {/* Bloque Superior de Datos Esenciales */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Condiciones de la Operación
              </span>
              <span className="text-xs text-slate-400">
                Expediente {application.publicId}
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
                  {application.termMonths} meses ({application.termMonths / 12} años)
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
                  USD {application.estimatedValue.toLocaleString('es-UY')}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Porcentaje de Financiación
                </span>
                <strong className="text-slate-900 text-sm font-bold block">
                  {application.ltvPercentage.toFixed(1)}% del valor
                </strong>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Tipo de Pago de la Operación
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
                {application.nextAction?.title || 'Tu solicitud está siendo evaluada'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                {application.nextAction?.description ||
                  'Estamos analizando los títulos de propiedad y la documentación del expediente. No necesitás hacer nada por ahora.'}
              </p>
            </div>

            {application.nextAction?.buttonLabel && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextActionUpload}
                  className="!bg-[#f4b43b] hover:!bg-[#e0a230] !text-[#102d49] !font-bold text-xs !rounded-xl shadow-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
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
                Recaudos exigidos específicamente para la estructuración y formalización de esta solicitud
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {application.documents.filter((d) => d.status === 'approved' || d.status === 'signed').length} de {application.documents.length} completados
            </span>
          </div>

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
                  {doc.fileName && (
                    <span className="text-[10px] font-mono text-slate-400 pl-6 block">
                      Archivo: {doc.fileName} · Actualizado el {doc.updatedAt}
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
                        setUploadModalOpen(true);
                      }}
                      className="text-xs font-bold !bg-[#102d49] text-white !rounded-xl shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Subir
                    </Button>
                  )}

                  {(doc.status === 'received' || doc.status === 'in_review' || doc.status === 'approved') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetDoc(doc);
                        setUploadModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:bg-slate-50 !rounded-xl"
                    >
                      Reemplazar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                  {application.currentStageName} (Etapa {application.currentStageIndex} de 7)
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                {application.statusLabel}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {application.currentStageDescription}
            </p>

            {/* Stepper de 7 Etapas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
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

          {/* Historial Cronológico de Novedades */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
              Historial de Novedades
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

            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-[#102d49] rounded-2xl p-6 text-center cursor-pointer transition block bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploading ? 'Cargando archivo...' : 'Seleccionar archivo o sacar foto'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se sincroniza automáticamente con el expediente
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
          onSigned={() => {
            setSignModalOpen(false);
            showToast('Documento firmado con validez jurídica.');
            onRefresh();
          }}
        />
      )}

    </div>
  );
};
