// ==============================================================================
// SERVER SIGNATURE: Cliente REST Oficial para AGESIC Firma.gub.uy
// Basado en Documentación Oficial AGESIC y Postman Collection V1.0
// ==============================================================================

import crypto from 'crypto';
import { FirmaGubGatewayAuthProvider, GatewayAuthConfig } from './gatewayAuth.js';
import {
  FirmaGubPayloadMapper,
  FirmaGubProceso1Request,
  FirmaGubProceso2Request,
  NormalizedCreationResponse,
} from './payloadMapper.js';

export interface FirmaGubClientOptions {
  apiBaseUrl?: string;
  signBaseUrl?: string;
  apiPrefix?: string;
  statusMethod?: 'GET' | 'HEAD';
  process2Transport?: 'binary' | 'multipart';
  timeoutMs?: number;
  gatewayAuth?: GatewayAuthConfig;
}

export interface FirmaGubSignedFileResult {
  name: string;
  contentBase64: string;
  sha256: string;
  isValidPdf: boolean;
  fileSizeBytes: number;
}

export class FirmaGubClient {
  private apiBaseUrl: string;
  private signBaseUrl: string;
  private apiPrefix: string;
  private statusMethod: 'GET' | 'HEAD';
  private process2Transport: 'binary' | 'multipart';
  private timeoutMs: number;
  private gatewayAuthProvider: FirmaGubGatewayAuthProvider;

  constructor(options: FirmaGubClientOptions = {}) {
    this.apiBaseUrl = (
      options.apiBaseUrl ||
      process.env.FIRMA_GUB_API_BASE_URL ||
      process.env.FIRMA_GUB_BASE_URL ||
      ''
    ).replace(/\/$/, '');

    this.signBaseUrl = (
      options.signBaseUrl ||
      process.env.FIRMA_GUB_SIGN_BASE_URL ||
      this.apiBaseUrl
    ).replace(/\/$/, '');

    this.apiPrefix =
      options.apiPrefix || process.env.FIRMA_GUB_API_PREFIX || '/api/v1/externos';
    this.statusMethod =
      options.statusMethod ||
      (process.env.FIRMA_GUB_STATUS_METHOD as 'GET' | 'HEAD') ||
      'GET';
    this.process2Transport =
      options.process2Transport ||
      (process.env.FIRMA_GUB_PROCESS2_TRANSPORT as 'binary' | 'multipart') ||
      'multipart';
    this.timeoutMs = options.timeoutMs || 30000;

    this.gatewayAuthProvider = new FirmaGubGatewayAuthProvider(options.gatewayAuth);
  }

  public isEnabled(): boolean {
    return Boolean(this.apiBaseUrl);
  }

  public getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  public getSignBaseUrl(): string {
    return this.signBaseUrl;
  }

  public getApiPrefix(): string {
    return this.apiPrefix;
  }

  public getStatusMethod(): 'GET' | 'HEAD' {
    return this.statusMethod;
  }

  public getProcess2Transport(): 'binary' | 'multipart' {
    return this.process2Transport;
  }

  /**
   * Valida si un buffer o base64 tiene cabecera mágica de PDF (%PDF-)
   */
  public static isValidPdfHeader(data: Buffer | Uint8Array | ArrayBuffer | string): boolean {
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('%PDF-')) return true;
      try {
        const decoded = Buffer.from(trimmed.substring(0, 32), 'base64');
        return decoded.toString('utf-8', 0, 5) === '%PDF-';
      } catch {
        return false;
      }
    }
    let buf: Buffer;
    if (data instanceof ArrayBuffer) {
      buf = Buffer.from(data);
    } else if (Buffer.isBuffer(data)) {
      buf = data;
    } else {
      buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    if (buf.length < 5) return false;
    return buf.toString('utf-8', 0, 5) === '%PDF-';
  }

  /**
   * Health check no destructivo contra endpoint info/version de AGESIC
   */
  public async checkHealth(): Promise<{
    status: 'HEALTHY' | 'WAITING_PROVIDER_CONFIGURATION' | 'WAITING_EXTERNAL_ACCESS';
    endpoint?: string;
    version?: string;
    error?: string;
  }> {
    if (!this.apiBaseUrl) {
      return {
        status: 'WAITING_PROVIDER_CONFIGURATION',
        error: 'FIRMA_GUB_API_BASE_URL no está configurada.',
      };
    }

    const infoEndpoint = `${this.apiBaseUrl}/api/v1/info/version`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();
      const res = await fetch(infoEndpoint, {
        method: 'GET',
        headers: { ...gwHeaders },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          status: 'HEALTHY',
          endpoint: infoEndpoint,
          version: data.version || 'AGESIC_V1',
        };
      }

      return {
        status: 'WAITING_EXTERNAL_ACCESS',
        endpoint: infoEndpoint,
        error: `HTTP ${res.status} al consultar endpoint de salud`,
      };
    } catch (err: any) {
      return {
        status: 'WAITING_EXTERNAL_ACCESS',
        endpoint: infoEndpoint,
        error: err?.message || 'No se pudo alcanzar el endpoint de AGESIC',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Proceso 1: Creación directa con uno o más PDFs en Base64 (POST /api/v1/externos/proceso1)
   */
  public async postProceso1(
    payload: FirmaGubProceso1Request
  ): Promise<NormalizedCreationResponse> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/proceso1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...gwHeaders,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firma.gub.uy postProceso1 HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      return FirmaGubPayloadMapper.normalizeCreationResponse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Proceso 2 - Paso A: Carga de archivo previo (POST /api/v1/externos/archivo)
   * Soportando transporte configurable: binary | multipart
   */
  public async uploadArchivo(
    nombre: string,
    contenidoBase64OrBuffer: string | Buffer | Uint8Array,
    mimeType: string = 'application/pdf'
  ): Promise<{ idArchivo: string }> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/archivo`;
    const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let buffer: Buffer;
    if (typeof contenidoBase64OrBuffer === 'string') {
      buffer = Buffer.from(contenidoBase64OrBuffer, 'base64');
    } else {
      buffer = Buffer.from(contenidoBase64OrBuffer);
    }

    try {
      let res: Response;

      if (this.process2Transport === 'multipart') {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('archivo', blob, nombre);

        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...gwHeaders,
          },
          body: formData,
          signal: controller.signal,
        });
      } else {
        // Binary transport: application/octet-stream
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${nombre}"`,
            ...gwHeaders,
          },
          body: buffer,
          signal: controller.signal,
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firma.gub.uy uploadArchivo HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const idArchivo = json.idArchivo || json.identificador || json.id;
      if (!idArchivo) {
        throw new Error(`Firma.gub.uy uploadArchivo no retornó idArchivo válido: ${JSON.stringify(json)}`);
      }

      return { idArchivo: String(idArchivo) };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Proceso 2 - Paso B: Creación del proceso con IDs de archivos previamente cargados (POST /api/v1/externos/proceso2)
   */
  public async postProceso2(
    payload: FirmaGubProceso2Request
  ): Promise<NormalizedCreationResponse> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/proceso2`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...gwHeaders,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firma.gub.uy postProceso2 HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      return FirmaGubPayloadMapper.normalizeCreationResponse(json);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Consulta de estado del proceso (GET / HEAD /api/v1/externos/estado/{identificador})
   * Header estricto oficial: Authorization: {claveSeguridad} (SIN Bearer)
   */
  public async getProcesoEstado(
    identificador: string,
    claveSeguridad: string,
    methodOverride?: 'GET' | 'HEAD'
  ): Promise<{ estado: string; rawResponse?: any }> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/estado/${encodeURIComponent(identificador)}`;
    const method = methodOverride || this.statusMethod;
    const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();

    const headers: Record<string, string> = {
      Authorization: claveSeguridad, // Header oficial AGESIC sin Bearer
      ...gwHeaders,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        signal: controller.signal,
      });

      // Si el método falló por 405 Method Not Allowed, intentar fallback alternativo
      if (res.status === 405 && !methodOverride) {
        const fallbackMethod = method === 'GET' ? 'HEAD' : 'GET';
        return this.getProcesoEstado(identificador, claveSeguridad, fallbackMethod);
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Firma.gub.uy getProcesoEstado HTTP ${res.status}: ${errText}`);
      }

      if (method === 'HEAD') {
        const headerState =
          res.headers.get('x-estado') ||
          res.headers.get('x-status') ||
          res.headers.get('estado') ||
          (res.status === 200 ? 'FINALIZADO' : 'INICIADO');
        return { estado: headerState };
      }

      const json = await res.json();
      const estado =
        typeof json === 'string'
          ? json
          : json.estado || json.status || json.estadoProceso || 'INICIADO';

      return { estado, rawResponse: json };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Descarga todos los documentos firmados del proceso (GET /api/v1/externos/archivos/{identificador})
   * Header estricto: Authorization: {claveSeguridad} (SIN Bearer)
   * Valida integridad SHA-256 y cabecera PDF (%PDF-)
   */
  public async getArchivosFirmados(
    identificador: string,
    claveSeguridad: string
  ): Promise<FirmaGubSignedFileResult[]> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/archivos/${encodeURIComponent(identificador)}`;
    const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();

    const headers: Record<string, string> = {
      Authorization: claveSeguridad,
      ...gwHeaders,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Firma.gub.uy getArchivosFirmados HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const filesList: Array<{ nombre?: string; name?: string; contenido?: string; content?: string }> =
        Array.isArray(json) ? json : json.archivos || json.documentos || [];

      const results: FirmaGubSignedFileResult[] = [];

      for (const item of filesList) {
        const name = item.nombre || item.name || `documento_firmado_${identificador}.pdf`;
        const contentBase64 = item.contenido || item.content || '';

        const buffer = Buffer.from(contentBase64, 'base64');
        const isValidPdf = FirmaGubClient.isValidPdfHeader(buffer);
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

        results.push({
          name,
          contentBase64,
          sha256,
          isValidPdf,
          fileSizeBytes: buffer.length,
        });
      }

      return results;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Descarga individual de archivo (GET /api/v1/externos/archivo/{fileId})
   * Header estricto: Authorization: {claveSeguridad} (SIN Bearer)
   */
  public async getArchivoFirmadoIndividual(
    fileId: string,
    claveSeguridad: string
  ): Promise<{
    fileId: string;
    filename: string;
    buffer: Buffer;
    sha256: string;
    isValidPdf: boolean;
  }> {
    if (!this.apiBaseUrl) {
      throw new Error('FIRMA_GUB_API_BASE_URL no está configurada.');
    }

    const endpoint = `${this.apiBaseUrl}${this.apiPrefix}/archivo/${encodeURIComponent(fileId)}`;
    const gwHeaders = await this.gatewayAuthProvider.getGatewayHeaders();

    const headers: Record<string, string> = {
      Authorization: claveSeguridad,
      ...gwHeaders,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Firma.gub.uy getArchivoFirmadoIndividual HTTP ${res.status}: ${errText}`);
      }

      const contentDisposition = res.headers.get('content-disposition') || '';
      const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
      const filename = match ? match[1] : `archivo_${fileId}.pdf`;

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isValidPdf = FirmaGubClient.isValidPdfHeader(buffer);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        fileId,
        filename,
        buffer,
        sha256,
        isValidPdf,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Construye la URL de firma server-side sin loguear datos sensibles
   */
  public buildSigningUrl(identificador: string, claveSeguridad: string): string {
    return FirmaGubPayloadMapper.buildSigningUrl(this.signBaseUrl, identificador, claveSeguridad);
  }
}
