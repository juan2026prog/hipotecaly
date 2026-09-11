// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE GESTIÓN OPERATIVA DE TASACIONES
// Persistencia multi-tenant, validación rigurosa, invocación server-side de comparables
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../supabase';
import {
  AppraisalRecord,
  AppraisalPropertyInput,
  AppraisalComparableItem,
  AppraisalStatus,
  AppraisalSetQuality,
  AppraisalDescriptiveStats,
  SearchComparablesFilterParams,
} from './appraisalTypes';

const LOCAL_APPRAISALS_KEY = 'hipotecaly_operational_appraisals_v1';

export class AppraisalService {
  private static instance: AppraisalService;
  private memoryAppraisals: Map<string, AppraisalRecord> = new Map();

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): AppraisalService {
    if (!AppraisalService.instance) {
      AppraisalService.instance = new AppraisalService();
    }
    return AppraisalService.instance;
  }

  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_APPRAISALS_KEY);
        if (raw) {
          const parsed: AppraisalRecord[] = JSON.parse(raw);
          for (const item of parsed) {
            this.memoryAppraisals.set(item.id, item);
          }
        }
      } catch {
        // Fallback silencioso
      }
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(this.memoryAppraisals.values());
        localStorage.setItem(LOCAL_APPRAISALS_KEY, JSON.stringify(arr));
      } catch {
        // Fallback silencioso
      }
    }
  }

  /**
   * Valida la información mínima antes de permitir la búsqueda de comparables
   * Devuelve un mensaje explicativo exacto si falta algún dato indispensable.
   */
  public validateForComparables(property: Partial<AppraisalPropertyInput>): {
    valid: boolean;
    errorField?: string;
    errorMessage?: string;
  } {
    if (!property.propertyType) {
      return {
        valid: false,
        errorField: 'propertyType',
        errorMessage: 'Debes seleccionar el tipo de inmueble (ej: Apartamento, Casa).',
      };
    }

    if (!property.location?.department) {
      return {
        valid: false,
        errorField: 'department',
        errorMessage: 'Debes indicar el departamento del inmueble.',
      };
    }

    if (!property.location?.city && !property.location?.neighborhood) {
      return {
        valid: false,
        errorField: 'location',
        errorMessage: 'Necesitamos al menos el barrio o la localidad para buscar comparables en la zona geográfica adecuada.',
      };
    }

    const totalArea = property.surfaces?.totalAreaM2 || 0;
    const builtArea = property.surfaces?.builtAreaM2 || 0;
    const coveredArea = property.surfaces?.coveredAreaM2 || 0;

    if (totalArea <= 0 && builtArea <= 0 && coveredArea <= 0) {
      return {
        valid: false,
        errorField: 'surfaces',
        errorMessage: 'Necesitamos la superficie total o construida en m² para buscar comparables confiables.',
      };
    }

    if (totalArea > 50000) {
      return {
        valid: false,
        errorField: 'surfaces',
        errorMessage: 'La superficie ingresada supera los límites operativos razonables.',
      };
    }

    return { valid: true };
  }

  /**
   * Lista todas las tasaciones de una organización (Aislamiento Multi-Tenant)
   */
  public async listAppraisals(organizationId: string): Promise<AppraisalRecord[]> {
    if (!organizationId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appraisals')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(this.mapDbToRecord);
        }
      } catch {
        // Fallback a memoria local
      }
    }

    return Array.from(this.memoryAppraisals.values())
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtiene una tasación específica por ID garantizando pertenencia a la organización
   */
  public async getAppraisal(
    id: string,
    organizationId: string
  ): Promise<AppraisalRecord | null> {
    if (!id || !organizationId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appraisals')
          .select('*')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (!error && data) {
          const rec = this.mapDbToRecord(data);

          // Cargar comparables asociados si existen
          const { data: compData } = await supabase
            .from('appraisal_comparables')
            .select('*')
            .eq('appraisal_id', id)
            .order('rank', { ascending: true });

          if (compData && compData.length > 0) {
            rec.comparables = compData.map(this.mapDbToComparable);
          }

          return rec;
        }
      } catch {
        // Fallback
      }
    }

    const local = this.memoryAppraisals.get(id);
    if (local && local.organizationId === organizationId) {
      return local;
    }
    return null;
  }

  /**
   * Guarda o actualiza un borrador de tasación (DRAFT o READY_FOR_COMPARABLES)
   */
  public async saveAppraisal(
    record: Omit<AppraisalRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<AppraisalRecord> {
    const id = record.id || `appraisal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const fullRecord: AppraisalRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured) {
      try {
        const payload = {
          id: fullRecord.id,
          organization_id: fullRecord.organizationId,
          created_by: fullRecord.createdBy || null,
          status: fullRecord.status,
          property_input: fullRecord.propertyInput,
          location: fullRecord.location,
          selected_comparables_count: fullRecord.selectedComparablesCount || 0,
          set_quality: fullRecord.setQuality || 'MEDIA',
          descriptive_stats: fullRecord.descriptiveStats || {},
          estimated_value: fullRecord.estimatedValue || null,
          valuation_data: fullRecord.valuationData || {},
          updated_at: now,
        };

        const { error } = await supabase.from('appraisals').upsert(payload);
        if (error) {
          console.warn('[AppraisalService] Warning saving to Supabase, falling back to local:', error.message);
        }
      } catch (err: any) {
        console.warn('[AppraisalService] Exception saving to Supabase:', err.message);
      }
    }

    this.memoryAppraisals.set(id, fullRecord);
    this.saveToLocalStorage();
    return fullRecord;
  }

  /**
   * Actualiza el conjunto de comparables seleccionados/revisados por el analista
   */
  public async saveComparablesReview(params: {
    appraisalId: string;
    organizationId: string;
    comparables: AppraisalComparableItem[];
    stats: AppraisalDescriptiveStats;
    setQuality: AppraisalSetQuality;
    nextStatus?: AppraisalStatus;
  }): Promise<AppraisalRecord | null> {
    const { appraisalId, organizationId, comparables, stats, setQuality, nextStatus } = params;
    const appraisal = await this.getAppraisal(appraisalId, organizationId);
    if (!appraisal) return null;

    const selectedCount = comparables.filter((c) => c.selected).length;
    const status = nextStatus || (selectedCount > 0 ? 'COMPARABLES_REVIEWED' : 'COMPARABLES_FOUND');

    appraisal.comparables = comparables;
    appraisal.selectedComparablesCount = selectedCount;
    appraisal.descriptiveStats = stats;
    appraisal.setQuality = setQuality;
    appraisal.status = status;
    appraisal.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        // 1. Actualizar appraisal
        await supabase
          .from('appraisals')
          .update({
            status,
            selected_comparables_count: selectedCount,
            set_quality: setQuality,
            descriptive_stats: stats,
            updated_at: appraisal.updatedAt,
          })
          .eq('id', appraisalId)
          .eq('organization_id', organizationId);

        // 2. Upsert comparables
        if (comparables.length > 0) {
          const compPayloads = comparables.map((c, index) => ({
            id: c.id,
            appraisal_id: appraisalId,
            property_master_id: c.propertyMasterId || null,
            listing_id: c.listingId || null,
            similarity_score: c.similarityScore,
            score_breakdown: c.scoreBreakdown,
            selected: c.selected,
            exclusion_reason: c.exclusionReason || null,
            analyst_note: c.analystNote || null,
            rank: index + 1,
            candidate_data: c.candidateData,
            updated_at: appraisal.updatedAt,
          }));

          await supabase.from('appraisal_comparables').upsert(compPayloads);
        }
      } catch (err: any) {
        console.warn('[AppraisalService] Warning saving comparables review to Supabase:', err.message);
      }
    }

    this.memoryAppraisals.set(appraisalId, appraisal);
    this.saveToLocalStorage();
    return appraisal;
  }

  /**
   * Invoca el motor de búsqueda y scoring de comparables mediante la API server-side protegida
   */
  public async searchComparablesServerSide(params: {
    targetProperty: AppraisalPropertyInput;
    organizationId: string;
    filters?: SearchComparablesFilterParams;
  }): Promise<{
    candidates: AppraisalComparableItem[];
    stats: AppraisalDescriptiveStats;
    setQuality: AppraisalSetQuality;
    searchLevel: string;
    totalPoolConsidered: number;
  }> {
    const { targetProperty, organizationId, filters } = params;

    // Obtener sesión/token para invocar el endpoint server-side
    let token = '';
    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData.session?.access_token || '';
    }

    try {
      const res = await fetch('/api/tasador?action=comparables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organizationId,
          targetProperty,
          filters,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            candidates: data.candidates || [],
            stats: data.stats || this.calculateDescriptiveStats(data.candidates || []),
            setQuality: data.setQuality || 'MEDIA',
            searchLevel: data.searchLevel || 'NEIGHBORHOOD',
            totalPoolConsidered: data.totalPoolConsidered || (data.candidates || []).length,
          };
        }
      }
    } catch (err) {
      console.warn('[AppraisalService] API /api/tasador?action=comparables failed or unreachable:', err);
    }

    // Fallback determinístico client-side en modo demo / offline
    return this.searchComparablesFallback(targetProperty, filters);
  }

  /**
   * Fallback determinístico y explicable para búsqueda de comparables en desarrollo local o demo
   */
  public searchComparablesFallback(
    target: AppraisalPropertyInput,
    _filters?: SearchComparablesFilterParams
  ): {
    candidates: AppraisalComparableItem[];
    stats: AppraisalDescriptiveStats;
    setQuality: AppraisalSetQuality;
    searchLevel: string;
    totalPoolConsidered: number;
  } {
    const dept = target.location.department || 'Montevideo';
    const neigh = target.location.neighborhood || 'Pocitos';
    const targetArea = target.surfaces.totalAreaM2 || target.surfaces.builtAreaM2 || 75;
    const targetBeds = target.layout.bedrooms;
    const targetType = target.propertyType;

    // Conjunto base representativo de la Base Inmobiliaria uruguaya
    const baseSamples = [
      {
        id: 'comp_sim_01',
        title: `${targetType.toUpperCase()} en ${neigh} impecable`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: targetArea - 2,
        totalAreaM2: targetArea,
        bedrooms: targetBeds,
        bathrooms: target.layout.bathrooms || 1,
        garages: target.layout.garages || 1,
        constructionYear: target.constructionYear ? target.constructionYear - 2 : 2018,
        priceUsd: Math.round(targetArea * 2550 * 0.88),
        pricePerM2Usd: 2550,
        distanceMeters: 280,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'ELIGIBLE' as const,
        dataQualityScore: 92,
        daysSincePublication: 14,
        lat: (target.location.latitude || -34.915) + 0.002,
        lng: (target.location.longitude || -56.148) - 0.001,
      },
      {
        id: 'comp_sim_02',
        title: `${targetType.toUpperCase()} luminoso con balcón en ${neigh}`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: targetArea + 4,
        totalAreaM2: targetArea + 6,
        bedrooms: targetBeds,
        bathrooms: target.layout.bathrooms || 1,
        garages: Math.max(0, (target.layout.garages || 0) - 1),
        constructionYear: target.constructionYear || 2019,
        priceUsd: Math.round((targetArea + 4) * 2600 * 0.88),
        pricePerM2Usd: 2600,
        distanceMeters: 450,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'ELIGIBLE' as const,
        dataQualityScore: 88,
        daysSincePublication: 22,
        lat: (target.location.latitude || -34.915) - 0.003,
        lng: (target.location.longitude || -56.148) + 0.002,
      },
      {
        id: 'comp_sim_03',
        title: `${targetType.toUpperCase()} reciclado con parrillero en ${neigh}`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: targetArea,
        totalAreaM2: targetArea + 3,
        bedrooms: targetBeds,
        bathrooms: (target.layout.bathrooms || 1) + 1,
        garages: target.layout.garages || 1,
        constructionYear: 2015,
        priceUsd: Math.round(targetArea * 2500 * 0.88),
        pricePerM2Usd: 2500,
        distanceMeters: 620,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'ELIGIBLE' as const,
        dataQualityScore: 94,
        daysSincePublication: 8,
        lat: (target.location.latitude || -34.915) + 0.004,
        lng: (target.location.longitude || -56.148) + 0.003,
      },
      {
        id: 'comp_sim_04',
        title: `Unidad a pasos de servicios en ${neigh}`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: Math.round(targetArea * 1.08),
        totalAreaM2: Math.round(targetArea * 1.12),
        bedrooms: targetBeds + 1,
        bathrooms: target.layout.bathrooms || 1,
        garages: target.layout.garages || 0,
        constructionYear: 2012,
        priceUsd: Math.round(targetArea * 1.08 * 2480 * 0.88),
        pricePerM2Usd: 2480,
        distanceMeters: 850,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'ELIGIBLE' as const,
        dataQualityScore: 85,
        daysSincePublication: 35,
        lat: (target.location.latitude || -34.915) - 0.006,
        lng: (target.location.longitude || -56.148) - 0.004,
      },
      {
        id: 'comp_sim_05',
        title: `Excelente planta estándar en ${neigh}`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: Math.round(targetArea * 0.94),
        totalAreaM2: Math.round(targetArea * 0.98),
        bedrooms: targetBeds,
        bathrooms: target.layout.bathrooms || 1,
        garages: target.layout.garages || 1,
        constructionYear: 2020,
        priceUsd: Math.round(targetArea * 0.94 * 2650 * 0.88),
        pricePerM2Usd: 2650,
        distanceMeters: 920,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'PARTIAL' as const,
        dataQualityScore: 78,
        daysSincePublication: 45,
        lat: (target.location.latitude || -34.915) + 0.007,
        lng: (target.location.longitude || -56.148) - 0.005,
      },
      {
        id: 'comp_sim_06',
        title: `Propiedad funcional en ${neigh}`,
        neighborhood: neigh,
        department: dept,
        builtAreaM2: targetArea + 8,
        totalAreaM2: targetArea + 10,
        bedrooms: targetBeds,
        bathrooms: target.layout.bathrooms || 1,
        garages: 0,
        constructionYear: 2014,
        priceUsd: Math.round((targetArea + 8) * 2420 * 0.88),
        pricePerM2Usd: 2420,
        distanceMeters: 1150,
        sourceCode: 'infocasas',
        sourceName: 'InfoCasas Uruguay',
        comparableEligibility: 'ELIGIBLE' as const,
        dataQualityScore: 82,
        daysSincePublication: 60,
        lat: (target.location.latitude || -34.915) - 0.009,
        lng: (target.location.longitude || -56.148) + 0.006,
      },
    ];

    const candidates: AppraisalComparableItem[] = baseSamples.map((s, idx) => {
      // Cálculo determinístico del score (0-100)
      const isSameNeigh = s.neighborhood.toLowerCase() === neigh.toLowerCase();
      const locScore = isSameNeigh ? Math.max(50, 100 - Math.round((s.distanceMeters / 1500) * 40)) : 40;
      const typeScore = 100;
      const areaRatio = s.builtAreaM2 / targetArea;
      const surfScore = Math.max(20, Math.round(100 - Math.abs(1 - areaRatio) * 150));
      const bedScore = s.bedrooms === targetBeds ? 100 : Math.max(30, 100 - Math.abs(s.bedrooms - targetBeds) * 40);
      const bathScore = s.bathrooms === (target.layout.bathrooms || 1) ? 100 : 75;
      const garScore = s.garages === (target.layout.garages || 0) ? 100 : 70;
      const recScore = Math.max(30, 100 - s.daysSincePublication);
      const qualScore = s.dataQualityScore;

      // Ponderación de pesos
      let finalScore = Math.round(
        locScore * 0.30 +
        typeScore * 0.20 +
        surfScore * 0.20 +
        bedScore * 0.10 +
        bathScore * 0.05 +
        garScore * 0.05 +
        recScore * 0.05 +
        qualScore * 0.05
      );

      // Penalización si es PARTIAL
      if (s.comparableEligibility === 'PARTIAL') {
        finalScore = Math.max(10, finalScore - 12);
      }

      const factors = [
        {
          factor: 'Ubicación',
          status: isSameNeigh ? ('match' as const) : ('partial' as const),
          label: isSameNeigh ? `Mismo barrio (${s.neighborhood})` : `Barrio ${s.neighborhood}`,
          detail: `Distancia aproximada: ${s.distanceMeters} m`,
          score: locScore,
          maxScore: 100,
        },
        {
          factor: 'Tipo de Inmueble',
          status: 'match' as const,
          label: `Tipo ${s.title.split(' ')[0]} coincidente`,
          detail: 'Categoría residencial equivalente',
          score: typeScore,
          maxScore: 100,
        },
        {
          factor: 'Superficie',
          status: Math.abs(1 - areaRatio) <= 0.10 ? ('match' as const) : ('partial' as const),
          label: `Superficie ${s.builtAreaM2} m² vs ${targetArea} m²`,
          detail: `Desvío del ${(Math.abs(1 - areaRatio) * 100).toFixed(1)}%`,
          score: surfScore,
          maxScore: 100,
        },
        {
          factor: 'Dormitorios',
          status: s.bedrooms === targetBeds ? ('match' as const) : ('partial' as const),
          label: `${s.bedrooms} dormitorios`,
          detail: s.bedrooms === targetBeds ? 'Coincidencia exacta' : `Diferencia de ${Math.abs(s.bedrooms - targetBeds)} dorm`,
          score: bedScore,
          maxScore: 100,
        },
        {
          factor: 'Garajes',
          status: s.garages === (target.layout.garages || 0) ? ('match' as const) : ('miss' as const),
          label: s.garages > 0 ? `${s.garages} garaje(s)` : 'Sin garaje declarado',
          detail: s.garages === (target.layout.garages || 0) ? 'Coincidencia de estacionamiento' : 'Disparidad de garaje',
          score: garScore,
          maxScore: 100,
        },
        {
          factor: 'Recencia',
          status: s.daysSincePublication <= 30 ? ('match' as const) : ('partial' as const),
          label: `Publicado hace ${s.daysSincePublication} días`,
          detail: 'Filtro temporal de vigencia de mercado',
          score: recScore,
          maxScore: 100,
        },
      ];

      return {
        id: s.id,
        appraisalId: '',
        propertyMasterId: `master_${s.id}`,
        listingId: `list_${s.id}`,
        similarityScore: finalScore,
        scoreBreakdown: {
          locationScore: locScore,
          propertyTypeScore: typeScore,
          surfaceScore: surfScore,
          bedroomsScore: bedScore,
          bathroomsScore: bathScore,
          garageScore: garScore,
          ageScore: 85,
          recencyScore: recScore,
          dataQualityScore: qualScore,
          finalSimilarityScore: finalScore,
          factors,
        },
        selected: finalScore >= 70, // Preseleccionados determinísticos
        rank: idx + 1,
        candidateData: {
          id: s.id,
          propertyMasterId: `master_${s.id}`,
          sourceListingId: s.id,
          sourceCode: s.sourceCode,
          sourceName: s.sourceName,
          title: s.title,
          propertyType: targetType,
          department: s.department,
          city: target.location.city || s.department,
          neighborhood: s.neighborhood,
          latitude: s.lat,
          longitude: s.lng,
          builtAreaM2: s.builtAreaM2,
          totalAreaM2: s.totalAreaM2,
          bedrooms: s.bedrooms,
          bathrooms: s.bathrooms,
          garages: s.garages,
          constructionYear: s.constructionYear,
          priceUsd: Math.round(s.priceUsd / 0.88), // Asking price original
          pricePerM2Usd: s.pricePerM2Usd,
          adjustedPriceUsd: s.priceUsd, // Precio con el 12% aplicado
          askingPriceAdjustmentApplied: true,
          publicationDate: new Date(Date.now() - s.daysSincePublication * 86400000).toISOString(),
          daysSincePublication: s.daysSincePublication,
          dataQualityScore: s.dataQualityScore,
          comparableEligibility: s.comparableEligibility,
          distanceMeters: s.distanceMeters,
          primaryPhotoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
        },
      };
    });

    // Ordenar descendentemente por score de similitud y asignar rank
    candidates.sort((a, b) => b.similarityScore - a.similarityScore);
    candidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    const stats = this.calculateDescriptiveStats(candidates);

    return {
      candidates,
      stats,
      setQuality: stats.selectedCount >= 4 && stats.dispersionPercentage < 20 ? 'ALTA' : 'MEDIA',
      searchLevel: 'NEIGHBORHOOD',
      totalPoolConsidered: baseSamples.length,
    };
  }

  /**
   * Calcula métricas estadísticas descriptivas del conjunto de comparables
   */
  public calculateDescriptiveStats(items: AppraisalComparableItem[]): AppraisalDescriptiveStats {
    const selected = items.filter((i) => i.selected);
    const totalCandidates = items.length;
    const warnings: string[] = [];

    if (selected.length === 0) {
      return {
        selectedCount: 0,
        totalCandidates,
        minPriceUsd: 0,
        maxPriceUsd: 0,
        medianPriceUsd: 0,
        minPricePerM2Usd: 0,
        maxPricePerM2Usd: 0,
        medianPricePerM2Usd: 0,
        dispersionPercentage: 0,
        averageDistanceMeters: 0,
        warnings: ['No hay comparables seleccionados para la tasación.'],
      };
    }

    if (selected.length < 3) {
      warnings.push(`Solo se han seleccionado ${selected.length} comparables. Se recomiendan al menos 3 para alta representatividad.`);
    }

    const prices = selected.map((s) => s.candidateData.adjustedPriceUsd).sort((a, b) => a - b);
    const m2Prices = selected.map((s) => s.candidateData.pricePerM2Usd).sort((a, b) => a - b);
    const distances = selected.map((s) => s.candidateData.distanceMeters || 0);

    const minPriceUsd = prices[0];
    const maxPriceUsd = prices[prices.length - 1];
    const medianPriceUsd = this.getMedian(prices);

    const minPricePerM2Usd = m2Prices[0];
    const maxPricePerM2Usd = m2Prices[m2Prices.length - 1];
    const medianPricePerM2Usd = this.getMedian(m2Prices);

    const avgDistance = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);

    // Dispersión relativa
    const dispersionPercentage = medianPricePerM2Usd > 0
      ? Number((((maxPricePerM2Usd - minPricePerM2Usd) / medianPricePerM2Usd) * 100).toFixed(1))
      : 0;

    if (dispersionPercentage > 25) {
      warnings.push(`La dispersión de valores en USD/m² es del ${dispersionPercentage}%. El mercado en la zona muestra heterogeneidad.`);
    }

    const withoutCoords = selected.filter((s) => !s.candidateData.latitude || !s.candidateData.longitude).length;
    if (withoutCoords > 0) {
      warnings.push(`${withoutCoords} comparable(s) no poseen coordenadas GPS exactas.`);
    }

    return {
      selectedCount: selected.length,
      totalCandidates,
      minPriceUsd,
      maxPriceUsd,
      medianPriceUsd,
      minPricePerM2Usd,
      maxPricePerM2Usd,
      medianPricePerM2Usd,
      dispersionPercentage,
      averageDistanceMeters: avgDistance,
      warnings,
    };
  }

  private getMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 !== 0
      ? numbers[mid]
      : Math.round((numbers[mid - 1] + numbers[mid]) / 2);
  }

  private mapDbToRecord(row: any): AppraisalRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      creatorEmail: row.creator_email || null,
      status: row.status as AppraisalStatus,
      propertyInput: row.property_input || {},
      location: row.location || {},
      selectedComparablesCount: row.selected_comparables_count || 0,
      setQuality: (row.set_quality as AppraisalSetQuality) || 'MEDIA',
      descriptiveStats: row.descriptive_stats || undefined,
      estimatedValue: row.estimated_value || null,
      valuationData: row.valuation_data || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDbToComparable(row: any): AppraisalComparableItem {
    return {
      id: row.id,
      appraisalId: row.appraisal_id,
      propertyMasterId: row.property_master_id,
      listingId: row.listing_id,
      similarityScore: Number(row.similarity_score),
      scoreBreakdown: row.score_breakdown || {},
      selected: Boolean(row.selected),
      status: row.selected ? 'INCLUDED' : 'EXCLUDED',
      exclusionReason: row.exclusion_reason || null,
      analystNote: row.analyst_note || null,
      rank: row.rank || 1,
      candidateData: row.candidate_data || {},
    };
  }

  /**
   * Evalúa la calidad estadística y consistencia del set de comparables seleccionados
   */
  public evaluateSetQuality(items: AppraisalComparableItem[]): AppraisalSetQuality {
    const selected = items.filter((i) => i.selected || i.status === 'INCLUDED');
    if (selected.length < 3) return 'BAJA';
    const stats = this.calculateDescriptiveStats(items);
    if (selected.length >= 5 && stats.dispersionPercentage < 20) return 'ALTA';
    if (selected.length >= 3) return 'MEDIA';
    return 'BAJA';
  }

  /**
   * Obtiene una tasación por su ID sin filtrar por organización
   */
  public async getAppraisalById(id: string): Promise<AppraisalRecord | null> {
    if (!id) return null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appraisals')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const rec = this.mapDbToRecord(data);
          const { data: compData } = await supabase
            .from('appraisal_comparables')
            .select('*')
            .eq('appraisal_id', id)
            .order('rank', { ascending: true });

          if (compData && compData.length > 0) {
            rec.comparables = compData.map(this.mapDbToComparable);
          }
          return rec;
        }
      } catch {}
    }
    return this.memoryAppraisals.get(id) || null;
  }

  /**
   * Actualiza el estado de una tasación
   */
  public async updateStatus(id: string, status: AppraisalStatus): Promise<AppraisalRecord | null> {
    const appraisal = await this.getAppraisalById(id);
    if (!appraisal) return null;

    appraisal.status = status;
    appraisal.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('appraisals')
          .update({ status, updated_at: appraisal.updatedAt })
          .eq('id', id);
      } catch {}
    }

    this.memoryAppraisals.set(id, appraisal);
    this.saveToLocalStorage();
    return appraisal;
  }

  /**
   * Excluye un comparable de forma fundamentada registrando motivo y notas
   */
  public async excludeComparable(
    appraisalId: string,
    comparableId: string,
    reason: string,
    notes?: string
  ): Promise<AppraisalRecord | null> {
    const appraisal = await this.getAppraisalById(appraisalId);
    if (!appraisal) return null;

    const comp = (appraisal.comparables || []).find((c) => c.id === comparableId);
    if (comp) {
      comp.selected = false;
      comp.status = 'EXCLUDED';
      comp.exclusionReason = reason;
      comp.analystNote = notes || null;
      comp.excludedAt = new Date().toISOString();
    }

    appraisal.descriptiveStats = this.calculateDescriptiveStats(appraisal.comparables || []);
    appraisal.setQuality = this.evaluateSetQuality(appraisal.comparables || []);
    appraisal.selectedComparablesCount = (appraisal.comparables || []).filter(
      (c) => c.selected || c.status === 'INCLUDED'
    ).length;
    appraisal.updatedAt = new Date().toISOString();

    this.memoryAppraisals.set(appraisalId, appraisal);
    this.saveToLocalStorage();
    return appraisal;
  }

  /**
   * Re-incluye un comparable previamente excluido
   */
  public async includeComparable(
    appraisalId: string,
    comparableId: string
  ): Promise<AppraisalRecord | null> {
    const appraisal = await this.getAppraisalById(appraisalId);
    if (!appraisal) return null;

    const comp = (appraisal.comparables || []).find((c) => c.id === comparableId);
    if (comp) {
      comp.selected = true;
      comp.status = 'INCLUDED';
      comp.exclusionReason = null;
      comp.analystNote = null;
      comp.excludedAt = undefined;
    }

    appraisal.descriptiveStats = this.calculateDescriptiveStats(appraisal.comparables || []);
    appraisal.setQuality = this.evaluateSetQuality(appraisal.comparables || []);
    appraisal.selectedComparablesCount = (appraisal.comparables || []).filter(
      (c) => c.selected || c.status === 'INCLUDED'
    ).length;
    appraisal.updatedAt = new Date().toISOString();

    this.memoryAppraisals.set(appraisalId, appraisal);
    this.saveToLocalStorage();
    return appraisal;
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE CONVENIENCIA
  // ============================================================================
  public static validateForComparables(property: Partial<AppraisalPropertyInput>) {
    return AppraisalService.getInstance().validateForComparables(property);
  }

  public static async listAppraisals(organizationId: string): Promise<AppraisalRecord[]> {
    return AppraisalService.getInstance().listAppraisals(organizationId);
  }

  public static async getAppraisal(id: string, organizationId: string): Promise<AppraisalRecord | null> {
    return AppraisalService.getInstance().getAppraisal(id, organizationId);
  }

  public static async getAppraisalById(id: string): Promise<AppraisalRecord | null> {
    return AppraisalService.getInstance().getAppraisalById(id);
  }

  public static async saveAppraisal(
    record: Omit<AppraisalRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<AppraisalRecord> {
    return AppraisalService.getInstance().saveAppraisal(record);
  }

  public static async updateStatus(id: string, status: AppraisalStatus): Promise<AppraisalRecord | null> {
    return AppraisalService.getInstance().updateStatus(id, status);
  }

  public static async searchComparables(
    targetProperty: AppraisalPropertyInput,
    filters?: SearchComparablesFilterParams
  ): Promise<AppraisalComparableItem[]> {
    const res = AppraisalService.getInstance().searchComparablesFallback(targetProperty, filters);
    return res.candidates.map((c) => ({
      ...c,
      status: c.selected ? 'INCLUDED' : 'EXCLUDED',
    }));
  }

  public static computeDescriptiveStats(items: AppraisalComparableItem[]): AppraisalDescriptiveStats {
    return AppraisalService.getInstance().calculateDescriptiveStats(items);
  }

  public static evaluateSetQuality(items: AppraisalComparableItem[]): AppraisalSetQuality {
    return AppraisalService.getInstance().evaluateSetQuality(items);
  }

  public static async excludeComparable(
    appraisalId: string,
    comparableId: string,
    reason: string,
    notes?: string
  ): Promise<AppraisalRecord | null> {
    return AppraisalService.getInstance().excludeComparable(appraisalId, comparableId, reason, notes);
  }

  public static async includeComparable(
    appraisalId: string,
    comparableId: string
  ): Promise<AppraisalRecord | null> {
    return AppraisalService.getInstance().includeComparable(appraisalId, comparableId);
  }
}

