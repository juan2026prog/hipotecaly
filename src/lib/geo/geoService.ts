// ==============================================================================
// HIPOTECALY GEOCORE - SERVICIO ORQUESTADOR CENTRAL (GeoService)
// ==============================================================================

import { GeoProvider } from "./providers/GeoProvider";
import { IDEUruguayProvider } from "./providers/IDEUruguayProvider";
import {
  Department,
  Locality,
  StreetSuggestion,
  AddressCandidate,
  ReverseGeocodeResult,
  CanonicalGeoAddress,
} from "./types";
import { formatUruguayAddress, normalizeDepartmentName } from "./normalization";
import { calculateHaversineDistanceMeters, isWithinRadius } from "./distance";
import { getPrecisionDescriptor } from "./precision";

export class GeoService {
  private static instance: GeoService;
  private provider: GeoProvider;

  private constructor() {
    this.provider = new IDEUruguayProvider();
  }

  public static getInstance(): GeoService {
    if (!GeoService.instance) {
      GeoService.instance = new GeoService();
    }
    return GeoService.instance;
  }

  public setProvider(provider: GeoProvider): void {
    this.provider = provider;
  }

  public async getDepartments(): Promise<Department[]> {
    return this.provider.getDepartments();
  }

  public async getLocalities(departmentName: string): Promise<Locality[]> {
    return this.provider.getLocalities(departmentName);
  }

  public async searchStreet(
    query: string,
    department: string = "Montevideo",
    locality?: string
  ): Promise<StreetSuggestion[]> {
    return this.provider.searchStreet(query, department, locality);
  }

  public async searchAddressCandidates(query: string, limit?: number): Promise<AddressCandidate[]> {
    return this.provider.searchAddressCandidates(query, limit);
  }

  public async geocodeAddress(addr: Partial<CanonicalGeoAddress>): Promise<AddressCandidate | null> {
    return this.provider.geocodeAddress(addr);
  }

  public async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    return this.provider.reverseGeocode(latitude, longitude);
  }

  public formatAddress(addr: Partial<CanonicalGeoAddress>): string {
    return formatUruguayAddress(addr);
  }

  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);
  }

  public isWithin(
    origin: { latitude: number; longitude: number },
    target: { latitude: number; longitude: number },
    radiusMeters: number
  ): boolean {
    return isWithinRadius(origin, target, radiusMeters);
  }

  public normalizeDepartment(raw?: string | null): Department {
    return normalizeDepartmentName(raw);
  }

  public getPrecisionInfo(level?: any) {
    return getPrecisionDescriptor(level);
  }
}
