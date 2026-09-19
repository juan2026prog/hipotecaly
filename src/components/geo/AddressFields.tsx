// ==============================================================================
// HIPOTECALY GEOCORE - FORMULARIO INTEGRADO DE DIRECCIÓN (AddressFields)
// Soporta búsqueda inteligente, campos jerárquicos, fallback manual y mapa interactivo
// ==============================================================================

import React, { useState } from 'react';
import { CanonicalGeoAddress, AddressCandidate, LocationPrecision } from '../../lib/geo/types';
import { GeoService } from '../../lib/geo/geoService';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DepartmentSelect } from './DepartmentSelect';
import { LocalitySelect } from './LocalitySelect';
import { NeighborhoodSelect } from './NeighborhoodSelect';
import { StreetAutocomplete } from './StreetAutocomplete';
import { LocationPicker } from './LocationPicker';
import { GeoPrecisionBadge } from './GeoPrecisionBadge';
import { Info, Edit3, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  const [inputMode, setInputMode] = useState<'search' | 'fields'>('search');
  const [manualFallbackActive, setManualFallbackActive] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);

  // Manejar selección desde el buscador general
  const handleSelectAutocomplete = async (candidate: AddressCandidate) => {
    let lat = candidate.latitude ?? null;
    let lng = candidate.longitude ?? null;
    let precision: LocationPrecision = candidate.precision;
    let verified = false;

    // Si aún no tiene coordenadas o faltan, intentar geocodificar
    if ((!lat || !lng) && candidate.streetName) {
      setGeocodingInProgress(true);
      try {
        const geocoded = await GeoService.getInstance().geocodeAddress({
          streetName: candidate.streetName,
          streetNumber: candidate.portalNumber ? String(candidate.portalNumber) : undefined,
          department: candidate.department,
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
        console.warn('Geocoding candidate failed:', err);
      } finally {
        setGeocodingInProgress(false);
      }
    } else if (lat && lng) {
      verified = true;
    }

    const updated: CanonicalGeoAddress = {
      ...address,
      department: candidate.department || address.department,
      locality: candidate.locality || address.locality,
      streetName: candidate.streetName || address.streetName,
      streetNumber: candidate.portalNumber ? String(candidate.portalNumber) : address.streetNumber,
      postalCode: candidate.postalCode || address.postalCode,
      latitude: lat,
      longitude: lng,
      precision,
      source: candidate.source,
      verified,
      verifiedAt: verified ? new Date().toISOString() : null,
      officialAddressId: candidate.officialAddressId,
      formattedAddress: candidate.fullAddress,
    };

    onChange(updated);
  };

  // Re-geocodificar cuando el usuario cambia calle o número en modo campos
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
        // Fallback no exacto
        onChange({
          ...address,
          streetName,
          streetNumber,
          latitude: null,
          longitude: null,
          precision: streetNumber ? 'STREET' : 'NEIGHBORHOOD',
          verified: false,
          source: 'manual',
        });
      }
    } catch (err) {
      console.warn('Error on field geocode:', err);
    } finally {
      setGeocodingInProgress(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selector de Modo de Carga */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setInputMode('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              inputMode === 'search'
                ? 'bg-[#102d49] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Búsqueda Rápida</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('fields')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              inputMode === 'fields'
                ? 'bg-[#102d49] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Detalle por Campos</span>
          </button>
        </div>

        <GeoPrecisionBadge precision={address.precision} />
      </div>

      {/* MODO 1: BÚSQUEDA RÁPIDA */}
      {inputMode === 'search' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Buscar dirección oficial en Uruguay
            </label>
            <AddressAutocomplete
              onSelectAddress={handleSelectAutocomplete}
              placeholder="Escribí calle y número (ej: Bulevar España 2450, Montevideo)..."
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>¿No encontrás la dirección exacta en el buscador?</span>
            <button
              type="button"
              onClick={() => {
                setInputMode('fields');
                setManualFallbackActive(true);
              }}
              className="text-[#102d49] font-bold hover:underline"
            >
              Completar por campos o manual
            </button>
          </div>
        </div>
      )}

      {/* MODO 2: CAMPOS JERÁRQUICOS */}
      {inputMode === 'fields' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                onChange({
                  ...address,
                  department: dept,
                  locality: dept === 'Montevideo' ? 'Montevideo' : '',
                  neighborhood: '',
                  streetName: '',
                  streetNumber: '',
                  latitude: null,
                  longitude: null,
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
                  streetName: '',
                  streetNumber: '',
                  latitude: null,
                  longitude: null,
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
              {!manualFallbackActive ? (
                <StreetAutocomplete
                  department={address.department}
                  locality={address.locality}
                  value={address.streetName}
                  onChange={(stName, stId) => {
                    handleFieldGeocode(stName, address.streetNumber, address.department, address.locality, stId);
                  }}
                />
              ) : (
                <input
                  type="text"
                  placeholder="Calle o avenida..."
                  value={address.streetName}
                  onChange={(e) => {
                    onChange({
                      ...address,
                      streetName: e.target.value,
                      verified: false,
                      source: 'manual',
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
                />
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nº Puerta</label>
              <input
                type="text"
                placeholder="Ej: 2450"
                value={address.streetNumber}
                onChange={(e) => {
                  const num = e.target.value;
                  handleFieldGeocode(address.streetName, num, address.department, address.locality);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Apto / Unidad</label>
              <input
                type="text"
                placeholder="Ej: 402"
                value={address.unitOrApt || ''}
                onChange={(e) => onChange({ ...address, unitOrApt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Piso</label>
              <input
                type="text"
                placeholder="Ej: 4"
                value={address.floor || ''}
                onChange={(e) => onChange({ ...address, floor: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Padrón Catastral (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: 34567"
              value={address.cadastralNumber || ''}
              onChange={(e) => onChange({ ...address, cadastralNumber: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
            />
          </div>
        </div>
      )}

      {/* Estado y Mensajes de Verificación Dinámicos */}
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
              ✓ Dirección verificada. Coordenadas reales obtenidas para la búsqueda de comparables.
            </span>
          </div>
        ) : address.streetName ? (
          <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ⚠ No encontramos numeración exacta verificada. Podés ajustar el marcador en el mapa para ubicar el inmueble con precisión.
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Ingresá la calle o buscá la dirección para posicionar la garantía y calcular comparables de mercado.
            </span>
          </div>
        )}
      </div>

      {/* MAPA INTERACTIVO LEAFLET */}
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
              onChange({
                ...address,
                latitude: lat,
                longitude: lng,
                precision: 'EXACT_ADDRESS',
                verified: true,
                source: 'manual',
                verifiedAt: new Date().toISOString(),
                ...(reverse?.streetName && !address.streetName ? { streetName: reverse.streetName } : {}),
                ...(reverse?.streetNumber && !address.streetNumber ? { streetNumber: reverse.streetNumber } : {}),
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
