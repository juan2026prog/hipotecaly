import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  ArrowLeft,
  FileText,
  Home,
  CheckCircle2,
  FileSignature,
  Stamp,
  Plus,
  ShieldCheck,
  Eye,
  Sparkles,
  AlertTriangle,
  Clock,
  Building,
  History,
  X,
  Lock,
  Check,
  Award,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { getNotaryStatusLabel, NotaryStatus, NotaryObservation } from '../../lib/types';
import {
  NotarialRequirementsEngine,
  DynamicNotaryRequirement,
  CaseNotarialContext,
} from '../../lib/notarialRequirementsEngine';
import { googleCalendarService, CalendarEventSchedule, getAvailableCalendarSlots } from '../../lib/calendar/googleCalendarService';
import { DocumentGenerationModal } from '../../components/docflow/DocumentGenerationModal';
import { AdvancedSignatureModal } from '../../components/signature/AdvancedSignatureModal';
import { SignatureEvidenceModal } from '../../components/signature/SignatureEvidenceModal';
import { NotaryElectronicSupportBadge } from '../../components/signature/NotaryElectronicSupportBadge';

export const NotaryApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'revision' | 'documentos' | 'escritura_firma' | 'historial'>('resumen');

  // Motor Notarial Dinámico
  const [dynamicReqs, setDynamicReqs] = useState<DynamicNotaryRequirement[]>([]);

  // Observaciones
  const [observations, setObservations] = useState<NotaryObservation[]>([]);

  // Modal para nueva observación
  const [showNewObsModal, setShowNewObsModal] = useState(false);
  const [newObsTitle, setNewObsTitle] = useState('');
  const [newObsDesc, setNewObsDesc] = useState('');
  const [newObsType, setNewObsType] = useState<any>('documental');
  const [newObsSeverity, setNewObsSeverity] = useState<any>('requiere_correccion');
  const [newObsResponsible, setNewObsResponsible] = useState<'Cliente' | 'Backoffice' | 'Acreedor' | 'Escribano'>('Cliente');
  const [savingObs, setSavingObs] = useState(false);

  // Modales y Post-Firma
  const [showDocGen, setShowDocGen] = useState(false);
  const [showFeaModal, setShowFeaModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const evidenceProcessId = 'sp-demo-002';
  const [signedSuccessToast, setSignedSuccessToast] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Registro Post-Firma
  const [registrationEntryNumber, setRegistrationEntryNumber] = useState('2026-REG-84912');
  const [registrationStatus, setRegistrationStatus] = useState<'presentado' | 'en_tramite' | 'inscripto'>('en_tramite');
  const [savedRegistration, setSavedRegistration] = useState(false);

  // Estado de confirmación profesional por bloque
  const [confirmedBlocks, setConfirmedBlocks] = useState<Record<string, { confirmed: boolean; by: string; at: string }>>({
    partes: { confirmed: true, by: 'Esc. María Pérez Morales', at: '07/09/2026 · 11:20' },
    titularidad: { confirmed: true, by: 'Esc. María Pérez Morales', at: '07/09/2026 · 11:25' },
    catastro: { confirmed: true, by: 'Esc. María Pérez Morales', at: '07/09/2026 · 11:40' },
    registros: { confirmed: true, by: 'Esc. María Pérez Morales', at: '07/09/2026 · 11:45' },
  });

  // Modal de Evidencia IA
  const [evidenceModalAiData, setEvidenceModalAiData] = useState<{ title: string; text: string; sources: string[] } | null>(null);

  // Modal de Fundamento Notarial
  const [legalBasisModalData, setLegalBasisModalData] = useState<{ title: string; basis: string; description: string } | null>(null);

  // Gestión de Originales
  const [requiresOriginals, setRequiresOriginals] = useState<boolean | null>(true);
  const [selectedOriginalDocs, setSelectedOriginalDocs] = useState<string[]>([
    'Escritura pública de compraventa antecedente matriz 2014',
    'Testimonio de Capitulaciones Matrimoniales inscripto',
  ]);
  const [showOriginalsModal, setShowOriginalsModal] = useState(false);
  const [newOriginalDocInput, setNewOriginalDocInput] = useState('');

  // Coordinación con Google Calendar
  const [showScheduleSignModal, setShowScheduleSignModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('2026-09-15');
  const [scheduleTime, setScheduleTime] = useState('15:30');
  const [scheduleLocation, setScheduleLocation] = useState('Estudio Fernández & Asociados (Rincón 487 Piso 3)');
  const [scheduledEvent, setScheduledEvent] = useState<CalendarEventSchedule | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const appData = await notaryService.getNotaryApplicationDetail(id, user?.id || 'u-test-notary');
      setApp(appData);

      const context: CaseNotarialContext = {
        maritalStatus: 'casado_capitulaciones',
        propertyOrigin: 'compraventa',
        ownership: 'propietario_unico',
        cadastreType: 'comun',
        isBorrowerOwner: true,
        isLenderCompany: true,
        hasForeignDocuments: false,
      };

      const reqs = NotarialRequirementsEngine.generateRequirements(context);
      setDynamicReqs(reqs);

      const obs = await notaryService.getNotaryObservations(appData.id);
      setObservations(obs);

      const ev = googleCalendarService.getEventByApplication(appData.id);
      setScheduledEvent(ev);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.id]);

  const handleToggleBlockConfirm = (blockKey: string) => {
    const current = confirmedBlocks[blockKey];
    if (current?.confirmed) {
      const updated = { ...confirmedBlocks };
      delete updated[blockKey];
      setConfirmedBlocks(updated);
    } else {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-UY') + ' · ' + now.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
      setConfirmedBlocks({
        ...confirmedBlocks,
        [blockKey]: {
          confirmed: true,
          by: 'Esc. María Pérez Morales',
          at: dateStr,
        },
      });
    }
  };

  const handleApproveNotaryReview = async () => {
    if (!app) return;
    const hasBlocking = observations.some((o) => o.status === 'open' && o.severity_level === 'bloqueante');
    if (hasBlocking) {
      alert('BLOQUEO JURÍDICO: Debe subsanar las observaciones bloqueantes antes de aprobar la revisión notarial.');
      return;
    }

    const nextStatus: NotaryStatus = requiresOriginals ? 'originals_required' : 'signature_to_coordinate';
    setApp({ ...app, notary_status: nextStatus });
    await notaryService.updateNotaryStatus(app.id, app.organization_id, nextStatus);
    setStatusToast('🟢 Revisión Notarial Aprobada conforme');
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleConfirmScheduleSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    const newEv = await googleCalendarService.scheduleEvent({
      applicationId: app.id,
      applicationPublicId: app.public_id,
      type: 'firma_escritura',
      title: `Firma Matriz Hipotecaria — ${app.borrower?.first_name} ${app.borrower?.last_name}`,
      date: scheduleDate,
      time: scheduleTime,
      durationMinutes: 45,
      location: scheduleLocation,
      locationType: 'estudio',
      participants: [
        { name: `${app.borrower?.first_name} ${app.borrower?.last_name}`, role: 'Deudor', email: app.borrower?.email || 'cliente@ejemplo.com' },
        { name: 'Esc. María Pérez Morales', role: 'Escribano', email: 'maria.perez@notarios.org.uy' },
        { name: 'Mateo Silva (Nova Capital)', role: 'Acreedor', email: 'mateo.silva@novacapital.uy' },
      ],
      reminders: { hours24: true, hours2: true },
      googleMeetLink: 'https://meet.google.com/hpt-notary-sign',
      createdBy: 'Esc. María Pérez Morales',
    });

    setScheduledEvent(newEv);
    setApp({ ...app, notary_status: 'signature_scheduled' });
    await notaryService.updateNotaryStatus(app.id, app.organization_id, 'signature_scheduled');
    setShowScheduleSignModal(false);
    setStatusToast('📅 Firma Agendada y sincronizada con Google Calendar');
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !newObsTitle) return;
    setSavingObs(true);
    const { data } = await notaryService.createNotaryObservation({
      application_id: app.id,
      organization_id: app.organization_id,
      title: newObsTitle,
      description: newObsDesc,
      observation_type: newObsType,
      severity_level: newObsSeverity,
      status: 'open',
      responsible_id: newObsResponsible,
      created_by: user?.id,
    });
    if (data) {
      setObservations([data, ...observations]);
      setShowNewObsModal(false);
      setNewObsTitle('');
      setNewObsDesc('');
    }
    setSavingObs(false);
  };

  const handleResolveObs = async (obsId: string) => {
    if (!app) return;
    await notaryService.resolveNotaryObservation(obsId, app.organization_id, app.id, user?.id || 'u-test-notary', 'Resuelto conforme por la escribana.');
    setObservations(
      observations.map((o) => (o.id === obsId ? { ...o, status: 'resolved', resolved_at: new Date().toISOString() } : o))
    );
  };

  if (loading || !app) {
    return (
      <NotaryLayout title="Expediente Notarial">
        <div className="p-16 text-center text-xs text-slate-500 space-y-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <span>Cargando mesa de revisión notarial...</span>
        </div>
      </NotaryLayout>
    );
  }

  const financingPct = app.property?.estimated_value
    ? Math.round((app.requested_amount / app.property.estimated_value) * 100)
    : 35;

  const openObsCount = observations.filter((o) => o.status === 'open').length;
  const hasBlockingObs = observations.some((o) => o.status === 'open' && o.severity_level === 'bloqueante');

  // Determinar color de semáforo jurídico
  const juridicalStatusColor = hasBlockingObs
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : openObsCount > 0
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const juridicalStatusText = hasBlockingObs
    ? '🔴 Bloqueado (Observaciones críticas)'
    : openObsCount > 0
    ? '🟡 Requiere revisión notarial'
    : '🟢 Revisión notarial aprobada';

  return (
    <NotaryLayout title={`Expediente ${app.public_id}`}>
      {/* Toast de confirmación de estado */}
      {statusToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-teal-500/50 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Barra Superior con Botón Volver y Badge del Workflow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to={`${basePath}/expedientes`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Expedientes</span>
          </Link>

          {/* Indicador de Workflow (Reemplaza al selector manual libre) */}
          <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Etapa:</span>
            <span className="font-extrabold text-xs text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
              {getNotaryStatusLabel(app.notary_status || 'under_review')}
            </span>
          </div>
        </div>

        {/* HEADER PRINCIPAL DEL EXPEDIENTE - Comprensión en 5 segundos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono tracking-wider">
                  {app.public_id}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${juridicalStatusColor}`}>
                  {juridicalStatusText}
                </span>
                <NotaryElectronicSupportBadge />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{app.borrower?.first_name} {app.borrower?.last_name}</span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-slate-600 font-medium text-base">{app.property?.address}, {app.property?.department}</span>
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewObsModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Observación</span>
              </button>
            </div>
          </div>

          {/* Tarjetas rápidas de datos esenciales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monto Préstamo</div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                {app.currency === 'USD' ? 'USD ' : 'UYU '}
                {Number(app.requested_amount).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tasación Inmueble</div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                USD {Number(app.property?.estimated_value || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Porcentaje Financiación</div>
              <div className="text-base font-black text-teal-700 mt-0.5 font-mono">
                {financingPct}%
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Padrón Catastral</div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                N° {app.property?.cadastral_number || '14.892'} ({app.property?.department || 'Montevideo'})
              </div>
            </div>
          </div>
        </div>

        {/* 5 PESTAÑAS PRINCIPALES DE LA MESA NOTARIAL */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'resumen'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>1. Resumen</span>
          </button>

          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'revision'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Revisión Jurídica</span>
            {openObsCount > 0 && (
              <span className="ml-1 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {openObsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('documentos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'documentos'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Documentos</span>
          </button>

          <button
            onClick={() => setActiveTab('escritura_firma')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'escritura_firma'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>4. Escritura y Firma</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'historial'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>5. Historial</span>
          </button>
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}

        {/* PESTAÑA 1: RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* Banner de Próxima Acción Inmediata */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-500/30">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/40 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                    Próxima acción inmediata
                  </div>
                  <div className="text-sm font-bold text-white">
                    {hasBlockingObs
                      ? 'Subsanar la observación bloqueante en el estudio de títulos.'
                      : openObsCount > 0
                      ? 'Revisar certificados de gravámenes y capitulaciones matrimoniales.'
                      : scheduledEvent
                      ? `Firma agendada para el ${scheduledEvent.date} a las ${scheduledEvent.time} hs.`
                      : 'Revisión notarial aprobada. Proceder a coordinar la firma con Google Calendar.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (hasBlockingObs || openObsCount > 0) setActiveTab('revision');
                  else if (!scheduledEvent) setShowScheduleSignModal(true);
                  else setActiveTab('escritura_firma');
                }}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-colors shadow-lg shadow-teal-500/20 shrink-0 self-start sm:self-center"
              >
                {scheduledEvent ? 'Ver firma agendada →' : openObsCount > 0 ? 'Revisar observaciones →' : 'Coordinar firma →'}
              </button>
            </div>

            {/* Diagnóstico Previo IA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    HIPOTECALY analizó el expediente
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  47 verificaciones ejecutadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-emerald-950">✓ 43 Conformes</div>
                    <div className="text-xs text-emerald-700 font-medium">Sin inconsistencias detectadas</div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-amber-950">⚠ 3 Requieren Revisión</div>
                    <div className="text-xs text-amber-700 font-medium">Verificados por el escribano</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-blue-950">✕ 1 Pendiente</div>
                    <div className="text-xs text-blue-700 font-medium">Actualización DGI certificado</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ficha de Operación Comercial (Fuente de verdad inmutable) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Términos Económicos y Comerciales (Aprobados por Comité de Riesgo)
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  Inmutable para Escribano
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Acreedor Hipotecario</span>
                  <div className="font-bold text-slate-900 text-sm">Fondo Inversor Privado Nova Capital</div>
                  <div className="text-slate-500 text-[11px]">RUT: 21.908.411.0012</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Tasa Efectiva Anual (TEA)</span>
                  <div className="font-bold text-slate-900 text-sm">11.5% USD fija</div>
                  <div className="text-slate-500 text-[11px]">Plazo: 36 meses amortizable</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Garantía Hipotecaria</span>
                  <div className="font-bold text-slate-900 text-sm">Primer Rango / Grado 1</div>
                  <div className="text-slate-500 text-[11px]">Padrón 14.892 Montevideo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: REVISIÓN JURÍDICA */}
        {activeTab === 'revision' && (
          <div className="space-y-6">
            {/* Banner de Aprobación Global de Revisión */}
            <div className="bg-white p-5 rounded-2xl border border-teal-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Estado General de Revisión Jurídica</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confirma cada bloque tras revisar las evidencias previas procesadas por HIPOTECALY.
                </p>
              </div>

              <button
                onClick={handleApproveNotaryReview}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Aprobar Revisión Notarial</span>
              </button>
            </div>

            {/* 7 Bloques Homogéneos de Revisión */}

            {/* Bloque 1: Partes y Representación */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      1. Identificación de las Partes y Capacidad
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Sin inconsistencias aparentes · Fuentes analizadas: 2
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setEvidenceModalAiData({
                        title: 'Evidencia: Identificación y Representación',
                        text: 'Cotejo automatizado realizado entre CI digital del deudor y testimonio de personería y facultades del representante de Nova Capital.',
                        sources: ['C.I. 4.218.930-5 (DNIC)', 'Poder de Representación Nova Capital'],
                      })
                    }
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold"
                  >
                    Ver evidencia
                  </button>
                  <button
                    onClick={() => handleToggleBlockConfirm('partes')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.partes?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.partes?.confirmed ? `✓ Confirmado (${confirmedBlocks.partes.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <div className="font-bold text-slate-800">Deudor / Propietario</div>
                  <div className="text-slate-600">{app.borrower?.first_name} {app.borrower?.last_name} (C.I. 4.218.930-5)</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <div className="font-bold text-slate-800">Acreedor / Fondo</div>
                  <div className="text-slate-600">Fondo Inversor Privado Nova Capital (RUT 21.908.411.0012)</div>
                </div>
              </div>
            </div>

            {/* Bloque 2: Estado Civil y Régimen Matrimonial */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      2. Estado Civil y Régimen Patrimonial
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟡 IA: Capitulaciones matrimoniales requieren confirmación notarial · Fuentes: 2
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setEvidenceModalAiData({
                        title: 'Evidencia: Capitulaciones Matrimoniales Inscritas',
                        text: 'Las capitulaciones matrimoniales fueron otorgadas el 14/05/2018 ante el Esc. Roberto Gómez e inscriptas en el Registro Nacional de Actos Personales con el N° 4512/2018. Régimen de separación de bienes.',
                        sources: ['Testimonio de Capitulaciones Matrimoniales (PDF)', 'Certificado DGR Actos Personales'],
                      })
                    }
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold"
                  >
                    Ver evidencia
                  </button>
                  <button
                    onClick={() => handleToggleBlockConfirm('estado_civil')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.estado_civil?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.estado_civil?.confirmed ? `✓ Confirmado (${confirmedBlocks.estado_civil.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deudor casado con capitulaciones matrimoniales inscriptas. Conforme al régimen notarial uruguayo, el bien es propio y no requiere consentimiento del cónyuge (Art. 1970 Código Civil).
              </p>
            </div>

            {/* Bloque 3: Titularidad y Derechos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      3. Titularidad y Derechos Reales
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Dominio 100% pleno en titular único · Fuentes: 2
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setEvidenceModalAiData({
                        title: 'Evidencia: Titularidad Dominial',
                        text: 'El deudor es titular exclusivo del 100% del dominio del padrón 14.892 sin usufructos ni gravámenes reales precedentes.',
                        sources: ['Matriz de Compraventa 2014', 'Certificado DGR Inmobiliaria'],
                      })
                    }
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold"
                  >
                    Ver evidencia
                  </button>
                  <button
                    onClick={() => handleToggleBlockConfirm('titularidad')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.titularidad?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.titularidad?.confirmed ? `✓ Confirmado (${confirmedBlocks.titularidad.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                Propietario único del inmueble. No se detectan desmembramientos de dominio ni tercerías.
              </div>
            </div>

            {/* Bloque 4: Cadena Dominial (30 Años) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      4. Cadena Dominial (Estudio de Títulos 30 Años)
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Tracto sucesivo ininterrumpido (1994 - 2026) · Fuentes: 3
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleBlockConfirm('cadena')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.cadena?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.cadena?.confirmed ? `✓ Confirmado (${confirmedBlocks.cadena.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">2014 — Compraventa Actual</div>
                    <div className="text-slate-500 text-[11px]">Esc. Alberto Rossi | Inscripta en Registro con el N° 8901/2014.</div>
                  </div>
                  <button
                    onClick={() =>
                      setEvidenceModalAiData({
                        title: 'Título 2014: Compraventa',
                        text: 'El deudor adquirió el padrón por un precio de USD 190.000 con posesión efectiva.',
                        sources: ['Copia Simple Matriz 2014'],
                      })
                    }
                    className="text-xs text-teal-700 font-bold"
                  >
                    Ver detalle
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">1994 — Partición Judicial y Adjudicación</div>
                    <div className="text-slate-500 text-[11px]">Juzgado Letrado de Familia 4° Turno | Inscripción N° 1205/1994.</div>
                  </div>
                  <button
                    onClick={() =>
                      setEvidenceModalAiData({
                        title: 'Título 1994: Partición',
                        text: 'Partición que adjudica el 100% del inmueble al causante. Cumple prescripción treintenaria.',
                        sources: ['Oficio Judicial Inscripción 1994'],
                      })
                    }
                    className="text-xs text-teal-700 font-bold"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>

            {/* Bloque 5: Catastro y Tributos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      5. Catastro y Tributos Inmobiliarios
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Cédula informada vigente y al día · Fuentes: 2
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleBlockConfirm('catastro')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.catastro?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.catastro?.confirmed ? `✓ Confirmado (${confirmedBlocks.catastro.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-950">Dirección Nacional de Catastro (DNC)</div>
                  <div className="text-[11px] text-emerald-700">Cédula Catastral Informada N° 145.892 (Valor Real $ 4.850.000)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            </div>

            {/* Bloque 6: Situación Registral (DGR) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      6. Situación Registral (DGR)
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Libre de gravámenes, embargos e interdicciones · Fuentes: 2
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleBlockConfirm('registros')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.registros?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.registros?.confirmed ? `✓ Confirmado (${confirmedBlocks.registros.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">Registro Inmobiliario</div>
                    <div className="text-[11px] text-emerald-700">Certificado N° 84.192: Libre de embargos e hipotecas</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">Actos Personales</div>
                    <div className="text-[11px] text-emerald-700">Sin inhibiciones ni interdicciones registradas</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              </div>
            </div>

            {/* Bloque 7: Identidad Digital y Debida Diligencia (Didit KYC) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      7. Identidad y Debida Diligencia (Didit Protocol)
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    🟢 IA: Identidad digital verificada con prueba de vida y listas GAFI/PEP conformes
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleBlockConfirm('identidad')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      confirmedBlocks.identidad?.confirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {confirmedBlocks.identidad?.confirmed ? `✓ Confirmado (${confirmedBlocks.identidad.at})` : '⏳ Confirmar'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Identidad Digital</div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">Verificada por Didit</div>
                  <div className="text-[10px] text-slate-500">Prueba de vida y DocMatch 99.4%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Listas PEP / GAFI / OFAC</div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">Sin Coincidencias</div>
                  <div className="text-[10px] text-slate-500">Revisado en tiempo real</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Revisión Profesional</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {confirmedBlocks.identidad?.confirmed ? '✓ Convalidada' : '⏳ Pendiente'}
                  </div>
                  <div className="text-[10px] text-slate-500">Decisión notarial profesional</div>
                </div>
              </div>
            </div>

            {/* MÓDULO OPERATIVO: DOCUMENTACIÓN ORIGINAL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Documentación Original (Decisión Profesional Notarial)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {requiresOriginals ? '✓ Originales Requeridos' : 'No se requieren originales'}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                ¿Requiere la presentación de documentos físicos originales antes del acto de firma?
              </p>

              <div className="flex items-center space-x-4 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="requiresOrig"
                    checked={requiresOriginals === false}
                    onChange={() => setRequiresOriginals(false)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>No (Suficiente con cotejo digital verificado)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="requiresOrig"
                    checked={requiresOriginals === true}
                    onChange={() => setRequiresOriginals(true)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Sí (Se solicitarán originales para cotejo notarial)</span>
                </label>
              </div>

              {requiresOriginals && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 text-xs">
                  <div className="font-bold text-slate-800">Documentos físicos a solicitar:</div>
                  <div className="space-y-1.5">
                    {selectedOriginalDocs.map((doc, i) => (
                      <div key={i} className="flex items-center space-x-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <span className="text-[11px] text-teal-800 font-bold">
                      Estado: ✓ Originales recibidos y cotejados por Esc. María Pérez Morales
                    </span>
                    <button
                      onClick={() => setShowOriginalsModal(true)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      Editar Solicitud de Originales
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Observaciones del Expediente */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Observaciones Notariales del Expediente ({observations.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewObsModal(true)}
                  className="text-xs text-teal-700 hover:text-teal-900 font-bold inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Observación</span>
                </button>
              </div>

              {observations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No existen observaciones activas en este expediente. Todo en orden.
                </div>
              ) : (
                <div className="space-y-3">
                  {observations.map((obs) => {
                    const isBloq = obs.severity_level === 'bloqueante';
                    return (
                      <div
                        key={obs.id}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          obs.status === 'resolved'
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : isBloq
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-amber-50/70 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isBloq ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                              }`}
                            >
                              {isBloq ? 'Bloqueante' : 'Requiere Corrección'}
                            </span>
                            <span className="font-black text-slate-900">{obs.title}</span>
                          </div>
                          {obs.status === 'resolved' ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ✓ Subsanado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleResolveObs(obs.id)}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-[11px] transition-colors"
                            >
                              Marcar como Conforme
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 font-medium">{obs.description}</p>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50">
                          <span>Responsable: <strong>{obs.responsible_id || 'Cliente'}</strong></span>
                          <span>Tipo: {obs.observation_type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: DOCUMENTOS (Sin Ruido Visual) */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-teal-950 font-bold">
                  Documentos clasificados y vinculados automáticamente por IA según el contexto del caso.
                </span>
              </div>
              <span className="font-mono font-bold text-teal-800">
                {dynamicReqs.length} Documentos Requeridos
              </span>
            </div>

            {/* Documentos que Requieren Atención */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Requieren Atención Notarial</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dynamicReqs.slice(0, 2).map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{req.title}</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        ⚠ Revisión requerida
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{req.ai_finding?.summary || 'HIPOTECALY verificó existencia e inscripción.'}</p>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setEvidenceModalAiData({
                              title: req.title,
                              text: req.ai_finding?.summary || 'Verificado conforme a normativa notarial uruguaya.',
                              sources: req.ai_finding?.sources || ['Archivo Digitalizado SHA-256', 'Base Registral'],
                            })
                          }
                          className="text-teal-700 hover:text-teal-900 font-bold text-xs inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver documento</span>
                        </button>
                        <button
                          onClick={() =>
                            setLegalBasisModalData({
                              title: req.title,
                              basis: req.legal_basis || 'Normativa Notarial DGR',
                              description: req.description,
                            })
                          }
                          className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                        >
                          Ver fundamento
                        </button>
                      </div>

                      <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm">
                        Confirmar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expediente Completo */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Expediente Completo y Verificado ({dynamicReqs.length - 2})</span>
              </h3>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                {dynamicReqs.slice(2).map((req) => (
                  <div key={req.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{req.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({req.category})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{req.description}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Conforme</span>
                      </span>
                      <button
                        onClick={() =>
                          setEvidenceModalAiData({
                            title: req.title,
                            text: req.ai_finding?.summary || 'Verificado con hash SHA-256 inmutable.',
                            sources: req.ai_finding?.sources || ['Archivo Digitalizado SHA-256'],
                          })
                        }
                        className="text-teal-700 hover:text-teal-900 font-bold"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: ESCRITURA Y FIRMA (Workflow Unificado con Google Calendar y Post-Firma) */}
        {activeTab === 'escritura_firma' && (
          <div className="space-y-6">
            {/* Estado de la Escritura y Firma Agendada */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <FileSignature className="w-4 h-4 text-teal-600" />
                    <span>Escritura de Hipoteca y Mutuo (Versión 4.1)</span>
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Documentación completa</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Revisión notarial aprobada</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Originales cotejados</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Firmantes definidos y verificados con Didit KYC</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {scheduledEvent ? (
                    <div className="text-right p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                      <div className="font-black text-teal-950 flex items-center justify-end space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>Firma Agendada</span>
                      </div>
                      <div className="font-bold text-teal-900">{scheduledEvent.date} · {scheduledEvent.time} hs</div>
                      <div className="text-[10px] text-teal-700 truncate max-w-[200px]">{scheduledEvent.location}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowScheduleSignModal(true)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Coordinar Firma (Google Calendar)</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDocGen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Generar Borrador
                    </button>
                    <button
                      onClick={() => setShowFeaModal(true)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <Stamp className="w-3.5 h-3.5 text-teal-400" />
                      <span>Preparar Versión para Firma (FEA)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Vista Previa del Protocolo / Matriz */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed space-y-2 max-h-48 overflow-y-auto border border-slate-800">
                <div className="text-teal-400 font-bold">--- PROTOCOLO NOTARIAL HIPOTECALY ---</div>
                <p>
                  En la ciudad de Montevideo, el {new Date().toLocaleDateString('es-UY')}, ante mí, Esc. María Pérez Morales,
                  comparecen por una parte el deudor {app.borrower?.first_name} {app.borrower?.last_name}, C.I. 4.218.930-5,
                  y por otra parte el Acreedor Hipotecario Fondo Inversor Privado Nova Capital (RUT 21.908.411.0012),
                  quienes acuerdan otorgar el presente contrato de Mutuo con Garantía Hipotecaria en Primer Grado sobre el
                  padrón {app.property?.cadastral_number || '14.892'} del departamento de {app.property?.department || 'Montevideo'}.
                </p>
              </div>
            </div>

            {/* Progreso de Firmas Multilaterales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Estado de Firmas del Documento Matriz
                </h3>
                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="text-xs text-teal-700 hover:text-teal-900 font-bold inline-flex items-center space-x-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Ver Información Técnica</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">Deudor: {app.borrower?.first_name} {app.borrower?.last_name}</div>
                    <div className="text-[11px] text-emerald-700">✓ Firma electrónica avanzada con C.I. Digital validada</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">Acreedor: Fondo Inversor Privado Nova Capital</div>
                    <div className="text-[11px] text-emerald-700">✓ Firmado por Representante con Token Abitab</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>

                <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-teal-950">Escribana Autorizante: Esc. María Pérez Morales</div>
                    <div className="text-[11px] text-teal-700">Firma digital disponible vía Firma.gub.uy / SNE</div>
                  </div>
                  <button
                    onClick={() => setShowFeaModal(true)}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs"
                  >
                    Firmar Ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Módulo Post-Firma y Tramitación Registral (DGR) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Gestión Post-Firma e Inscripción Registral (DGR)
                  </h3>
                </div>
                {savedRegistration && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Datos Guardados
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">N° Entrada / Minuta DGR</label>
                  <input
                    type="text"
                    value={registrationEntryNumber}
                    onChange={(e) => setRegistrationEntryNumber(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Estado de la Inscripción</label>
                  <select
                    value={registrationStatus}
                    onChange={(e) => setRegistrationStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-bold text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="presentado">Presentada ante DGR</option>
                    <option value="en_tramite">En trámite con reserva de prioridad</option>
                    <option value="inscripto">Inscripta definitivamente</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSavedRegistration(true);
                      setTimeout(() => setSavedRegistration(false), 3000);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    Guardar Datos Registrales
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Historial de Auditoría Notarial y Trazabilidad Criptográfica
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Registro Inmutable
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Diagnóstico Notarial de Inteligencia Artificial Completado</div>
                  <div className="text-slate-500 text-[11px]">47 controles normativos ejecutados contra registros públicos.</div>
                  <div className="text-slate-400 font-mono text-[10px]">Hash SHA-256: 8f4b23c91a02938e...</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Identidad Biométrica KYC Verificada</div>
                  <div className="text-slate-500 text-[11px]">Prueba de vida y escaneo de C.I. aprobado por Didit Protocol.</div>
                  <div className="text-slate-400 font-mono text-[10px]">Hash SHA-256: 3c1a89f41209be88...</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Asignación a Escribana María Pérez Morales</div>
                  <div className="text-slate-500 text-[11px]">Expediente transferido con éxito a la mesa notarial.</div>
                  <div className="text-slate-400 font-mono text-[10px]">Hash SHA-256: 7d10e5b309f48201...</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALES REUTILIZABLES */}

      {/* Modal Coordinar Firma con Google Calendar */}
      {showScheduleSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Coordinar Firma (Google Calendar)
                </h3>
              </div>
              <button onClick={() => setShowScheduleSignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleSignature} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">{app.public_id} · {app.borrower?.first_name} {app.borrower?.last_name}</div>
                <div className="text-slate-500 text-[11px]">Participantes: Deudor, Acreedor (Nova Capital) y Esc. María Pérez</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fecha del Acto</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hora</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                  >
                    {getAvailableCalendarSlots(scheduleDate).map((slot, i) => (
                      <option key={i} value={slot.time} disabled={!slot.available}>
                        {slot.time} hs {!slot.available ? '(Ocupado)' : '✓ Libre'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lugar del Acto</label>
                <input
                  type="text"
                  required
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1 text-[11px] text-teal-900">
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Recordatorios Automáticos Activos:</span>
                </div>
                <div>✓ Notificación a los firmantes 24 horas y 2 horas antes de la cita.</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleSignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirmar y Agendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Solicitud de Originales */}
      {showOriginalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Solicitud de Documentos Físicos Originales
              </h3>
              <button onClick={() => setShowOriginalsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Indique los documentos matrices o testimonios que los otorgantes deberán presentar en formato físico:
              </p>

              <div className="space-y-2">
                {selectedOriginalDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-800">{doc}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOriginalDocs(selectedOriginalDocs.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Agregar otro documento..."
                  value={newOriginalDocInput}
                  onChange={(e) => setNewOriginalDocInput(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newOriginalDocInput.trim()) {
                      setSelectedOriginalDocs([...selectedOriginalDocs, newOriginalDocInput.trim()]);
                      setNewOriginalDocInput('');
                    }
                  }}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOriginalsModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs"
              >
                Guardar Requerimientos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Observación */}
      {showNewObsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Nueva Observación Notarial
              </h3>
              <button onClick={() => setShowNewObsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateObservation} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Título de la Observación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Falta certificado de libre de prenda"
                  value={newObsTitle}
                  onChange={(e) => setNewObsTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tipo</label>
                  <select
                    value={newObsType}
                    onChange={(e) => setNewObsType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="documental">Documental</option>
                    <option value="juridica">Jurídica</option>
                    <option value="catastral">Catastral</option>
                    <option value="registral">Registral</option>
                    <option value="representacion">Representación</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Severidad</label>
                  <select
                    value={newObsSeverity}
                    onChange={(e) => setNewObsSeverity(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="requiere_correccion">Requiere Corrección</option>
                    <option value="bloqueante">Bloqueante (Impide Firma)</option>
                    <option value="informativa">Informativa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Responsable</label>
                  <select
                    value={newObsResponsible}
                    onChange={(e) => setNewObsResponsible(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Backoffice">Backoffice</option>
                    <option value="Acreedor">Acreedor</option>
                    <option value="Escribano">Escribano</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Descripción / Instrucción Notarial</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalle claramente el requisito o documento necesario..."
                  value={newObsDesc}
                  onChange={(e) => setNewObsDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewObsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingObs}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/20"
                >
                  {savingObs ? 'Guardando...' : 'Crear Observación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Evidencia IA Notarial */}
      {evidenceModalAiData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {evidenceModalAiData.title}
                </h3>
              </div>
              <button onClick={() => setEvidenceModalAiData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-700 leading-relaxed font-medium">
              {evidenceModalAiData.text}
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fuentes y Archivos Analizados</div>
              <div className="space-y-1 text-xs">
                {evidenceModalAiData.sources.map((s, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg text-slate-600 font-mono text-[11px] flex items-center justify-between">
                    <span>{s}</span>
                    <span className="text-teal-700 font-bold text-[10px]">Verificado</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setEvidenceModalAiData(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fundamento Notarial */}
      {legalBasisModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Fundamento Jurídico Notarial
              </h3>
              <button onClick={() => setLegalBasisModalData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800">{legalBasisModalData.title}</div>
              <div className="text-slate-500">{legalBasisModalData.description}</div>
            </div>
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-teal-950 font-medium">
              ⚖️ Base Legal Aplicable: <strong>{legalBasisModalData.basis}</strong>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setLegalBasisModalData(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales Existentes de DocFlow y Firma Electrónica Avanzada */}
      {showDocGen && (
        <DocumentGenerationModal
          isOpen={showDocGen}
          caseId={app.id}
          appData={app}
          onClose={() => setShowDocGen(false)}
          onGenerated={() => {
            setShowDocGen(false);
            setStatusToast('Borrador matriz generado y archivado en DocFlow');
            setTimeout(() => setStatusToast(null), 3500);
          }}
        />
      )}

      {showFeaModal && (
        <AdvancedSignatureModal
          isOpen={showFeaModal}
          onClose={() => setShowFeaModal(false)}
          documentTitle="Escritura Pública de Préstamo con Garantía Hipotecaria y Mutuo"
          documentVersion={4}
          applicationId={app.id}
          applicationPublicId={app.public_id || 'HIP-2026-00158'}
          notaryUserId={user?.id || 'u-test-notary'}
          onSignatureCompleted={() => {
            setShowFeaModal(false);
            setSignedSuccessToast(true);
            setTimeout(() => setSignedSuccessToast(false), 5000);
          }}
        />
      )}

      {showEvidenceModal && (
        <SignatureEvidenceModal
          isOpen={showEvidenceModal}
          processId={evidenceProcessId}
          onClose={() => setShowEvidenceModal(false)}
        />
      )}

      {/* Toast Notificación Firma Exitosa */}
      {signedSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/60 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-xs text-white">Firma Electrónica Avanzada Exitosa</div>
            <div className="text-[11px] text-teal-300">Documento validado con FEA y archivado inmutablemente.</div>
          </div>
        </div>
      )}
    </NotaryLayout>
  );
};
