import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  CheckCircle2,
  Building,
  ArrowRight,
  Lock,
  DollarSign,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules } from '../../lib/tenantModulesService';
import { submitWhiteLabelInvestorLead } from '../../lib/lendersService';
import { Button } from '../../components/ui/Button';

const PROPERTY_OPTIONS = [
  'Apartamento',
  'Casa',
  'Local Comercial',
  'Oficina',
  'Terreno / Lote',
  'Campo / Chacra',
];

const DEPARTMENT_OPTIONS = [
  'Montevideo',
  'Canelones',
  'Maldonado',
  'Colonia',
  'San Jose',
  'Rocha',
  'Interior del Pais',
];

export const WhiteLabelInvestPage: React.FC = () => {
  const { tenant } = useTenant();
  const { tenantSlug: urlSlug } = useParams<{ tenantSlug?: string }>();
  const tenantSlug = tenant?.slug || urlSlug || 'nova';
  const [modules, setModules] = useState<{ white_label_enabled?: boolean } | null>(null);
  const [loadingModules, setLoadingModules] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [investorType, setInvestorType] = useState<'persona_fisica' | 'persona_juridica'>('persona_fisica');
  const [indicativeCapital, setIndicativeCapital] = useState(100000);
  const [preferredDepartments, setPreferredDepartments] = useState<string[]>(['Montevideo', 'Maldonado']);
  const [preferredPropertyTypes, setPreferredPropertyTypes] = useState<string[]>(['Apartamento', 'Casa']);
  const [preferredModality, setPreferredModality] = useState<'solo_intereses' | 'capital_e_intereses' | 'ambas'>('solo_intereses');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (tenant.id) {
          const m = await getTenantModules(tenant.id);
          setModules(m);
        }
      } catch (e) {
        console.error('Error loading tenant modules:', e);
      } finally {
        setLoadingModules(false);
      }
    }
    load();
  }, [tenant.id]);

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Hipotecario';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const logoUrl = tenant.branding?.logo_url;

  const toggleDept = (dept: string) => {
    setPreferredDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleType = (t: string) => {
    setPreferredPropertyTypes(prev =>
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Por favor ingresa tu nombre y correo electronico.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitWhiteLabelInvestorLead({
        organizationId: tenant.id || 'd0000000-0000-0000-0000-000000000001',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        investorType: investorType === 'persona_juridica' ? 'Empresa' : 'Persona',
        indicativeCapital: Number(indicativeCapital) || 0,
        currency: 'USD',
        preferredDepartments,
        preferredPropertyTypes,
        preferredModality: preferredModality === 'ambas' ? 'solo_intereses,capital_e_intereses' : preferredModality,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setSubmittedSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loadingModules && modules && modules.white_label_enabled === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <Building className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Modulo no disponible</h2>
          <p className="text-sm text-slate-600">
            La captacion publica de inversores no esta habilitada para esta organizacion.
          </p>
          <Link to={`/demo/${tenant.slug || tenantSlug || 'nova'}`}>
            <Button variant="outline" className="mt-2">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-9 max-w-[160px] object-contain" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {brandName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-slate-800 tracking-tight text-lg">{brandName}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Area de Inversion Privada Directa</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        {submittedSuccess ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Solicitud Recibida con Exito</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gracias <strong className="text-slate-800">{name}</strong>. El equipo de{' '}
                <strong className="text-slate-800">{brandName}</strong> analizara tus criterios de inversion y te
                contactara a la brevedad con oportunidades hipotecarias exclusivas.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" /> Proximos pasos:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Validacion confidencial de criterios por el equipo notarial.</li>
                <li>Acceso personalizado al Portal del Inversor de {brandName}.</li>
                <li>Recepcion de operaciones con garantia hipotecaria de primer rango.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link to={`/demo/${tenant.slug || tenantSlug || 'nova'}`}>
                <Button className="w-full sm:w-auto px-8" style={{ backgroundColor: primaryColor }}>
                  Volver al portal principal
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Rendimientos Hipotecarios en USD</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Inverti en Creditos con Garantia Real en Uruguay
                </h1>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Forma parte de la red de inversores privados de <strong>{brandName}</strong>. Accede a operaciones
                  respaldadas por inmuebles de primera categoria, con LTV controlado y rentas mensuales en dolares.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Garantia Hipotecaria 1er Rango</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Escritura publica notarial a tu nombre sobre inmuebles con tasacion profesional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Retorno en USD Directo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tasas de rendimiento fijas anuales del 10% al 14% pagaderas mensualmente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Privacidad y Gestion Integral</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Originacion, due diligence legal, titulos y administracion gestionados por {brandName}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900">Registrar Perfil de Inversor</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Completa tus datos y preferencias. Es una solicitud informativa sin compromiso vinculante.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Inversor</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setInvestorType('persona_fisica')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          investorType === 'persona_fisica'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Persona Fisica
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvestorType('persona_juridica')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          investorType === 'persona_juridica'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Persona Juridica / Empresa
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {investorType === 'persona_juridica' ? 'Razon Social / Nombre Comercial' : 'Nombre Completo'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={investorType === 'persona_juridica' ? 'Ej. Inversiones del Plata S.A.' : 'Ej. Juan Perez'}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electronico *</label>
                      <input
                        type="email"
                        required
                        placeholder="juan@ejemplo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Telefono / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+598 99 123 456"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Capital Indicativo a Invertir</label>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        USD {indicativeCapital.toLocaleString('es-UY')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20000"
                      max="1000000"
                      step="10000"
                      value={indicativeCapital}
                      onChange={e => setIndicativeCapital(Number(e.target.value))}
                      className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>USD 20.000</span>
                      <span>USD 500.000</span>
                      <span>USD 1.000.000+</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Zonas de Preferencia</label>
                    <div className="flex flex-wrap gap-2">
                      {DEPARTMENT_OPTIONS.map(dept => {
                        const selected = preferredDepartments.includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleDept(dept)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              selected
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipos de Garantia Aceptada</label>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_OPTIONS.map(prop => {
                        const selected = preferredPropertyTypes.includes(prop);
                        return (
                          <button
                            key={prop}
                            type="button"
                            onClick={() => toggleType(prop)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              selected
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {prop}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Modalidad Preferida</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreferredModality('solo_intereses')}
                        className={`p-2 rounded-xl border text-center font-medium ${
                          preferredModality === 'solo_intereses'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Solo Intereses (Bullet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredModality('capital_e_intereses')}
                        className={`p-2 rounded-xl border text-center font-medium ${
                          preferredModality === 'capital_e_intereses'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Capital + Int. (Frances)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredModality('ambas')}
                        className={`p-2 rounded-xl border text-center font-medium ${
                          preferredModality === 'ambas'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Cualquiera
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Comentarios o requisitos especificos (Opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Preferencia por plazos de 12 a 24 meses..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>{isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Inversor'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-[11px] text-slate-500 text-center leading-normal pt-1">
                    🔒 Tus datos estan protegidos y solo se utilizaran para la originacion y matching confidencial con operaciones directas de {brandName}.
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};