import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TransactionalHeader } from '../../components/layout/TransactionalHeader';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import {
  saveApplicationDraft,
  getActiveDraft,
  uploadPropertyPhoto,
  uploadPrivateDocument,
  submitFinalApplication,
  generateApplicationPublicId,
  ApplicationDraftPayload,
} from '../../lib/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { clientSimulationService } from '../../lib/clientSimulationService';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Camera,
  Upload,
  FileText,
  Trash2,
  X,
  ZoomIn,
  ShieldCheck,
} from 'lucide-react';

export const ApplicationWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, borrower } = useAuth();
  const { tenant } = useTenant();

  const isNova = tenant.slug === 'estudio-nova' || tenant.slug === 'nova' || tenant.slug === 'estudio_nova';
  const isWhiteLabel = tenant.is_white_label || isNova;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de origen y modalidad
  const [source, setSource] = useState<string>(isNova ? 'estudio_nova' : 'native_white_label');
  const [sourceMode, setSourceMode] = useState<string>('full');
  const [repaymentMode, setRepaymentMode] = useState<string>('solo_intereses');
  const [linkedSimulationId, setLinkedSimulationId] = useState<string | null>(null);

  // Estados del Formulario
  const [appId, setAppId] = useState<string | undefined>(undefined);
  const [publicId, setPublicId] = useState<string>(() => generateApplicationPublicId());
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

  // Paso 1: Necesidad
  const [requestedAmount, setRequestedAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [purpose, setPurpose] = useState<string>('Refacción y capital de trabajo');

  // Paso 2: Propiedad
  const [propertyType, setPropertyType] = useState<string>('casa');
  const [department, setDepartment] = useState<string>('Montevideo');
  const [city, setCity] = useState<string>('Montevideo');
  const [neighborhood, setNeighborhood] = useState<string>('Pocitos');
  const [address, setAddress] = useState<string>('');
  const [cadastralNumber, setCadastralNumber] = useState<string>('');
  const [surfaceM2, setSurfaceM2] = useState<number>(120);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [estimatedValue, setEstimatedValue] = useState<number>(200000);
  const [legalStatus, setLegalStatus] = useState<string>('libre_gravamenes');

  // Paso 3: Fotos
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ name: string; category: string; url?: string }>>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Paso 4: Ingresos
  const [incomeType, setIncomeType] = useState<string>('dependiente');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(95000);
  const [uploadedIncomeDoc, setUploadedIncomeDoc] = useState<string | null>(null);

  // Paso 5: Datos Personales
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Paso 6: Consentimientos
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptCreditCheck, setAcceptCreditCheck] = useState(false);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inicialización y recuperación de draft
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryAmount = Number(searchParams.get('monto') || searchParams.get('amount'));
    const queryVal = Number(searchParams.get('valor_propiedad') || searchParams.get('property_value'));
    const queryTerm = Number(searchParams.get('plazo') || searchParams.get('term'));
    const queryMode = searchParams.get('modalidad') || searchParams.get('repayment_mode');
    const querySource = searchParams.get('source');
    const querySourceMode = searchParams.get('source_mode');
    const querySimId = searchParams.get('simulation_id');

    const simState = location.state as {
      requestedAmount?: number;
      propertyValue?: number;
      propertyType?: string;
      department?: string;
      legalStatus?: string;
      incomeType?: string;
      termMonths?: number;
      repaymentMode?: string;
      source?: string;
      sourceMode?: string;
      simulationId?: string;
    } | null;

    if (querySimId) setLinkedSimulationId(querySimId);
    else if (simState?.simulationId) setLinkedSimulationId(simState.simulationId);

    if (querySource) setSource(querySource);
    else if (simState?.source) setSource(simState.source);

    if (querySourceMode) setSourceMode(querySourceMode);
    else if (simState?.sourceMode) setSourceMode(simState.sourceMode);

    if (queryMode) setRepaymentMode(queryMode);
    else if (simState?.repaymentMode) setRepaymentMode(simState.repaymentMode);

    if (queryAmount > 0) setRequestedAmount(queryAmount);
    else if (simState?.requestedAmount) setRequestedAmount(simState.requestedAmount);

    if (queryVal > 0) setEstimatedValue(queryVal);
    else if (simState?.propertyValue) setEstimatedValue(simState.propertyValue);

    if (queryTerm > 0) setTermMonths(queryTerm);
    else if (simState?.termMonths) setTermMonths(simState.termMonths);

    if (simState?.propertyType) setPropertyType(simState.propertyType);
    if (simState?.department) setDepartment(simState.department);
    if (simState?.legalStatus) setLegalStatus(simState.legalStatus);
    if (simState?.incomeType) setIncomeType(simState.incomeType);

    if (!simState && !queryAmount) {
      getActiveDraft().then((draft) => {
        if (draft) {
          setAppId(draft.id);
          if (draft.publicId) setPublicId(draft.publicId);
          setCurrentStep(draft.currentStep || 1);
          setRequestedAmount(draft.requestedAmount || 70000);
          setTermMonths(draft.termMonths || 36);
          setPurpose(draft.purpose || '');
          if (draft.property) {
            setPropertyId(draft.property.id);
            setPropertyType(draft.property.propertyType || 'casa');
            setDepartment(draft.property.department || 'Montevideo');
            setCity(draft.property.city || 'Montevideo');
            setNeighborhood(draft.property.neighborhood || '');
            setAddress(draft.property.address || '');
            setCadastralNumber(draft.property.cadastralNumber || '');
            setSurfaceM2(draft.property.surfaceM2 || 120);
            setBedrooms(draft.property.bedrooms || 3);
            setEstimatedValue(draft.property.estimatedValue || 200000);
            setLegalStatus(draft.property.legalStatus || 'libre_gravamenes');
          }
        }
      });
    }

    if (borrower) {
      setFirstName(borrower.first_name);
      setLastName(borrower.last_name);
      setEmail(borrower.email);
      setPhone(borrower.phone || '');
      setIdNumber(borrower.id_number || '');
    } else if (user) {
      setEmail(user.email || '');
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
    }
  }, [borrower, user, location.state, location.search]);

  // Persistir en cada cambio de paso
  const persistStep = async (step: number) => {
    setSavingDraft(true);
    const payload: ApplicationDraftPayload = {
      id: appId,
      publicId,
      organizationId: tenant.id,
      currentStep: step,
      requestedAmount,
      currency: 'USD',
      termMonths,
      purpose,
      source,
      sourceMode,
      repaymentMode,
      property: {
        id: propertyId,
        propertyType,
        department,
        city,
        neighborhood,
        address,
        cadastralNumber,
        surfaceM2,
        bedrooms,
        estimatedValue,
        legalStatus,
      },
      income: {
        incomeType,
        monthlyAmount: monthlyIncome,
      },
      borrowerData: {
        firstName,
        lastName,
        idNumber,
        email,
        phone,
      },
    };

    const { application, property, isServerSynced: synced } = await saveApplicationDraft(payload, user?.id);
    if (application?.id) setAppId(application.id);
    if (application?.public_id) setPublicId(application.public_id);
    if (property?.id) setPropertyId(property.id);
    setIsServerSynced(synced);

    setSavingDraft(false);
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
    return { application, property, isServerSynced: synced };
  };

  const nextStep = async () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await persistStep(next);
  };

  const prevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPhotoUploading(true);

    const tempPropId = propertyId || crypto.randomUUID();
    const { photo, error } = await uploadPropertyPhoto(tempPropId, file, category);
    setPhotoUploading(false);

    const objectUrl = URL.createObjectURL(file);
    setUploadedPhotos((prev) => {
      const filtered = prev.filter((p) => p.category !== category);
      return [...filtered, { name: file.name, category, url: (!error && photo?.file_path) ? photo.file_path : objectUrl }];
    });
  };

  const handleRemovePhoto = (category: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.category !== category));
  };

  const handleIncomeDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const tempPropId = propertyId || crypto.randomUUID();
    await uploadPrivateDocument(tempPropId, file, 'comprobante_ingresos');
    setUploadedIncomeDoc(file.name);
  };

  const handleFinalSubmit = async () => {
    if (!acceptTerms || !acceptPrivacy || !acceptCreditCheck) return;
    setSubmitting(true);
    setSubmitError(null);
    const draftRes = await persistStep(6);
    const targetAppId = appId || draftRes?.application?.id;

    if (targetAppId) {
      if (linkedSimulationId) {
        clientSimulationService.linkSimulationToApplication(linkedSimulationId, publicId, user?.id);
      }
      const { success, error } = await submitFinalApplication(targetAppId);
      if (success) {
        setSubmitting(false);
        navigate('/mi-cuenta', { state: { justSubmitted: true, publicId } });
        return;
      } else {
        navigate('/mi-cuenta', { state: { justSubmitted: true, publicId, pendingSync: true, syncError: error?.message } });
        return;
      }
    } else {
      if (linkedSimulationId) {
        clientSimulationService.linkSimulationToApplication(linkedSimulationId, publicId, user?.id);
      }
      navigate('/mi-cuenta', { state: { justSubmitted: true, publicId, pendingSync: true } });
    }
    setSubmitting(false);
  };

  const ltv = estimatedValue > 0 ? (requestedAmount / estimatedValue) * 100 : 0;

  const stepsLabels = [
    'Necesidad',
    'Propiedad',
    'Fotos',
    'Ingresos',
    'Datos Personales',
    'Resumen & Confirmación',
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isWhiteLabel ? 'bg-[#f5f7f9] text-[#27384a]' : 'bg-slate-bg text-slate-text'}`}>
      
      {/* 1. Header Transaccional Minimalista */}
      <TransactionalHeader
        title="Solicitud de Financiación"
        publicId={publicId}
        saving={savingDraft}
        isSaved={isServerSynced}
      />

      {/* 2. Main Content Split Layout */}
      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: RESUMEN DE LA OPERACIÓN (DESKTOP STICKY)  */}
            {/* ============================================================ */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5 order-2 lg:order-1">
              
              <div className="bg-white rounded-2xl p-6 border border-[#dfe5ea] shadow-sm text-left space-y-5">
                <div className="border-b border-[#dfe5ea] pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#245f91] block">
                    EXPEDIENTE EN TRÁMITE
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#173a5e] mt-0.5">
                    Resumen de la Operación
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100">
                    <span className="text-[#718096]">Monto solicitado:</span>
                    <strong className="text-sm font-bold text-[#173a5e] font-mono">
                      USD {requestedAmount.toLocaleString('es-UY')}
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100">
                    <span className="text-[#718096]">Plazo propuesto:</span>
                    <strong className="text-[#173a5e] font-semibold">
                      {termMonths} meses ({termMonths / 12} {termMonths === 12 ? 'año' : 'años'})
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100">
                    <span className="text-[#718096]">Valor declarado:</span>
                    <strong className="text-[#173a5e] font-mono">
                      USD {estimatedValue.toLocaleString('es-UY')}
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100">
                    <span className="text-[#718096]">Inmueble:</span>
                    <strong className="text-[#173a5e] capitalize">
                      {propertyType} · {department}
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100">
                    <span className="text-[#718096]">Modalidad:</span>
                    <strong className="text-[#173a5e]">
                      {repaymentMode === 'solo_intereses' ? 'Solo Intereses' : 'Cuota Amortizable'}
                    </strong>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[#718096] font-medium">Porcentaje financiado:</span>
                    <strong className={`font-mono text-xs font-bold ${ltv > 50 ? 'text-amber-600' : 'text-[#245f91]'}`}>
                      {ltv.toFixed(1)}% (Ref. máx. 50%)
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f5f7f9] border border-[#dfe5ea] text-[11px] text-[#718096] leading-relaxed space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-[#173a5e]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#245f91]" />
                    <span>Legajo Protegido</span>
                  </div>
                  <p>Tus datos son almacenados de forma cifrada y utilizados exclusivamente para la estructuración de esta operación.</p>
                </div>
              </div>

            </aside>

            {/* ============================================================ */}
            {/* COLUMNA DERECHA: FORMULARIO WIZARD                           */}
            {/* ============================================================ */}
            <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
              
              {/* Stepper Progress Compacto */}
              <div className="bg-white rounded-2xl p-5 border border-[#dfe5ea] shadow-sm text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#245f91]">
                      Paso {currentStep} de 6
                    </span>
                    <h2 className="text-xl font-serif font-bold text-[#173a5e]">
                      {stepsLabels[currentStep - 1]}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-[#718096]">
                      {Math.round((currentStep / 6) * 100)}% completado
                    </span>
                  </div>
                </div>

                {/* Barra de progreso fina y elegante */}
                <div className="w-full bg-[#dfe5ea] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isWhiteLabel ? 'bg-[#f4b43b]' : 'bg-brand-green'
                    }`}
                    style={{ width: `${(currentStep / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Contenedor del Formulario del Paso */}
              <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#dfe5ea] shadow-sm text-left space-y-6">
                
                {/* ========================================================== */}
                {/* PASO 1: NECESIDAD                                          */}
                {/* ========================================================== */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        ¿Cuánto capital deseás solicitar y en qué plazo?
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        Estructuración de financiación en Dólares Estadounidenses con respaldo hipotecario.
                      </p>
                    </div>

                    <CurrencyInput
                      label="Monto solicitado (USD)"
                      value={requestedAmount}
                      onChange={(val) => setRequestedAmount(val)}
                      helperText="Mínimo USD 10.000 — Máximo USD 300.000 (según las condiciones configuradas para esta financiación)."
                    />

                    <div>
                      <label className="block text-xs font-bold text-[#27384a] mb-2">
                        Plazo de devolución
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[12, 24, 36, 48, 60].map((months) => (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setTermMonths(months)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                              termMonths === months
                                ? 'border-[#173a5e] bg-[#173a5e] text-white shadow-sm'
                                : 'border-[#dfe5ea] text-[#27384a] bg-white hover:border-slate-300'
                            }`}
                          >
                            {months} meses ({months / 12} {months === 12 ? 'año' : 'años'})
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      label="Destino o finalidad de la financiación (opcional)"
                      type="text"
                      placeholder="Ej. Reformas edilicias, capital de giro, consolidación de pasivos"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      helperText="Esta información será utilizada para realizar la evaluación preliminar de tu solicitud."
                    />
                  </div>
                )}

                {/* ========================================================== */}
                {/* PASO 2: PROPIEDAD                                         */}
                {/* ========================================================== */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        Datos del inmueble en garantía
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        El activo ofrecido para respaldar la estructuración de la operación.
                      </p>
                    </div>

                    <CurrencyInput
                      label="Valor de referencia estimado del inmueble (USD)"
                      value={estimatedValue}
                      onChange={(val) => setEstimatedValue(val)}
                      helperText="Valor estimativo de mercado en dólares."
                    />

                    <div className="p-3.5 rounded-xl bg-[#f5f7f9] border border-[#dfe5ea] flex items-center justify-between text-xs">
                      <span className="font-medium text-[#718096]">Relación Préstamo / Garantía:</span>
                      <span className={`font-bold ${ltv > 50 ? 'text-amber-700' : 'text-[#173a5e]'}`}>
                        {ltv.toFixed(1)}% (Tope de referencia: 50%)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#27384a] mb-1.5">
                          Tipo de propiedad
                        </label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#dfe5ea] bg-white text-xs font-semibold text-[#27384a]"
                        >
                          <option value="casa">Casa</option>
                          <option value="apartamento">Apartamento</option>
                          <option value="local_comercial">Local Comercial</option>
                          <option value="terreno">Terreno</option>
                          <option value="campo">Campo / Rural</option>
                          <option value="otro">Otro tipo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#27384a] mb-1.5">
                          Departamento
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#dfe5ea] bg-white text-xs font-semibold text-[#27384a]"
                        >
                          {['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José', 'Rocha', 'Salto', 'Paysandú'].map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Localidad / Ciudad"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Montevideo"
                      />
                      <Input
                        label="Barrio / Zona"
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Pocitos, Carrasco, Centro, etc."
                      />
                    </div>

                    <Input
                      label="Dirección o calle de referencia"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Bulevar Artigas esq. Rivera"
                      helperText="La información exacta se mantiene bajo estricta confidencialidad y control de acceso."
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Superficie aprox. (m²)"
                        type="number"
                        value={surfaceM2}
                        onChange={(e) => setSurfaceM2(Number(e.target.value))}
                      />
                      <Input
                        label="Dormitorios"
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(Number(e.target.value))}
                      />
                      <Input
                        label="Número de Padrón (opcional)"
                        type="text"
                        value={cadastralNumber}
                        onChange={(e) => setCadastralNumber(e.target.value)}
                        placeholder="Padrón N°"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#27384a] mb-1.5">
                        Situación jurídica declarada
                      </label>
                      <select
                        value={legalStatus}
                        onChange={(e) => setLegalStatus(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#dfe5ea] bg-white text-xs font-semibold text-[#27384a]"
                      >
                        <option value="libre_gravamenes">Libre de gravámenes e hipotecas</option>
                        <option value="tiene_hipoteca">Tiene una hipoteca activa</option>
                        <option value="sucesion_en_tramite">Sucesión en trámite o en proceso</option>
                        <option value="desconocido">A verificar durante estudio notarial</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* PASO 3: FOTOS DE LA PROPIEDAD                              */}
                {/* ========================================================== */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        Fotografías del inmueble
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        Podés subir fotos desde tu dispositivo o tomarlas en el momento. Podés avanzar y completarlas luego en tu portal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {[
                        { cat: 'frente', label: 'Fachada / Frente' },
                        { cat: 'living', label: 'Ambiente Principal / Living' },
                        { cat: 'cocina', label: 'Cocina' },
                        { cat: 'dormitorio', label: 'Dormitorios' },
                        { cat: 'bano', label: 'Baño' },
                        { cat: 'patio', label: 'Patio / Balcón / Exterior' },
                      ].map((item) => {
                        const existing = uploadedPhotos.find((p) => p.category === item.cat);
                        return (
                          <div
                            key={item.cat}
                            className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${
                              existing
                                ? 'border-[#173a5e]/30 bg-[#173a5e]/5 shadow-xs'
                                : 'border-dashed border-[#dfe5ea] bg-[#f5f7f9] hover:border-[#173a5e]'
                            }`}
                          >
                            <div className="flex items-center space-x-3 overflow-hidden">
                              {existing?.url ? (
                                <div className="relative group/thumb w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#173a5e]/20 bg-slate-100 shadow-2xs">
                                  <img
                                    src={existing.url}
                                    alt={item.label}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPreviewZoomUrl(existing.url || null)}
                                    className="absolute inset-0 bg-[#102d49]/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                    title="Ampliar foto"
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-[#173a5e]/10 flex items-center justify-center text-[#173a5e] shrink-0">
                                  <Camera className="w-5 h-5" />
                                </div>
                              )}

                              <div className="truncate text-left">
                                <span className="text-xs font-bold text-[#173a5e] block truncate">{item.label}</span>
                                <span className="text-[11px] text-[#718096] truncate block">
                                  {existing ? (
                                    <span className="text-[#245f91] font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 inline text-[#245f91]" /> Cargada
                                    </span>
                                  ) : (
                                    'Pendiente'
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              {existing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(item.cat)}
                                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Eliminar foto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoSelect(e, item.cat)}
                                />
                                <span className="inline-flex items-center text-xs font-bold text-[#173a5e] hover:bg-slate-100 bg-white px-3 py-1.5 rounded-lg border border-[#dfe5ea] shadow-xs">
                                  {existing ? 'Cambiar' : 'Subir'}
                                </span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {previewZoomUrl && (
                      <div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                        onClick={() => setPreviewZoomUrl(null)}
                      >
                        <div
                          className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewZoomUrl(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#102d49] text-white flex items-center justify-center hover:bg-[#173a5e] transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <img
                            src={previewZoomUrl}
                            alt="Previsualización de ambiente"
                            className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {photoUploading && (
                      <p className="text-xs text-[#245f91] font-semibold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#245f91] animate-ping" />
                        Subiendo y procesando imagen en alta resolución...
                      </p>
                    )}
                  </div>
                )}

                {/* ========================================================== */}
                {/* PASO 4: INGRESOS Y COMPROBANTES                            */}
                {/* ========================================================== */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        Fuente de ingresos del solicitante
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        Información referencial para el análisis global de la capacidad de repago.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#27384a] mb-2">
                        Tipo de actividad principal
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'dependiente', label: 'Empleado Dependiente' },
                          { id: 'independiente', label: 'Profesional Independiente' },
                          { id: 'empresa', label: 'Titular de Empresa' },
                          { id: 'jubilado', label: 'Jubilado / Pensionista' },
                          { id: 'rentas', label: 'Rentas Inmobiliarias' },
                          { id: 'otro', label: 'Otros Ingresos' },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setIncomeType(type.id)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                              incomeType === type.id
                                ? 'border-[#173a5e] bg-[#173a5e] text-white shadow-sm font-bold'
                                : 'border-[#dfe5ea] text-[#27384a] bg-white hover:border-slate-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <CurrencyInput
                      label="Ingreso mensual promedio aproximado"
                      currency="UYU"
                      value={monthlyIncome}
                      onChange={(val) => setMonthlyIncome(val)}
                      helperText="Monto mensual aproximado en Pesos Uruguayos."
                    />

                    <div className="border border-dashed border-[#dfe5ea] rounded-xl p-5 text-center bg-[#f5f7f9] space-y-2">
                      <FileText className="w-8 h-8 text-[#245f91] mx-auto" />
                      <h4 className="text-xs font-bold text-[#173a5e]">
                        Comprobante de ingresos (opcional en esta instancia)
                      </h4>
                      <p className="text-[11px] text-[#718096] max-w-sm mx-auto">
                        Recibo de sueldo o certificado de ingresos firmado por contador (PDF, JPG, PNG).
                      </p>

                      <label className="cursor-pointer inline-block mt-2">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleIncomeDocUpload}
                        />
                        <span className="inline-flex items-center text-xs font-bold text-white bg-[#173a5e] hover:bg-[#102d49] px-4 py-2 rounded-lg shadow-sm transition-colors">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {uploadedIncomeDoc ? `Archivo cargado: ${uploadedIncomeDoc}` : 'Seleccionar documento'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* PASO 5: DATOS PERSONALES                                   */}
                {/* ========================================================== */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        Datos del titular solicitante
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        Información requerida para la confección del expediente e inicio de estudio notarial.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nombres"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Juan Carlos"
                      />
                      <Input
                        label="Apellidos"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Pérez Gómez"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Cédula de Identidad (Uruguay)"
                        type="text"
                        required
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="1.234.567-8"
                      />
                      <Input
                        label="Teléfono Celular de Contacto"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="099 123 456"
                      />
                    </div>

                    <Input
                      label="Correo Electrónico"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juan@ejemplo.com"
                      helperText="Enviaremos las actualizaciones de tu expediente y notificaciones a esta casilla."
                    />
                  </div>
                )}

                {/* ========================================================== */}
                {/* PASO 6: RESUMEN & CONFIRMACIÓN                             */}
                {/* ========================================================== */}
                {currentStep === 6 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#173a5e]">
                        Revisión y confirmación de la solicitud
                      </h3>
                      <p className="text-xs text-[#718096] mt-1">
                        Al enviar la solicitud, el equipo dará inicio al análisis pericial y técnico del expediente.
                      </p>
                    </div>

                    <div className="bg-[#f5f7f9] rounded-xl p-5 border border-[#dfe5ea] space-y-3 text-xs">
                      <div className="flex justify-between pb-2 border-b border-[#dfe5ea]">
                        <span className="text-[#718096]">Monto solicitado:</span>
                        <span className="font-extrabold text-[#173a5e] text-sm font-mono">USD {requestedAmount.toLocaleString('es-UY')}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#dfe5ea]">
                        <span className="text-[#718096]">Plazo propuesto:</span>
                        <span className="font-bold text-[#173a5e]">{termMonths} meses ({termMonths / 12} años)</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#dfe5ea]">
                        <span className="text-[#718096]">Inmueble en garantía:</span>
                        <span className="font-bold text-[#173a5e] capitalize">{propertyType} en {department}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#dfe5ea]">
                        <span className="text-[#718096]">Valor estimado del bien:</span>
                        <span className="font-bold text-[#173a5e] font-mono">USD {estimatedValue.toLocaleString('es-UY')}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#dfe5ea]">
                        <span className="text-[#718096]">Porcentaje financiado:</span>
                        <span className="font-bold text-[#245f91] font-mono">{ltv.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Titular solicitante:</span>
                        <span className="font-bold text-[#173a5e]">{firstName} {lastName} ({email})</span>
                      </div>
                    </div>

                    {/* Consentimientos Legales */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start space-x-3 text-xs text-[#27384a] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 rounded text-[#173a5e] focus:ring-[#173a5e]"
                        />
                        <span>
                          Acepto los Términos y Condiciones para la tramitación de esta solicitud de financiación.
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 text-xs text-[#27384a] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptPrivacy}
                          onChange={(e) => setAcceptPrivacy(e.target.checked)}
                          className="mt-0.5 rounded text-[#173a5e] focus:ring-[#173a5e]"
                        />
                        <span>
                          He leído y acepto la Política de Privacidad y protección de datos personales.
                        </span>
                      </label>

                      <label className="flex items-start space-x-3 text-xs text-[#27384a] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptCreditCheck}
                          onChange={(e) => setAcceptCreditCheck(e.target.checked)}
                          className="mt-0.5 rounded text-[#173a5e] focus:ring-[#173a5e]"
                        />
                        <span>
                          Autorizo la evaluación preliminar, peritaje del inmueble y análisis de antecedentes crediticios para esta operación.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Botones de Navegación del Wizard */}
                <div className="pt-6 border-t border-[#dfe5ea] flex items-center justify-between">
                  {currentStep > 1 ? (
                    <Button type="button" variant="secondary" size="md" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Anterior
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 6 ? (
                    <Button
                      type="button"
                      variant={isWhiteLabel ? 'navy' : 'primary'}
                      size="lg"
                      className={isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider font-bold' : ''}
                      onClick={nextStep}
                    >
                      Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant={isWhiteLabel ? 'navy' : 'primary'}
                      size="lg"
                      disabled={!acceptTerms || !acceptPrivacy || !acceptCreditCheck || submitting}
                      onClick={handleFinalSubmit}
                      className={`px-8 shadow-md ${isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider font-bold' : ''}`}
                    >
                      {submitting ? 'Enviando solicitud...' : 'Enviar solicitud definitiva'}
                    </Button>
                  )}
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {submitError}
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Toast flotante de guardado de borrador */}
          {draftSavedToast && (
            <div className="fixed bottom-6 right-6 bg-[#102d49] text-white px-4 py-2.5 rounded-xl shadow-floating text-xs flex items-center space-x-2 animate-in fade-in z-50">
              <CheckCircle2 className="w-4 h-4 text-[#f4b43b] shrink-0" />
              <span>Borrador guardado automáticamente</span>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

