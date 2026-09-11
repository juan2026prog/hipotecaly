// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR Y AUDITORÍA CATASTRAL URUGUAY
// Dirección Nacional de Catastro (DNC / MEF) & IDEuy (Infraestructura de Datos Espaciales)
// Estado Oficial: NOT_CONNECTED (Sin datos sintéticos simulados)
// ==============================================================================

export type CadastralConnectionStatus =
  | 'CONNECTED'
  | 'NOT_CONNECTED'
  | 'REQUIRES_INTERINSTITUTIONAL_AGREEMENT'
  | 'PENDING_AUTHORIZATION';

export interface CadastralAuditReport {
  status: CadastralConnectionStatus;
  officialEntity: string;
  publicVisualizerUrl: string;
  wfsServiceUrl?: string | null;
  directApiAvailable: boolean;
  legalAndTechnicalSummary: string;
  dataPointsReadyForIngestion: string[];
  requiredAuthorizationForLiveSync: string;
  simulatedDataAllowed: boolean;
  auditedAt: string;
}

export interface OfficialCadastralRecord {
  cadastralNumber: string; // Padrón
  department: string;
  locality?: string | null;
  horizontalPropertyUnit?: string | null;
  landAreaM2?: number | null;
  builtAreaM2?: number | null;
  officialAddress?: string | null;
  source: string;
  sourceUpdatedAt?: string | null;
  retrievedAt: string;
  rawPayload?: Record<string, unknown>;
}

export class CadastralAdapter {
  private static instance: CadastralAdapter;

  public static getInstance(): CadastralAdapter {
    if (!CadastralAdapter.instance) {
      CadastralAdapter.instance = new CadastralAdapter();
    }
    return CadastralAdapter.instance;
  }

  /**
   * Informe de Auditoría Oficial del Catastro Uruguayo
   */
  public getAuditReport(): CadastralAuditReport {
    return {
      status: 'NOT_CONNECTED',
      officialEntity: 'Dirección Nacional de Catastro (MEF) / IDE Uruguay (AGESIC)',
      publicVisualizerUrl: 'https://visualizador.ide.uy/ideuy/core/load_public_project/ideuy/',
      wfsServiceUrl: 'https://geoservicios.dinarp.gub.uy/geoserver/wfs',
      directApiAvailable: false,
      legalAndTechnicalSummary:
        'La Dirección Nacional de Catastro publica visualizadores geoespaciales públicos pero no provee una REST API pública abierta y sin autenticación para consulta transaccional masiva de cédulas catastrales individuales. Los servicios WFS/WMS institucionales requieren convenio formal de interoperabilidad con AGESIC / SGM.',
      dataPointsReadyForIngestion: [
        'Padrón Matriz / Padrón Urbano / Padrón Rural',
        'Unidad de Propiedad Horizontal (PH)',
        'Sección y Manzana Catastral',
        'Superficie de Terreno y Área Edificada Oficial',
        'Alineación y Código Postal Oficial',
      ],
      requiredAuthorizationForLiveSync:
        'Convenio de Interoperabilidad con AGESIC (Plataforma de Interoperabilidad del Estado - PDI) o credenciales autorizadas del Sistema Geográfico Catastral de la DNC.',
      simulatedDataAllowed: false, // Regla estricta: NO simular datos catastrales
      auditedAt: new Date().toISOString(),
    };
  }

  /**
   * Consulta formal preparada para cuando se habilite la conexión autorizada
   */
  public async fetchCadastralData(
    _padron: string,
    _department: string
  ): Promise<OfficialCadastralRecord | null> {
    // Al estar en estado NOT_CONNECTED, no devolvemos datos ficticios
    return null;
  }
}
