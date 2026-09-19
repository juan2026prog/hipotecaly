// ==============================================================================
// HIPOTECALY GEOCORE - TIPOS Y MODELO GEOGRÁFICO CANÓNICO
// ==============================================================================

export type LocationPrecision =
  | "EXACT_ADDRESS"
  | "STREET_NUMBER"
  | "STREET"
  | "NEIGHBORHOOD"
  | "LOCALITY"
  | "DEPARTMENT"
  | "UNKNOWN";

export type GeoSource = "ide_uy" | "manual" | "osm" | "catastro" | "inferred";

export type CadastralStatus = "confirmed" | "candidate" | "unknown";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Department {
  id: number | string;
  name: string;
  canonicalName: string;
  code?: string;
}

export interface Locality {
  id: number | string;
  name: string;
  canonicalName: string;
  departmentId: number | string;
  departmentName: string;
  postalCode?: string | number | null;
}

export interface Neighborhood {
  id: string;
  name: string;
  department: string;
  locality?: string;
}

export interface StreetSuggestion {
  idCalle: number;
  calle: string;
  departamento: string;
  localidad: string;
  idLocalidad?: number;
}

export interface AddressCandidate {
  id: string;
  fullAddress: string;
  streetName?: string;
  portalNumber?: number | string | null;
  department?: string;
  locality?: string;
  neighborhood?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  precision: LocationPrecision;
  source: GeoSource;
  officialAddressId?: string | number | null;
  raw?: Record<string, any>;
}

export interface CanonicalGeoAddress {
  country: string;
  countryCode: string;
  department: string;
  departmentId?: string | number | null;
  locality: string;
  localityId?: string | number | null;
  neighborhood: string;
  neighborhoodId?: string | null;
  streetName: string;
  streetId?: string | number | null;
  streetNumber: string;
  unitOrApt?: string;
  floor?: string;
  postalCode?: string | null;
  cadastralNumber?: string | null;
  cadastralStatus?: CadastralStatus;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  precision: LocationPrecision;
  source: GeoSource;
  verified: boolean;
  verifiedAt?: string | null;
  officialAddressId?: string | number | null;
}

export interface ReverseGeocodeResult {
  address: string;
  streetName?: string;
  streetNumber?: string;
  neighborhood?: string;
  locality: string;
  department: string;
  postalCode?: string;
  precision: LocationPrecision;
  source: GeoSource;
  latitude: number;
  longitude: number;
  raw?: any;
}
