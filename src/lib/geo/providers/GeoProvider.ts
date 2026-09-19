// ==============================================================================
// HIPOTECALY GEOCORE - INTERFAZ DE PROVEEDOR GEOGRÁFICO
// ==============================================================================

import {
  Department,
  Locality,
  StreetSuggestion,
  AddressCandidate,
  ReverseGeocodeResult,
  CanonicalGeoAddress,
} from "../types";

export interface GeoProvider {
  name: string;
  getDepartments(): Promise<Department[]>;
  getLocalities(department: string): Promise<Locality[]>;
  searchStreet(query: string, department?: string, locality?: string): Promise<StreetSuggestion[]>;
  searchAddressCandidates(query: string, limit?: number): Promise<AddressCandidate[]>;
  geocodeAddress(address: Partial<CanonicalGeoAddress>): Promise<AddressCandidate | null>;
  reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null>;
}
