// ==============================================================================
// HIPOTECALY: Mi Perfil del Inversor (Versión Final)
// Modal integral y modular para la gestión del perfil del prestamista privado
// ==============================================================================

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Sliders,
  DollarSign,
  FileText,
  KeyRound,
  CreditCard,
  Bell,
  Lock,
  X,
  CheckCircle2,
  Upload,
  Info,
  Building2,
  MapPin,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';

export type InvestorType = 'persona_fisica' | 'persona_juridica';
export type FundAvailability = 'inmediata' | '7_dias' | '15_dias' | '30_dias' | 'otro';
export type PaymentModalityOption = 'solo_intereses' | 'capital_e_intereses';

export interface InvestorProfileData {
  // Tipo y Estado General
  investorType: InvestorType;
  isVerified: boolean;
  isReceivingOpportunities: boolean; // Toggle ON/OFF
  
  // Persona Física
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  documentCountry: string;
  birthDate: string;
  nationality: string;
  countryOfResidence: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  email: string;

  // Persona Jurídica / Empresa
  companyLegalName: string;
  companyTradeName: string;
  companyTaxId: string; // RUT
  companyEntityType: string;
  companyCountry: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;

  // Representantes Autorizados
  representatives: Array<{
    id: string;
    fullName: string;
    documentNumber: string;
    role: string;
    email: string;
    phone: string;
  }>;

  // Beneficiarios Finales
  ultimateBeneficiaries: Array<{
    id: string;
    fullName: string;
    documentNumber: string;
    nationality: string;
    countryOfResidence: string;
    sharePercentage: number;
  }>;

  // Titularidad de Fondos
  actsOnOwnBehalf: boolean; // Sí = fondos propios, No = cuenta de terceros
  thirdPartyOwnerName?: string;
  thirdPartyOwnerTaxId?: string;
  thirdPartyRelationship?: string;

  // KYC & PEP
  kycStatus: 'verified' | 'pending' | 'in_progress' | 'requires_update';
  isPep: boolean;
  pepDetails?: string;

  // Fondos
  availableCapital: number;
  disbursementTime: FundAvailability;
  disbursementTimeOther?: string;
  fundSources: string[];
  fundSourcesOther?: string;
  fundSourceBackupStatus: 'declarado' | 'verificado' | 'pendiente';

  // Criterios de Préstamo
  minLoanAmount: number;
  maxLoanAmount: number;
  minRate: number;
  maxFinancingRatio: number;
  minTermMonths: number;
  maxTermMonths: number;
  acceptedPropertyTypes: string[];
  acceptedDepartments: string[];
  allMontevideo: boolean;
  acceptedMontevideoNeighborhoods: string[];
  acceptedModalities: PaymentModalityOption[];

  // Documentos Permanentes
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    status: 'verified' | 'pending' | 'requires_update';
    validUntil?: string;
  }>;

  // Firma Digital
  signatureConfigured: boolean;
  signatureProvider: string;
  signatureLastVerified?: string;

  // Cuenta Bancaria para Operaciones
  hasBankAccount: boolean;
  bankName: string;
  bankCurrency: string;
  bankMaskedNumber: string;
  bankAccountVerified: boolean;

  // Notificaciones
  notifications: {
    newOpportunityEmail: boolean;
    newOpportunityInApp: boolean;
    proposalStatusEmail: boolean;
    proposalStatusInApp: boolean;
    upcomingPaymentEmail: boolean;
    upcomingPaymentInApp: boolean;
    paymentReceivedEmail: boolean;
    paymentReceivedInApp: boolean;
    overduePaymentEmail: boolean;
    overduePaymentInApp: boolean;
    documentPendingEmail: boolean;
    documentPendingInApp: boolean;
  };
}

export const INITIAL_INVESTOR_PROFILE: InvestorProfileData = {
  investorType: 'persona_fisica',
  isVerified: true,
  isReceivingOpportunities: true,

  firstName: 'Juan Manuel',
  lastName: 'Fernández',
  documentType: 'CI',
  documentNumber: '3.842.190-4',
  documentCountry: 'Uruguay',
  birthDate: '1982-05-14',
  nationality: 'Uruguaya',
  countryOfResidence: 'Uruguay',
  address: 'Rambla República de México 5420',
  city: 'Carrasco',
  department: 'Montevideo',
  phone: '+598 99 123 456',
  email: 'inversor@estudionova.uy',

  companyLegalName: 'Inversiones del Plata S.A.',
  companyTradeName: 'Plata Capital',
  companyTaxId: '21.849.201.0019',
  companyEntityType: 'Sociedad Anónima (S.A.)',
  companyCountry: 'Uruguay',
  companyAddress: 'Plaza Independencia 848, Of. 602',
  companyPhone: '+598 2901 8844',
  companyEmail: 'directorio@platacapital.uy',

  representatives: [
    {
      id: 'rep-1',
      fullName: 'Juan Manuel Fernández',
      documentNumber: '3.842.190-4',
      role: 'Director Presidente',
      email: 'juan@platacapital.uy',
      phone: '+598 99 123 456',
    },
  ],

  ultimateBeneficiaries: [
    {
      id: 'ub-1',
      fullName: 'Juan Manuel Fernández',
      documentNumber: '3.842.190-4',
      nationality: 'Uruguaya',
      countryOfResidence: 'Uruguay',
      sharePercentage: 100,
    },
  ],

  actsOnOwnBehalf: true,
  thirdPartyOwnerName: '',
  thirdPartyOwnerTaxId: '',
  thirdPartyRelationship: '',

  kycStatus: 'verified',
  isPep: false,
  pepDetails: '',

  availableCapital: 200000,
  disbursementTime: 'inmediata',
  fundSources: ['Actividad empresarial', 'Ahorros', 'Rentas'],
  fundSourceBackupStatus: 'declarado',

  minLoanAmount: 25000,
  maxLoanAmount: 180000,
  minRate: 11.0,
  maxFinancingRatio: 40.0,
  minTermMonths: 12,
  maxTermMonths: 60,
  acceptedPropertyTypes: ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
  acceptedDepartments: ['Montevideo', 'Canelones', 'Maldonado'],
  allMontevideo: true,
  acceptedMontevideoNeighborhoods: ['Pocitos', 'Carrasco', 'Punta Carretas', 'Malvín', 'Centro'],
  acceptedModalities: ['solo_intereses', 'capital_e_intereses'],

  documents: [
    {
      id: 'doc-1',
      name: 'Documento de Identidad (Frente y Dorso)',
      type: 'Identidad',
      uploadedAt: '12/03/2026',
      status: 'verified',
      validUntil: '12/03/2031',
    },
    {
      id: 'doc-2',
      name: 'Comprobante de Domicilio (Factura UTE/OSE)',
      type: 'Domicilio',
      uploadedAt: '15/03/2026',
      status: 'verified',
      validUntil: '15/09/2026',
    },
  ],

  signatureConfigured: true,
  signatureProvider: 'Firma Digital Avanzada (Ley 18.600)',
  signatureLastVerified: '02/08/2026',

  hasBankAccount: true,
  bankName: 'Banco Santander Uruguay',
  bankCurrency: 'USD',
  bankMaskedNumber: '•••• 4821',
  bankAccountVerified: true,

  notifications: {
    newOpportunityEmail: true,
    newOpportunityInApp: true,
    proposalStatusEmail: true,
    proposalStatusInApp: true,
    upcomingPaymentEmail: true,
    upcomingPaymentInApp: true,
    paymentReceivedEmail: true,
    paymentReceivedInApp: true,
    overduePaymentEmail: true,
    overduePaymentInApp: true,
    documentPendingEmail: true,
    documentPendingInApp: true,
  },
};

export interface TenantInvestorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  brandName?: string;
  initialTab?: 'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones';
  profileData?: InvestorProfileData;
  onProfileUpdated?: (updated: InvestorProfileData) => void;
}

export const TenantInvestorProfileModal: React.FC<TenantInvestorProfileModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#173a5e',
  brandName = 'Estudio Nova',
  initialTab = 'datos',
  profileData,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<InvestorProfileData>(profileData || INITIAL_INVESTOR_PROFILE);
  const [activeTab, setActiveTab] = useState<
    'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones'
  >(initialTab);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Sincronizar si cambia el prop externo
  React.useEffect(() => {
    if (profileData) {
      setProfile(profileData);
    }
  }, [profileData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onProfileUpdated) {
      onProfileUpdated(profile);
    }
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2000);
  };

  const togglePauseOpportunities = () => {
    const nextState = !profile.isReceivingOpportunities;
    const updated = { ...profile, isReceivingOpportunities: nextState };
    setProfile(updated);
    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn text-left">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* =================================================================== */}
        {/* 1. CABECERA DEL PERFIL (SIMPLIFICADA)                              */}
        {/* =================================================================== */}
        <div
          className="p-5 sm:p-6 text-white border-b border-slate-800 relative"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Lado Izquierdo: Identidad y Badge */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                {profile.investorType === 'persona_fisica' ? (
                  <User className="w-6 h-6 text-amber-300" />
                ) : (
                  <Building2 className="w-6 h-6 text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-white">
                    Mi Perfil del Inversor
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-300" />
                    Perfil verificado
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {profile.investorType === 'persona_fisica'
                    ? `${profile.firstName} ${profile.lastName} · Persona física`
                    : `${profile.companyLegalName} · Persona jurídica`} · {brandName}
                </p>
              </div>
            </div>

            {/* Lado Derecho: Botón Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fila de 3 Indicadores Rápidos: Capital, Disponibilidad y Estado de Oportunidades */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
            
            {/* 1. Capital disponible */}
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-[11px] text-slate-300 block">Disponibles para prestar</span>
              <span className="text-lg font-extrabold text-white font-mono block mt-0.5">
                USD {profile.availableCapital.toLocaleString('es-UY')}
              </span>
            </div>

            {/* 2. Disponibilidad temporal */}
            <div className="bg-white/10 p-3 rounded-xl border border-white/15">
              <span className="text-[11px] text-slate-300 block">Disponibilidad de fondos</span>
              <span className="text-sm font-bold text-white block mt-0.5 capitalize">
                {profile.disbursementTime === 'inmediata' && 'Inmediata'}
                {profile.disbursementTime === '7_dias' && 'Dentro de 7 días'}
                {profile.disbursementTime === '15_dias' && 'Dentro de 15 días'}
                {profile.disbursementTime === '30_dias' && 'Dentro de 30 días'}
                {profile.disbursementTime === 'otro' && (profile.disbursementTimeOther || 'A convenir')}
              </span>
            </div>

            {/* 3. Estado de Búsqueda & Botón Pausar/Reanudar */}
            <div className="bg-white/10 p-3 rounded-xl border border-white/15 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-300 block">Estado de asignación</span>
                <span className={`text-xs font-bold flex items-center mt-0.5 ${
                  profile.isReceivingOpportunities ? 'text-emerald-300' : 'text-slate-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${
                    profile.isReceivingOpportunities ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`} />
                  {profile.isReceivingOpportunities ? 'Recibiendo oportunidades' : 'Oportunidades pausadas'}
                </span>
              </div>

              <button
                type="button"
                onClick={togglePauseOpportunities}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  profile.isReceivingOpportunities
                    ? 'bg-amber-400/90 hover:bg-amber-300 text-slate-900'
                    : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
                }`}
              >
                {profile.isReceivingOpportunities ? 'Pausar' : 'Reanudar'}
              </button>
            </div>

          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. PESTAÑAS DE NAVEGACIÓN INTERNA (8 BLOQUES CLAVE)               */}
        {/* =================================================================== */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 overflow-x-auto shrink-0 flex space-x-1">
          {[
            { id: 'datos', label: '1. Mis datos', icon: User },
            { id: 'verificacion', label: '2. Verificación', icon: ShieldCheck },
            { id: 'fondos', label: '3. Fondos', icon: DollarSign },
            { id: 'criterios', label: '4. Mis criterios', icon: Sliders },
            { id: 'documentos', label: '5. Documentos', icon: FileText },
            { id: 'firma', label: '6. Firma digital', icon: KeyRound },
            { id: 'cuenta', label: '7. Cuenta bancaria', icon: CreditCard },
            { id: 'notificaciones', label: '8. Notificaciones y Seguridad', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'border-slate-900 text-slate-900 bg-white font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* 3. CUERPO DE LAS PESTAÑAS                                          */}
        {/* =================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 1: MIS DATOS (PERSONA FÍSICA / JURÍDICA + TITULARIDAD)    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'datos' && (
            <div className="space-y-6">
              
              {/* Selector: ¿Cómo prestás? */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  ¿Cómo prestás dinero en la plataforma?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, investorType: 'persona_fisica' })}
                    className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      profile.investorType === 'persona_fisica'
                        ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className={`w-5 h-5 ${profile.investorType === 'persona_fisica' ? 'text-slate-900' : 'text-slate-400'}`} />
                    <div>
                      <strong className="text-xs block text-slate-900">Persona física</strong>
                      <span className="text-[11px] text-slate-500">Presto a título personal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, investorType: 'persona_juridica' })}
                    className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      profile.investorType === 'persona_juridica'
                        ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${profile.investorType === 'persona_juridica' ? 'text-slate-900' : 'text-slate-400'}`} />
                    <div>
                      <strong className="text-xs block text-slate-900">Persona jurídica / Empresa</strong>
                      <span className="text-[11px] text-slate-500">Presto mediante S.A., SAS, S.R.L. o sociedad</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Formulario Caso A: Persona Física */}
              {profile.investorType === 'persona_fisica' ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Datos Personales
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Nombre</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Apellido</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tipo de documento</label>
                      <select
                        value={profile.documentType}
                        onChange={(e) => setProfile({ ...profile, documentType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="CI">Cédula de Identidad (CI)</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="DNI">DNI Extranjero</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Documento de identidad</label>
                      <input
                        type="text"
                        value={profile.documentNumber}
                        onChange={(e) => setProfile({ ...profile, documentNumber: e.target.value })}
                        className="w-full font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">País emisor</label>
                      <input
                        type="text"
                        value={profile.documentCountry}
                        onChange={(e) => setProfile({ ...profile, documentCountry: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Fecha de nacimiento</label>
                      <input
                        type="date"
                        value={profile.birthDate}
                        onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Nacionalidad</label>
                      <input
                        type="text"
                        value={profile.nationality}
                        onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">País de residencia</label>
                      <input
                        type="text"
                        value={profile.countryOfResidence}
                        onChange={(e) => setProfile({ ...profile, countryOfResidence: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1">Domicilio</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Departamento / Localidad</label>
                      <input
                        type="text"
                        value={`${profile.city}, ${profile.department}`}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Teléfono móvil</label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulario Caso B: Persona Jurídica / Empresa */
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Datos de la Empresa
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Razón social</label>
                        <input
                          type="text"
                          value={profile.companyLegalName}
                          onChange={(e) => setProfile({ ...profile, companyLegalName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Nombre comercial (opcional)</label>
                        <input
                          type="text"
                          value={profile.companyTradeName}
                          onChange={(e) => setProfile({ ...profile, companyTradeName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">RUT / Identificación fiscal</label>
                        <input
                          type="text"
                          value={profile.companyTaxId}
                          onChange={(e) => setProfile({ ...profile, companyTaxId: e.target.value })}
                          className="w-full font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Tipo de entidad</label>
                        <input
                          type="text"
                          value={profile.companyEntityType}
                          onChange={(e) => setProfile({ ...profile, companyEntityType: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">País de constitución</label>
                        <input
                          type="text"
                          value={profile.companyCountry}
                          onChange={(e) => setProfile({ ...profile, companyCountry: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-semibold mb-1">Domicilio fiscal</label>
                        <input
                          type="text"
                          value={profile.companyAddress}
                          onChange={(e) => setProfile({ ...profile, companyAddress: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Teléfono corporativo</label>
                        <input
                          type="text"
                          value={profile.companyPhone}
                          onChange={(e) => setProfile({ ...profile, companyPhone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Representantes Autorizados */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Representante Autorizado</h4>
                      <span className="text-[11px] text-slate-500">Poder de actuación verificado</span>
                    </div>
                    {profile.representatives.map((rep) => (
                      <div key={rep.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Nombre y Cargo:</span>
                          <strong>{rep.fullName} ({rep.role})</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Documento:</span>
                          <strong className="font-mono">{rep.documentNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Contacto:</span>
                          <span>{rep.email} · {rep.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Beneficiarios Finales */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Beneficiarios Finales</h4>
                      <span className="text-[11px] text-slate-500">Cumplimiento BCU / DGI</span>
                    </div>
                    {profile.ultimateBeneficiaries.map((ub) => (
                      <div key={ub.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Nombre:</span>
                          <strong>{ub.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Documento / País:</span>
                          <span>{ub.documentNumber} ({ub.nationality})</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Participación:</span>
                          <strong className="text-emerald-700">{ub.sharePercentage}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Titularidad de los Fondos (Propios vs Terceros) */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-bold text-slate-900">
                    Titularidad de los Fondos
                  </span>
                </div>
                <label className="block text-slate-700 font-medium">
                  ¿Los fondos que utilizarás para prestar son propios?
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="actsOnOwnBehalf"
                      checked={profile.actsOnOwnBehalf === true}
                      onChange={() => setProfile({ ...profile, actsOnOwnBehalf: true })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Sí, actúo por cuenta propia (fondos propios)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="actsOnOwnBehalf"
                      checked={profile.actsOnOwnBehalf === false}
                      onChange={() => setProfile({ ...profile, actsOnOwnBehalf: false })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>No, actúo por cuenta de un tercero (mandato / fiduciario)</span>
                  </label>
                </div>

                {!profile.actsOnOwnBehalf && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Nombre / Razón Social del Titular</label>
                      <input
                        type="text"
                        value={profile.thirdPartyOwnerName || ''}
                        onChange={(e) => setProfile({ ...profile, thirdPartyOwnerName: e.target.value })}
                        placeholder="Titular real de los fondos"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Documento / RUT del Titular</label>
                      <input
                        type="text"
                        value={profile.thirdPartyOwnerTaxId || ''}
                        onChange={(e) => setProfile({ ...profile, thirdPartyOwnerTaxId: e.target.value })}
                        placeholder="N° Identificación"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Vínculo o Instrumento</label>
                      <input
                        type="text"
                        value={profile.thirdPartyRelationship || ''}
                        onChange={(e) => setProfile({ ...profile, thirdPartyRelationship: e.target.value })}
                        placeholder="Poder especial / Mandato"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 2: VERIFICACIÓN & CUMPLIMIENTO (KYC + PEP)                */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'verificacion' && (
            <div className="space-y-6">
              
              {/* Estado KYC */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Verificación de Identidad (KYC)
                  </span>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Estado de Identidad</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Verificada
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Identidad validada mediante cotejo biométrico y documental seguro.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold self-start sm:self-auto"
                  onClick={() => alert('Tu identidad ya se encuentra verificada y vigente.')}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Verificar identidad
                </Button>
              </div>

              {/* Declaración PEP */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Declaración de Persona Políticamente Expuesta (PEP)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Conforme a la normativa vigente de prevención de lavado de activos (SENACLAFT / BCU).
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <label className="block text-slate-800 font-semibold">
                    ¿Corresponde alguna declaración como Persona Políticamente Expuesta (PEP) para ti, tus representantes o familiares directos?
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="isPep"
                        checked={profile.isPep === false}
                        onChange={() => setProfile({ ...profile, isPep: false, pepDetails: '' })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>No, no soy PEP</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="isPep"
                        checked={profile.isPep === true}
                        onChange={() => setProfile({ ...profile, isPep: true })}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>Sí, declaro condición PEP</span>
                    </label>
                  </div>

                  {profile.isPep && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <label className="block text-slate-700 font-semibold">
                        Detalle del cargo público u organismo
                      </label>
                      <textarea
                        rows={2}
                        value={profile.pepDetails || ''}
                        onChange={(e) => setProfile({ ...profile, pepDetails: e.target.value })}
                        placeholder="Indicar cargo, organismo, país y período..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 3: FONDOS PARA PRESTAR (CAPITAL + DISPONIBILIDAD + ORIGEN) */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'fondos' && (
            <div className="space-y-6">
              
              {/* Capital Disponible */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Capital Disponible para Prestar</h3>
                    <p className="text-xs text-slate-500">
                      Indicanos aproximadamente cuánto capital tenés disponible actualmente para nuevas operaciones.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg font-mono">
                    USD
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold font-mono">USD</span>
                  <input
                    type="number"
                    value={profile.availableCapital}
                    onChange={(e) => setProfile({ ...profile, availableCapital: Number(e.target.value) })}
                    className="w-full pl-14 pr-4 py-2.5 font-mono text-base font-extrabold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* ¿Cuándo podrías desembolsar los fondos? */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ¿Cuándo podrías desembolsar los fondos?
                </h4>
                <p className="text-xs text-slate-500">
                  Permite a HIPOTECALY coordinar los plazos de escrituración y cierre notarial.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { id: 'inmediata', label: 'Inmediatamente' },
                    { id: '7_dias', label: 'Dentro de 7 días' },
                    { id: '15_dias', label: 'Dentro de 15 días' },
                    { id: '30_dias', label: 'Dentro de 30 días' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfile({ ...profile, disbursementTime: opt.id as FundAvailability })}
                      className={`p-3 rounded-xl border text-center font-semibold transition-all ${
                        profile.disbursementTime === opt.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origen Principal de los Fondos */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Origen Principal de los Fondos
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Declarado
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Seleccioná una o más fuentes que justifican el capital colocado.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    'Actividad empresarial',
                    'Actividad profesional',
                    'Ahorros',
                    'Inversiones',
                    'Venta de activos',
                    'Rentas',
                    'Dividendos',
                    'Herencia',
                  ].map((src) => {
                    const isSelected = profile.fundSources.includes(src);
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? profile.fundSources.filter(s => s !== src)
                            : [...profile.fundSources, src];
                          setProfile({ ...profile, fundSources: next });
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{src}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Documentación de respaldo:</strong> No requerida inicialmente. Se solicitará en caso de auditoría u operación específica.</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    No requerida
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 4: MIS CRITERIOS DE PRÉSTAMO (ZONAS, TASAS, MODALIDAD)    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'criterios' && (
            <div className="space-y-6">
              
              {/* Montos y Tasas */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Montos, Tasas y Porcentaje de Financiación
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Monto Mínimo por Préstamo</label>
                    <input
                      type="number"
                      value={profile.minLoanAmount}
                      onChange={(e) => setProfile({ ...profile, minLoanAmount: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Monto Máximo por Préstamo</label>
                    <input
                      type="number"
                      value={profile.maxLoanAmount}
                      onChange={(e) => setProfile({ ...profile, maxLoanAmount: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tasa Mínima (% anual USD)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.minRate}
                      onChange={(e) => setProfile({ ...profile, minRate: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Porcentaje Máx. Financiación</label>
                    <input
                      type="number"
                      value={profile.maxFinancingRatio}
                      onChange={(e) => setProfile({ ...profile, maxFinancingRatio: Number(e.target.value) })}
                      className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Inmuebles que me interesan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inmuebles que me interesan
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Apartamento', 'Casa', 'Local Comercial', 'Campo', 'Terreno'].map((type) => {
                    const isSelected = profile.acceptedPropertyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? profile.acceptedPropertyTypes.filter(t => t !== type)
                            : [...profile.acceptedPropertyTypes, type];
                          setProfile({ ...profile, acceptedPropertyTypes: next });
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zonas donde quiero prestar */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-slate-600" />
                    Zonas donde quiero prestar
                  </h4>
                  <span className="text-[11px] text-slate-500">Departamentos y Barrios</span>
                </div>

                {/* Departamentos */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José', 'Rocha'].map((dept) => {
                    const isSelected = profile.acceptedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? profile.acceptedDepartments.filter(d => d !== dept)
                            : [...profile.acceptedDepartments, dept];
                          setProfile({ ...profile, acceptedDepartments: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{dept}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-selector para Montevideo */}
                {profile.acceptedDepartments.includes('Montevideo') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Barrios preferidos en Montevideo:</span>
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, allMontevideo: !profile.allMontevideo })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          profile.allMontevideo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {profile.allMontevideo ? '✓ Todo Montevideo incluido' : 'Personalizar barrios'}
                      </button>
                    </div>

                    {!profile.allMontevideo && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Pocitos', 'Carrasco', 'Punta Carretas', 'Malvín', 'Centro', 'Buceo', 'Cordón', 'Parque Rodó'].map((n) => {
                          const checked = profile.acceptedMontevideoNeighborhoods.includes(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                const next = checked
                                  ? profile.acceptedMontevideoNeighborhoods.filter(item => item !== n)
                                  : [...profile.acceptedMontevideoNeighborhoods, n];
                                setProfile({ ...profile, acceptedMontevideoNeighborhoods: next });
                              }}
                              className={`px-2.5 py-1 rounded text-xs transition-all ${
                                checked
                                  ? 'bg-slate-800 text-white font-semibold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {checked ? '✓ ' : ''}{n}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Formas de Pago que acepto */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Formas de pago que acepto
                </h4>
                <div className="space-y-2">
                  {[
                    { id: 'solo_intereses', label: 'Solo intereses + devolución del capital al vencimiento' },
                    { id: 'capital_e_intereses', label: 'Capital + intereses (cuotas amortizantes periódicas)' },
                  ].map((mod) => {
                    const checked = profile.acceptedModalities.includes(mod.id as PaymentModalityOption);
                    return (
                      <label key={mod.id} className="flex items-center space-x-2 text-slate-800 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? profile.acceptedModalities.filter(m => m !== mod.id)
                              : [...profile.acceptedModalities, mod.id as PaymentModalityOption];
                            setProfile({ ...profile, acceptedModalities: next });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center space-x-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    <strong>Nota:</strong> Este criterio se utiliza para el matching de oportunidades. La modalidad de cada hipoteca viene definida por el expediente y no puede ser modificada al ofertar.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 5: MIS DOCUMENTOS                                         */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Documentación Permanente del Inversor</h3>
                  <p className="text-xs text-slate-500">
                    Archivos válidos permanentemente para operar en la red sin tener que volver a solicitarlos por cada préstamo.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-xs font-semibold" onClick={() => alert('Seleccionar documento a cargar')}>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Subir documento
                </Button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {profile.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <strong className="text-slate-900 block">{doc.name}</strong>
                        <span className="text-[11px] text-slate-400">
                          {doc.type} · Subido el {doc.uploadedAt} {doc.validUntil ? `· Vigente hasta ${doc.validUntil}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Verificado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 6: FIRMA DIGITAL                                          */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'firma' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Firma Electrónica Avanzada (Ley 18.600)
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Estado de Firma Digital</h3>
                    <p className="text-slate-500">
                      Habilita la firma remota de contratos mutuos, pagarés y acuerdos de confidencialidad con plena validez legal.
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Lista para firmar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Proveedor / Protocolo:</span>
                    <strong className="text-slate-900">{profile.signatureProvider}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Última validación de certificado:</span>
                    <strong className="text-emerald-700">{profile.signatureLastVerified}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    HIPOTECALY no almacena PIN ni claves privadas. La firma se ejecuta mediante canal criptográfico seguro.
                  </span>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => alert('Certificado de firma activo y validado.')}>
                    Verificar certificado
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 7: CUENTA BANCARIA PARA OPERACIONES                       */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'cuenta' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Cuenta para Operaciones</h3>
                <p className="text-xs text-slate-500">
                  Cuenta bancaria en dólares (USD) utilizada para recibir los pagos periódicos de intereses y amortizaciones.
                </p>
              </div>

              {profile.hasBankAccount ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        <CreditCard className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <strong className="text-sm text-slate-900 block">{profile.bankName}</strong>
                        <span className="text-slate-500 font-mono">Moneda: {profile.bankCurrency} · Cuenta: {profile.bankMaskedNumber}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Verificada
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Datos bancarios enmascarados por seguridad de confidencialidad.</span>
                    <button
                      type="button"
                      onClick={() => alert('Modificación de cuenta sujeta a confirmación notarial.')}
                      className="text-amber-800 font-bold hover:underline"
                    >
                      Modificar cuenta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
                  <p className="text-xs text-slate-600">
                    Aún no configuraste una cuenta. Te la solicitaremos antes de formalizar tu primer préstamo.
                  </p>
                  <Button size="sm" style={{ backgroundColor: primaryColor }} onClick={() => setProfile({ ...profile, hasBankAccount: true })}>
                    Agregar cuenta bancaria
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PESTAÑA 8: NOTIFICACIONES Y SEGURIDAD                             */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6 text-xs">
              
              {/* Notificaciones */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Preferencias de Alertas y Notificaciones
                </h4>

                <div className="space-y-3">
                  {[
                    { key: 'newOpportunity', label: 'Nueva oportunidad compatible con tus criterios' },
                    { key: 'proposalStatus', label: 'Propuesta aceptada o con respuesta del solicitante' },
                    { key: 'upcomingPayment', label: 'Aviso previo de próximo cobro de intereses' },
                    { key: 'paymentReceived', label: 'Acreditación de pago y comprobante mensual' },
                    { key: 'documentPending', label: 'Firma o documento pendiente de formalización' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5 cursor-pointer text-slate-600">
                          <input type="checkbox" defaultChecked className="rounded text-amber-600" />
                          <span className="text-[11px]">Email</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer text-slate-600">
                          <input type="checkbox" defaultChecked className="rounded text-amber-600" />
                          <span className="text-[11px]">Plataforma</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seguridad de la Cuenta */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-slate-600" />
                  Seguridad y Sesión
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Email de acceso:</span>
                    <strong className="text-slate-900 font-mono">{profile.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Método de autenticación:</span>
                    <strong className="text-slate-900">Magic Link & Token Seguro</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Último acceso registrado:</span>
                    <strong className="text-emerald-700">Hoy (IP Protegida)</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* =================================================================== */}
        {/* 4. FOOTER: ESTADO GLOBAL DEL PERFIL Y ACCIONES                      */}
        {/* =================================================================== */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-900">
              ✓ Perfil completo y habilitado para operar
            </span>
            {saveSuccessToast && (
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] animate-fadeIn">
                ¡Cambios guardados con éxito!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cerrar
            </Button>
            <Button
              size="sm"
              className="text-xs font-semibold shadow-sm"
              style={{ backgroundColor: primaryColor }}
              onClick={handleSave}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
