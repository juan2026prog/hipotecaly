// ==============================================================================
// HIPOTECALY TASADOR IA - NUEVA TASACIÓN / CONSULTA OPERATIVA (PARTE 1)
// Formulario profesional estructurado por bloques con validación rigurosa
// ==============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { AppraisalService } from '../../lib/tasador/appraisal/AppraisalService';
import {
  AppraisalPropertyInput,
  AppraisalPropertyType,
  BuildingCondition,
  AppraisalPhoto,
} from '../../lib/tasador/appraisal/appraisalTypes';
import {
  Compass,
  MapPin,
  Building2,
  Maximize2,
  Bed,
  Sparkles,
  Upload,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

const DEPARTMENTS_URUGUAY = [
  'Montevideo',
  'Canelones',
  'Maldonado',
  'Colonia',
  'Rocha',
  'San José',
  'Salto',
  'Paysandú',
  'Rivera',
  'Tacuarembó',
  'Lavalleja',
  'Soriano',
  'Florida',
  'Durazno',
  'Río Negro',
  'Treinta y Tres',
  'Cerro Largo',
  'Artigas',
  'Flores',
];

const MONTEVIDEO_NEIGHBORHOODS = [
  'Pocitos',
  'Punta Carretas',
  'Buceo',
  'Malvín',
  'Carrasco',
  'Parque Rodó',
  'Cordón',
  'Centro',
  'Ciudad Vieja',
  'Tres Cruces',
  'La Blanqueada',
  'Palermo',
  'Barrio Sur',
  'Aguada',
  'Prado',
  'Unión',
  'Maroñas',
  'Sayago',
  'Colón',
];

export const TasadorNewAppraisalPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const baseRoute = `/demo/${tenant.slug || 'estudio-nova'}/admin`;

  // Bloque A: Ubicación
  const [country] = useState('Uruguay');
  const [department, setDepartment] = useState('Montevideo');
  const [city, setCity] = useState('Montevideo');
  const [neighborhood, setNeighborhood] = useState('Pocitos');
  const [streetName, setStreetName] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [unitOrApt, setUnitOrApt] = useState('');
  const [floor, setFloor] = useState('');
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [latitude, _setLatitude] = useState<number | null>(-34.915);
  const [longitude, _setLongitude] = useState<number | null>(-56.148);

  // Bloque B: Tipo de Inmueble
  const [propertyType, setPropertyType] = useState<AppraisalPropertyType>('apartamento');
  const [subType, _setSubType] = useState('');
  const [horizontalProperty, setHorizontalProperty] = useState(true);

  // Bloque C: Superficies
  const [totalAreaM2, setTotalAreaM2] = useState<number | ''>(82);
  const [builtAreaM2, setBuiltAreaM2] = useState<number | ''>(78);
  const [coveredAreaM2, setCoveredAreaM2] = useState<number | ''>(75);
  const [landAreaM2, setLandAreaM2] = useState<number | ''>('');
  const [balconyOrTerraceM2, setBalconyOrTerraceM2] = useState<number | ''>(4);

  // Bloque D: Distribución
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [toilettes, setToilettes] = useState<number>(0);
  const [garages, setGarages] = useState<number>(1);
  const [floorLevel, _setFloorLevel] = useState<number | ''>(4);

  // Bloque E: Amenities
  const [amenities, setAmenities] = useState({
    balcony: true,
    terrace: false,
    patio: false,
    garden: false,
    barbecue: true,
    pool: false,
    elevator: true,
    concierge: true,
    security24h: false,
    heating: true,
    airConditioning: true,
    gym: false,
    seaFront: false,
    openView: true,
    storage: true,
  });

  // Bloque F: Estado
  const [condition, setCondition] = useState<BuildingCondition>('bueno');
  const [constructionYear, setConstructionYear] = useState<number | ''>(2016);

  // Bloque G: Fotos
  const [photos, setPhotos] = useState<AppraisalPhoto[]>([]);

  // Bloque H: Observaciones
  const [observations, setObservations] = useState('');

  // Estado de envío y validación
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: AppraisalPhoto[] = [];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedMimeTypes.includes(file.type)) {
        alert(`El archivo ${file.name} no tiene un formato soportado (solo JPEG, PNG o WebP).`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} supera el límite de 5MB.`);
        continue;
      }

      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `photo_${Date.now()}_${i}`,
        url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        isPrimary: photos.length === 0 && i === 0,
        order: photos.length + i,
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({ ...p, isPrimary: p.id === id }))
    );
  };

  // Construir objeto de propiedad objetivo
  const targetProperty: AppraisalPropertyInput = {
    title: `${propertyType.toUpperCase()} en ${neighborhood || city || department}`,
    propertyType,
    subType: subType || undefined,
    horizontalProperty,
    operationType: 'SALE',
    location: {
      country,
      department,
      city,
      neighborhood,
      streetName,
      streetNumber,
      unitOrApt: unitOrApt || undefined,
      floor: floor || undefined,
      cadastralNumber: cadastralNumber || undefined,
      latitude,
      longitude,
      isGeocodedExact: Boolean(streetName && streetNumber),
    },
    surfaces: {
      totalAreaM2: Number(totalAreaM2) || 0,
      builtAreaM2: Number(builtAreaM2) || Number(totalAreaM2) || 0,
      coveredAreaM2: Number(coveredAreaM2) || Number(totalAreaM2) || 0,
      landAreaM2: Number(landAreaM2) || undefined,
      balconyOrTerraceM2: Number(balconyOrTerraceM2) || undefined,
    },
    layout: {
      bedrooms,
      bathrooms,
      toilettes,
      garages,
      floorLevel: Number(floorLevel) || undefined,
    },
    amenities,
    condition,
    constructionYear: Number(constructionYear) || undefined,
    photos,
    observations: observations || undefined,
  };

  const handleStartSearch = async () => {
    setValidationError(null);
    const service = AppraisalService.getInstance();
    const validation = service.validateForComparables(targetProperty);

    if (!validation.valid) {
      setValidationError(validation.errorMessage || 'Información insuficiente para buscar comparables.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      // Guardar el borrador con estado READY_FOR_COMPARABLES
      const saved = await service.saveAppraisal({
        organizationId: tenant.id,
        createdBy: user?.id || null,
        creatorEmail: user?.email || null,
        status: 'READY_FOR_COMPARABLES',
        propertyInput: targetProperty,
        location: targetProperty.location,
        selectedComparablesCount: 0,
        setQuality: 'MEDIA',
      });

      // Navegar a la pantalla de selección y validación de comparables (Parte 2)
      navigate(`${baseRoute}/tasaciones/${saved.id}`);
    } catch (err: any) {
      console.error('[TasadorNewAppraisalPage] Error saving appraisal:', err);
      setValidationError('Ocurrió un error al guardar la tasación. Por favor intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackofficeLayout>
      <div className="max-w-5xl mx-auto space-y-8 text-left pb-16">
        {/* Encabezado y Breadcrumb */}
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <button
              onClick={() => navigate(`${baseRoute}/tasaciones`)}
              className="hover:text-[#102d49] transition-colors"
            >
              Tasador IA
            </button>
            <span>/</span>
            <span className="text-slate-600 font-semibold">Nueva Tasación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
            Ingreso de Inmueble a Tasar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Completa la ficha técnica del inmueble para obtener comparables reales de mercado y calificar el colateral.
          </p>
        </div>

        {/* Alerta de Validación */}
        {validationError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Información requerida para continuar</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal: Formulario en Bloques */}
          <div className="lg:col-span-2 space-y-6">

            {/* BLOQUE A: UBICACIÓN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque A — Ubicación Geográfica</h3>
                  <p className="text-[11px] text-slate-400">Jurisdicción y dirección del inmueble</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">País</label>
                  <input
                    type="text"
                    value={country}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Departamento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (e.target.value === 'Montevideo') {
                        setCity('Montevideo');
                      } else {
                        setCity(e.target.value);
                        setNeighborhood('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 font-medium"
                  >
                    {DEPARTMENTS_URUGUAY.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Barrio / Zona <span className="text-rose-500">*</span>
                  </label>
                  {department === 'Montevideo' ? (
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 font-medium"
                    >
                      <option value="">Seleccionar barrio...</option>
                      {MONTEVIDEO_NEIGHBORHOODS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ej: La Barra, Punta del Este..."
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Localidad / Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Calle / Avenida</label>
                    <input
                      type="text"
                      placeholder="Ej: Bulevar España"
                      value={streetName}
                      onChange={(e) => setStreetName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nº Puerta</label>
                    <input
                      type="text"
                      placeholder="Ej: 2450"
                      value={streetNumber}
                      onChange={(e) => setStreetNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Apto / Unidad</label>
                    <input
                      type="text"
                      placeholder="Ej: 402"
                      value={unitOrApt}
                      onChange={(e) => setUnitOrApt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Piso</label>
                    <input
                      type="text"
                      placeholder="Ej: 4"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Padrón Catastral (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 34567"
                    value={cadastralNumber}
                    onChange={(e) => setCadastralNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>
              </div>

              {/* Estado de Geocodificación */}
              <div className="pt-2">
                {streetName && streetNumber ? (
                  <div className="flex items-center space-x-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dirección completa para geolocalización precisa.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                    <Info className="w-3.5 h-3.5" />
                    <span>Sin numeración exacta: los comparables se buscarán a nivel de barrio ({neighborhood || department}).</span>
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE B: TIPO DE INMUEBLE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque B — Tipo de Inmueble y Operación</h3>
                  <p className="text-[11px] text-slate-400">Categoría tipológica conforme a la taxonomía canónica</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'apartamento', label: 'Apartamento' },
                  { key: 'casa', label: 'Casa / Chalet' },
                  { key: 'ph', label: 'Prop. Horizontal (PH)' },
                  { key: 'terreno', label: 'Terreno / Solar' },
                  { key: 'local_comercial', label: 'Local Comercial' },
                  { key: 'oficina', label: 'Oficina' },
                  { key: 'campo', label: 'Campo / Chacra' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPropertyType(item.key as AppraisalPropertyType)}
                    className={`p-3 rounded-xl border font-bold text-center transition-all ${
                      propertyType === item.key
                        ? 'bg-[#102d49] text-white border-[#102d49] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4 pt-2 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horizontalProperty}
                    onChange={(e) => setHorizontalProperty(e.target.checked)}
                    className="w-4 h-4 rounded text-[#102d49] focus:ring-[#102d49]"
                  />
                  <span className="text-slate-700 font-semibold">Régimen de Propiedad Horizontal (Ley 10.751)</span>
                </label>
              </div>
            </div>

            {/* BLOQUE C: SUPERFICIES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque C — Superficies (m²)</h3>
                  <p className="text-[11px] text-slate-400">Medidas del inmueble para cálculo de USD/m²</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Superficie Total (m²) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 82"
                    value={totalAreaM2}
                    onChange={(e) => setTotalAreaM2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sup. Construida (m²)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 78"
                    value={builtAreaM2}
                    onChange={(e) => setBuiltAreaM2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sup. Cubierta (m²)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 75"
                    value={coveredAreaM2}
                    onChange={(e) => setCoveredAreaM2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Terraza / Balcón (m²)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 4"
                    value={balconyOrTerraceM2}
                    onChange={(e) => setBalconyOrTerraceM2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>

                {propertyType === 'casa' || propertyType === 'terreno' ? (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Terreno / Solar (m²)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 300"
                      value={landAreaM2}
                      onChange={(e) => setLandAreaM2(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* BLOQUE D: DISTRIBUCIÓN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque D — Distribución y Ambientes</h3>
                  <p className="text-[11px] text-slate-400">Dormitorios, baños y plazas de garaje</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dormitorios</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'Monoambiente (0 dorm)' : `${num} dorm`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Baños Completos</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'baño' : 'baños'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Toilettes</label>
                  <select
                    value={toilettes}
                    onChange={(e) => setToilettes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  >
                    {[0, 1, 2, 3].map((num) => (
                      <option key={num} value={num}>
                        {num} toilette(s)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Garajes / Cocheras</label>
                  <select
                    value={garages}
                    onChange={(e) => setGarages(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  >
                    {[0, 1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'Sin garaje' : `${num} garaje(s)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BLOQUE E: CARACTERÍSTICAS Y AMENITIES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque E — Características y Amenities</h3>
                  <p className="text-[11px] text-slate-400">Servicios e infraestructura que inciden en el valor de mercado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { key: 'balcony', label: 'Balcón' },
                  { key: 'terrace', label: 'Terraza' },
                  { key: 'patio', label: 'Patio' },
                  { key: 'garden', label: 'Jardín' },
                  { key: 'barbecue', label: 'Parrillero / Asador' },
                  { key: 'pool', label: 'Piscina' },
                  { key: 'elevator', label: 'Ascensor' },
                  { key: 'concierge', label: 'Portería / Recepción' },
                  { key: 'security24h', label: 'Seguridad 24h' },
                  { key: 'heating', label: 'Calefacción central' },
                  { key: 'airConditioning', label: 'Aire Acondicionado' },
                  { key: 'gym', label: 'Gimnasio' },
                  { key: 'seaFront', label: 'Frente al Mar' },
                  { key: 'openView', label: 'Vista Despejada' },
                  { key: 'storage', label: 'Box / Baulera' },
                ].map((amenity) => {
                  const active = amenities[amenity.key as keyof typeof amenities];
                  return (
                    <button
                      key={amenity.key}
                      type="button"
                      onClick={() => toggleAmenity(amenity.key as keyof typeof amenities)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                        active
                          ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{amenity.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                          active ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {active ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BLOQUE F: ESTADO Y ANTIGÜEDAD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque F — Estado de Conservación y Antigüedad</h3>
                  <p className="text-[11px] text-slate-400">Año de construcción y estado físico de la propiedad</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Año de Construcción</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Ej: 2016"
                    value={constructionYear}
                    onChange={(e) => setConstructionYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                  {constructionYear && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Antigüedad aproximada: {new Date().getFullYear() - Number(constructionYear)} años
                    </span>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado de Conservación</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as BuildingCondition)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 capitalize"
                  >
                    <option value="excelente">Excelente (A estrenar / Reciclado premium)</option>
                    <option value="muy_bueno">Muy Bueno</option>
                    <option value="bueno">Bueno (Estándar habitable)</option>
                    <option value="regular">Regular (Requiere mantenimiento menor)</option>
                    <option value="a_reciclar">A Reciclar (Requiere reforma integral)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BLOQUE G: FOTOS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque G — Fotografías del Inmueble</h3>
                  <p className="text-[11px] text-slate-400">Subida segura de imágenes para respaldo y preview</p>
                </div>
              </div>

              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-[#102d49]">Haz click o arrastra fotos aquí</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Formatos JPEG, PNG, WebP (máx. 5MB por foto)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 aspect-video"
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      {photo.isPrimary && (
                        <div className="absolute top-1.5 left-1.5 bg-[#f4b43b] text-[#102d49] text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                          PRINCIPAL
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        {!photo.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryPhoto(photo.id)}
                            title="Establecer como foto principal"
                            className="p-1.5 bg-white/90 text-amber-600 rounded-lg hover:bg-white text-xs font-bold"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          title="Eliminar foto"
                          className="p-1.5 bg-white/90 text-rose-600 rounded-lg hover:bg-white text-xs font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOQUE H: OBSERVACIONES DEL TASADOR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102d49]">Bloque H — Observaciones del Tasador</h3>
                  <p className="text-[11px] text-slate-400">Notas cualitativas del profesional (orientación, estado, reformas)</p>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Ej: Apartamento en excelente estado, orientación norte con vista despejada. Living con pisos de parquet pulidos recientemente..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                />
              </div>
            </div>

          </div>

          {/* Columna Lateral: Tarjeta Resumen "INMUEBLE A TASAR" */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 bg-white p-6 rounded-2xl border-2 border-[#102d49]/10 shadow-lg space-y-5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-[#102d49] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  RESUMEN PREVIO
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif font-bold text-[#102d49] capitalize">
                  {propertyType} en {neighborhood || department}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[streetName, streetNumber].filter(Boolean).join(' ') || 'Dirección a definir'}, {department}
                </p>
              </div>

              {/* Ficha Rápida */}
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Superficie Total</span>
                  <span className="font-bold text-slate-800">{totalAreaM2 || '—'} m²</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Superficie Construida</span>
                  <span className="font-bold text-slate-800">{builtAreaM2 || '—'} m²</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Dormitorios</span>
                  <span className="font-bold text-slate-800">{bedrooms}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Baños</span>
                  <span className="font-bold text-slate-800">{bathrooms}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Garajes</span>
                  <span className="font-bold text-slate-800">{garages > 0 ? garages : 'Sin garaje'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Estado</span>
                  <span className="font-bold text-slate-800 capitalize">{condition.replace(/_/g, ' ')}</span>
                </div>
                {constructionYear && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Año de Construcción</span>
                    <span className="font-bold text-slate-800">{constructionYear}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Fotos cargadas</span>
                  <span className="font-bold text-slate-800">{photos.length} foto(s)</span>
                </div>
              </div>

              {/* CTA Principal de Búsqueda */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleStartSearch}
                  className="w-full bg-[#102d49] hover:bg-[#153a5e] text-white py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Iniciando búsqueda...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-[#f4b43b]" />
                      <span>Buscar Comparables</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  La consulta buscará candidatos reales en la Base Inmobiliaria de HIPOTECALY sin consultar portales externos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};
