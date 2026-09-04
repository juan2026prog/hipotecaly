import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
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
} from 'lucide-react';

export const ApplicationWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, borrower } = useAuth();
  const { tenant } = useTenant();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de origen y modalidad
  const [source, setSource] = useState<string>('native_white_label');
  const [sourceMode, setSourceMode] = useState<string>('full');
  const [repaymentMode, setRepaymentMode] = useState<string>('solo_intereses');

  // Estados del Formulario
  const [appId, setAppId] = useState<string | undefined>(undefined);
  const [publicId, setPublicId] = useState<string>(() => generateApplicationPublicId());
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

  // Paso 1: Necesidad
  const [requestedAmount, setRequestedAmount] = useState<number>(60000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [purpose, setPurpose] = useState<string>('Refacción y consolidación');

  // Paso 2: Propiedad
  const [propertyType, setPropertyType] = useState<string>('casa');
  const [department, setDepartment] = useState<string>('Montevideo');
  const [city, setCity] = useState<string>('Montevideo');
  const [neighborhood, setNeighborhood] = useState<string>('Pocitos');
  const [address, setAddress] = useState<string>('');
  const [cadastralNumber, setCadastralNumber] = useState<string>('');
  const [surfaceM2, setSurfaceM2] = useState<number>(120);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [estimatedValue, setEstimatedValue] = useState<number>(180000);
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
    } | null;

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
      // Intentar cargar borrador previo
      getActiveDraft().then((draft) => {
        if (draft) {
          setAppId(draft.id);
          if (draft.publicId) setPublicId(draft.publicId);
          setCurrentStep(draft.currentStep || 1);
          setRequestedAmount(draft.requestedAmount || 60000);
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
            setSurfaceM2(draft.property.surfaceM2 || 100);
            setBedrooms(draft.property.bedrooms || 2);
            setEstimatedValue(draft.property.estimatedValue || 150000);
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

  // Persistir en cada cambio de paso (Regla 15)
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
      const { success, error } = await submitFinalApplication(targetAppId);
      if (success) {
        setSubmitting(false);
        navigate('/mi-cuenta', { state: { justSubmitted: true, publicId } });
        return;
      } else {
        // En caso de corte, advertir y permitir navegar marcando estado pendiente
        navigate('/mi-cuenta', { state: { justSubmitted: true, publicId, pendingSync: true, syncError: error?.message } });
        return;
      }
    } else {
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
    'Resumen',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg">
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header del Wizard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                Solicitud de préstamo
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                Paso {currentStep} de 6: {stepsLabels[currentStep - 1]}
              </h1>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
              <div className="inline-flex items-center space-x-1.5 text-xs text-brand-green font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-brand-green/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {savingDraft
                    ? 'Guardando datos...'
                    : isServerSynced
                    ? 'Tus datos están guardados'
                    : 'Guardado local'}
                </span>
              </div>
              {publicId && (
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {publicId}
                </span>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="bg-brand-green h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>

          {/* Contenedor del Paso */}
          <div className="bg-white rounded-card p-6 sm:p-10 border border-slate-border shadow-card text-left space-y-6">
            
            {/* ========================================================== */}
            {/* PASO 1: NECESIDAD                                          */}
            {/* ========================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">¿Cuánto dinero necesitás y en qué plazo?</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Préstamo en Dólares Estadounidenses con garantía sobre tu inmueble.
                  </p>
                </div>

                <CurrencyInput
                  label="Monto que necesitás solicitar"
                  value={requestedAmount}
                  onChange={(val) => setRequestedAmount(val)}
                  helperText="Mínimo USD 10.000 — Máximo USD 200.000 (según reglas del prestamista piloto)."
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-text mb-2">
                    Plazo de devolución deseado
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[12, 24, 36, 48, 60].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setTermMonths(months)}
                        className={`py-2.5 px-3 rounded-btn border text-xs font-bold transition-all ${
                          termMonths === months
                            ? 'border-brand-green bg-brand-green-light text-brand-green-dark shadow-sm'
                            : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
                        }`}
                      >
                        {months} meses ({months / 12} {months === 12 ? 'año' : 'años'})
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Finalidad del préstamo (opcional)"
                  type="text"
                  placeholder="Ej. Reformar vivienda, cancelar deudas, capital de trabajo"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  helperText="Nos ayuda a orientar mejor la propuesta con el prestamista adecuado."
                />
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 2: PROPIEDAD                                         */}
            {/* ========================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">Datos básicos de tu propiedad</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    El inmueble ofrecido en garantía para respaldar la operación.
                  </p>
                </div>

                <CurrencyInput
                  label="Valor aproximado de mercado de la propiedad"
                  value={estimatedValue}
                  onChange={(val) => setEstimatedValue(val)}
                  helperText="Valor de venta estimado en USD."
                />

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Relación Préstamo / Valor (LTV):</span>
                  <span className={`font-bold ${ltv > 40 ? 'text-rose-600' : 'text-brand-green-dark'}`}>
                    {ltv.toFixed(1)}% (Tope máximo: 40%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-text mb-1.5">
                      Tipo de propiedad
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border bg-white text-sm"
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
                    <label className="block text-sm font-semibold text-slate-text mb-1.5">
                      Departamento
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border bg-white text-sm"
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
                    placeholder="Pocitos, Carrasco, etc."
                  />
                </div>

                <Input
                  label="Dirección o calle aproximada"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Bulevar Artigas esq. Rivera"
                  helperText="Por política anti-bypass, la dirección exacta no se revela a prestamistas en etapas preliminares."
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
                  <label className="block text-sm font-semibold text-slate-text mb-1.5">
                    Situación jurídica declarada
                  </label>
                  <select
                    value={legalStatus}
                    onChange={(e) => setLegalStatus(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border bg-white text-sm"
                  >
                    <option value="libre_gravamenes">Libre de gravámenes e hipotecas</option>
                    <option value="tiene_hipoteca">Tiene una hipoteca activa</option>
                    <option value="sucesion_en_tramite">Sucesión en trámite o en proceso</option>
                    <option value="desconocido">No estoy seguro / A verificar</option>
                  </select>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 3: FOTOS DE LA PROPIEDAD (Regla 14)                   */}
            {/* ========================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">Fotografías del inmueble</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Podés tomar fotos con tu celular o subirlas desde tu galería. No te preocupes si no las tenés todas ahora: podés guardar borrador y subirlas luego.
                  </p>
                </div>

                {/* Grid de carga por ambiente con Thumbnails en tiempo real */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { cat: 'frente', label: 'Fachada / Frente' },
                    { cat: 'living', label: 'Ambiente Principal / Living' },
                    { cat: 'cocina', label: 'Cocina' },
                    { cat: 'dormitorio', label: 'Dormitorios' },
                    { cat: 'bano', label: 'Baño' },
                    { cat: 'patio', label: 'Patio / Fondo / Balcón' },
                  ].map((item) => {
                    const existing = uploadedPhotos.find((p) => p.category === item.cat);
                    return (
                      <div
                        key={item.cat}
                        className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${
                          existing
                            ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                            : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-brand-green'
                        }`}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {existing?.url ? (
                            <div className="relative group/thumb w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-emerald-200 bg-slate-100 shadow-2xs">
                              <img
                                src={existing.url}
                                alt={item.label}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewZoomUrl(existing.url || null)}
                                className="absolute inset-0 bg-navy/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                title="Ampliar foto"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green shrink-0">
                              <Camera className="w-5 h-5" />
                            </div>
                          )}

                          <div className="truncate text-left">
                            <span className="text-xs font-bold text-navy block truncate">{item.label}</span>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {existing ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Cargada
                                </span>
                              ) : (
                                'Pendiente de carga'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {existing && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.cat)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handlePhotoSelect(e, item.cat)}
                            />
                            <span className="inline-flex items-center text-xs font-bold text-brand-green-dark hover:underline bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs">
                              {existing ? 'Cambiar' : 'Subir'}
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal de Previsualización Zoom */}
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
                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-navy/80 text-white flex items-center justify-center hover:bg-navy transition-colors"
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
                  <p className="text-xs text-brand-green font-semibold animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                    Subiendo y optimizando imagen en alta resolución...
                  </p>
                )}

                <div className="bg-brand-green-light/40 border border-brand-green/20 rounded-xl p-3.5 text-xs text-brand-green-dark">
                  💡 <strong>Recomendación:</strong> Fotos nítidas y con luz natural aceleran la evaluación preliminar de tasación.
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 4: INGRESOS Y COMPROBANTES                            */}
            {/* ========================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">Fuente de ingresos</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    El prestamista evalúa la capacidad de repago estimada.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-text mb-2">
                    Tipo de actividad económica
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'dependiente', label: 'Empleado Dependiente' },
                      { id: 'independiente', label: 'Profesional Independiente' },
                      { id: 'empresa', label: 'Titular de Empresa' },
                      { id: 'jubilado', label: 'Jubilado / Pensionista' },
                      { id: 'rentas', label: 'Rentas de Inmuebles' },
                      { id: 'otro', label: 'Otros Ingresos' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setIncomeType(type.id)}
                        className={`py-2.5 px-3 rounded-btn border text-xs font-semibold transition-all ${
                          incomeType === type.id
                            ? 'border-brand-green bg-brand-green-light text-brand-green-dark shadow-sm'
                            : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <CurrencyInput
                  label="Ingreso mensual promedio estimado"
                  currency="UYU"
                  value={monthlyIncome}
                  onChange={(val) => setMonthlyIncome(val)}
                  helperText="Equivalente mensual aproximado en Pesos Uruguayos."
                />

                {/* Subida de Comprobante de Ingresos */}
                <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 space-y-2">
                  <FileText className="w-8 h-8 text-brand-green mx-auto" />
                  <h4 className="text-sm font-bold text-navy">
                    Comprobante de ingresos (opcional en esta etapa)
                  </h4>
                  <p className="text-xs text-slate-muted max-w-sm mx-auto">
                    Recibo de sueldo o certificado emitido por contador público (PDF, JPG, PNG).
                  </p>

                  <label className="cursor-pointer inline-block mt-2">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleIncomeDocUpload}
                    />
                    <span className="inline-flex items-center text-xs font-bold text-white bg-navy hover:bg-navy-light px-4 py-2 rounded-btn shadow-sm transition-colors">
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
                  <h3 className="text-lg font-bold text-navy">Tus datos de contacto</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Solo solicitamos la información estrictamente necesaria para gestionar tu solicitud.
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
                    label="Teléfono Celular"
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
                  helperText="Te notificaremos cada actualización de tu expediente a este email."
                />
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 6: RESUMEN Y CONSENTIMIENTO                           */}
            {/* ========================================================== */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">Revisá tu solicitud antes de enviar</h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Una vez enviada, nuestros analistas revisarán los datos y comenzaremos la búsqueda de propuestas.
                  </p>
                </div>

                {/* Resumen Ficha */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Monto solicitado:</span>
                    <span className="font-extrabold text-navy text-sm">USD {requestedAmount.toLocaleString('es-UY')}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Plazo deseado:</span>
                    <span className="font-bold text-navy">{termMonths} meses ({termMonths / 12} años)</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Inmueble en garantía:</span>
                    <span className="font-bold text-navy capitalize">{propertyType} en {department}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Valor estimado del inmueble:</span>
                    <span className="font-bold text-navy">USD {estimatedValue.toLocaleString('es-UY')}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">LTV resultante:</span>
                    <span className="font-bold text-brand-green-dark">{ltv.toFixed(1)}% (Tope 40%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Titular solicitante:</span>
                    <span className="font-bold text-navy">{firstName} {lastName} ({email})</span>
                  </div>
                </div>

                {/* Consentimientos Legales (Regla 27) */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start space-x-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 rounded text-brand-green focus:ring-brand-green"
                    />
                    <span>
                      Acepto los{' '}
                      <Link to="/terminos" className="text-brand-green font-bold hover:underline">
                        Términos y Condiciones del Servicio
                      </Link>{' '}
                      de intermediación y gestión de HIPOTECALY.
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="mt-0.5 rounded text-brand-green focus:ring-brand-green"
                    />
                    <span>
                      He leído y acepto la{' '}
                      <Link to="/privacidad" className="text-brand-green font-bold hover:underline">
                        Política de Privacidad
                      </Link>{' '}
                      y protección de datos personales.
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptCreditCheck}
                      onChange={(e) => setAcceptCreditCheck(e.target.checked)}
                      className="mt-0.5 rounded text-brand-green focus:ring-brand-green"
                    />
                    <span>
                      Autorizo el análisis crediticio preliminar y la búsqueda de propuestas con prestamistas calificados.
                    </span>
                  </label>
                </div>

              </div>
            )}

            {/* Navegación y Botones del Wizard */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <Button type="button" variant="secondary" size="md" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Anterior
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <Button type="button" variant="primary" size="lg" onClick={nextStep}>
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={!acceptTerms || !acceptPrivacy || !acceptCreditCheck || submitting}
                  onClick={handleFinalSubmit}
                  className="px-8 shadow-md"
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

          {/* Toast flotante de guardado de borrador */}
          {draftSavedToast && (
            <div className="fixed bottom-6 right-6 bg-navy text-white px-4 py-2.5 rounded-lg shadow-floating text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>Borrador guardado automáticamente</span>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
