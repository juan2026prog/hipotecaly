// ==============================================================================
// HIPOTECALY GEOCORE - PROVIDER IDE URUGUAY
// Sistema Único de Direcciones Geográficas (https://direcciones.ide.uy/)
// ==============================================================================

import { GeoProvider } from "./GeoProvider";
import {
  Department,
  Locality,
  StreetSuggestion,
  AddressCandidate,
  ReverseGeocodeResult,
  CanonicalGeoAddress,
} from "../types";
import { OFFICIAL_URUGUAY_DEPARTMENTS, cleanGeoText } from "../normalization";
import { GeoCache } from "../cache";

export class IDEUruguayProvider implements GeoProvider {
  public name = "ide_uy";
  private baseUrl = "https://direcciones.ide.uy";
  private cache = GeoCache.getInstance();

  public async getDepartments(): Promise<Department[]> {
    return OFFICIAL_URUGUAY_DEPARTMENTS;
  }

  public async getLocalities(departmentName: string): Promise<Locality[]> {
    const cleanDept = cleanGeoText(departmentName);
    const cacheKey = `localities_${cleanDept}`;
    const cached = this.cache.get<Locality[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/api/v0/geocode/localidades?departamento=${encodeURIComponent(departmentName)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const mapped: Locality[] = data.map((item: any) => {
          const rawName = item.nombre || item.localidad || item.nombreLocalidad || item.name || String(item);
          // Capitalizar apropiadamente si viene en MAYÚSCULAS
          const locName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          return {
            id: item.id || locName,
            name: locName,
            canonicalName: locName,
            departmentId: departmentName,
            departmentName,
            postalCode: item.codigoPostal || null,
          };
        });
        if (mapped.length > 0) {
          this.cache.set(cacheKey, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn("[IDEUruguayProvider] Error fetching localities from IDE:", err);
    }

    // Fallback con localidad homónima
    const fallback: Locality[] = [
      {
        id: departmentName,
        name: departmentName,
        canonicalName: departmentName,
        departmentId: departmentName,
        departmentName,
        postalCode: null,
      },
    ];
    return fallback;
  }

  public async searchStreet(
    query: string,
    department: string = "Montevideo",
    _locality?: string
  ): Promise<StreetSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQ = cleanGeoText(query);
    const cleanDept = cleanGeoText(department);
    const cacheKey = `streets_${cleanDept}_${cleanQ}`;
    const cached = this.cache.get<StreetSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/api/v0/geocode/SugerenciaCalleCompleta?departamento=${encodeURIComponent(department)}&entrada=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filtrar resultados coincidentes con el departamento
          const results = data.filter(
            (item: any) => !department || cleanGeoText(item.departamento) === cleanDept
          ).map((item: any) => ({
            idCalle: item.idCalle,
            calle: item.calle,
            departamento: item.departamento,
            localidad: item.localidad,
            idLocalidad: item.idLocalidad,
          }));
          this.cache.set(cacheKey, results, 1000 * 60 * 60); // 1 hora
          return results;
        }
      }
    } catch (err) {
      console.warn("[IDEUruguayProvider] Error searching streets:", err);
    }

    return [];
  }

  public async searchAddressCandidates(query: string, limit: number = 6): Promise<AddressCandidate[]> {
    if (!query || query.trim().length < 3) return [];

    const cleanQ = cleanGeoText(query);
    const cacheKey = `candidates_${cleanQ}_${limit}`;
    const cached = this.cache.get<AddressCandidate[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/api/v1/geocode/candidates?q=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const results: AddressCandidate[] = data.map((item: any) => {
            const hasCoords = item.lat && item.lng && (item.lat !== 0 || item.lng !== 0);
            return {
              id: String(item.id || item.idCalle),
              fullAddress: item.address,
              streetName: item.nomVia || item.address?.split(",")[0],
              portalNumber: item.portalNumber || null,
              department: item.departamento,
              locality: item.localidad,
              neighborhood: null,
              postalCode: item.postalCode || null,
              latitude: hasCoords ? item.lat : null,
              longitude: hasCoords ? item.lng : null,
              precision: item.portalNumber ? (item.state === 1 ? "EXACT_ADDRESS" : "STREET_NUMBER") : "STREET",
              source: "ide_uy",
              officialAddressId: item.id,
              raw: item,
            };
          });
          this.cache.set(cacheKey, results, 1000 * 60 * 30);
          return results;
        }
      }
    } catch (err) {
      console.warn("[IDEUruguayProvider] Error fetching candidates:", err);
    }

    return [];
  }

  public async geocodeAddress(addr: Partial<CanonicalGeoAddress>): Promise<AddressCandidate | null> {
    const qParts = [addr.streetName, addr.streetNumber, addr.locality, addr.department].filter(Boolean);
    const query = qParts.join(" ");
    if (!query) return null;

    const cacheKey = `geocode_${cleanGeoText(query)}`;
    const cached = this.cache.get<AddressCandidate>(cacheKey);
    if (cached) return cached;

    try {
      // 1. Intentar con find si tenemos idCalle y número
      if (addr.streetId && addr.streetNumber) {
        const findUrl = `${this.baseUrl}/api/v1/geocode/find?type=calle&idcalle=${addr.streetId}&portal=${addr.streetNumber}`;
        const findRes = await fetch(findUrl);
        if (findRes.ok) {
          const findData = await findRes.json();
          if (Array.isArray(findData) && findData.length > 0) {
            const item = findData[0];
            const hasCoords = item.lat && item.lng && (item.lat !== 0 || item.lng !== 0);
            if (hasCoords) {
              const resObj: AddressCandidate = {
                id: String(item.id || item.idCalle),
                fullAddress: item.address,
                streetName: item.nomVia || addr.streetName,
                portalNumber: item.portalNumber || addr.streetNumber,
                department: item.departamento || addr.department,
                locality: item.localidad || addr.locality,
                postalCode: item.postalCode || null,
                latitude: item.lat,
                longitude: item.lng,
                precision: item.state === 1 ? "EXACT_ADDRESS" : "STREET_NUMBER",
                source: "ide_uy",
                officialAddressId: item.id,
                raw: item,
              };
              this.cache.set(cacheKey, resObj);
              return resObj;
            }
          }
        }
      }

      // 2. Intentar con direcUnica
      const url = `${this.baseUrl}/api/v1/geocode/direcUnica?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const hasCoords = item.lat && item.lng && (item.lat !== 0 || item.lng !== 0);
          if (hasCoords) {
            const resObj: AddressCandidate = {
              id: String(item.id || item.idCalle),
              fullAddress: item.address,
              streetName: item.nomVia || addr.streetName,
              portalNumber: item.portalNumber || addr.streetNumber,
              department: item.departamento || addr.department,
              locality: item.localidad || addr.locality,
              postalCode: item.postalCode || null,
              latitude: item.lat,
              longitude: item.lng,
              precision: item.state === 1 ? "EXACT_ADDRESS" : "STREET_NUMBER",
              source: "ide_uy",
              officialAddressId: item.id,
              raw: item,
            };
            this.cache.set(cacheKey, resObj);
            return resObj;
          }
        }
      }
    } catch (err) {
      console.warn("[IDEUruguayProvider] Error geocoding address:", err);
    }

    return null;
  }

  public async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    const cacheKey = `reverse_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
    const cached = this.cache.get<ReverseGeocodeResult>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/api/v1/geocode/reverse?latitud=${latitude}&longitud=${longitude}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const result: ReverseGeocodeResult = {
            address: item.address,
            streetName: item.nomVia,
            streetNumber: item.portalNumber ? String(item.portalNumber) : undefined,
            locality: item.localidad || "Montevideo",
            department: item.departamento || "Montevideo",
            postalCode: item.postalCode,
            precision: item.portalNumber ? "EXACT_ADDRESS" : "STREET",
            source: "ide_uy",
            latitude: item.lat || latitude,
            longitude: item.lng || longitude,
            raw: item,
          };
          this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn("[IDEUruguayProvider] Error in reverse geocoding:", err);
    }

    return null;
  }
}
