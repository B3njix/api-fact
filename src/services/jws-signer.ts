/**
 * Servicio de Firma Electrónica JWS (JSON Web Signature)
 * Conforme a la normativa técnica del Ministerio de Hacienda de El Salvador
 * Algoritmo: RS512 (SHA512withRSA)
 */

export interface JWSComponents {
  header: {
    alg: string;
    typ: string;
  };
  payload: any;
  signature: string;
  compact: string;
}

// Codificación Base64URL según RFC 7515
export function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Descompone un token JWS compacto en sus partes constituyentes para inspección
 */
export function parseJWS(jwsCompact: string): JWSComponents | null {
  try {
    const parts = jwsCompact.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return {
      header,
      payload,
      signature: parts[2],
      compact: jwsCompact,
    };
  } catch {
    return null;
  }
}
