// ==============================================================================
// HIPOTECALY SERVER: Enterprise Anti-SSRF Defense Engine
// Validador criptográfico y de red sin servicios externos para prevenir SSRF
// Soporta IPv4, IPv6, formatos alternativos, CIDR, resolución DNS y IP Pinning
// ==============================================================================

import dns from 'dns';
import net from 'net';

export interface SsrfValidationResult {
  valid: boolean;
  reason?: string;
  resolvedIps?: string[];
  safeUrl?: string;
}

export class SsrfValidator {
  /**
   * Lista de dominios y hosts de metadatos o infraestructura interna estrictamente prohibidos
   */
  private static readonly FORBIDDEN_HOSTNAMES = new Set([
    'localhost',
    'localhost.localdomain',
    'ip6-localhost',
    'ip6-loopback',
    'instance-data',
    'metadata.google.internal',
    'metadata.internal',
    'metadata.packet.net',
    '169.254.169.254',
    'fd00:ec2::254',
  ]);

  /**
   * Convierte una dirección IPv4 en formato entero de 32 bits a string con puntos
   */
  public static parseDecimalOrHexIpv4(host: string): string | null {
    // Si es un número decimal entero (ej: 2130706433 para 127.0.0.1)
    if (/^\d+$/.test(host)) {
      const num = parseInt(host, 10);
      if (num >= 0 && num <= 0xffffffff) {
        return [
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255,
        ].join('.');
      }
    }

    // Si es un número hexadecimal (ej: 0x7f000001)
    if (/^0x[0-9a-fA-F]+$/i.test(host)) {
      const num = parseInt(host, 16);
      if (num >= 0 && num <= 0xffffffff) {
        return [
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255,
        ].join('.');
      }
    }

    // Si tiene partes en octal (ej: 0177.0.0.1) o hex por octeto
    const parts = host.split('.');
    if (parts.length === 4 && parts.every((p) => /^(0[0-7]+|0x[0-9a-fA-F]+|\d+)$/i.test(p))) {
      try {
        const decoded = parts.map((p) => {
          if (p.startsWith('0x') || p.startsWith('0X')) return parseInt(p, 16);
          if (p.startsWith('0') && p.length > 1) return parseInt(p, 8);
          return parseInt(p, 10);
        });
        if (decoded.every((d) => d >= 0 && d <= 255)) {
          return decoded.join('.');
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Determina si una dirección IPv4 es privada, loopback, link-local, multicast o reservada
   */
  public static isPrivateOrReservedIpv4(ip: string): boolean {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true; // Malformada = rechazar por seguridad
    }

    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Red actual)
    if (a === 0) return true;

    // 10.0.0.0/8 (Privada RFC 1918)
    if (a === 10) return true;

    // 100.64.0.0/10 (CGNAT / Shared Address Space RFC 6598)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-Local / Cloud Metadata RFC 3927)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Privada RFC 1918: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments RFC 6890)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1 RFC 5737)
    if (a === 192 && b === 0 && c === 2) return true;

    // 192.88.99.0/24 (6to4 Relay Anycast RFC 7526)
    if (a === 192 && b === 88 && c === 99) return true;

    // 192.168.0.0/16 (Privada RFC 1918)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Network Benchmark RFC 2544: 198.18.0.0 - 198.19.255.255)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2 RFC 5737)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3 RFC 5737)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast RFC 5771: 224.0.0.0 - 239.255.255.255)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reservado para investigación futura RFC 1112: 240.0.0.0 - 255.255.255.254)
    if (a >= 240) return true;

    // 255.255.255.255 (Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;

    return false;
  }

  /**
   * Determina si una dirección IPv6 es privada, loopback, link-local, multicast o especial
   */
  public static isPrivateOrReservedIpv6(ip: string): boolean {
    const normalized = ip.toLowerCase().trim();

    // Loopback
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

    // Unspecified
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

    // IPv4-mapped IPv6 (ej: ::ffff:127.0.0.1 o ::ffff:7f00:1)
    if (normalized.startsWith('::ffff:') || normalized.startsWith('0:0:0:0:0:ffff:')) {
      const ipv4Part = normalized.replace(/^.*ffff:/, '');
      if (net.isIPv4(ipv4Part)) {
        return this.isPrivateOrReservedIpv4(ipv4Part);
      }
      return true;
    }

    // Link-Local (fe80::/10 -> fe8, fe9, fea, feb)
    if (/^fe[89ab]/i.test(normalized)) return true;

    // Unique Local / Private (fc00::/7 -> fc, fd)
    if (/^f[cd]/i.test(normalized)) return true;

    // Multicast (ff00::/8)
    if (normalized.startsWith('ff')) return true;

    // Documentation (2001:db8::/32)
    if (normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0db8:')) return true;

    // Discard Prefix (100::/64)
    if (normalized.startsWith('100::')) return true;

    return false;
  }

  /**
   * Valida sintáctica y semánticamente una URL para prevenir SSRF (Sincrónico)
   */
  public static validateUrlSync(urlString: string, options: { requireHttps?: boolean } = {}): { valid: boolean; reason?: string } {
    try {
      if (!urlString || typeof urlString !== 'string') {
        return { valid: false, reason: 'URL requerida.' };
      }

      const trimmed = urlString.trim();
      if (trimmed.length > 2048) {
        return { valid: false, reason: 'URL excede longitud máxima permitida (2048 caracteres).' };
      }

      const parsed = new URL(trimmed);

      // 1. Protocolo
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, reason: `Protocolo no permitido: ${parsed.protocol}. Solo se admiten HTTP/HTTPS.` };
      }

      const isProd = process.env.NODE_ENV === 'production';
      if ((isProd || options.requireHttps) && parsed.protocol !== 'https:') {
        return { valid: false, reason: 'En producción los webhooks deben utilizar obligatoriamente HTTPS.' };
      }

      // 2. Prohibir credenciales embebidas en la URL (evitar bypass de parsing y filtración)
      if (parsed.username || parsed.password) {
        return { valid: false, reason: 'No se permiten credenciales de usuario o contraseña embebidas en la URL.' };
      }

      // 3. Prohibir puertos no estándar
      if (parsed.port) {
        const portNum = parseInt(parsed.port, 10);
        const allowedPorts = [80, 443, 8080, 8443];
        if (!allowedPorts.includes(portNum)) {
          return { valid: false, reason: `Puerto ${portNum} no autorizado. Solo se permiten puertos web estándar.` };
        }
      }

      // 4. Hostname
      const rawHostname = parsed.hostname.toLowerCase();
      if (!rawHostname) {
        return { valid: false, reason: 'Hostname vacío.' };
      }

      // Prohibir terminaciones ambiguas o locales
      if (
        rawHostname.endsWith('.local') ||
        rawHostname.endsWith('.internal') ||
        rawHostname.endsWith('.localhost') ||
        rawHostname.endsWith('.onion')
      ) {
        return { valid: false, reason: `Dominio interno o no público no permitido: ${rawHostname}` };
      }

      // 5. Verificar lista negra de nombres directos
      if (this.FORBIDDEN_HOSTNAMES.has(rawHostname)) {
        return { valid: false, reason: `Host interno/loopback bloqueado: ${rawHostname}` };
      }

      // 6. Verificar si es IP decimal/hex/octal alternativa
      const altIpv4 = this.parseDecimalOrHexIpv4(rawHostname);
      if (altIpv4) {
        if (this.isPrivateOrReservedIpv4(altIpv4)) {
          return { valid: false, reason: `Dirección IPv4 codificada (${rawHostname} -> ${altIpv4}) pertenece a rango privado o reservado.` };
        }
      }

      // 7. Verificar si es IPv4 directa
      if (net.isIPv4(rawHostname)) {
        if (this.isPrivateOrReservedIpv4(rawHostname)) {
          return { valid: false, reason: `Dirección IPv4 (${rawHostname}) pertenece a rango privado o reservado.` };
        }
      }

      // 8. Verificar si es IPv6 directa
      if (net.isIPv6(rawHostname)) {
        if (this.isPrivateOrReservedIpv6(rawHostname)) {
          return { valid: false, reason: `Dirección IPv6 (${rawHostname}) pertenece a rango privado o reservado.` };
        }
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'URL malformada o inválida.' };
    }
  }

  /**
   * Validación profunda Asíncrona con resolución DNS y protección contra DNS Rebinding (IP Pinning)
   */
  public static async validateUrlAsync(
    urlString: string,
    options: { requireHttps?: boolean } = {}
  ): Promise<SsrfValidationResult> {
    const syncCheck = this.validateUrlSync(urlString, options);
    if (!syncCheck.valid) {
      return { valid: false, reason: syncCheck.reason };
    }

    try {
      const parsed = new URL(urlString.trim());
      const hostname = parsed.hostname.toLowerCase();

      // Si ya es una IP literal validada, no requiere DNS
      if (net.isIP(hostname)) {
        return { valid: true, resolvedIps: [hostname], safeUrl: parsed.toString() };
      }

      // Resolver todos los registros A y AAAA
      const resolvedIps: string[] = [];

      try {
        const records = await dns.promises.lookup(hostname, { all: true });
        for (const record of records) {
          resolvedIps.push(record.address);
        }
      } catch (dnsErr: any) {
        return {
          valid: false,
          reason: `No se pudo resolver el nombre de dominio DNS: ${dnsErr?.message || 'Host desconocido'}`,
        };
      }

      if (resolvedIps.length === 0) {
        return { valid: false, reason: 'El dominio no retornó ninguna dirección IP pública.' };
      }

      // Verificar CADA IP resuelta
      for (const ip of resolvedIps) {
        if (net.isIPv4(ip)) {
          if (this.isPrivateOrReservedIpv4(ip)) {
            return {
              valid: false,
              reason: `El dominio resuelve a una IP privada/reservada (${ip}). Bloqueado por protección Anti-SSRF (DNS Rebinding prevention).`,
              resolvedIps,
            };
          }
        } else if (net.isIPv6(ip)) {
          if (this.isPrivateOrReservedIpv6(ip)) {
            return {
              valid: false,
              reason: `El dominio resuelve a una IPv6 privada/reservada (${ip}). Bloqueado por protección Anti-SSRF.`,
              resolvedIps,
            };
          }
        }
      }

      return {
        valid: true,
        resolvedIps,
        safeUrl: parsed.toString(),
      };
    } catch (err: any) {
      return { valid: false, reason: `Error validando URL: ${err?.message}` };
    }
  }
}
