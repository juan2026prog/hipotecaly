import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import {
  getApplicationDetail,
  updateApplicationStatus,
  savePropertyValuation,
  createApplicationTask,
} from '../../lib/backofficeService';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ArrowLeft,
  FileText,
  User,
  Home,
  DollarSign,
  Compass,
  Activity,
  CheckSquare,
  Clock,
  CheckCircle2,
  FileCheck,
  Plus,
  Lock,
  Sparkles,
  Printer,
  FileSignature,
  ChevronDown,
  MessageSquare,
  Share2,
  Fingerprint,
  UserCheck,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { ApplicationMatchingTab } from '../../components/backoffice/ApplicationMatchingTab';
import { HipotecalyAiTab } from '../../components/ai/HipotecalyAiTab';
import { maskPhone, maskEmail } from '../../lib/sensitiveDataService';
import { DocumentHub } from '../../components/docflow/DocumentHub';
import { DocumentGenerationModal } from '../../components/docflow/DocumentGenerationModal';
import { KycVerificationCard } from '../../components/identity/KycVerificationCard';
import { SignatureProcessCard } from '../../components/signature/SignatureProcessCard';
import { isMarketplaceEnabled } from '../../config/features';
import { useAuth } from '../../contexts/AuthContext';

export const ApplicationDetailPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

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
  const [commandActionToast, setCommandActionToast] = useState<string | null>(null);
  const [showAssignNotaryModal, setShowAssignNotaryModal] = useState(false);
  const [selectedNotaryUser, setSelectedNotaryUser] = useState('u-test-notary');
  const [assignedNotaryName, setAssignedNotaryName] = useState('Esc. María Pérez Morales');

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
    const data = await getApplicationDetail(id);
    setApp(data);
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

  useEffect(() => {
    load();
  }, [id]);

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


  const tabs = [
    { id: 'resumen', label: 'Ficha 360° & Resumen', icon: FileText },
    { id: 'solicitante', label: 'Solicitante', icon: User },
    { id: 'propiedad', label: 'Propiedad', icon: Home },
    { id: 'ingresos', label: 'Ingresos & Capacidad', icon: DollarSign },
    { id: 'personas', label: 'Personas & Cotitulares', icon: Users },
    { id: 'documentos', label: 'DocFlow & Legajo', icon: FileCheck },
    { id: 'valuacion', label: 'Tasación', icon: Compass },
    { id: 'riesgo', label: 'Análisis de Riesgo', icon: ShieldAlert },
    { id: 'oferta', label: 'Oferta & Condiciones', icon: DollarSign },
    { id: 'ia', label: 'Evaluación IA', icon: Sparkles },
    { id: 'firmas', label: 'Firma Notarial', icon: FileSignature },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
    { id: 'actividad', label: 'Timeline de Actividad', icon: Activity },
    ...(isMarketplaceEnabled() || isSuperAdmin
      ? [{ id: 'prestamistas', label: 'Red Inversores', icon: Lock }]
      : []),
  ];

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

        {/* Top Breadcrumb & Return */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Link to={`${baseRoute}/solicitudes`} className="hover:text-[#102d49] font-semibold flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Solicitudes
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-[#102d49]">{app.public_id}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Responsable: Mesa de Crédito</span>
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
        {/* TABS DE NAVEGACIÓN DETALLADA                                 */}
        {/* ============================================================ */}
        <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex space-x-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#102d49] text-[#102d49] font-bold'
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
        {/* CONTENIDO PRINCIPAL + SIDEBAR TAREAS/TIMELINE                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Tab Panel (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            
            {/* TAB: RESUMEN / FICHA 360° */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#102d49]">Ficha Ejecutiva 360° del Expediente</h3>
                  <p className="text-xs text-slate-500">Resumen integral estructurado de la operación hipotecaria.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Garantía Inmobiliaria</span>
                    <p className="font-bold text-[#102d49] text-sm capitalize">{app.property?.property_type || 'Inmueble'}</p>
                    <p className="text-slate-600">Ubicación: {app.property?.neighborhood || 'Centro'}, {app.property?.department || 'Montevideo'}</p>
                    <p className="text-slate-600">Valor mercado estimado: USD {estValue.toLocaleString('es-UY')}</p>
                    <p className="text-slate-600">Padrón catastral: {app.property?.cadastral_number || '34.892 (Registrado)'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Condiciones Financieras</span>
                    <p className="font-bold text-[#102d49] text-sm">USD {reqAmount.toLocaleString('es-UY')} en {app.term_months || 36} meses</p>
                    <p className="text-slate-600">Destino: {app.purpose || 'Consolidación / Inversión'}</p>
                    <p className="text-slate-600">Porcentaje de financiación: {financingPercent}% (Margen seguro)</p>
                    <p className="text-slate-600">Modalidad: Intereses mensuales y capital al vencimiento</p>
                  </div>
                </div>

                {/* DocFlow Card Resumen */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Legajo Digital DOCFLOW</span>
                      <p className="font-bold text-[#102d49] text-sm">Autollenado & Versionado Certificado Activo</p>
                      <p className="text-[11px] text-slate-500">Documentos oficiales autocompletados desde los datos validados del expediente.</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('documentos')}
                    className="text-xs font-bold text-[#102d49] border-slate-300 hover:bg-slate-50"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" /> Ver Documentos
                  </Button>
                </div>

                {/* Tarjeta Universal de Verificación de Identidad (KYC) */}
                <KycVerificationCard
                  caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                  applicantName={borrowerFullName}
                  applicantCi={app.borrower?.document_number || '4.892.114-2'}
                />

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  🛡️ <strong>Protección Anti-Bypass Activa:</strong> La identidad directa y datos de contacto se mantienen enmascarados ante prestamistas e inversores hasta la formalización de la propuesta.
                </div>
              </div>
            )}

            {/* TAB: SOLICITANTE */}
            {activeTab === 'solicitante' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#102d49]">Datos del Solicitante</h3>
                    <p className="text-xs text-slate-500">Titular del crédito hipotecario</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDocGenTplId('tpl-seed-6');
                        setShowDocGen(true);
                      }}
                      className="text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#102d49]" /> Ficha Solicitante
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Nombre completo</label>
                    <p className="font-bold text-[#102d49] text-sm">{borrowerFullName}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Documento de Identidad (CI)</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.borrower?.id_number || '4.892.114-2'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Email</label>
                    <p className="font-bold text-[#102d49] text-sm font-mono">
                      {app.status === 'approved' || app.status === 'formalization'
                        ? (app.borrower?.email || 'titular@demo.uy')
                        : maskEmail(app.borrower?.email || 'ignacio@ejemplo.com')}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Teléfono Celular</label>
                    <p className="font-bold text-[#102d49] text-sm font-mono">
                      {app.status === 'approved' || app.status === 'formalization'
                        ? (app.borrower?.phone || '+598 99 123 456')
                        : maskPhone(app.borrower?.phone || '099123456')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROPIEDAD */}
            {activeTab === 'propiedad' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102d49]">Detalles de la Propiedad en Garantía</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocGenTplId('tpl-seed-7');
                      setShowDocGen(true);
                    }}
                    className="text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#102d49]" /> Generar Ficha Inmueble
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Tipo</label>
                    <p className="font-bold text-[#102d49] text-sm capitalize">{app.property?.property_type || 'Apartamento'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Superficie</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.surface_m2 || 85} m²</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Dormitorios</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.bedrooms || 2}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Departamento</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.department || 'Montevideo'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Zona / Barrio</label>
                    <p className="font-bold text-[#102d49] text-sm">{app.property?.neighborhood || 'Pocitos'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Situación Jurídica</label>
                    <p className="font-bold text-[#102d49] text-sm">Libre de Gravámenes</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INGRESOS */}
            {activeTab === 'ingresos' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#102d49]">Capacidad Financiera e Ingresos</h3>
                    <p className="text-xs text-slate-500">Evaluación de solvencia y repago de cuota.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocGenTplId('tpl-seed-4');
                      setShowDocGen(true);
                    }}
                    className="text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#102d49]" /> Declaración Jurada
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Ingreso Mensual Declarado</span>
                    <p className="font-bold text-[#102d49] text-lg mt-1">
                      UYU {(app.income?.monthly_amount || 95000).toLocaleString('es-UY')}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 capitalize">
                      Tipo de actividad: {app.income?.income_type || 'Dependiente'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Relación Cuota / Ingreso</span>
                    <p className="font-bold text-emerald-800 text-lg mt-1">
                      24.8% <span className="text-xs font-normal text-slate-500">(Saludable &lt; 35%)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Margen holgado de repago de cuota.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PERSONAS */}
            {activeTab === 'personas' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-[#102d49] flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-green" /> Personas Vinculadas al Expediente
                </h3>
                {/* Titular principal */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Titular Principal</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#102d49] text-sm">{borrowerFullName}</p>
                      <p className="text-xs text-slate-500">{app.borrower?.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">TITULAR</span>
                  </div>
                </div>
                {/* Cotitulares */}
                <div className="p-4 rounded-xl border border-slate-200 border-dashed text-center">
                  <p className="text-xs text-slate-400">No hay cotitulares ni garantes registrados.</p>
                  <button className="mt-2 text-xs font-bold text-[#102d49] hover:text-brand-green">+ Agregar cotitular o garante</button>
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTOS (DOCFLOW) */}
            {activeTab === 'documentos' && (
              <DocumentHub
                caseId={app.id || id || 'e0000000-0000-0000-0000-000000000001'}
                appData={app}
                onGoToSection={(sec) => setActiveTab(sec)}
              />
            )}

            {/* TAB: RIESGO */}
            {activeTab === 'riesgo' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-[#102d49] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Análisis de Riesgo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">% Financiación</span>
                    <div className="text-2xl font-black text-[#102d49] font-serif">{financingPercent}%</div>
                    <span className="text-[11px] text-slate-500">Sobre valor tasado</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Monto Solicitado</span>
                    <div className="text-2xl font-black text-[#102d49] font-serif">USD {Number(reqAmount).toLocaleString('es-UY')}</div>
                    <span className="text-[11px] text-slate-500">Crédito hipotecario</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Garantía</span>
                    <div className="text-2xl font-black text-[#102d49] font-serif">USD {Number(estValue).toLocaleString('es-UY')}</div>
                    <span className="text-[11px] text-slate-500">Valor tasado del inmueble</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-800 mb-1">Evaluación de Riesgo</p>
                  <p className="text-amber-700">El análisis de riesgo detallado está disponible en el tab <strong>Evaluación IA</strong>. Este módulo muestra el resumen ejecutivo de las métricas clave para la decisión crediticia.</p>
                </div>
              </div>
            )}

            {/* TAB: OFERTA */}
            {activeTab === 'oferta' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-[#102d49] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-brand-green" /> Oferta & Condiciones de Financiación
                </h3>
                {app.status === 'offer_available' || app.status === 'formalization' || app.status === 'approved' ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                      <span className="font-bold text-emerald-800 block">Oferta disponible para el solicitante</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div><span className="text-[10px] text-slate-400 block">Monto aprobado</span><span className="font-bold text-[#102d49]">USD {Number(reqAmount).toLocaleString('es-UY')}</span></div>
                        <div><span className="text-[10px] text-slate-400 block">% Financiación</span><span className="font-bold text-[#102d49]">{financingPercent}%</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-semibold">Oferta no generada aún</p>
                    <p className="text-xs text-slate-400">La oferta se generará una vez completada la evaluación de riesgo y tasación del inmueble.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: IA */}
            {activeTab === 'ia' && (
              <div className="space-y-6">
                <HipotecalyAiTab app={app} onRefresh={() => load(true)} />
              </div>
            )}

            {/* TAB: TASACIÓN */}
            {activeTab === 'valuacion' && (
              <form onSubmit={handleSaveValuation} className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#102d49]">Valuación Preliminar y Peritaje del Inmueble</h3>
                  <p className="text-xs text-slate-500">Estimación técnica para calcular el porcentaje de financiación real.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Valor preliminar (USD)
                    </label>
                    <input
                      type="number"
                      value={preliminaryValue}
                      onChange={(e) => setPreliminaryValue(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#102d49]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rango Mínimo (USD)
                    </label>
                    <input
                      type="number"
                      value={valMin}
                      onChange={(e) => setValMin(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rango Máximo (USD)
                    </label>
                    <input
                      type="number"
                      value={valMax}
                      onChange={(e) => setValMax(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nivel de Confianza
                    </label>
                    <select
                      value={valConfidence}
                      onChange={(e) => setValConfidence(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="alta">Alta (comparables directos de mercado)</option>
                      <option value="media">Media (datos declarados)</option>
                      <option value="baja">Baja (a tasar físicamente)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Metodología Empleada
                    </label>
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas y Observaciones del Perito
                  </label>
                  <textarea
                    rows={3}
                    value={valNotes}
                    onChange={(e) => setValNotes(e.target.value)}
                    placeholder="Detalles sobre el estado del inmueble, ubicación o metraje..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" disabled={savingVal} className="!bg-[#102d49] text-white">
                  {savingVal ? 'Guardando...' : 'Guardar Valuación'}
                </Button>

                {valSavedToast && (
                  <span className="text-xs font-bold text-emerald-700 ml-3">
                    ✓ Valuación registrada con éxito
                  </span>
                )}
              </form>
            )}

            {/* TAB: FIRMAS NOTARIALES */}
            {activeTab === 'firmas' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#102d49]">Firma Electrónica Avanzada (Firma.gub.uy / Notarial)</h3>
                    <p className="text-xs text-slate-500">Orquestación de firma electrónica avanzada bajo Ley N° 18.600.</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => triggerCommandAction('Firma Notarial Iniciada', 'Proceso de firma electrónica avanzada remitido a los comparecientes.')}
                    className="text-xs font-bold !bg-[#102d49] text-white"
                  >
                    <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                    Enviar a Firma Notarial
                  </Button>
                </div>

                <SignatureProcessCard
                  process={{
                    id: 'sig-proc-current-01',
                    provider_process_id: 'AGESIC-2026-00491',
                    provider: 'firma_gub',
                    mode: 'mock',
                    status: 'signed',
                    created_at: app.created_at,
                    completed_at: new Date().toISOString(),
                    documents: [
                      {
                        title: 'Solicitud de Crédito Hipotecario Definitiva',
                        sha256_original: 'd41d8cd98f00b204e9800998ecf8427e9f1d8cd98f00b204e9800998ecf8427e',
                        sha256_signed: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                      },
                    ],
                    signers: [
                      {
                        name: borrowerFullName,
                        email: app.borrower?.email || 'titular@demo.uy',
                        role: 'applicant',
                        status: 'signed',
                        signedAt: new Date().toISOString(),
                      },
                    ],
                  }}
                  onRefresh={() => load(true)}
                />
              </div>
            )}

            {/* TAB: COMUNICACIONES */}
            {activeTab === 'comunicaciones' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102d49] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-green" /> Historial de Comunicaciones
                  </h3>
                  <button className="text-xs font-bold text-[#102d49] hover:text-brand-green border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">+ Enviar mensaje</button>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { canal: 'Email', msg: 'Solicitud recibida correctamente. Nos pondremos en contacto.', fecha: 'Hoy 10:15', estado: 'Entregado', template: 'solicitud_recibida' },
                    { canal: 'Email', msg: 'Documentación pendiente: Recibo de sueldo y certificado DGI.', fecha: 'Ayer 14:30', estado: 'Entregado', template: 'doc_faltante' },
                    { canal: 'Email', msg: 'Su cédula de identidad fue verificada exitosamente.', fecha: '03/09/2026', estado: 'Entregado', template: 'kyc_aprobado' },
                  ].map((com, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{com.canal}</span>
                          <span className="text-[10px] font-mono text-slate-400">{com.template}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px]">
                          <span className="text-slate-400">{com.fecha}</span>
                          <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{com.estado}</span>
                        </div>
                      </div>
                      <p className="text-slate-600">{com.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TIMELINE DE ACTIVIDAD (UNIFICADO) */}
            {activeTab === 'actividad' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#102d49]">Timeline de Actividad del Expediente</h3>
                  <span className="text-xs font-mono text-slate-400">{timelineEvents.length} eventos registrados</span>
                </div>

                <div className="space-y-3 text-xs">
                  {timelineEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{event.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {event.category}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{event.time}</span>
                      </div>
                      <p className="text-slate-600">{event.desc}</p>
                      <span className="text-[10px] text-slate-400 block pt-1 font-mono">Actor: {event.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: RED DE INVERSORES */}
            {activeTab === 'prestamistas' && (
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
    </BackofficeLayout>
  );
};

