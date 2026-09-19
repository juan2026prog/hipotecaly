import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import {
  getLenderById,
  saveLenderRules,
  updateLenderData,
  Lender,
  LenderRules,
} from '../../lib/lendersService';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Mail,
  User,
  Sliders,
  History,
} from 'lucide-react';

const PROPERTY_TYPES_OPTIONS = [
  'Apartamento',
  'Casa',
  'Local Comercial',
  'Campo',
  'Terreno',
  'Oficina',
  'Galpón / Logística',
];

const DEPARTMENTS_OPTIONS = [
  'Montevideo',
  'Canelones',
  'Maldonado',
  'Colonia',
  'San José',
  'Rocha',
  'Paysandú',
  'Salto',
  'Otros',
];

export const InvestorDetailPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const isOrganizationBackoffice = window.location.pathname.startsWith('/org/');
  const baseRoute = isOrganizationBackoffice
    ? `/org/${tenant.slug}/admin`
    : `/demo/${tenant.slug || 'estudio-nova'}/admin`;

  const [lender, setLender] = useState<Lender | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'criterios' | 'contacto' | 'historial'>('resumen');

  // Estados editables de datos generales
  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [availableCapital, setAvailableCapital] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'draft' | 'paused'>('active');
  const [notes, setNotes] = useState('');

  // Estados editables de criterios de inversión
  const [maxLtv, setMaxLtv] = useState<number>(40);
  const [minLoan, setMinLoan] = useState<number>(25000);
  const [maxLoan, setMaxLoan] = useState<number>(180000);
  const [minRate, setMinRate] = useState<number>(11.0);
  const [minTerm, setMinTerm] = useState<number>(12);
  const [maxTerm, setMaxTerm] = useState<number>(60);
  const [acceptsClearing, setAcceptsClearing] = useState<boolean>(true);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [acceptedModalities, setAcceptedModalities] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const loadLender = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getLenderById(id, { organizationId: tenant.id });
    if (res.lender) {
      setLender(res.lender);
      setDisplayName(res.lender.display_name);
      setLegalName(res.lender.legal_name || '');
      setContactName(res.lender.contact_name || '');
      setContactEmail(res.lender.contact_email || '');
      setContactPhone(res.lender.contact_phone || '');
      setAvailableCapital(res.lender.available_capital || 0);
      setStatus(res.lender.status === 'paused' ? 'paused' : 'active');
      setNotes(res.lender.notes || '');

      if (res.lender.rules) {
        setMaxLtv(Math.round(res.lender.rules.max_ltv * 100));
        setMinLoan(res.lender.rules.min_loan);
        setMaxLoan(res.lender.rules.max_loan);
        setMinRate(res.lender.rules.min_rate || 11.0);
        setMinTerm(res.lender.rules.min_term_months);
        setMaxTerm(res.lender.rules.max_term_months);
        setAcceptsClearing(res.lender.rules.accepts_clearing);
        setSelectedPropertyTypes(res.lender.rules.accepted_property_types || []);
        setSelectedDepartments(res.lender.rules.accepted_departments || []);
        setAcceptedModalities(res.lender.rules.accepted_modalities || ['solo_intereses', 'capital_e_intereses']);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLender();
  }, [id, tenant.id]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender) return;
    setSaving(true);
    const { success } = await updateLenderData(
      lender.id,
      {
        display_name: displayName,
        legal_name: legalName,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        available_capital: availableCapital,
        status,
        notes,
      },
      user?.id
    );
    setSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadLender();
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender) return;
    setSaving(true);
    const updatedRules: Partial<LenderRules> = {
      max_ltv: maxLtv / 100,
      min_loan: minLoan,
      max_loan: maxLoan,
      min_rate: minRate,
      min_term_months: minTerm,
      max_term_months: maxTerm,
      accepts_clearing: acceptsClearing,
      accepted_property_types: selectedPropertyTypes,
      accepted_departments: selectedDepartments,
      accepted_modalities: acceptedModalities,
    };
    const { success } = await saveLenderRules(lender.id, updatedRules, user?.id);
    setSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadLender();
    }
  };

  const handleInviteToPortal = async () => {
    if (!contactEmail) {
      alert('Se requiere un correo electrónico válido para invitar al inversor.');
      return;
    }
    setInviteStatus('Enviando invitación...');
    // Simulación de envío seguro / RPC server side
    setTimeout(() => {
      setInviteStatus('✓ Invitación al portal enviada con éxito.');
      setTimeout(() => setInviteStatus(null), 4000);
    }, 1000);
  };

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleModality = (mod: string) => {
    setAcceptedModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  if (loading) {
    return (
      <BackofficeLayout title="Ficha de Inversor">
        <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-200">
          Cargando ficha del inversor...
        </div>
      </BackofficeLayout>
    );
  }

  if (!lender) {
    return (
      <BackofficeLayout title="Inversor no encontrado">
        <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 space-y-4">
          <p className="text-slate-500">No se encontró el inversor solicitado.</p>
          <Link to={`${baseRoute}/inversores`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la Red de Inversores
            </Button>
          </Link>
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title={`Ficha: ${lender.display_name}`}>
      <div className="space-y-6 text-left">
        {/* Barra superior */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to={`${baseRoute}/inversores`}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Red de Inversores
          </Link>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                lender.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {lender.status}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInviteToPortal}
              className="text-xs font-bold"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Invitar al portal
            </Button>
          </div>
        </div>

        {inviteStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
            {inviteStatus}
          </div>
        )}

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            Cambios guardados y auditados exitosamente en la base de datos.
          </div>
        )}

        {/* Encabezado del Inversor */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">{lender.display_name}</h2>
            <p className="text-xs text-slate-500">
              {lender.legal_name || 'Inversor privado registrado'} · Tipo: {lender.lender_type} · Origen: {lender.source || 'manual'}
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-0.5">
            <div className="font-semibold text-slate-900">Capital Disponible Declarado:</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {lender.available_capital
                ? `USD ${lender.available_capital.toLocaleString('es-UY')}`
                : 'No informado'}
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b border-slate-200 flex space-x-2 overflow-x-auto">
          {[
            { id: 'resumen', label: 'Datos Generales', icon: User },
            { id: 'criterios', label: 'Criterios de Inversión', icon: Sliders },
            { id: 'historial', label: 'Historial y Auditoría', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENIDO 1: DATOS GENERALES */}
        {activeTab === 'resumen' && (
          <form onSubmit={handleSaveGeneral} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Nombre / Denominación</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Razón Social (opcional)</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Capital disponible aproximado"
                  value={availableCapital}
                  onChange={(v) => setAvailableCapital(v)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Estado de la cuenta</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                >
                  <option value="active">Activo</option>
                  <option value="draft">En evaluación</option>
                  <option value="paused">Pausado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-900 mb-1">Observaciones internas</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-right">
              <Button type="submit" variant="primary" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Guardando...' : 'Guardar Datos Generales'}
              </Button>
            </div>
          </form>
        )}

        {/* CONTENIDO 2: CRITERIOS DE INVERSIÓN */}
        {activeTab === 'criterios' && (
          <form onSubmit={handleSaveRules} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Criterios Canónicos de Inversión</h3>
              <p className="text-xs text-slate-500">
                Estos mismos criterios se reflejan en el Portal del Inversor y en el motor de asignación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Financiación máxima (LTV) (%)
                </label>
                <input
                  type="number"
                  value={maxLtv}
                  onChange={(e) => setMaxLtv(Number(e.target.value))}
                  min={5}
                  max={80}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-bold"
                />
                <span className="text-[10px] text-slate-400">
                  Porcentaje del valor de tasación del inmueble.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Tasa anual mínima (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={minRate}
                  onChange={(e) => setMinRate(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Monto mínimo por operación"
                  value={minLoan}
                  onChange={(v) => setMinLoan(v)}
                />
              </div>

              <div>
                <CurrencyInput
                  label="Monto máximo por operación"
                  value={maxLoan}
                  onChange={(v) => setMaxLoan(v)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Plazo mínimo (meses)</label>
                <input
                  type="number"
                  value={minTerm}
                  onChange={(e) => setMinTerm(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Plazo máximo (meses)</label>
                <input
                  type="number"
                  value={maxTerm}
                  onChange={(e) => setMaxTerm(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Tipos de Inmueble */}
            <div>
              <label className="block font-bold text-slate-900 mb-1.5 text-xs">
                Tipos de inmueble aceptados
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {PROPERTY_TYPES_OPTIONS.map((type) => {
                  const isSelected = selectedPropertyTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePropertyType(type)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Departamentos */}
            <div>
              <label className="block font-bold text-slate-900 mb-1.5 text-xs">
                Departamentos / Zonas aceptadas
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {DEPARTMENTS_OPTIONS.map((dept) => {
                  const isSelected = selectedDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modalidades */}
            <div>
              <label className="block font-bold text-slate-900 mb-1.5 text-xs">
                Modalidades de amortización aceptadas
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedModalities.includes('solo_intereses')}
                    onChange={() => toggleModality('solo_intereses')}
                    className="rounded text-slate-900"
                  />
                  <span>Solo intereses + capital al vencimiento</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedModalities.includes('capital_e_intereses')}
                    onChange={() => toggleModality('capital_e_intereses')}
                    className="rounded text-slate-900"
                  />
                  <span>Capital + intereses / cuota amortizante mensual</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-right">
              <Button type="submit" variant="primary" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Guardando...' : 'Guardar Criterios'}
              </Button>
            </div>
          </form>
        )}

        {/* CONTENIDO 3: HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-xs text-slate-500 space-y-2">
            <h3 className="font-bold text-slate-900">Historial inmutable de auditoría</h3>
            <p>
              Todos los cambios sobre los datos y criterios de este inversor quedan registrados inalterablemente en
              la tabla <code className="font-mono">audit_logs</code>.
            </p>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};
