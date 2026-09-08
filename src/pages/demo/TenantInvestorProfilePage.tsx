// ==============================================================================
// HIPOTECALY: Mi Perfil del Inversor (Página Completa / Rediseño UX Final)
// Vista de área privada con navegación lateral sticky, modo lectura primero
// y edición granular por sección para prestamistas hipotecarios privados
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Sliders,
  DollarSign,
  FileText,
  KeyRound,
  CreditCard,
  Bell,
  CheckCircle2,
  Upload,
  Info,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Edit3,
  X,
  AlertTriangle,
  Menu,
  Shield,
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  InvestorProfileData,
  INITIAL_INVESTOR_PROFILE,
  FundAvailability,
} from '../../components/investor/TenantInvestorProfileModal';

// Lista de Barrios de Montevideo
const MONTEVIDEO_NEIGHBORHOODS = [
  'Pocitos',
  'Punta Carretas',
  'Carrasco',
  'Carrasco Norte',
  'Malvín',
  'Buceo',
  'Parque Rodó',
  'Cordón',
  'Centro',
  'Ciudad Vieja',
  'Tres Cruces',
  'Parque Batlle',
  'La Blanqueada',
  'Prado',
  'Golf / Villa Biarritz',
  'Puerto del Buceo',
];

// Opciones de Departamentos
const DEPARTMENTS = [
  { id: 'montevideo', label: 'Montevideo' },
  { id: 'canelones', label: 'Canelones (Ciudad de la Costa / Costa de Oro)' },
  { id: 'maldonado', label: 'Maldonado (Punta del Este / Maldonado)' },
  { id: 'colonia', label: 'Colonia' },
  { id: 'san_jose', label: 'San José' },
  { id: 'otros', label: 'Otros departamentos del interior' },
];

export const TenantInvestorProfilePage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const basePath = `/demo/${tenant.slug}/inversor`;

  // Pestaña activa proveniente de query param o por defecto 'datos'
  const tabParam = searchParams.get('tab') as
    | 'datos'
    | 'verificacion'
    | 'fondos'
    | 'criterios'
    | 'documentos'
    | 'firma'
    | 'cuenta'
    | 'notificaciones'
    | null;

  const [activeTab, setActiveTab] = useState<
    'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones'
  >(tabParam || 'datos');

  // Estado del Perfil
  const [profile, setProfile] = useState<InvestorProfileData>(() => {
    const saved = localStorage.getItem(`hipotecaly_investor_profile_${tenant.slug || 'default'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_INVESTOR_PROFILE;
      }
    }
    return INITIAL_INVESTOR_PROFILE;
  });

  // Modo edición por sección
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<InvestorProfileData>(profile);

  // Estados de feedback
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showCompanyGuidance, setShowCompanyGuidance] = useState(false);
  const [showSensitiveConfirmModal, setShowSensitiveConfirmModal] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sincronizar tab con URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (
    tab: 'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones'
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setEditingSection(null);
    setMobileMenuOpen(false);
  };

  const handleStartEdit = (section: string) => {
    setEditFormData(profile);
    setEditingSection(section);
    setSaveFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditFormData(profile);
  };

  const handleSaveSection = (sectionName: string) => {
    setProfile(editFormData);
    localStorage.setItem(`hipotecaly_investor_profile_${tenant.slug || 'default'}`, JSON.stringify(editFormData));
    setEditingSection(null);
    setSaveFeedback(`✓ Cambios guardados correctamente en ${sectionName}`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const toggleReceivingOpportunities = () => {
    const nextState = !profile.isReceivingOpportunities;
    const updated = { ...profile, isReceivingOpportunities: nextState };
    setProfile(updated);
    localStorage.setItem(`hipotecaly_investor_profile_${tenant.slug || 'default'}`, JSON.stringify(updated));
    setSaveFeedback(
      nextState
        ? '🟢 Notificaciones de oportunidades activadas.'
        : '⚪ Nuevas oportunidades pausadas. Sus criterios se mantienen guardados.'
    );
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Definición de ítems del Sidebar
  const sidebarItems = [
    {
      id: 'datos',
      label: 'Mis datos',
      icon: User,
      status: '✓',
      desc: 'Datos personales y personería',
    },
    {
      id: 'verificacion',
      label: 'Verificación',
      icon: ShieldCheck,
      status: '✓',
      desc: 'Identidad, KYC y PEP',
    },
    {
      id: 'fondos',
      label: 'Fondos',
      icon: DollarSign,
      status: '✓',
      desc: 'Capital declarado y disponibilidad',
    },
    {
      id: 'criterios',
      label: 'Mis criterios',
      icon: Sliders,
      status: '✓',
      desc: 'Montos, tasas y zonas',
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FileText,
      status: '✓',
      desc: 'Documentación permanente',
    },
    {
      id: 'firma',
      label: 'Firma digital',
      icon: KeyRound,
      status: '✓',
      desc: 'Firma Electrónica Avanzada',
    },
    {
      id: 'cuenta',
      label: 'Cuenta para operaciones',
      icon: CreditCard,
      status: '✓',
      desc: 'Desembolsos y cobro de cuotas',
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones y seguridad',
      icon: Bell,
      status: null,
      desc: 'Alertas y acceso seguro',
    },
  ];

  const currentTabMeta = sidebarItems.find((i) => i.id === activeTab) || sidebarItems[0];

  return (
    <TenantInvestorLayout title="Mi Perfil del Inversor">
      <div className="space-y-6">
        {/* Breadcrumb y Navegación Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Link
              to={basePath}
              className="inline-flex items-center space-x-1.5 font-bold text-slate-700 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Volver al Panel Inversor</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-600">Mi Perfil del Inversor</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">{currentTabMeta.label}</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Perfil privado protegido con cifrado SSL bancario</span>
          </div>
        </div>

        {/* Feedback Banner Discreto */}
        {saveFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
            <button
              onClick={() => setSaveFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* CABECERA PRINCIPAL DEL PERFIL DEL INVERSOR                           */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start sm:items-center space-x-4">
              <div
                className="w-14 h-14 rounded-2xl text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Perfil verificado</span>
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {profile.investorType === 'persona_fisica' ? 'Persona física' : 'Persona jurídica'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Inversor privado registrado en {brandName} · CI {profile.documentNumber} · {profile.city},{' '}
                  {profile.department}
                </p>
              </div>
            </div>

            {/* Acciones de Disponibilidad */}
            <div className="flex items-center space-x-3">
              <Button
                variant={profile.isReceivingOpportunities ? 'outline' : 'primary'}
                onClick={toggleReceivingOpportunities}
                className="text-xs h-10 px-4 font-bold"
              >
                {profile.isReceivingOpportunities ? 'Pausar oportunidades' : 'Volver a recibir oportunidades'}
              </Button>
            </div>
          </div>

          {/* Tres Indicadores Clave de la Cabecera */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Capital disponible
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">
                  USD {profile.availableCapital.toLocaleString('es-UY')}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">declarado</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Disponibilidad
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {profile.disbursementTime === 'inmediata'
                  ? 'Inmediata (48–72 hs)'
                  : profile.disbursementTime === '7_dias'
                  ? 'Hasta 7 días'
                  : profile.disbursementTime === '15_dias'
                  ? 'Hasta 15 días'
                  : 'Hasta 30 días'}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Nuevas oportunidades
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`w-3 h-3 rounded-full ${
                    profile.isReceivingOpportunities ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {profile.isReceivingOpportunities ? 'Recibiendo oportunidades' : 'Pausado temporalmente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ESTRUCTURA PRINCIPAL: SIDEBAR FIJO (DESKTOP) + CONTENIDO FLEXIBLE     */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Selector Mobile / Tablet de Secciones */}
          <div className="lg:hidden col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {React.createElement(currentTabMeta.icon, { className: 'w-4 h-4 text-slate-700' })}
              <span className="font-bold text-sm text-slate-900">{currentTabMeta.label}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <span>Cambiar sección</span>
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Drawer / Desplegable Mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden col-span-1 bg-white p-3 rounded-xl border border-slate-200 shadow-lg space-y-1 animate-fadeIn">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive ? 'bg-[#173a5e] text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.status && <span className="text-[11px] font-bold">{item.status}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sidebar Sticky Desktop (aprox 25% del ancho) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-28 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
              <div className="px-3.5 py-3 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Secciones de Mi Perfil
                </span>
              </div>
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as any)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-[#173a5e] text-white shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.status && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive ? 'bg-white/20 text-white' : 'text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tarjeta de Resumen de Salud del Perfil */}
            <div className="bg-gradient-to-br from-slate-900 to-[#173a5e] text-white p-4 rounded-2xl shadow-sm text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Perfil 100% operativo</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Su cuenta está completamente habilitada para recibir y fondear operaciones en {brandName}.
              </p>
            </div>
          </aside>

          {/* ================================================================== */}
          {/* CONTENIDO PRINCIPAL (DERECHA - UNA SOLA SECCIÓN A LA VEZ)          */}
          {/* ================================================================== */}
          <main className="col-span-1 lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* ---------------------------------------------------------------- */}
            {/* 1. SECCIÓN: MIS DATOS                                            */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'datos' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Mis datos</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Información de identificación personal y régimen de actuación
                    </p>
                  </div>
                  {editingSection !== 'datos' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit('datos')}
                      className="text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Editar datos
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs">
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveSection('Mis datos')}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tipo de Inversor */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Tipo de inversor</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {profile.investorType === 'persona_fisica' ? 'Persona física' : 'Persona jurídica / Empresa'}
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowCompanyGuidance(!showCompanyGuidance)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
                      >
                        <span>Necesito operar como empresa</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {showCompanyGuidance && (
                    <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2 animate-fadeIn">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Cambio a Personería Jurídica</p>
                          <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                            Al operar como empresa (S.A., S.A.S., S.R.L.), la normativa de prevención de lavado exige la
                            validación de estatutos, RUT ante DGI, representantes legales y beneficiarios finales (UBO).
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => {
                            alert(
                              'Un oficial de cumplimiento de ' +
                                brandName +
                                ' se contactará para habilitar la personería jurídica.'
                            );
                            setShowCompanyGuidance(false);
                          }}
                          className="text-xs font-bold text-blue-800 hover:text-blue-950 underline"
                        >
                          Solicitar migración con oficial de cuenta
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Persona Física: Modo Lectura vs Modo Edición */}
                {editingSection !== 'datos' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Nombre</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.firstName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Apellido</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.lastName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Documento</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {profile.documentType} {profile.documentNumber} ({profile.documentCountry})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Fecha de nacimiento
                      </span>
                      {/* Formato uruguayo DD/MM/AAAA */}
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {profile.birthDate
                          ? profile.birthDate.split('-').reverse().join('/')
                          : '14/05/1982'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Nacionalidad</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.nationality}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        País de residencia
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.countryOfResidence}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Domicilio</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.address}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Localidad / Departamento
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {profile.city}, {profile.department}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Teléfono móvil</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Correo electrónico
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={editFormData.firstName}
                          onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          value={editFormData.lastName}
                          onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Documento (CI / Pasaporte)</label>
                        <input
                          type="text"
                          value={editFormData.documentNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Fecha de nacimiento (AAAA-MM-DD)
                        </label>
                        <input
                          type="date"
                          value={editFormData.birthDate}
                          onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nacionalidad</label>
                        <input
                          type="text"
                          value={editFormData.nationality}
                          onChange={(e) => setEditFormData({ ...editFormData, nationality: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">País de residencia</label>
                        <input
                          type="text"
                          value={editFormData.countryOfResidence}
                          onChange={(e) => setEditFormData({ ...editFormData, countryOfResidence: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Domicilio</label>
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Localidad / Barrio</label>
                        <input
                          type="text"
                          value={editFormData.city}
                          onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                        <input
                          type="text"
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email de contacto</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Titularidad de los Fondos */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-900 block mb-2">Titularidad de los fondos</span>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {profile.actsOnOwnBehalf ? 'Fondos propios' : 'Actuación por cuenta de terceros'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {profile.actsOnOwnBehalf
                          ? 'Declaro que los fondos prestados son de mi exclusiva titularidad y provienen de actividades lícitas.'
                          : `Actuando en representación de: ${profile.thirdPartyOwnerName || 'Tercero declarado'}`}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      ✓ Declarado
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 2. SECCIÓN: VERIFICACIÓN (KYC & PEP)                             */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'verificacion' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Verificación</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validación de identidad, prevención de lavado y declaración de cumplimiento
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Identidad */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">Identidad</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Verificada
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Proveedor biométrico: <strong className="text-slate-700">Didit Identity</strong> · Validado
                          el 12/01/2026 · Válido hasta 12/01/2027
                        </p>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Certificado de verificación Didit ID-9284-UY validado correctamente.')}
                        className="text-xs font-semibold"
                      >
                        Ver detalle
                      </Button>
                    </div>
                  </div>

                  {/* PEP y Cumplimiento */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Declaración PEP (Persona Expuesta Políticamente)
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          ¿Es usted o un familiar directo una Persona Expuesta Políticamente según normativa BCU?
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        {profile.isPep ? 'Sí (Declarado)' : 'No'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() =>
                          alert('Formulario de declaración jurada PEP actualizado conforme a circulares BCU.')
                        }
                        className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline"
                      >
                        Actualizar declaración
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 3. SECCIÓN: FONDOS                                               */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'fondos' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Fondos</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Capital disponible declarado, tiempos de desembolso y origen de fondos
                    </p>
                  </div>
                  {editingSection !== 'fondos' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit('fondos')}
                      className="text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Editar fondos
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs">
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveSection('Fondos')}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  )}
                </div>

                {editingSection !== 'fondos' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Capital disponible declarado
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-1">
                        USD {profile.availableCapital.toLocaleString('es-UY')}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Plazo habitual de desembolso
                      </span>
                      <p className="text-xl font-bold text-slate-900 mt-1">
                        {profile.disbursementTime === 'inmediata'
                          ? 'Inmediata (48–72 hs)'
                          : profile.disbursementTime === '7_dias'
                          ? 'Hasta 7 días'
                          : profile.disbursementTime === '15_dias'
                          ? 'Hasta 15 días'
                          : 'Hasta 30 días'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Titularidad de los fondos
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {profile.actsOnOwnBehalf ? 'Fondos propios' : 'Cuenta de terceros'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                        Origen principal de fondos
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {profile.fundSources?.length > 0
                          ? profile.fundSources.join(', ')
                          : 'Actividad empresarial / Ahorros'}
                      </p>
                    </div>

                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                          Documentación de respaldo
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">
                          Declaración jurada de origen de fondos conforme a normativa bancaria
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        ✓ Declarado
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Capital disponible declarado (USD)
                        </label>
                        <input
                          type="number"
                          value={editFormData.availableCapital}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, availableCapital: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Plazo de desembolso habitual</label>
                        <select
                          value={editFormData.disbursementTime}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, disbursementTime: e.target.value as FundAvailability })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="inmediata">Inmediata (48–72 hs)</option>
                          <option value="7_dias">Hasta 7 días</option>
                          <option value="15_dias">Hasta 15 días</option>
                          <option value="30_dias">Hasta 30 días</option>
                          <option value="otro">Otra</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 4. SECCIÓN: MIS CRITERIOS                                        */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'criterios' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Mis criterios de inversión</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filtros automáticos para determinar qué oportunidades hipotecarias se le presentan
                    </p>
                  </div>
                  {editingSection !== 'criterios' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit('criterios')}
                      className="text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Editar criterios
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs">
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveSection('Mis criterios')}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  )}
                </div>

                {editingSection !== 'criterios' ? (
                  <div className="space-y-6 text-xs">
                    {/* Parámetros Financieros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monto por operación</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          USD {profile.minLoanAmount.toLocaleString('es-UY')} – {profile.maxLoanAmount.toLocaleString('es-UY')}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tasa anual mínima</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.minRate}% anual</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {/* REGLA: SIEMPRE "Porcentaje de financiación" (NUNCA LTV en UI) */}
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Porcentaje máx. financiación
                        </span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.maxFinancingRatio}% del valor</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Plazos aceptados</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {profile.minTermMonths} a {profile.maxTermMonths} meses
                        </p>
                      </div>
                    </div>

                    {/* Tipos de Inmueble Aceptados */}
                    <div>
                      <span className="font-bold text-slate-900 block mb-2">Tipos de inmueble en garantía</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.acceptedPropertyTypes?.map((pt) => (
                          <span
                            key={pt}
                            className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200"
                          >
                            ✓ {pt.charAt(0).toUpperCase() + pt.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Zonas y Barrios */}
                    <div>
                      <span className="font-bold text-slate-900 block mb-2">Zonas y Departamentos</span>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span>
                            {profile.allMontevideo
                              ? 'Todo Montevideo (todos los barrios)'
                              : `Montevideo (${profile.acceptedMontevideoNeighborhoods?.join(', ') || 'Barrios seleccionados'})`}
                          </span>
                        </div>
                        {profile.acceptedDepartments?.filter((d) => d !== 'montevideo').length > 0 && (
                          <p className="text-slate-600 text-[11px] pl-6">
                            Departamentos adicionales:{' '}
                            {profile.acceptedDepartments
                              .filter((d) => d !== 'montevideo')
                              .map((d) => DEPARTMENTS.find((dep) => dep.id === d)?.label || d)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Formas de Pago Aceptadas */}
                    <div>
                      <span className="font-bold text-slate-900 block mb-2">Formas de pago aceptadas</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900 block">
                            {profile.acceptedModalities?.includes('solo_intereses') ? '✓ ' : '⚪ '}
                            Solo intereses + capital al vencimiento
                          </span>
                          <span className="text-[11px] text-slate-500">Cobro mensual de intereses con devolución al final.</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900 block">
                            {profile.acceptedModalities?.includes('capital_e_intereses') ? '✓ ' : '⚪ '}
                            Capital + intereses mensual (Amortizante)
                          </span>
                          <span className="text-[11px] text-slate-500">Cobro mensual de cuota que reduce el saldo capital.</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 italic">
                        * Este criterio define qué oportunidades se le asignan. No modifica las condiciones de hipotecas ya formalizadas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-xs">
                    {/* Formulario de Edición de Criterios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Monto mínimo por préstamo (USD)</label>
                        <input
                          type="number"
                          value={editFormData.minLoanAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, minLoanAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Monto máximo por préstamo (USD)</label>
                        <input
                          type="number"
                          value={editFormData.maxLoanAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, maxLoanAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tasa anual mínima pretendida (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={editFormData.minRate}
                          onChange={(e) => setEditFormData({ ...editFormData, minRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        {/* Porcentaje de financiación */}
                        <label className="block font-bold text-slate-700 mb-1">Porcentaje máximo de financiación (%)</label>
                        <input
                          type="number"
                          value={editFormData.maxFinancingRatio}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, maxFinancingRatio: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                    </div>

                    {/* Selector de Zonas */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-900 block">Zonas geográficas de interés</span>
                      <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.allMontevideo}
                          onChange={(e) => setEditFormData({ ...editFormData, allMontevideo: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Todo Montevideo</span>
                      </label>

                      {!editFormData.allMontevideo && (
                        <div className="pt-2 pl-4 space-y-2">
                          <span className="text-[11px] text-slate-500 font-semibold block">
                            Seleccionar barrios específicos de Montevideo:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MONTEVIDEO_NEIGHBORHOODS.map((nh) => {
                              const checked = editFormData.acceptedMontevideoNeighborhoods?.includes(nh);
                              return (
                                <label key={nh} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const current = editFormData.acceptedMontevideoNeighborhoods || [];
                                      const updated = e.target.checked
                                        ? [...current, nh]
                                        : current.filter((item) => item !== nh);
                                      setEditFormData({ ...editFormData, acceptedMontevideoNeighborhoods: updated });
                                    }}
                                    className="w-3.5 h-3.5 rounded text-blue-600"
                                  />
                                  <span className="text-xs">{nh}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 5. SECCIÓN: DOCUMENTOS                                           */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'documentos' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Documentos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Legajo permanente del inversor para formalizaciones notariales
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {profile.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{doc.name}</span>
                          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                            <span>Subido el {doc.uploadedAt}</span>
                            {doc.validUntil && <span>· Válido hasta {doc.validUntil}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            doc.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {doc.status === 'verified'
                            ? '✓ Verificado'
                            : doc.status === 'pending'
                            ? 'Pendiente'
                            : 'Requiere actualización'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert(`Cargando visor para ${doc.name}`)}
                          className="text-xs"
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Abriendo selector de archivos seguros...')}
                      className="text-xs font-bold"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Subir nuevo documento
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 6. SECCIÓN: FIRMA DIGITAL                                        */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'firma' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Firma digital</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Firma Electrónica Avanzada conforme a la Ley 18.600 de la República Oriental del Uruguay
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">Firma Electrónica Avanzada</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Lista para firmar
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Proveedor acreditado: <strong className="text-slate-700">{profile.signatureProvider}</strong>{' '}
                          · Última validación: {profile.signatureLastVerified || '12/01/2026'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Certificado de firma digital activo y verificado ante AGESIC.')}
                      className="text-xs font-semibold"
                    >
                      Ver estado
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
                    <p>
                      La firma digital avanzada tiene el mismo valor legal y probatorio que la firma manuscrita para
                      contratos de mutuo e hipotecas.
                    </p>
                    <p className="text-slate-400 mt-1">
                      Por razones de estricta seguridad, HIPOTECALY no almacena PINs ni claves criptográficas privadas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 7. SECCIÓN: CUENTA PARA OPERACIONES                              */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'cuenta' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    {/* TÍTULO REGLA: "Cuenta para operaciones" (NO Cuenta bancaria) */}
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Cuenta para operaciones</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cuenta bancaria autorizada para el desembolso de préstamos y la recaudación de cuotas
                    </p>
                  </div>
                  {editingSection !== 'cuenta' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit('cuenta')}
                      className="text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Editar cuenta
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs">
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowSensitiveConfirmModal('cuenta')}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  )}
                </div>

                {editingSection !== 'cuenta' ? (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{profile.bankName}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Verificada
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Moneda: <strong className="text-slate-800">{profile.bankCurrency}</strong> · Cuenta:{' '}
                            <strong className="text-slate-800">{profile.bankMaskedNumber}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-500">
                      <span>Titular verificado: {profile.firstName} {profile.lastName} (CI {profile.documentNumber})</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Institución Bancaria</label>
                        <select
                          value={editFormData.bankName}
                          onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          <option value="Banco Santander Uruguay">Banco Santander Uruguay</option>
                          <option value="Banco Itaú Uruguay">Banco Itaú Uruguay</option>
                          <option value="Banco República (BROU)">Banco República (BROU)</option>
                          <option value="Scotiabank Uruguay">Scotiabank Uruguay</option>
                          <option value="BBVA Uruguay">BBVA Uruguay</option>
                          <option value="HSBC Bank Uruguay">HSBC Bank Uruguay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Moneda</label>
                        <input
                          type="text"
                          value={editFormData.bankCurrency}
                          disabled
                          className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Número de cuenta</label>
                        <input
                          type="text"
                          value={editFormData.bankMaskedNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, bankMaskedNumber: e.target.value })}
                          placeholder="•••• 4821"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* 8. SECCIÓN: NOTIFICACIONES Y SEGURIDAD                           */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === 'notificaciones' && (
              <div className="space-y-8">
                {/* Notificaciones */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Notificaciones</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Preferencias de alertas operativas por correo electrónico y plataforma
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Aviso / Evento</th>
                          <th className="py-2.5 px-4 text-center w-24">Email</th>
                          <th className="py-2.5 px-4 text-center w-28">Plataforma</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Nueva oportunidad que cumple criterios</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Propuesta aceptada o rechazada</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Próximo cobro de cuota</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Pago de cuota recibido</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Pago atrasado / Alerta de cobro</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-slate-800">Firma o documento pendiente</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Seguridad de la Cuenta */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Seguridad</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Credenciales de acceso y control de sesión</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email de acceso</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {user?.email || 'inversor@estudionova.uy'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Método de autenticación</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">Magic Link & Contraseña Segura</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Último acceso</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">Hoy, 14:22 hs</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sesiones activas</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">1 sesión actual</p>
                      </div>
                      <button
                        onClick={() => alert('Sesión actual asegurada con token rotativo.')}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        Cerrar otras sesiones
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modal de Confirmación para Cambios Sensibles */}
        {showSensitiveConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp text-xs text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar modificación de cuenta bancaria</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Modificar la cuenta bancaria para operaciones afectará el destino de futuros cobros y desembolsos. El
                  cambio será auditado por el equipo de cumplimiento de {brandName}.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowSensitiveConfirmModal(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowSensitiveConfirmModal(null);
                    handleSaveSection('Cuenta para operaciones');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Confirmar y guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TenantInvestorLayout>
  );
};
