// ==============================================================================
// SERVER CRYPTO: Verificador HMAC-SHA256 Timing-Safe
// ==============================================================================

import crypto from 'crypto';

export class HmacVerifier {
  /**
   * Verifica la firma HMAC-SHA256 de forma timing-safe evitando ataques de timing
   */
  public static verifyHmacSha256(
    rawBody: string | Buffer,
    receivedSignatureHex: string,
    sharedSecret: string
  ): boolean {
    if (!receivedSignatureHex || !sharedSecret) {
      return false;
    }

    try {
      const bodyBuffer = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), 'utf-8');

      const hmac = crypto.createHmac('sha256', sharedSecret);
      hmac.update(bodyBuffer);
      const computedHex = hmac.digest('hex');

      const bufComputed = Buffer.from(computedHex, 'hex');
      const bufReceived = Buffer.from(receivedSignatureHex, 'hex');

      if (bufComputed.length !== bufReceived.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufComputed, bufReceived);
    } catch (err) {
      console.error('[HmacVerifier] Error validating HMAC signature:', err);
      return false;
    }
  }

  /**
   * Genera una firma HMAC-SHA256 (útil para tests o dispatching de webhooks salientes)
   */
  public static signHmacSha256(data: string | Buffer, secret: string): string {
    const bodyBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bodyBuffer);
    return hmac.digest('hex');
  }
}
