import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { createLenderWithRules, Lender } from '../../lib/lendersService';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface ManualInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: (lender: Lender) => void;
}

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

export const ManualInvestorModal: React.FC<ManualInvestorModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'datos' | 'criterios'>('datos');

  // Datos Generales
  const [name, setName] = useState('');
  const [investorType, setInvestorType] = useState('Persona');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [availableCapital, setAvailableCapital] = useState<number>(100000);
  const currency = 'USD';
  const [status, setStatus] = useState<'active' | 'draft' | 'paused'>('active');
  const [notes, setNotes] = useState('');

  // Criterios de Inversión
  const [minLoan, setMinLoan] = useState<number>(25000);
  const [maxLoan, setMaxLoan] = useState<number>(180000);
  const [minRate, setMinRate] = useState<number>(11.0);
  const [maxLtv, setMaxLtv] = useState<number>(40); // 40%
  const [minTermMonths, setMinTermMonths] = useState<number>(12);
  const [maxTermMonths, setMaxTermMonths] = useState<number>(60);
  const acceptsClearing = true;
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([
    'Apartamento',
    'Casa',
    'Local Comercial',
    'Campo',
  ]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([
    'Montevideo',
    'Canelones',
    'Maldonado',
  ]);
  const [acceptedModalities, setAcceptedModalities] = useState<string[]>([
    'solo_intereses',
    'capital_e_intereses',
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('El nombre o denominación del inversor es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await createLenderWithRules({
        organizationId,
        name: name.trim(),
        displayName: name.trim(),
        lenderType: investorType,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim().toLowerCase() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        availableCapital,
        currency,
        status,
        notes: notes.trim() || undefined,
        source: 'manual',
        rules: {
          min_loan: minLoan,
          max_loan: maxLoan,
          min_rate: minRate,
          max_ltv: maxLtv / 100, // guardar como 0.40
          min_term_months: minTermMonths,
          max_term_months: maxTermMonths,
          accepts_clearing: acceptsClearing,
          accepted_property_types: selectedPropertyTypes,
          accepted_departments: selectedDepartments,
          accepted_modalities: acceptedModalities,
          accepted_currencies: [currency],
        },
      });

      setSaving(false);

      if (res.error || !res.lender) {
        setErrorMessage(res.error || 'Error al guardar el inversor en la base de datos.');
        return;
      }

      onSuccess(res.lender);
      onClose();
    } catch (err: unknown) {
      setSaving(false);
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn text-left">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Agregar Inversor</h2>
              <p className="text-xs text-slate-300">
                Alta manual de inversor privado para la cartera de tu organización
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'datos'
                ? 'border-emerald-600 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Datos del Inversor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('criterios')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'criterios'
                ? 'border-emerald-600 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Criterios de Inversión
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'datos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">
                    Nombre o denominación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Manuel Fernández o Grupo Inversor Sur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Tipo de inversor</label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="Persona">Persona física</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Fondo / vehículo de inversión">Fondo / vehículo de inversión</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Estado inicial</label>
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

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Persona de contacto</label>
                  <input
                    type="text"
                    placeholder="Nombre del apoderado o contacto"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="inversor@ejemplo.uy"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+598 99 123 456"
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

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Observaciones internas</label>
                  <textarea
                    rows={2}
                    placeholder="Notas privadas visibles solo para el equipo del estudio..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'criterios' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block font-bold text-slate-900 mb-1">
                    Financiación máxima / LTV (%)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={maxLtv}
                    onChange={(e) => setMaxLtv(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Porcentaje máximo del valor de la garantía tasada
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Tasa anual mínima (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    max={40}
                    value={minRate}
                    onChange={(e) => setMinRate(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Plazo mínimo (meses)</label>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={minTermMonths}
                    onChange={(e) => setMinTermMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Plazo máximo (meses)</label>
                  <input
                    type="number"
                    min={6}
                    max={120}
                    value={maxTermMonths}
                    onChange={(e) => setMaxTermMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tipos de Inmueble Aceptados */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Tipos de inmueble aceptados
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES_OPTIONS.map((type) => {
                    const isSelected = selectedPropertyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => togglePropertyType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
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

              {/* Departamentos / Zonas Aceptadas */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Zonas / departamentos aceptados
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS_OPTIONS.map((dept) => {
                    const isSelected = selectedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
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

              {/* Modalidades Aceptadas */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Modalidades de pago aceptadas
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedModalities.includes('solo_intereses')}
                      onChange={() => toggleModality('solo_intereses')}
                      className="rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-800">
                      Solo intereses + capital al vencimiento
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedModalities.includes('capital_e_intereses')}
                      onChange={() => toggleModality('capital_e_intereses')}
                      className="rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-800">
                      Capital + intereses / amortizante mensual
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {activeTab === 'datos' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('criterios')}
                className="text-xs"
              >
                Siguiente: Criterios de inversión →
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('datos')}
                className="text-xs"
              >
                ← Volver a Datos
              </Button>
            )}

            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {saving ? 'Guardando...' : 'Crear Inversor'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
