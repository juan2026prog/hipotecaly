// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE VINCULACIÓN DE PROPIEDADES A EXPEDIENTES
// Resolución inteligente de colaterales, aislamiento multi-organización y RLS
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../supabase';
import { PropertyMasterResolver, PropertyMasterEntity } from '../master/PropertyMasterResolver';
import {
  CasePropertyLink,
  CasePropertyMatchInput,
  CasePropertyMatchResult,
} from './casePropertyTypes';

export class CasePropertyLinkService {
  private static instance: CasePropertyLinkService;

  // Repositorio en memoria aislado por organization_id y case_id
  public links: Map<string, CasePropertyLink> = new Map();

  private constructor() {}

  public static getInstance(): CasePropertyLinkService {
    if (!CasePropertyLinkService.instance) {
      CasePropertyLinkService.instance = new CasePropertyLinkService();
    }
    return CasePropertyLinkService.instance;
  }

  /**
   * Resuelve y vincula una propiedad a un expediente garantizando aislamiento multi-organización
   */
  public async linkPropertyToCase(
    input: CasePropertyMatchInput
  ): Promise<CasePropertyMatchResult> {
    const masterResolver = PropertyMasterResolver.getInstance();
    const existingMasters = Array.from(masterResolver.masters.values());

    let matchedMaster: PropertyMasterEntity | null = null;
    let matchType: 'EXACT_CADASTRAL' | 'EXACT_ADDRESS' | 'GEO_PROXIMITY' | 'PROVISIONAL_CREATED' | 'UNRESOLVED' = 'UNRESOLVED';
    let confidenceScore = 0;
    let details = '';

    const cleanCadastral = input.cadastralNumber ? input.cadastralNumber.trim().toLowerCase() : null;
    const cleanDept = input.department ? input.department.trim().toLowerCase() : 'montevideo';
    const cleanAddress = input.address ? input.address.trim().toLowerCase() : '';

    // 1. Coincidencia por Padrón Catastral + Departamento
    if (cleanCadastral) {
      matchedMaster = existingMasters.find(
        (m) =>
          m.cadastralNumber &&
          m.cadastralNumber.trim().toLowerCase() === cleanCadastral &&
          m.department.trim().toLowerCase() === cleanDept
      ) || null;

      if (matchedMaster) {
        matchType = 'EXACT_CADASTRAL';
        confidenceScore = 98.0;
        details = `Coincidencia exacta por Padrón Catastral ${cleanCadastral} en ${input.department}.`;
      }
    }

    // 2. Coincidencia por Dirección Normalizada
    if (!matchedMaster && cleanAddress.length > 5) {
      matchedMaster = existingMasters.find((m) => {
        const masterAddr = (m.canonicalAddress || m.normalizedAddress || '').toLowerCase();
        const sameDept = m.department.trim().toLowerCase() === cleanDept;
        return sameDept && (masterAddr.includes(cleanAddress) || cleanAddress.includes(masterAddr));
      }) || null;

      if (matchedMaster) {
        matchType = 'EXACT_ADDRESS';
        confidenceScore = 88.0;
        details = `Coincidencia por dirección aproximada "${matchedMaster.canonicalAddress}".`;
      }
    }

    // 3. Coincidencia por Proximidad Geográfica (< 100 metros)
    if (!matchedMaster && input.latitude && input.longitude) {
      for (const master of existingMasters) {
        if (master.latitude && master.longitude) {
          const distMeters = this.calculateDistanceMeters(
            input.latitude,
            input.longitude,
            master.latitude,
            master.longitude
          );
          if (distMeters <= 100) {
            matchedMaster = master;
            matchType = 'GEO_PROXIMITY';
            confidenceScore = 78.0;
            details = `Coincidencia por cercanía geográfica (${Math.round(distMeters)}m) con ${master.canonicalAddress}.`;
            break;
          }
        }
      }
    }

    // 4. Si no coincide con ninguno existente, crear PropertyMaster Provisional
    if (!matchedMaster) {
      const provisionalId = `master-prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const provisionalMaster: PropertyMasterEntity = {
        id: provisionalId,
        canonicalAddress: input.address || `${input.streetName || 'Calle'} ${input.streetNumber || 'S/N'}`,
        normalizedAddress: input.address || `${input.streetName || 'Calle'} ${input.streetNumber || 'S/N'}`,
        department: input.department || 'Montevideo',
        city: input.locality || input.department || 'Montevideo',
        neighborhood: input.locality || 'Centro',
        latitude: input.latitude || -34.9011,
        longitude: input.longitude || -56.1645,
        propertyType: (input.propertyType as any) || 'APARTMENT',
        coveredSurfaceM2: input.coveredSurfaceM2 || 60,
        uncoveredSurfaceM2: 0,
        totalAreaM2: input.totalSurfaceM2 || input.coveredSurfaceM2 || 60,
        builtAreaM2: input.coveredSurfaceM2 || 60,
        bedrooms: input.bedrooms || 1,
        bathrooms: input.bathrooms || 1,
        garages: input.garages || 0,
        constructionYear: input.yearBuilt || 2010,
        cadastralNumber: input.cadastralNumber || undefined,
        canonicalStatus: 'ACTIVE',
        dataQualityScore: 70,
        countryCode: 'UY',
        locationPrecision: 'EXACT',
        amenities: {},
        dedupHash: `dedup_${provisionalId}`,
        dedupConfidence: 100,
        listingIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      masterResolver.masterStore.set(provisionalId, provisionalMaster);
      matchedMaster = provisionalMaster;
      matchType = 'PROVISIONAL_CREATED';
      confidenceScore = 65.0;
      details = 'Se creó un registro de Inmueble Maestro Provisional a partir de los datos del expediente.';
    }

    const resolutionStatus =
      confidenceScore >= 85 ? 'MATCHED' : confidenceScore >= 60 ? 'PROVISIONAL' : 'REVIEW_REQUIRED';

    const linkId = `link-${input.caseId}-${matchedMaster.id}`;
    const newLink: CasePropertyLink = {
      id: linkId,
      organizationId: input.organizationId,
      caseId: input.caseId,
      propertyMasterId: matchedMaster.id,
      relationshipType: 'PRIMARY_COLLATERAL',
      isPrimaryCollateral: true,
      resolutionStatus,
      resolutionScore: confidenceScore,
      resolutionNotes: details,
      provisionalData: input,
      linkedBy: input.userId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.links.set(linkId, newLink);

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured) {
      try {
        await supabase.from('case_property_links').upsert({
          id: linkId.startsWith('link-') && linkId.length === 36 ? linkId : undefined,
          organization_id: input.organizationId,
          case_id: input.caseId,
          property_master_id: matchedMaster.id.startsWith('master-') && matchedMaster.id.length === 36 ? matchedMaster.id : null,
          relationship_type: 'PRIMARY_COLLATERAL',
          is_primary_collateral: true,
          resolution_status: resolutionStatus,
          resolution_score: confidenceScore,
          resolution_notes: details,
          provisional_data: input,
          linked_by: input.userId || null,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Persistencia en Supabase de case_property_links omitida:', err);
      }
    }

    return {
      link: newLink,
      matchedMasterId: matchedMaster.id,
      confidenceScore,
      matchType,
      details,
    };
  }

  /**
   * Obtiene los colaterales vinculados a un expediente filtrados por organización
   */
  public getCaseCollaterals(caseId: string, organizationId: string): CasePropertyLink[] {
    return Array.from(this.links.values()).filter(
      (l) => l.caseId === caseId && l.organizationId === organizationId
    );
  }

  /**
   * Obtiene un link específico validando la organización
   */
  public getCollateralById(linkId: string, organizationId: string): CasePropertyLink | null {
    const link = this.links.get(linkId);
    if (!link || link.organizationId !== organizationId) return null;
    return link;
  }

  /**
   * Establece un inmueble como colateral principal del expediente
   */
  public setPrimaryCollateral(linkId: string, caseId: string, organizationId: string): boolean {
    const targetLink = this.getCollateralById(linkId, organizationId);
    if (!targetLink || targetLink.caseId !== caseId) return false;

    // Desmarcar los otros colaterales del mismo caso
    for (const link of this.links.values()) {
      if (link.caseId === caseId && link.organizationId === organizationId) {
        link.isPrimaryCollateral = link.id === linkId;
        link.updatedAt = new Date().toISOString();
      }
    }

    return true;
  }

  /**
   * Desvincula un inmueble de un expediente
   */
  public unlinkProperty(linkId: string, organizationId: string): boolean {
    const link = this.getCollateralById(linkId, organizationId);
    if (!link) return false;

    this.links.delete(linkId);
    return true;
  }

  /**
   * Calcula distancia en metros mediante fórmula de Haversine
   */
  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
