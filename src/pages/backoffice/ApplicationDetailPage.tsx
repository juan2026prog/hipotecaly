import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import {
  getApplicationDetail,
  updateApplicationStatus,
  savePropertyValuation,
  createApplicationTask,
} from '../../lib/backofficeService';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  FileText,
  User,
  Home,
  DollarSign,
  Camera,
  Compass,
  Activity,
  CheckSquare,
  Clock,
  CheckCircle2,
  FileCheck,
  Plus,
  Lock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { ApplicationMatchingTab } from '../../components/backoffice/ApplicationMatchingTab';
import { HipotecalyAiTab } from '../../components/ai/HipotecalyAiTab';
import { maskPhone, maskEmail } from '../../lib/sensitiveDataService';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  // Acciones sobre documentos (observar / aprobar)
  const handleDocumentAction = (docId: string, action: 'verified' | 'observed') => {
    if (!app) return;
    const updated = (app.documents || []).map((d: any) => {
      if (d.id === docId) {
        return { ...d, status: action };
      }
      return d;
    });
    setApp({ ...app, documents: updated });
  };

  // Estados para valuación preliminar (Regla 22 & 40)
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
    }
    setAddingTask(false);
  };

  if (loading) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center text-slate-400 font-medium">
          Cargando detalles del expediente...
        </div>
      </BackofficeLayout>
    );
  }

  if (!app) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center space-y-3">
          <p className="text-sm font-bold text-navy">Expediente no encontrado.</p>
          <Link to="/app/solicitudes" className="text-xs font-semibold text-brand-green hover:underline">
            ← Volver al listado
          </Link>
        </div>
      </BackofficeLayout>
    );
  }

  const estValue = app.property?.estimated_value || 0;
  const reqAmount = Number(app.requested_amount) || 0;
  const ltv = estValue > 0 ? (reqAmount / estValue) * 100 : 0;

  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: FileText },
    { id: 'solicitante', label: 'Solicitante', icon: User },
    { id: 'propiedad', label: 'Propiedad', icon: Home },
    { id: 'ingresos', label: 'Ingresos', icon: DollarSign },
    { id: 'documentos', label: 'Documentos', icon: FileCheck },
    { id: 'ia', label: 'HIPOTECALY AI', icon: Sparkles },
    { id: 'fotos', label: 'Fotos', icon: Camera },
    { id: 'valuacion', label: 'Valuación', icon: Compass },
    { id: 'actividad', label: 'Actividad', icon: Activity },
    { id: 'prestamistas', label: 'Prestamistas (F4)', icon: Lock },
  ];

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        
        {/* Top Breadcrumb & Return */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link to="/app/solicitudes" className="hover:text-brand-green flex items-center">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Solicitudes
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-navy">{app.public_id}</span>
        </div>

        {/* ============================================================ */}
        {/* HEADER DEL EXPEDIENTE (Regla 38)                              */}
        {/* ============================================================ */}
        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-2xl font-black text-navy">{app.public_id}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 capitalize">
                {app.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-muted">
              Creado el {new Date(app.created_at).toLocaleDateString('es-UY')} · Titular:{' '}
              <strong className="text-navy">
                {app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Borrador'}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Monto y LTV */}
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Monto Solicitado</span>
              <span className="text-lg font-extrabold text-navy">
                USD {reqAmount.toLocaleString('es-UY')}
              </span>
            </div>

            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">LTV Resultante</span>
              <span className="text-lg font-extrabold text-brand-green-dark">
                {ltv > 0 ? `${ltv.toFixed(1)}%` : '-'}
              </span>
            </div>

            {/* Selector de Estado Operativo */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">
                Cambiar Estado
              </label>
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 rounded-btn border border-slate-border bg-white text-xs font-semibold text-navy focus:ring-2 focus:ring-brand-green"
              >
                <option value="draft">Borrador</option>
                <option value="submitted">Solicitud Recibida</option>
                <option value="info_review">Información en Revisión</option>
                <option value="property_analysis">Propiedad en Análisis</option>
                <option value="matching_lenders">Buscando Propuesta</option>
                <option value="offer_available">Propuesta Disponible</option>
                <option value="formalization">Formalización Notarial</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TABS NAVIGATION                                              */}
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
                    ? 'border-brand-green text-brand-green font-bold'
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
        {/* CONTENIDO DE TABS + SIDEBAR DERECHA (DESKTOP)                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Tab Panel */}
          <div className="lg:col-span-8 bg-white rounded-card p-6 border border-slate-border shadow-card">
            
            {/* TAB: RESUMEN */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-navy">Ficha General del Expediente</h3>
                  <p className="text-xs text-slate-muted">Resumen ejecutivo de la operación.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Garantía Inmobiliaria</span>
                    <p className="font-bold text-navy text-sm capitalize">{app.property?.property_type || 'Inmueble'}</p>
                    <p className="text-slate-600">Ubicación: {app.property?.neighborhood}, {app.property?.department}</p>
                    <p className="text-slate-600">Valor mercado: USD {estValue.toLocaleString('es-UY')}</p>
                    <p className="text-slate-600">Padrón: {app.property?.cadastral_number || 'A verificar'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Condición Crediticia</span>
                    <p className="font-bold text-navy text-sm">USD {reqAmount.toLocaleString('es-UY')} en {app.term_months || 36} meses</p>
                    <p className="text-slate-600">Finalidad: {app.purpose || 'Financiación'}</p>
                    <p className="text-slate-600">LTV: {ltv.toFixed(1)}% (Tope prestamista: 40%)</p>
                    <p className="text-slate-600">Clearing: Admite evaluación preliminar</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-green-light/40 border border-brand-green/20 text-xs text-brand-green-dark">
                  🛡️ <strong>Protección Anti-Bypass Activa:</strong> La dirección exacta y datos de contacto se mantienen enmascarados ante prestamistas hasta la formalización de oferta.
                </div>
              </div>
            )}

            {/* TAB: SOLICITANTE */}
            {activeTab === 'solicitante' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-navy">Datos del Solicitante</h3>
                  {app.status !== 'approved' && app.status !== 'formalization' && (
                    <span className="flex items-center text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Contacto Enmascarado
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Nombre completo</label>
                    <p className="font-bold text-navy text-sm">{app.borrower?.first_name} {app.borrower?.last_name}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Documento de Identidad (CI)</label>
                    <p className="font-bold text-navy text-sm">{app.borrower?.id_number || 'Pendiente'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Email</label>
                    <p className="font-bold text-navy text-sm font-mono">
                      {app.status === 'approved' || app.status === 'formalization'
                        ? (app.borrower?.email || 'Sin email')
                        : maskEmail(app.borrower?.email)}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Teléfono Celular</label>
                    <p className="font-bold text-navy text-sm font-mono">
                      {app.status === 'approved' || app.status === 'formalization'
                        ? (app.borrower?.phone || 'Sin teléfono')
                        : maskPhone(app.borrower?.phone)}
                    </p>
                  </div>
                </div>

                {app.status !== 'approved' && app.status !== 'formalization' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                    🛡️ <strong>Política de Privacidad del Tenant:</strong> El teléfono y email se desbloquean automáticamente una vez que el expediente alcanza el estado <strong>Aprobado</strong> o <strong>Formalización</strong>.
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROPIEDAD */}
            {activeTab === 'propiedad' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-navy">Detalles de la Propiedad en Garantía</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium">Tipo</label>
                    <p className="font-bold text-navy text-sm capitalize">{app.property?.property_type}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Superficie</label>
                    <p className="font-bold text-navy text-sm">{app.property?.surface_m2 || 0} m²</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Dormitorios</label>
                    <p className="font-bold text-navy text-sm">{app.property?.bedrooms || 0}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Departamento</label>
                    <p className="font-bold text-navy text-sm">{app.property?.department}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Zona / Barrio</label>
                    <p className="font-bold text-navy text-sm">{app.property?.neighborhood || app.property?.city}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium">Situación Jurídica</label>
                    <p className="font-bold text-navy text-sm capitalize">{app.property?.legal_status?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTOS (Regla 23) */}
            {activeTab === 'documentos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-navy">Gestión Documental Privada</h3>
                    <p className="text-xs text-slate-500">Revisión, aprobación y observaciones de legajo.</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                    Storage Privado RLS
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {(app.documents || []).length === 0 ? (
                    <p className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                      No hay documentos adjuntados todavía.
                    </p>
                  ) : (
                    app.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-brand-green shrink-0" />
                          <div>
                            <p className="font-bold text-navy">{doc.document_type}</p>
                            <p className="text-[10px] text-slate-500">{doc.file_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'observed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {doc.status === 'verified' ? 'Aprobado' : doc.status === 'observed' ? 'Observado' : 'Pendiente'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDocumentAction(doc.id, 'verified')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition-colors"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDocumentAction(doc.id, 'observed')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[10px] transition-colors"
                          >
                            Observar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: HIPOTECALY AI CORE */}
            {activeTab === 'ia' && (
              <div className="space-y-6">
                <HipotecalyAiTab app={app} onRefresh={() => load(true)} />
              </div>
            )}

            {/* TAB: VALUACIÓN PRELIMINAR (Regla 22 & 40) */}
            {activeTab === 'valuacion' && (
              <form onSubmit={handleSaveValuation} className="space-y-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-2.5 py-0.5 rounded-full">
                      Módulo Técnico
                    </span>
                    <span className="text-[10px] text-slate-400 italic">No es tasación oficial</span>
                  </div>
                  <h3 className="text-base font-bold text-navy mt-1">Valuación Preliminar del Inmueble</h3>
                  <p className="text-xs text-slate-muted">
                    Estimación técnica preliminar para calcular capacidad crediticia y LTV real.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Valor preliminar (USD)
                    </label>
                    <input
                      type="number"
                      value={preliminaryValue}
                      onChange={(e) => setPreliminaryValue(Number(e.target.value))}
                      className="w-full p-2.5 rounded-btn border border-slate-border text-xs font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Rango Mínimo (USD)
                    </label>
                    <input
                      type="number"
                      value={valMin}
                      onChange={(e) => setValMin(Number(e.target.value))}
                      className="w-full p-2.5 rounded-btn border border-slate-border text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Rango Máximo (USD)
                    </label>
                    <input
                      type="number"
                      value={valMax}
                      onChange={(e) => setValMax(Number(e.target.value))}
                      className="w-full p-2.5 rounded-btn border border-slate-border text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Nivel de Confianza
                    </label>
                    <select
                      value={valConfidence}
                      onChange={(e) => setValConfidence(e.target.value)}
                      className="w-full p-2.5 rounded-btn border border-slate-border text-xs"
                    >
                      <option value="alta">Alta (comparables directos)</option>
                      <option value="media">Media (datos declarados)</option>
                      <option value="baja">Baja (a tasar físicamente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Metodología Empleada
                    </label>
                    <select
                      value={valMethodology}
                      onChange={(e) => setValMethodology(e.target.value)}
                      className="w-full p-2.5 rounded-btn border border-slate-border text-xs"
                    >
                      <option value="comparables_de_mercado">Comparables de mercado</option>
                      <option value="costo_reposicion">Costo de reposición</option>
                      <option value="rentabilidad_comercial">Rentabilidad comercial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-text mb-1">
                    Notas y Observaciones del Analista
                  </label>
                  <textarea
                    rows={3}
                    value={valNotes}
                    onChange={(e) => setValNotes(e.target.value)}
                    placeholder="Detalles sobre el estado del inmueble, ubicación o metraje..."
                    className="w-full p-3 rounded-btn border border-slate-border text-xs"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" disabled={savingVal}>
                  {savingVal ? 'Guardando valuación...' : 'Guardar Valuación Preliminar'}
                </Button>

                {valSavedToast && (
                  <span className="text-xs font-bold text-brand-green ml-3">
                    ✓ Valuación registrada con éxito
                  </span>
                )}
              </form>
            )}

            {/* TAB: ACTIVIDAD (Regla 39) */}
            {activeTab === 'actividad' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-navy">Historial de Actividad y Estados</h3>
                <div className="space-y-3 text-xs">
                  {((app.history as any[]) || [
                    { notes: 'Solicitud ingresada al sistema', created_at: app.created_at },
                  ]).map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-2 h-2 rounded-full bg-brand-green mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-navy">{h.notes || 'Actualización de estado'}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(h.created_at).toLocaleString('es-UY')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PRESTAMISTAS (Fase 4: Matching, Oportunidades, Ofertas y Anti-Bypass) */}
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

          {/* ============================================================ */}
          {/* SIDEBAR DERECHA: PRÓXIMO PASO Y TAREAS (Regla 38)            */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Próximo Paso Card */}
            <div className="bg-navy text-white rounded-card p-5 border border-navy-border shadow-floating space-y-2">
              <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                Próximo Paso Requerido
              </span>
              <h4 className="text-sm font-bold text-white">Revisión de documentación de ingresos</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verificar recibo de sueldo para autorizar la búsqueda de ofertas con prestamistas.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Responsable: Mesa de Crédito</span>
                <Clock className="w-3.5 h-3.5 text-brand-green" />
              </div>
            </div>

            {/* Checklist de Tareas del Expediente (Regla 24) */}
            <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center">
                  <CheckSquare className="w-4 h-4 mr-1.5 text-brand-green" /> Tareas Operativas
                </h4>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {(app.tasks || []).length}
                </span>
              </div>

              {/* Form nueva tarea */}
              <form onSubmit={handleAddTask} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nueva tarea..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-btn border border-slate-border text-xs focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
                <button
                  type="submit"
                  disabled={addingTask}
                  className="px-3 py-1.5 rounded-btn bg-brand-green text-white text-xs font-bold"
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
                          t.status === 'completed' ? 'text-brand-green' : 'text-slate-300'
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

          </div>

        </div>

      </div>
    </BackofficeLayout>
  );
};
