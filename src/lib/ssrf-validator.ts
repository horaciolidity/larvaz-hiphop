/**
 * LARVAZ HIPHOP — SSRF (Server-Side Request Forgery) Protection Guard
 * Validates outgoing URLs before fetching external oEmbed/OpenGraph metadata.
 */

// Blocked private / internal / link-local IP patterns and hostname patterns
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,  // 10.0.0.0/8
  /^192\.168\.\d{1,3}\.\d{1,3}$/,    // 192.168.0.0/16
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^169\.254\.\d{1,3}\.\d{1,3}$/,    // Link-local / Cloud metadata (AWS/GCP/Azure)
  /^0\.0\.0\.0$/,
  /^::1$/,                           // IPv6 loopback
  /^fe80:/i,                         // IPv6 link-local
  /^fc00:/i,                         // IPv6 unique local
  /\.internal$/i,
  /\.local$/i,
  /\.corp$/i,
  /\.lan$/i,
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

// Allowed or recommended media domains
export const RECOGNIZED_PROVIDERS: Record<string, string> = {
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'spotify.com': 'spotify',
  'soundcloud.com': 'soundcloud',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'vimeo.com': 'vimeo',
  'bandcamp.com': 'bandcamp',
};

export interface SafeUrlResult {
  isValid: boolean;
  sanitizedUrl?: string;
  domain?: string;
  provider: 'youtube' | 'spotify' | 'soundcloud' | 'instagram' | 'tiktok' | 'vimeo' | 'bandcamp' | 'generic';
  error?: string;
}

export function validateExternalUrl(urlString: string): SafeUrlResult {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, provider: 'generic', error: 'La URL está vacía o es inválida.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    return { isValid: false, provider: 'generic', error: 'Formato de URL no válido. Debe incluir https://' };
  }

  // 1. Enforce allowed protocol (prefer https)
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { isValid: false, provider: 'generic', error: 'Protocolo no permitido. Solo se admite HTTPS.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject internal / local hostnames & IPs
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isValid: false, provider: 'generic', error: 'Destino no permitido por políticas de seguridad.' };
    }
  }

  // 3. Reject ports other than default HTTP/HTTPS (e.g. 80, 443)
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { isValid: false, provider: 'generic', error: 'Puerto no permitido.' };
  }

  // 4. Detect provider
  let detectedProvider: SafeUrlResult['provider'] = 'generic';
  for (const [key, providerName] of Object.entries(RECOGNIZED_PROVIDERS)) {
    if (hostname === key || hostname.endsWith('.' + key)) {
      detectedProvider = providerName as SafeUrlResult['provider'];
      break;
    }
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
    domain: hostname,
    provider: detectedProvider,
  };
}
