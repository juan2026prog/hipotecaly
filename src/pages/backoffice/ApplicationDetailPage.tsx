import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import {
  getApplicationDetail,
  updateApplicationStatus,
  savePropertyValuation,
  createApplicationTask,
  DEMO_APPLICATIONS,
} from '../../lib/backofficeService';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  Home,
  Compass,
  CheckSquare,
  Clock,
  CheckCircle2,
  FileCheck,
  Plus,
  Sparkles,
  Printer,
  FileSignature,
  ChevronDown,
  MessageSquare,
  Share2,
  Fingerprint,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  FileLock2,
  Send,
} from 'lucide-react';
import {
  getApplicationConsents,
  ConsentRecord,
} from '../../lib/policyEngine';
import {
  sendApplicationCommunication,
  getApplicationCommunications,
  getCommunicationTemplates,
  CommunicationLog,
} from '../../lib/communicationsService';
import { ApplicationMatchingTab } from '../../components/backoffice/ApplicationMatchingTab';
import { HipotecalyAiTab } from '../../components/ai/HipotecalyAiTab';
import { DocumentHub } from '../../components/docflow/DocumentHub';
import { DocumentGenerationModal } from '../../components/docflow/DocumentGenerationModal';
import { KycVerificationCard } from '../../components/identity/KycVerificationCard';
import { AiAssistantDrawer } from '../../components/ai/AiAssistantDrawer';
import { CaseTasadorSection } from '../../components/case/CaseTasadorSection';
import { isMarketplaceEnabled } from '../../config/features';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

export const ApplicationDetailPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { tenant } = useTenant();

  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const routeParts = location.pathname.split('/');
  const baseRoute = isTenantPath ? `/demo/${routeParts[2]}/admin` : '/app';

  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showDocGen, setShowDocGen] = useState(false);
  const [docGenTplId, setDocGenTplId] = useState<string | undefined>(undefined);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showAiAssistantDrawer, setShowAiAssistantDrawer] = useState(false);
  const [commandActionToast, setCommandActionToast] = useState<string | null>(null);
  const [showAssignNotaryModal, setShowAssignNotaryModal] = useState(false);
  const [selectedNotaryUser, setSelectedNotaryUser] = useState('u-test-notary');
  const [assignedNotaryName, setAssignedNotaryName] = useState('Esc. María Pérez Morales');
  const [solicitanteSubTab, setSolicitanteSubTab] = useState<'perfil' | 'ingresos' | 'cotitulares' | 'kyc' | 'consentimientos'>('perfil');
  const [analisisSubTab, setAnalisisSubTab] = useState<'riesgo' | 'ia' | 'oferta' | 'inversores'>('riesgo');
  const [seguimientoSubTab, setSeguimientoSubTab] = useState<'tareas' | 'comunicaciones' | 'actividad'>('tareas');
  const [nextActionOverride, setNextActionOverride] = useState<any>(null);

  // Estados Pass 5: Comunicaciones, Consentimientos y Evidencia de Firma
  const [showSignatureEvidenceModal, setShowSignatureEvidenceModal] = useState(false);
  const [showManualCommModal, setShowManualCommModal] = useState(false);
  const [manualCommTemplate, setManualCommTemplate] = useState('solicitud_recibida');
  const [manualCommRecipient, setManualCommRecipient] = useState('');
  const [manualCommChannel, setManualCommChannel] = useState<'email' | 'whatsapp'>('email');
  const [sendingComm, setSendingComm] = useState(false);
  const [communicationsList, setCommunicationsList] = useState<CommunicationLog[]>([]);
  const [consentsList, setConsentsList] = useState<ConsentRecord[]>([]);

  // Estados para valuación preliminar
  const [preliminaryValue, setPreliminaryValue] = useState<number>(0);
  const [valMin, setValMin] = useState<number>(0);
  const [valMax, setValMax] = useState<number>(0);
  const [valConfidence, setValConfidence] = useState<string>('alta');
  const [valMethodology, setValMethodology] = useState<string>('comparables_de_mercado');
  const [valNotes, setValNotes] = useState<string>('');
  const [savingVal, setSavingVal] = useState(false);
  const [valSavedToast, setValSavedToast] = useState(false);

  // Estados para tareas
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Timeline de actividad unificado
  const [timelineEvents, setTimelineEvents] = useState<any[]>([
    {
      id: 'tl-1',
      time: 'Hoy 14:32',
      actor: 'Ignacio Silva (Cliente)',
      category: 'Documentos',
      title: 'Cliente subió recibo de sueldo',
      desc: 'Archivo Recibo-Sueldo-Marzo-2026.pdf adjunto al legajo DocFlow.',
      statusColor: 'emerald',
    },
    {
      id: 'tl-2',
      time: 'Hoy 13:10',
      actor: 'Dra. Valentina Ramos (Escribanía)',
      category: 'Documentos',
      title: 'Documento revisado y validado',
      desc: 'Cédula de Identidad y Certificado de Ingresos aprobados conforme.',
      statusColor: 'emerald',
    },
    {
      id: 'tl-3',
      time: 'Ayer 16:45',
      actor: 'Arq. Martín Sosa (Perito)',
      category: 'Tasación',
      title: 'Tasación preliminar completada',
      desc: 'Valuación estimada en USD 240.000 mediante comparables de mercado.',
      statusColor: 'blue',
    },
    {
      id: 'tl-4',
      time: 'Ayer 10:20',
      actor: 'Sistema / Mesa de Crédito',
      category: 'Estados',
      title: 'Etapa cambiada a Evaluación',
      desc: 'El expediente avanzó automáticamente a la etapa 4 de 7 del pipeline.',
      statusColor: 'amber',
    },
    {
      id: 'tl-5',
      time: '04/09/2026 11:15',
      actor: 'Didit Biometría',
      category: 'KYC',
      title: 'Validación biométrica KYC exitosa',
      desc: 'Prueba de vida y escaneo de chip de Cédula uruguaya verificados 100%.',
      statusColor: 'purple',
    },
  ]);

  const load = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    const isDemo = Boolean(tenant.demo_mode) || location.search.includes('demo=true');
    let data = await getApplicationDetail(id, { isDemoMode: isDemo, organizationId: tenant.id });
    if (!data && (isDemo || id.startsWith('e0000000') || id.startsWith('HIP-') || id.startsWith('demo-'))) {
      data = DEMO_APPLICATIONS.find((a) => a.id === id || a.public_id === id) || DEMO_APPLICATIONS[0];
    }
    setApp(data);
    if (data?.id) {
      setCommunicationsList(getApplicationCommunications(data.id));
      setConsentsList(getApplicationConsents(data.id));
    }
    if (data?.valuation) {
      setPreliminaryValue(data.valuation.preliminary_value || 0);
      setValMin(data.valuation.valuation_min || 0);
      setValMax(data.valuation.valuation_max || 0);
      setValConfidence(data.valuation.confidence || 'alta');
      setValMethodology(data.valuation.methodology || 'comparables_de_mercado');
      setValNotes(data.valuation.notes || '');
    } else if (data?.property?.estimated_value) {
      setPreliminaryValue(data.property.estimated_value);
    }
    if (!silent) setLoading(false);
  };

  const handleSendManualComm = async () => {
    if (!app) return;
    setSendingComm(true);
    try {
      const res = await sendApplicationCommunication({
        organizationId: tenant.id,
        applicationId: app.id,
        templateCode: manualCommTemplate,
        channel: manualCommChannel,
        recipient: manualCommRecipient || app.borrower?.email || 'solicitante@ejemplo.com',
        deliveryType: 'MANUAL',
        userName: 'Operador Backoffice',
        variables: {
          '{{cliente.nombre}}': borrowerFullName,
          '{{expediente.id}}': app.public_id,
          '{{expediente.monto}}': Number(reqAmount).toLocaleString('es-UY'),
          '{{propiedad.direccion}}': `${app.property?.property_type || 'Inmueble'} en ${app.property?.department || 'Montevideo'}`,
          '{{responsable.nombre}}': assignedNotaryName,
          '{{fecha_limite}}': new Date(Date.now() + 86400000 * 3).toLocaleDateString('es-UY'),
        },
      });
      setCommunicationsList((prev) => [res, ...prev]);
      setShowManualCommModal(false);
      setCommandActionToast(`Notificación enviada exitosamente vía ${res.channel.toUpperCase()}`);
      setTimeout(() => setCommandActionToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar la comunicación.');
    } finally {
      setSendingComm(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, tenant.id, tenant.demo_mode]);

  const handleStatusChange = async (newStatus: string) => {
    if (!app) return;
    await updateApplicationStatus(app.id, app.status, newStatus, `Cambio manual desde backoffice`);
    setApp({ ...app, status: newStatus });
    
    // Agregar al timeline
    setTimelineEvents((prev) => [
      {
        id: `tl-${Date.now()}`,
        time: 'Recién',
        actor: 'Operador Backoffice',
        category: 'Estados',
        title: `Etapa actualizada a ${newStatus}`,
        desc: 'Modificación de estado ejecutada desde el Command Center.',
        statusColor: 'emerald',
      },
      ...prev,
    ]);
  };

  const handleSaveValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setSavingVal(true);
    await savePropertyValuation({
      application_id: app.id,
      applicant_estimated_value: app.property?.estimated_value || 0,
      preliminary_value: preliminaryValue,
      valuation_min: valMin,
      valuation_max: valMax,
      confidence: valConfidence,
      methodology: valMethodology,
      notes: valNotes,
    });
    setSavingVal(false);
    setValSavedToast(true);
    setTimeout(() => setValSavedToast(false), 3000);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !app) return;
    setAddingTask(true);
    const { task } = await createApplicationTask({
      application_id: app.id,
      title: newTaskTitle,
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    });
    if (task) {
      setApp({ ...app, tasks: [...(app.tasks || []), task] });
      setNewTaskTitle('');
      setTimelineEvents((prev) => [
        {
          id: `tl-${Date.now()}`,
          time: 'Recién',
          actor: 'Operador Backoffice',
          category: 'Tareas',
          title: `Nueva tarea creada: ${task.title}`,
          desc: 'Tarea agregada al checklist operativo del expediente.',
          statusColor: 'blue',
        },
        ...prev,
      ]);
    }
    setAddingTask(false);
  };

  const triggerCommandAction = (actionName: string, message: string) => {
    setShowCommandCenter(false);
    setCommandActionToast(message);
    setTimeout(() => setCommandActionToast(null), 4000);

    setTimelineEvents((prev) => [
      {
        id: `tl-${Date.now()}`,
        time: 'Recién',
        actor: 'Operador Backoffice',
        category: 'Acción Rápida',
        title: actionName,
        desc: message,
        statusColor: 'emerald',
      },
      ...prev,
    ]);
  };

  if (loading) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center text-slate-400 font-medium">
          <div className="w-8 h-8 border-4 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando Ficha 360° del Expediente...
        </div>
      </BackofficeLayout>
    );
  }

  if (!app) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center space-y-3">
          <p className="text-sm font-bold text-[#102d49]">Expediente no encontrado.</p>
          <Link to={`${baseRoute}/solicitudes`} className="text-xs font-semibold text-brand-green hover:underline">
            ← Volver al listado de solicitudes
          </Link>
        </div>
      </BackofficeLayout>
    );
  }

  const estValue = app.property?.estimated_value || 240000;
  const reqAmount = Number(app.requested_amount) || 80000;
  const financingPercent = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';
  const borrowerFullName = app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'María Pérez';
  const propertyDesc = app.property ? `${app.property.property_type} en ${app.property.department}` : 'Apartamento en Montevideo';
  const isInvestorEnabled = true;

  const stages = [
    { id: 'SOLICITUD', name: 'SOLICITUD', match: ['draft', 'submitted'] },
    { id: 'DOCUMENTACION', name: 'DOCUMENTACIÓN', match: ['info_review'] },
    { id: 'TASACION', name: 'TASACIÓN', match: ['property_analysis'] },
    { id: 'ANALISIS', name: 'ANÁLISIS', match: ['evaluation', 'in_analysis'] },
    { id: 'OFERTA', name: 'OFERTA', match: ['offer_available'] },
    { id: 'FIRMA', name: 'FIRMA', match: ['formalization'] },
    { id: 'CIERRE', name: 'CIERRE', match: ['approved', 'completed', 'rejected'] }
  ];
  const currentStageIndex = Math.max(0, stages.findIndex(s => s.match.includes(app.status)));


  // 6 Tabs Consolidados según especificación UX
  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: FileText },
    { id: 'solicitante', label: 'Solicitante', icon: User },
    { id: 'garantia', label: 'Garantía', icon: Home },
    { id: 'analisis', label: 'Análisis', icon: ShieldAlert },
    { id: 'documentos', label: 'Documentación', icon: FileCheck },
    { id: 'seguimiento', label: 'Seguimiento', icon: Clock },
  ];

  // Próxima Acción Dinámica calculada
  const currentNextAction = nextActionOverride || {
    title: !app ? 'Cargando expediente...' : app.status === 'submitted' || app.status === 'draft' ? 'Revisar documentación inicial del solicitante' : app.status === 'info_review' ? 'Solicitar certificado de ingresos y DGI' : app.status === 'property_analysis' ? 'Asignar perito tasador para inspección' : app.status === 'evaluation' || app.status === 'in_analysis' ? 'Revisar informe de riesgo y dictamen crediticio' : app.status === 'offer_available' ? 'Generar Carta de Condiciones y Oferta' : app.status === 'formalization' ? 'Generar Minuta y coordinar firma notarial' : 'Coordinar desembolso y custodia de títulos',
    responsible: !app ? 'Operador' : app.status === 'submitted' ? 'Mesa de Crédito' : app.status === 'info_review' ? 'Valeria Rivas' : app.status === 'property_analysis' ? 'Coordinador de Garantías' : app.status === 'formalization' ? 'Esc. María Pérez Morales' : 'Mesa de Crédito',
    due: 'Hoy',
    btnLabel: 'Ver expediente',
    nextStep: 'info_review',
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
        
        {/* Toast Notificación Command Center */}
        {commandActionToast && (
          <div className="p-4 bg-emerald-900 text-white rounded-xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{commandActionToast}</span>
            </div>
            <button onClick={() => setCommandActionToast(null)} className="text-xs text-emerald-200 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Breadcrumb Humanizado */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Link to={`${baseRoute}/solicitudes`} className="hover:text-[#102d49] font-semibold flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Expedientes
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-[#102d49]">{app.public_id}</span>
            <span>/</span>
            <span className="capitalize font-medium text-slate-700">{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Responsable: {currentNextAction.responsible}</span>
        </div>

        {/* Barra de etapas del proceso */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden mt-4">
          {/* Mobile: resumen compacto */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Etapa del proceso</span>
              <span className="font-bold text-[#102d49]">{currentStageIndex + 1} de {stages.length}: {stages[currentStageIndex]?.name}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-[#102d49] rounded-full transition-all" style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }} />
            </div>
          </div>
          {/* Desktop: barra completa */}
          <div className="hidden sm:flex items-center justify-between text-[10px] font-bold relative px-4">
            <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
            <div 
              className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-[#102d49] rounded-full z-0 transition-all"
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%`, maxWidth: 'calc(100% - 5rem)' }}
            ></div>
            
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1.5 w-24">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors bg-white ${
                    isCompleted ? 'border-brand-green text-brand-green' : 
                    isCurrent ? 'border-[#102d49] border-[3px]' : 
                    'border-slate-200 text-slate-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white bg-brand-green rounded-full" /> : 
                     isCurrent ? <div className="w-2 h-2 rounded-full bg-[#102d49]"></div> : 
                     <span>{idx + 1}</span>}
                  </div>
                  <span className={`text-center ${
                    isCompleted ? 'text-brand-green' : 
                    isCurrent ? 'text-[#102d49]' : 
                    'text-slate-400'
                  }`}>{stage.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. HEADER FIJO 360°                                          */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#102d49]">{app.public_id}</span>
              <span className="text-xl font-bold text-slate-800">· {borrowerFullName}</span>
              <StatusBadge status={app.status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span><strong>Monto:</strong> USD {reqAmount.toLocaleString('es-UY')}</span>
              <span>•</span>
              <span><strong>Garantía:</strong> {propertyDesc}</span>
              <span>•</span>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                {financingPercent}% financiación
              </span>
              <span>•</span>
              <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                Próxima acción: Revisar evaluación
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* COMMAND CENTER: BOTÓN ACCIONES */}
            <div className="relative">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCommandCenter(!showCommandCenter)}
                className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-bold text-xs shadow-sm flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-[#f4b43b]" />
                Acciones del Expediente <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              </Button>

              {/* Menú Dropdown Command Center */}
              {showCommandCenter && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-2 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Command Center Rápido
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('documentos');
                        setShowCommandCenter(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <FileText className="w-4 h-4 mr-2 text-blue-600" /> Solicitar / Revisar Documento
                    </button>
                    <button
                      onClick={() => {
                        setDocGenTplId('tpl-seed-1');
                        setShowDocGen(true);
                        setShowCommandCenter(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <FileCheck className="w-4 h-4 mr-2 text-emerald-600" /> Generar Documento DocFlow
                    </button>
                    <button
                      onClick={() => triggerCommandAction('Tasación Solicitada', 'Se ha emitido la orden de tasación al perito asignado.')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <Compass className="w-4 h-4 mr-2 text-purple-600" /> Solicitar Tasación Oficial
                    </button>
                    <button
                      onClick={() => triggerCommandAction('KYC Biométrico Solicitado', 'Enlace seguro de validación de CI enviado al solicitante por WhatsApp/SMS.')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <Fingerprint className="w-4 h-4 mr-2 text-indigo-600" /> Iniciar Verificación KYC
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('firmas');
                        setShowCommandCenter(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <FileSignature className="w-4 h-4 mr-2 text-amber-600" /> Enviar a Firma Notarial
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => triggerCommandAction('Mensaje Enviado', 'Mensaje transaccional enviado al titular del expediente.')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <MessageSquare className="w-4 h-4 mr-2 text-slate-600" /> Enviar Mensaje al Cliente
                    </button>
                    <button
                      onClick={() => triggerCommandAction('Responsable Asignado', 'Expediente asignado a Dra. Valentina Ramos.')}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-slate-800"
                    >
                      <UserCheck className="w-4 h-4 mr-2 text-slate-600" /> Asignar Responsable
                    </button>
                    {isInvestorEnabled && (
                      <button
                        onClick={() => {
                          setActiveTab('prestamistas');
                          setShowCommandCenter(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center font-medium text-[#102d49]"
                      >
                        <Share2 className="w-4 h-4 mr-2 text-[#f4b43b]" /> Compartir con Red de Inversores
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Estado Operativo */}
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#102d49] focus:ring-2 focus:ring-[#102d49]"
            >
              <option value="draft">1. Borrador</option>
              <option value="submitted">1. Solicitud Recibida</option>
              <option value="info_review">2. Información en Revisión</option>
              <option value="property_analysis">3. Propiedad y Docs</option>
              <option value="evaluation">4. Evaluación Técnica</option>
              <option value="offer_available">5. Condiciones Disponibles</option>
              <option value="formalization">6. Formalización Notarial</option>
              <option value="approved">7. Finalizada / Aprobada</option>
              <option value="rejected">Rechazada</option>
            </select>

            {/* Botón Asistente IA */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAiAssistantDrawer(true)}
              className="text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
              <span>Asistente IA</span>
            </Button>

            {/* Botón Imprimir / PDF */}
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-4 h-4 mr-1 text-[#102d49]" /> Ficha PDF
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SCORECARD SUPERIOR (4 BLOQUES 360°)                       */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bloque 1: Solicitante */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#102d49] flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Solicitante
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🟢 Completo
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Estado documental:</span>
                <strong className="text-slate-800">🟢 Al día (4 docs)</strong>
              </div>
              <div className="flex justify-between">
                <span>Ingresos declarados:</span>
                <strong className="text-slate-800">UYU 95.000 / mes</strong>
              </div>
              <div className="flex justify-between">
                <span>Identidad KYC:</span>
                <strong className="text-emerald-700">🟢 CI Validada</strong>
              </div>
              <div className="flex justify-between">
                <span>Clearing de Informes:</span>
                <strong className="text-amber-700">🟡 Sin antecedentes</strong>
              </div>
            </div>
          </div>

          {/* Bloque 2: Garantía */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#102d49] flex items-center">
                <Home className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Garantía
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🟢 Completo
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tipo de inmueble:</span>
                <strong className="text-slate-800 capitalize">{app.property?.property_type || 'Apartamento'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Ubicación:</span>
                <strong className="text-slate-800">{app.property?.department || 'Montevideo'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tasación preliminar:</span>
                <strong className="text-slate-800">USD {estValue.toLocaleString('es-UY')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Estado jurídico:</span>
                <strong className="text-emerald-700">🟢 Libre gravamen</strong>
              </div>
            </div>
          </div>

          {/* Bloque 3: Documentación */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#102d49] flex items-center">
                <FileCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Documentación
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🟢 92%
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Completo:</span>
                <strong className="text-emerald-700">92% (5/6 docs)</strong>
              </div>
              <div className="flex justify-between">
                <span>Pendientes:</span>
                <strong className="text-amber-700">🟡 1 recaudo</strong>
              </div>
              <div className="flex justify-between">
                <span>Observados:</span>
                <strong className="text-slate-800">🟢 0 observados</strong>
              </div>
              <div className="flex justify-between">
                <span>Firma notarial:</span>
                <strong className="text-emerald-700">🟢 Minuta lista</strong>
              </div>
            </div>
          </div>

          {/* Bloque 4: Evaluación */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#102d49] flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Evaluación
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                🟢 Favorable
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Capacidad crediticia:</span>
                <strong className="text-emerald-700">🟢 24.8% R/I</strong>
              </div>
              <div className="flex justify-between">
                <span>Financiación:</span>
                <strong className="text-emerald-700">🟢 {financingPercent}% (Tope: 40%)</strong>
              </div>
              <div className="flex justify-between">
                <span>Viabilidad jurídica:</span>
                <strong className="text-emerald-700">🟢 Conforme</strong>
              </div>
              <div className="flex justify-between">
                <span>Copiloto IA:</span>
                <strong className="text-purple-700">🟢 Score A+ (Bajo)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABS DE NAVEGACIÓN DETALLADA (6 MACRO-ÁREAS)                */}
        {/* ============================================================ */}
        <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex space-x-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-[#102d49] text-[#102d49] font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-navy hover:border-slate-300'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* CONTENIDO PRINCIPAL + SIDEBAR                                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Tab Panel (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            {/* ======================================================== */}
            {/* TAB 1: RESUMEN                                           */}
            {/* ======================================================== */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                
                {/* TARJETA CENTRAL: PRÓXIMA ACCIÓN */}
                <div className="bg-[#102d49] text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#f4b43b] animate-ping" />
                      <span className="text-[11px] font-bold text-[#f4b43b] uppercase tracking-wider">
                        Próxima Acción
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-300">
                      <span>Responsable: <strong>{currentNextAction.responsible}</strong></span>
                      <span>•</span>
                      <span className="text-[#f4b43b] font-bold">Vence: {currentNextAction.due}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {currentNextAction.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        Ejecutar esta acción avanza el expediente en el flujo de formalización y genera automáticamente el siguiente paso operativo.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        triggerCommandAction(
                          `Acción Ejecutada: ${currentNextAction.title}`,
                          `El expediente avanzó en su flujo operativo.`
                        );
                        // Recalcular siguiente acción
                        if (currentNextAction.nextStep === 'info_review') {
                          setNextActionOverride({ title: 'Solicitar certificado de ingresos y DGI', responsible: 'Valeria Rivas', due: 'Hoy', btnLabel: 'Solicitar ahora', nextStep: 'property_analysis' });
                        } else if (currentNextAction.nextStep === 'property_analysis') {
                          setNextActionOverride({ title: 'Asignar perito tasador para inspección', responsible: 'Coordinador de Garantías', due: 'En 24hs', btnLabel: 'Asignar tasador', nextStep: 'evaluation' });
                        } else if (currentNextAction.nextStep === 'evaluation') {
                          setNextActionOverride({ title: 'Revisar informe de riesgo y dictamen', responsible: 'Comité de Crédito', due: 'En 48hs', btnLabel: 'Revisar dictamen', nextStep: 'offer_available' });
                        } else {
                          setNextActionOverride({ title: 'Generar Minuta y coordinar firma notarial', responsible: 'Esc. María Pérez Morales', due: 'Esta semana', btnLabel: 'Coordinar firma', nextStep: 'approved' });
                        }
                      }}
                      className="!bg-[#f4b43b] hover:!bg-[#e5a832] !text-[#102d49] !font-black text-xs px-5 py-3 rounded-xl shadow-lg shrink-0 flex items-center justify-center transition-all"
                    >
                      <span>{currentNextAction.btnLabel}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>

                {/* DIFERENCIACIÓN: ESTADO / ALERTA / PRÓXIMA ACCIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Estado Operativo</span>
                    <p className="font-bold text-[#102d49] text-sm capitalize">{String(app.status).replace(/_/g, ' ')}</p>
                    <span className="text-[11px] text-slate-500">Etapa {currentStageIndex + 1} de 7</span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase">Alerta Activa</span>
                    <p className="font-bold text-amber-900 text-sm">Falta Recibo de Sueldo</p>
                    <span className="text-[11px] text-amber-700">Documentación de ingresos pendiente</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Próximo Hito</span>
                    <p className="font-bold text-emerald-900 text-sm">Tasación Inmobiliaria</p>
                    <span className="text-[11px] text-emerald-700">Peritaje de valor de mercado</span>
                  </div>
                </div>

                {/* DOCUMENTOS SUGERIDOS PARA ESTA ETAPA */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#102d49] flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-green" /> Documentos Sugeridos para esta Etapa
                      </h4>
                      <p className="text-[11px] text-slate-500">Documentos preconfigurados que pueden autollenerarse con un clic.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocGenTplId('tpl-seed-1');
                        setShowDocGen(true);
                      }}
                      className="text-xs font-bold text-[#102d49]"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Generar Documento
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { title: 'Solicitud Oficial', status: 'ready', icon: '✓' },
                      { title: 'Autorización de Datos', status: 'ready', icon: '✓' },
                      { title: 'Carta de Condiciones', status: 'suggested', icon: '○' },
                      { title: 'Minuta Notarial', status: 'suggested', icon: '○' },
                      { title: 'Contrato de Mutuo', status: 'pending', icon: '○' },
                    ].map((doc) => (
                      <div
                        key={doc.title}
                        onClick={() => {
                          setDocGenTplId('tpl-seed-1');
                          setShowDocGen(true);
                        }}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-[#102d49]/30 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-slate-700">{doc.title}</span>
                        <span className={`font-mono font-bold text-xs ${doc.status === 'ready' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {doc.icon}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen Ficha Rápida */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Garantía Inmobiliaria</span>
                    <p className="font-bold text-[#102d49] text-sm capitalize">{app.property?.property_type || 'Inmueble'}</p>
                    <p className="text-slate-600">Ubicación: {app.property?.neighborhood || 'Centro'}, {app.property?.department || 'Montevideo'}</p>
                    <p className="text-slate-600">Valor tasación: USD {estValue.toLocaleString('es-UY')}</p>
                    <p className="text-slate-600">Padrón: {app.property?.cadastral_number || '34.892 (Registrado)'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Condiciones Financieras</span>
                    <p className="font-bold text-[#102d49] text-sm">USD {reqAmount.toLocaleString('es-UY')} en {app.term_months || 36} meses</p>
                    <p className="text-slate-600">Destino: {app.purpose || 'Consolidación / Inversión'}</p>
                    <p className="text-slate-600">Porcentaje de financiación: {financingPercent}%</p>
                    <p className="text-slate-600">Modalidad: Intereses mensuales y capital al vencimiento</p>
                  </div>
                </div>

                {/* Tarjeta Universal KYC */}
                <KycVerificationCard
                  caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                  applicantName={borrowerFullName}
                  applicantCi={app.borrower?.document_number || '4.892.114-2'}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: SOLICITANTE (Consolida perfil, ingresos, cotit.) */}
            {/* ======================================================== */}
            {activeTab === 'solicitante' && (
              <div className="space-y-5">
                {/* Subtabs internas */}
                <div className="flex space-x-2 border-b border-slate-100 pb-2">
                  {[
                    { id: 'perfil', label: 'Titular Principal' },
                    { id: 'ingresos', label: 'Ingresos & Capacidad' },
                    { id: 'cotitulares', label: 'Personas & Cotitulares' },
                    { id: 'kyc', label: 'Identidad & KYC' },
                    { id: 'consentimientos', label: 'Consentimientos (Legal)' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSolicitanteSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        solicitanteSubTab === sub.id
                          ? 'bg-[#102d49] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {solicitanteSubTab === 'perfil' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-slate-400 font-medium">Nombre completo</label>
                        <p className="font-bold text-[#102d49] text-sm">{borrowerFullName}</p>
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Cédula de Identidad (CI)</label>
                        <p className="font-bold text-[#102d49] text-sm">{app.borrower?.id_number || '4.892.114-2'}</p>
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Email</label>
                        <p className="font-bold text-[#102d49] text-sm font-mono">
                          {app.borrower?.email || 'ignacio@ejemplo.com'}
                        </p>
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Teléfono Celular</label>
                        <p className="font-bold text-[#102d49] text-sm font-mono">
                          {app.borrower?.phone || '+598 99 123 456'}
                        </p>
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Estado Civil</label>
                        <p className="font-bold text-slate-800 text-sm">Casado/a</p>
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Domicilio</label>
                        <p className="font-bold text-slate-800 text-sm">Benito Blanco 1245 Apto 402, Montevideo</p>
                      </div>
                    </div>
                  </div>
                )}

                {solicitanteSubTab === 'ingresos' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-medium block">Ingreso Mensual Declarado</span>
                        <p className="font-bold text-[#102d49] text-lg mt-1">
                          UYU {(app.income?.monthly_amount || 95000).toLocaleString('es-UY')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 capitalize">
                          Tipo: {app.income?.income_type || 'Dependiente'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-medium block">Relación Cuota / Ingreso</span>
                        <p className="font-bold text-emerald-800 text-lg mt-1">
                          24.8% <span className="text-xs font-normal text-slate-500">(Saludable &lt; 35%)</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Margen holgado de repago.</p>
                      </div>
                    </div>
                  </div>
                )}

                {solicitanteSubTab === 'cotitulares' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#102d49]">{borrowerFullName}</p>
                        <span className="text-slate-500">{app.borrower?.email}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        TITULAR PRINCIPAL
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 border-dashed text-center">
                      <p className="text-slate-400">No hay cotitulares ni garantes registrados.</p>
                      <button className="mt-1 text-xs font-bold text-[#102d49] hover:text-brand-green">
                        + Agregar cotitular o garante
                      </button>
                    </div>
                  </div>
                )}

                {solicitanteSubTab === 'kyc' && (
                  <KycVerificationCard
                    caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                    applicantName={borrowerFullName}
                    applicantCi={app.borrower?.document_number || '4.892.114-2'}
                  />
                )}

                {solicitanteSubTab === 'consentimientos' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-[#102d49] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Registro de Consentimientos Digitales (Ley 18.331)</span>
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        CONSENTIMIENTO VÁLIDO
                      </span>
                    </div>

                    <div className="space-y-3">
                      {consentsList.map((cs) => (
                        <div key={cs.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy text-sm">{cs.user_name} ({cs.user_document})</span>
                            <span className="text-[10px] font-mono text-slate-400">IP: {cs.ip_address}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                            <div><strong>Términos aceptados:</strong> {cs.terms_version}</div>
                            <div><strong>Privacidad aceptada:</strong> {cs.privacy_version}</div>
                            <div><strong>Canal de captura:</strong> {cs.channel}</div>
                            <div><strong>Fecha y Hora:</strong> {new Date(cs.accepted_at).toLocaleString('es-UY')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: GARANTÍA (Inmueble + Tasación + Estado Legal)     */}
            {/* ======================================================== */}
            {activeTab === 'garantia' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#102d49]">Ficha de Garantía Hipotecaria</h3>
                  <p className="text-xs text-slate-500">Inmueble gravado en garantía de primer rango.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Tipo de inmueble</label>
                    <p className="font-bold text-[#102d49] text-sm capitalize">{app.property?.property_type || 'Apartamento'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Superficie</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.surface_m2 || 85} m²</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Padrón Catastral</label>
                    <p className="font-bold text-[#102d49] text-sm font-mono">{app.property?.cadastral_number || '34.892'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Departamento</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.department || 'Montevideo'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Barrio / Zona</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.neighborhood || 'Pocitos'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Situación Jurídica</label>
                    <p className="font-bold text-emerald-700 text-sm">Libre de Gravámenes ✓</p>
                  </div>
                </div>

                {/* Formulario de Tasación */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#102d49] mb-3">
                    Tasación & Valuación Oficial
                  </h4>
                  <form onSubmit={handleSaveValuation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Valor Preliminar (USD)</label>
                        <input
                          type="number"
                          value={preliminaryValue}
                          onChange={(e) => setPreliminaryValue(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#102d49]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Rango Mínimo (USD)</label>
                        <input
                          type="number"
                          value={valMin}
                          onChange={(e) => setValMin(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Rango Máximo (USD)</label>
                        <input
                          type="number"
                          value={valMax}
                          onChange={(e) => setValMax(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Metodología</label>
                        <select
                          value={valMethodology}
                          onChange={(e) => setValMethodology(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                        >
                          <option value="comparables_de_mercado">Comparables de mercado</option>
                          <option value="costo_reposicion">Costo de reposición</option>
                          <option value="rentabilidad_comercial">Rentabilidad comercial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Confianza</label>
                        <select
                          value={valConfidence}
                          onChange={(e) => setValConfidence(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                        >
                          <option value="alta">Alta (peritaje presencial)</option>
                          <option value="media">Media (datos declarados)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button type="submit" variant="primary" size="sm" disabled={savingVal} className="!bg-[#102d49] text-white">
                        {savingVal ? 'Guardando...' : 'Guardar Tasación'}
                      </Button>
                      {valSavedToast && (
                        <span className="text-xs font-bold text-emerald-700">✓ Tasación guardada con éxito</span>
                      )}
                    </div>
                  </form>
                </div>

                {/* Tasador IA Integrado - Motor de Comparables & FASE 5 */}
                <div className="pt-4 border-t border-slate-100">
                  <CaseTasadorSection
                    caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                    organizationId={tenant.id || 'org-estudio-nova'}
                    applicantName={borrowerFullName}
                    initialPropertyData={{
                      cadastralNumber: app.property?.cadastral_number || '34.892',
                      department: app.property?.department || 'Montevideo',
                      locality: app.property?.neighborhood || 'Pocitos',
                      address: app.property?.address || 'Av. Brasil y 26 de Marzo',
                      propertyType: app.property?.property_type || 'apartamento',
                      coveredSurfaceM2: app.property?.surface_m2 || 85,
                      bedrooms: app.property?.rooms ? app.property.rooms - 1 : 2,
                      bathrooms: app.property?.bathrooms || 2,
                    }}
                  />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: ANÁLISIS (Riesgo, IA, Oferta, Inversores)         */}
            {/* ======================================================== */}
            {activeTab === 'analisis' && (
              <div className="space-y-5">
                {/* Subtabs internas */}
                <div className="flex space-x-2 border-b border-slate-100 pb-2">
                  {[
                    { id: 'riesgo', label: 'Análisis de Riesgo' },
                    { id: 'ia', label: 'Evaluación IA' },
                    { id: 'oferta', label: 'Oferta & Condiciones' },
                    ...(isMarketplaceEnabled() || isSuperAdmin ? [{ id: 'inversores', label: 'Red de Inversores' }] : []),
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setAnalisisSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        analisisSubTab === sub.id
                          ? 'bg-[#102d49] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {analisisSubTab === 'riesgo' && (
                  <div className="space-y-4 text-xs">
                    {/* Badge de Política Aplicada */}
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-bold text-xs">Evaluado con Política Hipotecaria v5</span>
                        <span className="text-[10px] text-slate-400 font-mono">(Tope LTV: 40% · Tasa 11.5%)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        CONFORME A POLÍTICA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">% Financiación (LTV)</span>
                        <div className="text-2xl font-black text-[#102d49] font-serif">{financingPercent}%</div>
                        <span className="text-slate-500">Tope máximo permitido: 40%</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Monto Solicitado</span>
                        <div className="text-2xl font-black text-[#102d49] font-serif">USD {Number(reqAmount).toLocaleString('es-UY')}</div>
                        <span className="text-slate-500">Rango: USD 15k - USD 500k</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Garantía</span>
                        <div className="text-2xl font-black text-[#102d49] font-serif">USD {Number(estValue).toLocaleString('es-UY')}</div>
                        <span className="text-slate-500">Inmueble: {app.property?.property_type || 'Apartamento'}</span>
                      </div>
                    </div>

                    {/* Checklist de Reglas de Admisión */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider">
                        Matriz de Cumplimiento de Políticas
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center space-x-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>LTV {financingPercent}% &le; 40% límite institucional</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Garantía ({app.property?.property_type || 'Apartamento'}) habilitada</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Ingresos comprobados (UYU 95.000 / mes)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Consulta Clearing de Informes & Central de Riesgos BCU</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analisisSubTab === 'ia' && (
                  <HipotecalyAiTab app={app} onRefresh={() => load(true)} />
                )}

                {analisisSubTab === 'oferta' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <h4 className="font-bold text-emerald-900 text-sm">Condiciones Financieras Aprobadas</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div><span className="text-slate-500 block text-[10px]">Monto</span><strong className="text-navy text-sm">USD {Number(reqAmount).toLocaleString('es-UY')}</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Tasa de interés</span><strong className="text-navy text-sm">11.5% Anual</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Plazo</span><strong className="text-navy text-sm">{app.term_months || 36} meses</strong></div>
                        <div><span className="text-slate-500 block text-[10px]">Cuota estimada</span><strong className="text-emerald-700 text-sm">USD 766 / mes</strong></div>
                      </div>
                    </div>
                  </div>
                )}

                {analisisSubTab === 'inversores' && (
                  <ApplicationMatchingTab
                    applicationId={app.id}
                    publicId={app.public_id}
                    department={app.property?.department || 'Montevideo'}
                    propertyType={app.property?.property_type || 'casa'}
                    requestedAmount={app.requested_amount}
                    currency={app.currency || 'USD'}
                    estimatedValue={app.property?.estimated_value || 0}
                  />
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: DOCUMENTACIÓN (DocFlow + Firma Notarial)          */}
            {/* ======================================================== */}
            {activeTab === 'documentos' && (
              <div className="space-y-6">
                {/* Banner de Evidencia Criptográfica de Firma */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#102d49] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileLock2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-[#f4b43b] uppercase tracking-wider">
                        Firma Electrónica Avanzada · Ley N° 18.600
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Evidencia y huella criptográfica conforme a la Ley N° 18.600 disponibles para este expediente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignatureEvidenceModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center space-x-1.5 shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver Evidencia de Firma</span>
                  </button>
                </div>

                <DocumentHub
                  caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                  appData={app}
                  onGoToSection={(sec) => setActiveTab(sec as any)}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: SEGUIMIENTO (Tareas + Comunicaciones + Timeline)  */}
            {/* ======================================================== */}
            {activeTab === 'seguimiento' && (
              <div className="space-y-5">
                {/* Subtabs internas */}
                <div className="flex space-x-2 border-b border-slate-100 pb-2">
                  {[
                    { id: 'tareas', label: 'Tareas Operativas' },
                    { id: 'comunicaciones', label: 'Comunicaciones' },
                    { id: 'actividad', label: 'Historial de Actividad' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSeguimientoSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        seguimientoSubTab === sub.id
                          ? 'bg-[#102d49] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {seguimientoSubTab === 'tareas' && (
                  <div className="space-y-4 text-xs">
                    <form onSubmit={handleAddTask} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Nueva tarea para este expediente..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                      <Button type="submit" variant="primary" size="sm" disabled={addingTask} className="!bg-[#102d49] text-white">
                        <Plus className="w-4 h-4 mr-1" /> Agregar Tarea
                      </Button>
                    </form>

                    <div className="space-y-2">
                      {(app.tasks || []).map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center space-x-2.5">
                            <CheckCircle2 className={`w-4 h-4 ${t.status === 'completed' ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span className={`font-semibold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {t.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">Pendiente</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seguimientoSubTab === 'comunicaciones' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-[#102d49] uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>Historial de Notificaciones y Comunicaciones</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowManualCommModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#102d49] text-white font-bold text-[11px] hover:bg-[#173a5e] flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5 mr-0.5" />
                        <span>Enviar Notificación</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {communicationsList.map((com) => (
                        <div key={com.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">
                                {com.channel}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 font-bold">{com.event_name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                com.delivery_type === 'AUTOMÁTICA' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {com.delivery_type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400 text-[10px]">
                                {new Date(com.created_at).toLocaleString('es-UY')}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                {com.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {com.subject && (
                            <p className="text-slate-900 font-semibold text-[11px]">Asunto: {com.subject}</p>
                          )}
                          <p className="text-slate-700 text-[11px] leading-relaxed">{com.message_content}</p>
                          <p className="text-[10px] text-slate-400">Destinatario: {com.recipient}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seguimientoSubTab === 'actividad' && (
                  <div className="space-y-3 text-xs">
                    {timelineEvents.map((event) => (
                      <div key={event.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{event.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">{event.time}</span>
                        </div>
                        <p className="text-slate-600">{event.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* SIDEBAR DERECHA: PRÓXIMO PASO, TAREAS & TIMELINE RESUMIDO (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Escribano Asignado Card (Requerimiento Notarial) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Escribano Asignado
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                  {assignedNotaryName ? 'Activo' : 'Sin asignar'}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-500">Estudio Fernández & Asociados</div>
                <h4 className="text-sm font-bold text-slate-900">{assignedNotaryName || 'Esc. María Pérez Morales'}</h4>
                <div className="text-[11px] text-slate-400 font-mono">N.º Caja Notarial: 48.291 · Habilitada</div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignNotaryModal(true)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Cambiar escribano</span>
              </button>
            </div>

            {/* Próximo Paso Card */}
            <div className="bg-[#102d49] text-white rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-[#f4b43b] uppercase tracking-wider block">
                Próximo Paso Requerido
              </span>
              <h4 className="text-sm font-bold text-white">Revisión de documentación de ingresos</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verificar recibo de sueldo para autorizar la emisión de la propuesta de financiamiento.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Responsable: Mesa de Crédito</span>
                <Clock className="w-3.5 h-3.5 text-[#f4b43b]" />
              </div>
            </div>

            {/* Checklist de Tareas del Expediente */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#102d49] flex items-center">
                  <CheckSquare className="w-4 h-4 mr-1.5 text-emerald-600" /> Tareas Operativas
                </h4>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {(app.tasks || []).length}
                </span>
              </div>

              {/* Form nueva tarea */}
              <form onSubmit={handleAddTask} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nueva tarea operativa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#102d49]"
                />
                <button
                  type="submit"
                  disabled={addingTask}
                  className="px-3 py-1.5 rounded-xl bg-[#102d49] text-white text-xs font-bold hover:bg-[#173a5e]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Lista de tareas */}
              <div className="space-y-2 text-xs">
                {(app.tasks || []).length === 0 ? (
                  <p className="text-slate-400 text-center py-2 text-[11px]">Sin tareas pendientes.</p>
                ) : (
                  app.tasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          t.status === 'completed' ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                      <span className={t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                        {t.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Timeline Resumido en Sidebar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Actividad Reciente
                </h4>
                <button onClick={() => setActiveTab('actividad')} className="text-[11px] font-bold text-[#102d49] hover:underline">
                  Ver todo →
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {timelineEvents.slice(0, 3).map((ev) => (
                  <div key={ev.id} className="flex items-start space-x-2.5 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">{ev.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      <DocumentGenerationModal
        isOpen={showDocGen}
        caseId={app?.id || id || 'e0000000-0000-0000-0000-000000000001'}
        appData={app}
        preselectedTemplateId={docGenTplId}
        onClose={() => {
          setShowDocGen(false);
          setDocGenTplId(undefined);
        }}
        onGenerated={() => {
          setActiveTab('documentos');
        }}
        onGoToSection={(sec) => setActiveTab(sec)}
      />

      {/* Modal Asignar / Cambiar Escribano */}
      {showAssignNotaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Asignar Escribano al Expediente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignNotaryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-slate-600">
              Seleccione el profesional o estudio notarial habilitado para conceder acceso mediante RLS y asignación de tareas.
            </p>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Escribano Responsable:</label>
              <select
                value={selectedNotaryUser}
                onChange={(e) => setSelectedNotaryUser(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="u-test-notary">Esc. María Pérez Morales (Estudio Fernández & Asoc. · Caja 48.291)</option>
                <option value="u-test-notary-2">Esc. Pablo Silva Gómez (Estudio Fernández & Asoc. · Caja 52.140)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-teal-50 text-teal-900 border border-teal-200/80 space-y-1">
              <div className="font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mr-1" /> Permiso Inmediato RLS
              </div>
              <p className="text-[11px] text-teal-800 leading-normal">
                Al confirmar, el escribano verá este legajo en su consola "Mis Expedientes" y podrá emitir observaciones y generar escrituras con DocFlow.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignNotaryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignedNotaryName(
                    selectedNotaryUser === 'u-test-notary'
                      ? 'Esc. María Pérez Morales'
                      : 'Esc. Pablo Silva Gómez'
                  );
                  setShowAssignNotaryModal(false);
                  setCommandActionToast('Escribano asignado exitosamente al expediente.');
                  setTimeout(() => setCommandActionToast(null), 3500);
                }}
                className="px-4 py-2 rounded-xl bg-[#102d49] hover:bg-[#173a5e] text-white font-bold"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Evidencia de Firma Electrónica Avanzada (Ley 18.600) */}
      {showSignatureEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Evidencia de Firma Digital Avanzada</h3>
                  <span className="text-[10px] font-bold text-slate-500">Ley Nº 18.600 · República Oriental del Uruguay</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  SIMULACIÓN / EVIDENCIA DEMO
                </span>
                <button
                  type="button"
                  onClick={() => setShowSignatureEvidenceModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Prueba técnica y jurídica de otorgamiento de firma electrónica avanzada conforme a la Ley N° 18.600.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Expediente:</span>
                <span className="font-bold text-emerald-400">{app?.public_id || 'HIP-DEMO-00124'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Hash Criptográfico SHA-256 (Inmutable):</span>
                <span className="text-[10px] text-amber-300 break-all select-all font-mono">
                  8f4a2c91b5d6e3f017a89bc44298fc1c149afbf4c8996fb92427ae41e4649b93
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Fecha/Hora de Captura:</span>
                <span className="text-slate-200">{new Date().toISOString()} (ISO 8601)</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Sello de Tiempo (TSA):</span>
                <span className="text-amber-300 font-bold">SIMULACIÓN / NO VALIDADO POR TSA</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px]">Firmante Notarial</span>
                <strong className="text-navy">{assignedNotaryName}</strong>
                <p className="text-[10px] text-slate-500">Caja Notarial 48.291</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px]">Prestador / Certificado</span>
                <strong className="text-navy">DEMO (Prestador de Pruebas)</strong>
                <p className="text-[10px] text-amber-700 font-semibold">Certificado: SIMULADO (Entorno Demo)</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11px]">
                Integridad garantizada. Estructura de evidencia conforme a estándares criptográficos de firma avanzada.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowSignatureEvidenceModal(false)}
                className="px-4 py-2 rounded-xl bg-[#102d49] text-white font-bold hover:bg-[#173a5e]"
              >
                Cerrar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Despacho Manual de Comunicaciones */}
      {showManualCommModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Enviar Notificación al Solicitante</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualCommModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Plantilla de Evento Operativo:</label>
                <select
                  value={manualCommTemplate}
                  onChange={(e) => setManualCommTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-navy bg-white"
                >
                  {getCommunicationTemplates().map((tpl) => (
                    <option key={tpl.code} value={tpl.code}>
                      {tpl.name} ({tpl.channel.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Canal de Envío:</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="commChan"
                      value="email"
                      checked={manualCommChannel === 'email'}
                      onChange={() => setManualCommChannel('email')}
                      className="text-brand-green"
                    />
                    <span>Email Notificación</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="commChan"
                      value="whatsapp"
                      checked={manualCommChannel === 'whatsapp'}
                      onChange={() => setManualCommChannel('whatsapp')}
                      className="text-brand-green"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Destinatario:</label>
                <input
                  type="text"
                  value={manualCommRecipient || app?.borrower?.email || 'solicitante@ejemplo.com'}
                  onChange={(e) => setManualCommRecipient(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-navy"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <span className="font-bold text-navy block text-[10px] uppercase">Variables que se inyectarán:</span>
                <p>• Nombre: {borrowerFullName}</p>
                <p>• Expediente: {app?.public_id || id}</p>
                <p>• Monto: USD {Number(reqAmount).toLocaleString('es-UY')}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualCommModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingComm}
                onClick={handleSendManualComm}
                className="px-4 py-2 rounded-xl bg-[#102d49] hover:bg-[#173a5e] text-white font-bold flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingComm ? 'Enviando...' : 'Despachar Mensaje'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer del Asistente IA */}
      <AiAssistantDrawer
        isOpen={showAiAssistantDrawer}
        onClose={() => setShowAiAssistantDrawer(false)}
        app={app}
      />

    </BackofficeLayout>
  );
};

