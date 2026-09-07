// ==============================================================================
// SITEOS SIGNATURE CORE: Utilidades de Hash Criptográfico SHA-256
// Compatible tanto con entornos Node.js (Crypto) como Navegadores (Web Crypto API)
// ==============================================================================

export async function computeSha256(data: string | Uint8Array | ArrayBuffer): Promise<string> {
  // 1. Entorno Node.js con crypto nativo
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      if (typeof data === 'string') {
        hash.update(data, 'utf-8');
      } else if (data instanceof Uint8Array) {
        hash.update(data);
      } else {
        hash.update(Buffer.from(data));
      }
      return hash.digest('hex');
    } catch {
      // Fallback a Web Crypto si import falla
    }
  }

  // 2. Entorno Web Crypto API (Browser / Edge)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    let bufferSource: BufferSource;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      bufferSource = encoder.encode(data);
    } else if (data instanceof Uint8Array) {
      bufferSource = data;
    } else {
      bufferSource = data as ArrayBuffer;
    }

    const digestBuffer = await crypto.subtle.digest('SHA-256', bufferSource);
    const byteArray = new Uint8Array(digestBuffer);
    return Array.from(byteArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }


  // 3. Fallback simple en caso extremo
  throw new Error('[computeSha256] No hay motor criptográfico disponible.');
}

export async function computeBase64Sha256(base64Content: string): Promise<string> {
  const cleanBase64 = base64Content.replace(/^data:application\/pdf;base64,/, '').trim();
  
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(cleanBase64, 'base64');
    return computeSha256(buf);
  }

  // En navegador: decode base64 a Uint8Array
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return computeSha256(bytes);
}

export function verifyHashesMatch(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  return hashA.trim().toLowerCase() === hashB.trim().toLowerCase();
}
