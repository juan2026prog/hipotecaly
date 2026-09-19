// ==============================================================================
// HIPOTECALY GEOCORE - FORMULARIO INTEGRADO DE DIRECCIÓN (AddressFields)
// Búsqueda general tipo Collectibles + Detalle sincronizado + Mapa Leaflet bidireccional
// ==============================================================================

import React, { useState, useRef } from 'react';
import { CanonicalGeoAddress, AddressCandidate, LocationPrecision } from '../../lib/geo/types';
import { GeoService } from '../../lib/geo/geoService';
import { normalizeDepartment } from '../../lib/geo/normalization';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DepartmentSelect } from './DepartmentSelect';
import { LocalitySelect } from './LocalitySelect';
import { NeighborhoodSelect } from './NeighborhoodSelect';
import { StreetAutocomplete } from './StreetAutocomplete';
import { LocationPicker } from './LocationPicker';
import { GeoPrecisionBadge } from './GeoPrecisionBadge';
import { Info, CheckCircle2, AlertTriangle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface AddressFieldsProps {
  address: CanonicalGeoAddress;
  onChange: (updated: CanonicalGeoAddress) => void;
  showMap?: boolean;
  className?: string;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  address,
  onChange,
  showMap = true,
  className = '',
}) => {
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const debounceNumberTimerRef = useRef<any>(null);

  // Manejar selección desde el buscador general (handleGeoAddressSelect)
  const handleGeoAddressSelect = async (candidate: AddressCandidate) => {
    let lat = candidate.latitude ?? null;
    let lng = candidate.longitude ?? null;
    let precision: LocationPrecision = candidate.precision;
    let verified = false;

    // Normalizar departamento
    const normalizedDept = normalizeDepartment(candidate.department) || candidate.department || address.department;

    // Si aún no tiene coordenadas o faltan, intentar geocodificar
    if ((!lat || !lng) && candidate.streetName) {
      setGeocodingInProgress(true);
      try {
        const geocoded = await GeoService.getInstance().geocodeAddress({
          streetName: candidate.streetName,
          streetNumber: candidate.portalNumber ? String(candidate.portalNumber) : undefined,
          department: normalizedDept,
          locality: candidate.locality,
          streetId: candidate.raw?.idCalle,
        });
        if (geocoded && geocoded.latitude && geocoded.longitude) {
          lat = geocoded.latitude;
          lng = geocoded.longitude;
          precision = geocoded.precision;
          verified = true;
        }
      } catch (err) {
        console.warn('[AddressFields] Geocoding candidate failed:', err);
      } finally {
        setGeocodingInProgress(false);
      }
    } else if (lat && lng) {
      verified = true;
    }

    const updated: CanonicalGeoAddress = {
      ...address,
      country: 'Uruguay',
      countryCode: 'UY',
      department: normalizedDept,
      locality: candidate.locality || (normalizedDept === 'Montevideo' ? 'Montevideo' : ''),
      neighborhood: candidate.neighborhood || address.neighborhood || '',
      streetName: candidate.streetName || address.streetName,
      streetNumber: candidate.portalNumber ? String(candidate.portalNumber) : address.streetNumber,
      postalCode: candidate.postalCode || address.postalCode,
      latitude: lat,
      longitude: lng,
      precision,
      source: candidate.source || 'ide_uy',
      verified,
      verifiedAt: verified ? new Date().toISOString() : null,
      officialAddressId: candidate.officialAddressId,
      formattedAddress: candidate.fullAddress,
    };

    onChange(updated);
  };

  // Re-geocodificar cuando el usuario cambia calle o número en el formulario de detalle
  const handleFieldGeocode = async (
    streetName: string,
    streetNumber: string,
    dept: string,
    locality: string,
    streetId?: number
  ) => {
    if (!streetName.trim()) {
      onChange({
        ...address,
        streetName,
        streetNumber,
        latitude: null,
        longitude: null,
        precision: 'UNKNOWN',
        verified: false,
      });
      return;
    }

    setGeocodingInProgress(true);
    try {
      const res = await GeoService.getInstance().geocodeAddress({
        streetName,
        streetNumber,
        department: dept,
        locality,
        streetId,
      });

      if (res && res.latitude && res.longitude) {
        onChange({
          ...address,
          streetName: res.streetName || streetName,
          streetNumber: res.portalNumber ? String(res.portalNumber) : streetNumber,
          department: res.department || dept,
          locality: res.locality || locality,
          latitude: res.latitude,
          longitude: res.longitude,
          precision: res.precision,
          source: 'ide_uy',
          verified: true,
          verifiedAt: new Date().toISOString(),
          officialAddressId: res.officialAddressId,
          formattedAddress: res.fullAddress,
        });
      } else {
        // Fallback
        onChange({
          ...address,
          streetName,
          streetNumber,
          department: dept,
          locality,
          latitude: null,
          longitude: null,
          precision: streetNumber ? 'STREET' : 'NEIGHBORHOOD',
          verified: false,
          source: 'manual',
        });
      }
    } catch (err) {
      console.warn('[AddressFields] Error on field geocode:', err);
    } finally {
      setGeocodingInProgress(false);
    }
  };

  const handleStreetNumberChange = (num: string) => {
    onChange({
      ...address,
      streetNumber: num,
    });

    if (debounceNumberTimerRef.current) {
      clearTimeout(debounceNumberTimerRef.current);
    }

    if (num.trim() && address.streetName) {
      debounceNumberTimerRef.current = setTimeout(() => {
        handleFieldGeocode(address.streetName, num, address.department, address.locality);
      }, 500);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. BUSCADOR PRINCIPAL TIPO COLLECTIBLES */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            Buscar dirección del inmueble
          </label>
          <GeoPrecisionBadge precision={address.precision} />
        </div>
        <AddressAutocomplete
          onSelectAddress={handleGeoAddressSelect}
          placeholder="Escribí calle y número... (Ej: Bulevar España 2450)"
        />
        <p className="text-[11px] text-slate-400">
          Escribí al menos 3 letras para buscar en todo Uruguay con IDE Uruguay oficial.
        </p>
      </div>

      {/* 2. DETALLE DE UBICACIÓN / CAMPOS AUTOCOMPLETADOS */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#102d49]" />
            <span>Detalle de Ubicación</span>
          </h4>
          <button
            type="button"
            onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
            className="text-[11px] font-semibold text-[#102d49] hover:underline flex items-center space-x-1"
          >
            <span>{showAdvancedDetails ? 'Ocultar campos adicionales' : 'Ver campos adicionales (Apto, Piso, Padrón)'}</span>
            {showAdvancedDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">País</label>
            <input
              type="text"
              value={address.country || 'Uruguay'}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Departamento <span className="text-rose-500">*</span>
            </label>
            <DepartmentSelect
              value={address.department}
              onChange={(dept) => {
                const isDeptChanged = dept !== address.department;
                onChange({
                  ...address,
                  department: dept,
                  locality: dept === 'Montevideo' ? 'Montevideo' : '',
                  neighborhood: '',
                  streetName: isDeptChanged ? '' : address.streetName,
                  streetNumber: isDeptChanged ? '' : address.streetNumber,
                  latitude: isDeptChanged ? null : address.latitude,
                  longitude: isDeptChanged ? null : address.longitude,
                  precision: 'DEPARTMENT',
                  verified: false,
                });
              }}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Localidad / Ciudad <span className="text-rose-500">*</span>
            </label>
            <LocalitySelect
              department={address.department}
              value={address.locality}
              onChange={(loc) => {
                onChange({
                  ...address,
                  locality: loc,
                  precision: 'LOCALITY',
                  verified: false,
                });
              }}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Barrio / Zona
            </label>
            <NeighborhoodSelect
              department={address.department}
              value={address.neighborhood}
              onChange={(neigh) => {
                onChange({
                  ...address,
                  neighborhood: neigh,
                });
              }}
            />
          </div>

          <div className="sm:col-span-2 grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Calle / Avenida <span className="text-rose-500">*</span>
              </label>
              <StreetAutocomplete
                department={address.department}
                locality={address.locality}
                value={address.streetName}
                onChange={(stName, stId) => {
                  handleFieldGeocode(stName, address.streetNumber, address.department, address.locality, stId);
                }}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nº Puerta</label>
              <input
                type="text"
                placeholder="Ej: 2450"
                value={address.streetNumber}
                onChange={(e) => handleStreetNumberChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
              />
            </div>
          </div>

          {showAdvancedDetails && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apto / Unidad</label>
                  <input
                    type="text"
                    placeholder="Ej: 402"
                    value={address.unitOrApt || ''}
                    onChange={(e) => onChange({ ...address, unitOrApt: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Piso</label>
                  <input
                    type="text"
                    placeholder="Ej: 4"
                    value={address.floor || ''}
                    onChange={(e) => onChange({ ...address, floor: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Padrón Catastral (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 34567"
                  value={address.cadastralNumber || ''}
                  onChange={(e) => onChange({ ...address, cadastralNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. ESTADO DE VERIFICACIÓN */}
      <div className="pt-1">
        {geocodingInProgress ? (
          <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Consultando Sistema Único de Direcciones Geográficas (IDE Uruguay)...</span>
          </div>
        ) : address.verified && address.latitude && address.longitude ? (
          <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ✓ Dirección exacta verificada. Coordenadas reales obtenidas ({address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}).
            </span>
          </div>
        ) : address.streetName ? (
          <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ⚠ No encontramos numeración exacta verificada. Podés ajustar el marcador en el mapa para posicionar el inmueble con precisión.
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Buscá una dirección arriba o completá la calle para posicionar la garantía en el mapa interactivo.
            </span>
          </div>
        )}
      </div>

      {/* 4. MAPA INTERACTIVO OPENSTREETMAP CON PIN BIDIRECCIONAL */}
      {showMap && (
        <div className="pt-2">
          <LocationPicker
            latitude={address.latitude}
            longitude={address.longitude}
            addressLabel={
              address.streetName
                ? `${address.streetName} ${address.streetNumber || ''}`.trim()
                : undefined
            }
            onLocationChange={(lat, lng, reverse) => {
              const updatedDept = normalizeDepartment(reverse?.department) || reverse?.department || address.department;
              onChange({
                ...address,
                latitude: lat,
                longitude: lng,
                department: updatedDept,
                locality: reverse?.locality || address.locality,
                streetName: reverse?.streetName || address.streetName,
                streetNumber: reverse?.streetNumber || address.streetNumber,
                precision: 'EXACT_ADDRESS',
                verified: true,
                source: 'manual',
                verifiedAt: new Date().toISOString(),
                formattedAddress: reverse?.address || address.formattedAddress,
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

