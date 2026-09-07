import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  ArrowLeft,
  FileText,
  User,
  Home,
  FileCheck,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Stamp,
  Plus,
  ShieldCheck,
  Download,
  Eye,
  Sparkles,
} from 'lucide-react';
import { getNotaryStatusLabel, NotaryStatus, NotaryChecklistItem, NotaryObservation } from '../../lib/types';
import { DocumentHub } from '../../components/docflow/DocumentHub';
import { DocumentGenerationModal } from '../../components/docflow/DocumentGenerationModal';
import { SignatureProcessCard } from '../../components/signature/SignatureProcessCard';

export const NotaryApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'resumen' | 'partes' | 'propiedad' | 'documentos' | 'estudio' | 'observaciones' | 'docflow' | 'firmas' | 'tareas_actividad'
  >('resumen');

  // Checklist & Observaciones
  const [checklist, setChecklist] = useState<NotaryChecklistItem[]>([]);
  const [observations, setObservations] = useState<NotaryObservation[]>([]);

  // Modal para nueva observación
  const [showNewObsModal, setShowNewObsModal] = useState(false);
  const [newObsTitle, setNewObsTitle] = useState('');
  const [newObsDesc, setNewObsDesc] = useState('');
  const [newObsType, setNewObsType] = useState<any>('documental');
  const [newObsSeverity, setNewObsSeverity] = useState<any>('requiere_correccion');
  const [savingObs, setSavingObs] = useState(false);

  // Modal DocFlow
  const [showDocGen, setShowDocGen] = useState(false);

  // Notary status selector toast
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const appData = await notaryService.getNotaryApplicationDetail(id, user?.id || 'u-test-notary');
      setApp(appData);

      const chk = await notaryService.getNotaryChecklist(appData.id, appData.organization_id);
      setChecklist(chk);

      const obs = await notaryService.getNotaryObservations(appData.id);
      setObservations(obs);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.id]);

  const handleStatusChange = async (newStatus: NotaryStatus) => {
    if (!app) return;
    setApp({ ...app, notary_status: newStatus });
    await notaryService.updateNotaryStatus(app.id, app.organization_id, newStatus);
    setStatusToast(`Estado notarial actualizado a: ${getNotaryStatusLabel(newStatus)}`);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleChecklistToggle = async (item: NotaryChecklistItem) => {
    const nextStatus: 'pending' | 'completed' = item.status === 'completed' ? 'pending' : 'completed';
    const updated: NotaryChecklistItem[] = checklist.map((i) =>
      i.id === item.id ? { ...i, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : undefined } : i
    );
    setChecklist(updated);
    await notaryService.updateChecklistItem(item.id, nextStatus, item.comments, user?.id);
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
          <span>Cargando legajo y estudio notarial...</span>
        </div>
      </NotaryLayout>
    );
  }

  const financingPct = app.property?.estimated_value
    ? Math.round((app.requested_amount / app.property.estimated_value) * 100)
    : 45;

  return (
    <NotaryLayout title={`Expediente ${app.public_id}`}>
      {/* Toast de confirmación de estado */}
      {statusToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-teal-500/50 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Barra Superior con Botón Volver y Header del Expediente */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to={`${basePath}/expedientes`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Expedientes</span>
          </Link>

          {/* Selector de Estado Notarial Independiente */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500">Estado Notarial:</span>
            <select
              value={app.notary_status || 'under_review'}
              onChange={(e) => handleStatusChange(e.target.value as NotaryStatus)}
              className="bg-teal-50 text-teal-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="not_assigned">No asignado</option>
              <option value="assigned">Asignado</option>
              <option value="documents_pending">Esperando documentación</option>
              <option value="under_review">En estudio</option>
              <option value="observed">Observado</option>
              <option value="documentation_complete">Documentación completa</option>
              <option value="drafting">Preparando escritura</option>
              <option value="ready_to_sign">Listo para firma</option>
              <option value="signed">Firmado</option>
              <option value="completed">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Encabezado del Expediente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {app.public_id}
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {app.borrower?.first_name} {app.borrower?.last_name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 flex items-center space-x-2">
              <span>Garantía: {app.property?.address}</span>
              <span>·</span>
              <span>Padrón {app.property?.cadastral_number} ({app.property?.department})</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowDocGen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar con DocFlow</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('observaciones');
                setShowNewObsModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Observación</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Notariales */}
      <div className="border-b border-slate-200 bg-white px-3 rounded-2xl shadow-sm overflow-x-auto flex space-x-1">
        {[
          { id: 'resumen', label: 'Resumen', icon: FileText },
          { id: 'partes', label: 'Partes', icon: User },
          { id: 'propiedad', label: 'Propiedad & Antecedentes', icon: Home },
          { id: 'documentos', label: 'Documentos', icon: FileCheck },
          { id: 'estudio', label: 'Estudio Notarial', icon: Stamp },
          { id: 'observaciones', label: 'Observaciones', icon: AlertTriangle, count: observations.filter((o) => o.status === 'open').length },
          { id: 'docflow', label: 'DocFlow Escrituras', icon: FileText },
          { id: 'firmas', label: 'Firmas Digitales', icon: FileSignature },
          { id: 'tareas_actividad', label: 'Tareas & Actividad', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-500 text-white">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESUMEN DEL EXPEDIENTE */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Monto de la Operación</span>
              <div className="text-2xl font-black text-slate-900">
                {app.currency} {app.requested_amount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">{app.term_months} meses · {app.interest_rate || '8.5% TNA'}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Porcentaje de financiación</span>
              <div className="text-2xl font-black text-teal-700">{financingPct}%</div>
              <div className="text-xs text-slate-500">Sobre valor tasado de USD {app.property?.estimated_value?.toLocaleString()}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Acreedor / Prestamista</span>
              <div className="text-base font-bold text-slate-900 truncate">
                {app.lender?.name || 'Fondo Privado Nova Capital'}
              </div>
              <div className="text-xs text-slate-500">RUT: {app.lender?.rut || '21.908.411.0012'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <Stamp className="w-4 h-4 text-teal-600" />
                <span>Estado del Estudio Notarial</span>
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Estado actual:</span>
                  <span className="font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    {getNotaryStatusLabel(app.notary_status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Escribana responsable:</span>
                  <span className="font-bold text-slate-900">Esc. María Pérez (Caja 48.291)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Checklist Notarial:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {checklist.filter((c) => c.status === 'completed').length} / {checklist.length} completos
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Observaciones abiertas:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {observations.filter((o) => o.status === 'open').length} observaciones
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Validación de Partes & Garantía</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                  <span className="font-semibold">Titularidad y Estado Civil</span>
                  <span className="font-bold">Verificado</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                  <span className="font-semibold">Validación Biométrica KYC</span>
                  <span className="font-bold">Aprobada (Didit)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800">
                  <span className="font-semibold">Certificados Registrales</span>
                  <span className="font-bold">1 en revisión</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTES */}
      {activeTab === 'partes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Partes Intervinientes en la Operación</h3>
            <p className="text-xs text-slate-500">Datos requeridos para la redacción de la escritura de mutuo e hipoteca.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deudor / Solicitante */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Parte Deudora / Hipotecante
              </span>
              <div className="text-base font-bold text-slate-900">
                {app.borrower?.first_name} {app.borrower?.last_name}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div><span className="font-semibold">Documento:</span> {app.borrower?.id_type || 'CI'} {app.borrower?.id_number || '4.218.930-5'}</div>
                <div><span className="font-semibold">Estado Civil:</span> {app.borrower?.marital_status || 'Casado/a'}</div>
                <div><span className="font-semibold">Domicilio:</span> {app.borrower?.address || 'Montevideo'}</div>
                <div><span className="font-semibold">Email:</span> {app.borrower?.email}</div>
                <div><span className="font-semibold">Teléfono:</span> {app.borrower?.phone}</div>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Resultado KYC:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verificado / Identidad Aprobada
                </span>
              </div>
            </div>

            {/* Acreedor / Prestamista */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Parte Acreedora / Mutuante
              </span>
              <div className="text-base font-bold text-slate-900">
                {app.lender?.name || 'Fondo Inversor Privado Nova Capital'}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div><span className="font-semibold">Personería:</span> Persona Jurídica / RUT {app.lender?.rut || '21.908.411.0012'}</div>
                <div><span className="font-semibold">Representante:</span> Dr. Juan Manuel Fernández (Apoderado según poder vigente)</div>
                <div><span className="font-semibold">Domicilio constituido:</span> Rincón 487 Piso 3, Montevideo</div>
                <div><span className="font-semibold">Condición:</span> Acreedor Hipotecario en 1.er Grado</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROPIEDAD & ANTECEDENTES DOMINIALES (30 AÑOS) */}
      {activeTab === 'propiedad' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Datos Físicos y Catastrales del Inmueble</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Padrón</span>
                <span className="text-sm font-black text-slate-900 font-mono">{app.property?.cadastral_number}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Departamento</span>
                <span className="text-sm font-bold text-slate-900">{app.property?.department}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Superficie</span>
                <span className="text-sm font-bold text-slate-900">{app.property?.surface_m2 || 210} m²</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tasación</span>
                <span className="text-sm font-bold text-slate-900">USD {app.property?.estimated_value?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Stamp className="w-4 h-4 text-teal-600" />
                <span>Estudio de Títulos y Antecedentes Dominiales (30 Años)</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Cadena Dominial Verificada
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed space-y-2 border border-slate-200/80">
              <p className="font-semibold text-slate-900">Resumen del Tracto Sucesivo:</p>
              <p>{app.property?.history_30_years || 'Inmueble con títulos originales presentados. No surgen embargos, interdicciones ni servidumbres no declaradas en la matriz registral.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Legajo Documental Notarial</h3>
              <p className="text-xs text-slate-500">Documentos verificados y certificados con almacenamiento seguro cifrado.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Subir Documento</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
            {[
              { name: 'Cédula de Identidad de las partes.pdf', type: 'Identificación', status: 'Aprobado', date: '04/09/2026' },
              { name: 'Título_Propiedad_Escritura_2014.pdf', type: 'Título Dominial', status: 'Aprobado', date: '04/09/2026' },
              { name: 'Cedula_Catastral_2026.pdf', type: 'Catastro', status: 'Aprobado', date: '05/09/2026' },
              { name: 'Contribucion_Inmobiliaria_Al_Dia.pdf', type: 'Tributos', status: 'Aprobado', date: '05/09/2026' },
              { name: 'Certificado_Registral_Inmobiliaria_DGR.pdf', type: 'Registral', status: 'En revisión', date: '06/09/2026' },
            ].map((doc, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{doc.name}</div>
                    <div className="text-[11px] text-slate-400">{doc.type} · {doc.date}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.status === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {doc.status}
                  </span>
                  <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ESTUDIO NOTARIAL & CHECKLIST */}
      {activeTab === 'estudio' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Checklist Notarial y Control de Requisitos</h3>
                <p className="text-xs text-slate-500">Marca los hitos verificados para habilitar la redacción definitiva y la firma.</p>
              </div>
              <div className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200 self-start">
                {checklist.filter((c) => c.status === 'completed').length} de {checklist.length} Hitos Completos
              </div>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item) => {
                const isDone = item.status === 'completed';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleChecklistToggle(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      isDone
                        ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 pointer-events-none"
                    />
                    <div className="flex-1 text-xs">
                      <div className={`font-bold ${isDone ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                        {item.title}
                      </div>
                      {item.comments && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.comments}</div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OBSERVACIONES NOTARIALES */}
      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Observaciones Notariales Estructuradas</h3>
              <p className="text-xs text-slate-500">Registra requerimientos, faltantes registrales o bloqueos jurídicos.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewObsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Observación</span>
            </button>
          </div>

          <div className="space-y-3">
            {observations.length === 0 ? (
              <div className="bg-white p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-200">
                No hay observaciones registradas en este expediente.
              </div>
            ) : (
              observations.map((obs) => {
                const isOpen = obs.status === 'open';
                return (
                  <div
                    key={obs.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isOpen
                        ? obs.severity_level === 'bloqueante'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            obs.severity_level === 'bloqueante'
                              ? 'bg-rose-100 text-rose-800'
                              : obs.severity_level === 'requiere_correccion'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {obs.severity_level}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          Tipo: {obs.observation_type}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isOpen ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isOpen ? 'Abierta' : 'Resuelta'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{obs.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{obs.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-400">
                        Creada por Esc. María Pérez · {new Date(obs.created_at).toLocaleDateString('es-UY')}
                      </span>
                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => handleResolveObs(obs.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Marcar como resuelta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 7: DOCFLOW */}
      {activeTab === 'docflow' && (
        <div className="space-y-4">
          <DocumentHub
            caseId={app.id}
            appData={app}
          />
        </div>
      )}

      {/* TAB 8: FIRMAS */}
      {activeTab === 'firmas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Proceso de Firma Notarial y Digital</h3>
                <p className="text-xs text-slate-500">Valida la versión definitiva antes de enviar a firma de las partes.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Certificado Escribana Vigente
              </span>
            </div>

            <SignatureProcessCard
              process={{
                id: 'sig-proc-1',
                status: 'prepared',
                provider: 'firma_gub',
                mode: 'mock',
                documents: [{ title: 'Escritura Pública de Préstamo con Garantía Hipotecaria (v3).pdf' }],
                signers: [
                  { name: `${app.borrower?.first_name} ${app.borrower?.last_name}`, role: 'applicant', status: 'pending' },
                  { name: 'Dr. Juan Manuel Fernández', role: 'lender', status: 'pending' },
                  { name: 'Esc. María Pérez Morales', role: 'notary', status: 'pending' },
                ],
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 9: TAREAS & ACTIVIDAD */}
      {activeTab === 'tareas_actividad' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Historial y Timeline de Actividad Notarial</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Asignación formal a Estudio Notarial</span>
                  <div className="text-slate-500 text-[11px]">Asignado a Esc. María Pérez (Estudio Fernández & Asoc.)</div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">04/09/2026</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Generación de borrador de Escritura v1 con DOCFLOW</span>
                  <div className="text-slate-500 text-[11px]">Snapshot inmutable generado con datos de partes y padrón</div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">05/09/2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Observación */}
      {showNewObsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Registrar Observación Notarial</h3>
              <button
                type="button"
                onClick={() => setShowNewObsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateObservation} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Observación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Falta certificado de resultancias de autos"
                  value={newObsTitle}
                  onChange={(e) => setNewObsTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo</label>
                  <select
                    value={newObsType}
                    onChange={(e) => setNewObsType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="documental">Documental</option>
                    <option value="registral">Registral</option>
                    <option value="catastral">Catastral</option>
                    <option value="tributaria">Tributaria</option>
                    <option value="dominial">Dominial</option>
                    <option value="sucesoria">Sucesoria</option>
                    <option value="poderes">Poderes</option>
                    <option value="gravamenes">Gravámenes</option>
                    <option value="otra">Otra</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severidad</label>
                  <select
                    value={newObsSeverity}
                    onChange={(e) => setNewObsSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="informativa">Informativa</option>
                    <option value="requiere_correccion">Requiere corrección</option>
                    <option value="bloqueante">Bloqueante</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción Detallada</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique detalladamente el requisito o antecedente faltante..."
                  value={newObsDesc}
                  onChange={(e) => setNewObsDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewObsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingObs}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500"
                >
                  {savingObs ? 'Guardando...' : 'Crear Observación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generación Documental DocFlow */}
      <DocumentGenerationModal
        isOpen={showDocGen}
        caseId={app.id}
        appData={app}
        onClose={() => setShowDocGen(false)}
        onGenerated={() => {
          setShowDocGen(false);
          setActiveTab('docflow');
        }}
      />
    </NotaryLayout>
  );
};
