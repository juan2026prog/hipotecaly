// ==============================================================================
// SERVER SIGNATURE: Mapeador de Payloads y Normalizador para AGESIC Firma.gub.uy
// Paridad estricta con Postman Collection Oficial V1.0 y Manuales AGESIC
// ==============================================================================

import { SignatureProcessInput } from '../../src/lib/siteos/signature/types.js';

export interface FirmaGubProceso1File {
  nombre: string;
  contenido: string; // Base64
}

export interface FirmaGubSignerDetail {
  orden?: number;
  nombre: string;
  email: string;
  documento?: string;
  pais?: string;
  tipoDocumento?: string;
  pin?: string;
}

export interface FirmaGubProceso1Request {
  nombreSistema: string;
  cantidadFirmantes: number;
  fechaExpiracion?: string;
  urlNotificacion: string;
  urlRetorno: string;
  archivos: FirmaGubProceso1File[];
  detalleFirmantes: FirmaGubSignerDetail[];
}

export interface FirmaGubProceso2Request {
  nombreSistema: string;
  cantidadFirmantes: number;
  fechaExpiracion?: string;
  urlNotificacion: string;
  urlRetorno: string;
  archivos: Array<{ id: string } | string>;
  detalleFirmantes: FirmaGubSignerDetail[];
}

export interface NormalizedCreationResponse {
  providerProcessId: string;
  securityKey: string;
  expiresAt?: string;
}

export class FirmaGubPayloadMapper {
  /**
   * Formatea una fecha ISO o timestamp al formato AGESIC si es necesario
   */
  public static formatAgesicDate(isoOrTimestamp?: string | Date): string | undefined {
    if (!isoOrTimestamp) return undefined;
    const date = typeof isoOrTimestamp === 'string' ? new Date(isoOrTimestamp) : isoOrTimestamp;
    if (isNaN(date.getTime())) return typeof isoOrTimestamp === 'string' ? isoOrTimestamp : undefined;

    // DD/MM/YYYY HH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Mapea el input de dominio a payload oficial de Proceso 1 (Postman Collection V1.0)
   */
  public static toProceso1Request(
    input: SignatureProcessInput,
    defaults: { returnUrl: string; notificationUrl: string; systemName?: string }
  ): FirmaGubProceso1Request {
    const detalleFirmantes: FirmaGubSignerDetail[] = input.signers.map((s, idx) => ({
      orden: s.orderIndex !== undefined ? s.orderIndex + 1 : idx + 1,
      nombre: s.name,
      email: s.email,
      documento: s.documentNumber || undefined,
      pais: s.documentCountry || 'UY',
      tipoDocumento: s.documentType || 'CI',
    }));

    const archivos: FirmaGubProceso1File[] = input.documents.map((d) => {
      let fileName = d.title;
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName = `${fileName}.pdf`;
      }
      return {
        nombre: fileName,
        contenido: d.contentBase64 || '',
      };
    });

    const payload: FirmaGubProceso1Request = {
      nombreSistema: input.systemName || defaults.systemName || 'HIPOTECALY_DOCFLOW',
      cantidadFirmantes: input.signers.length,
      urlRetorno: input.returnUrl || defaults.returnUrl,
      urlNotificacion: input.notificationUrl || defaults.notificationUrl,
      archivos,
      detalleFirmantes,
    };

    if (input.expiresAt) {
      payload.fechaExpiracion = this.formatAgesicDate(input.expiresAt);
    }

    return payload;
  }

  /**
   * Mapea a payload oficial de Proceso 2 (Postman Collection V1.0)
   */
  public static toProceso2Request(
    input: SignatureProcessInput,
    fileIds: string[],
    defaults: { returnUrl: string; notificationUrl: string; systemName?: string }
  ): FirmaGubProceso2Request {
    const detalleFirmantes: FirmaGubSignerDetail[] = input.signers.map((s, idx) => ({
      orden: s.orderIndex !== undefined ? s.orderIndex + 1 : idx + 1,
      nombre: s.name,
      email: s.email,
      documento: s.documentNumber || undefined,
      pais: s.documentCountry || 'UY',
      tipoDocumento: s.documentType || 'CI',
    }));

    const payload: FirmaGubProceso2Request = {
      nombreSistema: input.systemName || defaults.systemName || 'HIPOTECALY_DOCFLOW',
      cantidadFirmantes: input.signers.length,
      urlRetorno: input.returnUrl || defaults.returnUrl,
      urlNotificacion: input.notificationUrl || defaults.notificationUrl,
      archivos: fileIds.map((id) => ({ id })),
      detalleFirmantes,
    };

    if (input.expiresAt) {
      payload.fechaExpiracion = this.formatAgesicDate(input.expiresAt);
    }

    return payload;
  }

  /**
   * Normaliza la respuesta de creación de AGESIC Firma.gub.uy
   */
  public static normalizeCreationResponse(raw: any): NormalizedCreationResponse {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[FirmaGubPayloadMapper] Respuesta de creación inválida o vacía de Firma.gub.uy');
    }

    const providerProcessId = raw.identificador || raw.id || raw.processId;
    const securityKey = raw.claveSeguridad || raw.securityKey || raw.clave || raw.pass;

    if (!providerProcessId || !securityKey) {
      throw new Error(
        `[FirmaGubPayloadMapper] La respuesta no contiene identificador o claveSeguridad: ${JSON.stringify(
          this.redactSecrets(raw)
        )}`
      );
    }

    return {
      providerProcessId: String(providerProcessId),
      securityKey: String(securityKey),
      expiresAt: raw.fechaExpiracion || raw.expiresAt,
    };
  }

  /**
   * Construye la URL oficial de firma con identificador y pass
   * NOTA: Esta URL contiene la clave de seguridad; no debe loguearse ni persistirse en cliente.
   */
  public static buildSigningUrl(
    signBaseUrl: string,
    identificador: string,
    claveSeguridad: string
  ): string {
    const cleanBase = signBaseUrl.replace(/\/$/, '');
    return `${cleanBase}/es/pp/firmar?id=${encodeURIComponent(identificador)}&pass=${encodeURIComponent(
      claveSeguridad
    )}`;
  }

  /**
   * Redacta datos sensibles para logs seguros
   */
  public static redactSecrets(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSecrets(item));
    }

    const copy: Record<string, any> = { ...obj };
    const sensitiveKeys = [
      'claveSeguridad',
      'clave',
      'pass',
      'password',
      'clientSecret',
      'client_secret',
      'securitySecretEncrypted',
      'securityKey',
      'bearerToken',
    ];

    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.some((k) => k.toLowerCase() === key.toLowerCase())) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = this.redactSecrets(copy[key]);
      } else if (typeof copy[key] === 'string' && copy[key].length > 500) {
        // Truncar payloads Base64 gigantes en logs
        copy[key] = `[BASE64_DATA_TRUNCATED_${copy[key].length}_BYTES]`;
      }
    }

    return copy;
  }

  /**
   * Sanitiza URLs de firma en logs para no exponer el query param 'pass'
   */
  public static sanitizeUrl(url?: string): string {
    if (!url) return '';
    return url.replace(/([?&]pass=)[^&]+/i, '$1[REDACTED]');
  }
}
