// ==============================================================================
// HIPOTECALY: Mi Perfil del Inversor (/demo/:tenantSlug/inversor/perfil)
// Vista canónica conectada a Supabase (lenders + lender_rules)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Sliders,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  getLendersList,
  updateLenderData,
  saveLenderRules,
  Lender,
} from '../../lib/lendersService';

const DEPARTMENTS = [
  'Montevideo',
  'Canelones',
  'Maldonado',
  'Colonia',
  'San José',
  'Rocha',
  'Paysandú',
  'Salto',
  'Otros departamentos',
];

const PROPERTY_TYPES = [
  'Apartamento',
  'Casa',
  'Local Comercial',
  'Oficina',
  'Terreno / Solar',
  'Campo / Chacra',
  'Galpón Industrial',
];

export const TenantInvestorProfilePage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';

  const tabParam = searchParams.get('tab') as 'datos' | 'criterios' | null;
  const [activeTab, setActiveTab] = useState<'datos' | 'criterios'>(
    tabParam === 'criterios' ? 'criterios' : 'datos'
  );

  const [currentLender, setCurrentLender] = useState<Lender | null>(null);
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form State: Datos Personales / Identidad
  const [formData, setFormData] = useState({
    displayName: '',
    legalName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    investorType: 'Persona',
    availableCapital: 200000,
    currency: 'USD',
    notes: '',
    status: 'active',
  });

  // Form State: Criterios de Inversión
  const [criteriaData, setCriteriaData] = useState({
    minLoan: 10000,
    maxLoan: 250000,
    minRate: 11.0,
    maxLtvPct: 40, // Financiación máxima (LTV)
    minTermMonths: 12,
    maxTermMonths: 60,
    acceptedPropertyTypes: ['Apartamento', 'Casa', 'Local Comercial'],
    acceptedDepartments: ['Montevideo', 'Canelones', 'Maldonado'],
    acceptedModalities: ['solo_intereses', 'capital_e_intereses'],
  });

  useEffect(() => {
    if (tabParam && (tabParam === 'datos' || tabParam === 'criterios')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Cargar datos de Supabase
  useEffect(() => {
    async function loadLender() {
      if (!tenant.id) return;
      setLoading(true);
      try {
        const { lenders } = await getLendersList({ organizationId: tenant.id });
        let matched = lenders[0] || null;
        if (user?.id) {
          const found = lenders.find(l => l.user_id === user.id || l.contact_email === user.email);
          if (found) matched = found;
        }

        if (matched) {
          setCurrentLender(matched);
          setFormData({
            displayName: matched.display_name || matched.name || '',
            legalName: matched.legal_name || '',
            contactName: matched.contact_name || matched.name || '',
            contactEmail: matched.contact_email || '',
            contactPhone: matched.contact_phone || '',
            investorType: matched.lender_type === 'institutional' || matched.lender_type === 'Empresa' ? 'Empresa' : 'Persona',
            availableCapital: matched.available_capital || 0,
            currency: matched.currency || 'USD',
            notes: matched.notes || '',
            status: matched.status || 'active',
          });

          if (matched.rules) {
            const r = matched.rules;
            setCriteriaData({
              minLoan: r.min_loan || 10000,
              maxLoan: r.max_loan || 250000,
              minRate: r.min_rate || 11.0,
              maxLtvPct: r.max_ltv ? Math.round(r.max_ltv * 100) : 40,
              minTermMonths: r.min_term_months || 12,
              maxTermMonths: r.max_term_months || 60,
              acceptedPropertyTypes: (r.accepted_property_types as string[]) || ['Apartamento', 'Casa'],
              acceptedDepartments: r.accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
              acceptedModalities: r.accepted_modalities || ['solo_intereses', 'capital_e_intereses'],
            });
          }
        }
      } catch (err) {
        console.error('Error cargando inversor desde Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLender();
  }, [tenant.id, user?.id]);

  const handleTabChange = (tab: 'datos' | 'criterios') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setFeedbackMessage(null);
  };

  const handleSaveDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLender?.id) return;
    setSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await updateLenderData(currentLender.id, {
        display_name: formData.displayName,
        legal_name: formData.legalName,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        lender_type: formData.investorType,
        available_capital: Number(formData.availableCapital) || 0,
        currency: formData.currency,
        notes: formData.notes,
        status: formData.status as any,
      }, user?.id);

      if (res.success) {
        setFeedbackMessage('✓ Datos de contacto y perfil guardados correctamente en la base de datos.');
      } else {
        setFeedbackMessage(`Error: ${res.error || 'No se pudo guardar'}`);
      }
    } catch (err: any) {
      setFeedbackMessage(`Error al guardar: ${err.message || err}`);
    } finally {
      setSaving(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleSaveCriterios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLender?.id) return;
    setSaving(true);
    setFeedbackMessage(null);

    try {
      const ltvDecimal = Number((criteriaData.maxLtvPct / 100).toFixed(2));
      const res = await saveLenderRules(currentLender.id, {
        min_loan: Number(criteriaData.minLoan),
        max_loan: Number(criteriaData.maxLoan),
        min_rate: Number(criteriaData.minRate),
        max_ltv: ltvDecimal,
        min_term_months: Number(criteriaData.minTermMonths),
        max_term_months: Number(criteriaData.maxTermMonths),
        accepted_property_types: criteriaData.acceptedPropertyTypes,
        accepted_departments: criteriaData.acceptedDepartments,
        accepted_modalities: criteriaData.acceptedModalities,
        accepted_currencies: ['USD'],
        accepts_clearing: true,
      }, user?.id);

      if (res.success) {
        setFeedbackMessage('✓ Criterios de inversión sincronizados y guardados correctamente.');
      } else {
        setFeedbackMessage(`Error: ${res.error || 'No se pudo guardar criterios'}`);
      }
    } catch (err: any) {
      setFeedbackMessage(`Error al guardar criterios: ${err.message || err}`);
    } finally {
      setSaving(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const togglePropertyType = (type: string) => {
    setCriteriaData(prev => {
      const exists = prev.acceptedPropertyTypes.includes(type);
      return {
        ...prev,
        acceptedPropertyTypes: exists
          ? prev.acceptedPropertyTypes.filter(t => t !== type)
          : [...prev.acceptedPropertyTypes, type],
      };
    });
  };

  const toggleDepartment = (dept: string) => {
    setCriteriaData(prev => {
      const exists = prev.acceptedDepartments.includes(dept);
      return {
        ...prev,
        acceptedDepartments: exists
          ? prev.acceptedDepartments.filter(d => d !== dept)
          : [...prev.acceptedDepartments, dept],
      };
    });
  };

  const toggleModality = (mod: string) => {
    setCriteriaData(prev => {
      const exists = prev.acceptedModalities.includes(mod);
      return {
        ...prev,
        acceptedModalities: exists
          ? prev.acceptedModalities.filter(m => m !== mod)
          : [...prev.acceptedModalities, mod],
      };
    });
  };

  return (
    <TenantInvestorLayout title={`Mi Perfil — ${brandName}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header con tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Mi Perfil y Criterios de Inversión
              </h1>
              <p className="text-xs text-slate-500">
                Configuración exclusiva de tu cuenta de inversor privado en {brandName}
              </p>
            </div>
          </div>

          {/* Selector de pestañas */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => handleTabChange('datos')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'datos'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mis Datos</span>
            </button>
            <button
              onClick={() => handleTabChange('criterios')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'criterios'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Mis Criterios de Inversión</span>
            </button>
          </div>
        </div>

        {/* Mensaje de Feedback */}
        {feedbackMessage && (
          <div className={`p-4 rounded-xl text-xs font-medium border flex items-center space-x-2 shadow-sm ${
            feedbackMessage.startsWith('✓')
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* TAB 1: MIS DATOS */}
        {activeTab === 'datos' && (
          <form onSubmit={handleSaveDatos} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500" />
                <span>Datos del Inversor y Contacto</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Información registrada y administrada directamente para la presentación de oportunidades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="Ej: Inversiones del Plata / Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Inversor
                </label>
                <select
                  value={formData.investorType}
                  onChange={(e) => setFormData({ ...formData, investorType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                >
                  <option value="Persona">Persona Física</option>
                  <option value="Empresa">Persona Jurídica / Empresa</option>
                  <option value="Fondo">Fondo Privado / Family Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="Persona responsable"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="inversor@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="+598 99 123 456"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capital Disponible Estimado (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">USD</span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formData.availableCapital}
                    onChange={(e) => setFormData({ ...formData, availableCapital: Number(e.target.value) })}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas y Preferencias Generales
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                placeholder="Indica condiciones particulares, requisitos notariales o preferencias adicionales..."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Los cambios se guardan directamente en el registro central de la organización.
              </span>
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: primaryColor }}
                className="shadow-sm font-semibold text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Guardando...' : 'Guardar Datos de Contacto'}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: MIS CRITERIOS DE INVERSIÓN */}
        {activeTab === 'criterios' && (
          <form onSubmit={handleSaveCriterios} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Criterios y Parámetros de Inversión</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Estos parámetros se utilizan para calcular el Match Score y filtrar las oportunidades de hipoteca asignadas.
              </p>
            </div>

            {/* Parámetros Numéricos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto Mínimo por Préstamo (USD)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={criteriaData.minLoan}
                  onChange={(e) => setCriteriaData({ ...criteriaData, minLoan: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto Máximo por Préstamo (USD)
                </label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={criteriaData.maxLoan}
                  onChange={(e) => setCriteriaData({ ...criteriaData, maxLoan: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tasa Mínima Anual (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={30}
                    step={0.5}
                    value={criteriaData.minRate}
                    onChange={(e) => setCriteriaData({ ...criteriaData, minRate: Number(e.target.value) })}
                    className="w-full pr-8 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Financiación máxima (LTV) (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={80}
                    step={1}
                    value={criteriaData.maxLtvPct}
                    onChange={(e) => setCriteriaData({ ...criteriaData, maxLtvPct: Number(e.target.value) })}
                    className="w-full pr-8 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Porcentaje de financiación máximo sobre tasación
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plazo Mínimo (Meses)
                </label>
                <input
                  type="number"
                  min={6}
                  max={120}
                  value={criteriaData.minTermMonths}
                  onChange={(e) => setCriteriaData({ ...criteriaData, minTermMonths: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plazo Máximo (Meses)
                </label>
                <input
                  type="number"
                  min={12}
                  max={240}
                  value={criteriaData.maxTermMonths}
                  onChange={(e) => setCriteriaData({ ...criteriaData, maxTermMonths: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Tipos de Inmueble Aceptados */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Tipos de Garantía Inmobiliaria Aceptados
              </label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => {
                  const active = criteriaData.acceptedPropertyTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => togglePropertyType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '} {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Departamentos Aceptados */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Departamentos / Zonas Geográficas Preferidas
              </label>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => {
                  const active = criteriaData.acceptedDepartments.includes(dept);
                  return (
                    <button
                      type="button"
                      key={dept}
                      onClick={() => toggleDepartment(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '} {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modalidades de Pago Aceptadas */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Modalidades de Amortización Aceptadas
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'solo_intereses', label: 'Solo intereses mensuales + Capital al vencimiento' },
                  { id: 'capital_e_intereses', label: 'Cuotas mensuales de Capital e Intereses' },
                ].map((mod) => {
                  const active = criteriaData.acceptedModalities.includes(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModality(mod.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '} {mod.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Los criterios se guardan en la tabla central <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">public.lender_rules</code>.
              </span>
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: primaryColor }}
                className="shadow-sm font-semibold text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Guardando...' : 'Guardar Criterios de Inversión'}
              </Button>
            </div>
          </form>
        )}

      </div>
    </TenantInvestorLayout>
  );
};
