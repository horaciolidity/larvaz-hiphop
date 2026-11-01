/**
 * Country utilities: extract country name from location strings and
 * return the corresponding flag emoji using Unicode regional indicator symbols.
 */

/** Map of country name keywords → ISO 3166-1 alpha-2 code */
const COUNTRY_CODE_MAP: Record<string, string> = {
  // Argentina
  argentina: 'AR',
  mendoza: 'AR',
  'buenos aires': 'AR',
  córdoba: 'AR',
  cordoba: 'AR',
  rosario: 'AR',
  neuquén: 'AR',
  neuquen: 'AR',
  salta: 'AR',
  tucumán: 'AR',
  tucuman: 'AR',
  bariloche: 'AR',
  'mar del plata': 'AR',
  // Chile
  chile: 'CL',
  santiago: 'CL',
  valparaíso: 'CL',
  valparaiso: 'CL',
  // Colombia
  colombia: 'CO',
  bogotá: 'CO',
  bogota: 'CO',
  medellín: 'CO',
  medellin: 'CO',
  cali: 'CO',
  // México
  méxico: 'MX',
  mexico: 'MX',
  cdmx: 'MX',
  'ciudad de méxico': 'MX',
  guadalajara: 'MX',
  monterrey: 'MX',
  // Uruguay
  uruguay: 'UY',
  montevideo: 'UY',
  // Perú
  perú: 'PE',
  peru: 'PE',
  lima: 'PE',
  // Brasil
  brasil: 'BR',
  brazil: 'BR',
  'são paulo': 'BR',
  'sao paulo': 'BR',
  'rio de janeiro': 'BR',
  // Venezuela
  venezuela: 'VE',
  caracas: 'VE',
  // Ecuador
  ecuador: 'EC',
  quito: 'EC',
  guayaquil: 'EC',
  // Bolivia
  bolivia: 'BO',
  'la paz': 'BO',
  // Paraguay
  paraguay: 'PY',
  asunción: 'PY',
  asuncion: 'PY',
  // Panama
  panamá: 'PA',
  panama: 'PA',
  // Costa Rica
  'costa rica': 'CR',
  // Guatemala
  guatemala: 'GT',
  // Honduras
  honduras: 'HN',
  // El Salvador
  'el salvador': 'SV',
  // Nicaragua
  nicaragua: 'NI',
  // Cuba
  cuba: 'CU',
  habana: 'CU',
  // Dominican Republic
  'república dominicana': 'DO',
  dominicana: 'DO',
  // Puerto Rico
  'puerto rico': 'PR',
  // USA
  'united states': 'US',
  usa: 'US',
  'new york': 'US',
  'nueva york': 'US',
  'los angeles': 'US',
  chicago: 'US',
  // Spain
  spain: 'ES',
  españa: 'ES',
  madrid: 'ES',
  barcelona: 'ES',
  // France
  france: 'FR',
  paris: 'FR',
  // Germany
  germany: 'DE',
  berlin: 'DE',
  // UK
  'united kingdom': 'GB',
  london: 'GB',
  // Italy
  italy: 'IT',
  rome: 'IT',
  // Portugal
  portugal: 'PT',
  lisboa: 'PT',
  // Japan
  japan: 'JP',
  tokyo: 'JP',
};

/**
 * Converts a 2-letter ISO country code to a flag emoji.
 * Uses Unicode Regional Indicator Symbol Letters (U+1F1E6..U+1F1FF).
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const first = String.fromCodePoint(0x1f1e6 + upper.charCodeAt(0) - 65);
  const second = String.fromCodePoint(0x1f1e6 + upper.charCodeAt(1) - 65);
  return first + second;
}

/**
 * Given a free-text location string like "Mendoza, Argentina" or "Santiago de Chile",
 * tries to detect the country and return its flag emoji.
 * Returns empty string if not detected.
 */
export function getLocationFlag(location?: string | null): string {
  if (!location) return '';
  const lower = location.toLowerCase();
  const sortedKeys = Object.keys(COUNTRY_CODE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return countryCodeToFlag(COUNTRY_CODE_MAP[key]);
    }
  }
  return '';
}

/**
 * Returns the ISO-2 country code from a location string, or empty string.
 */
export function getCountryCode(location?: string | null): string {
  if (!location) return '';
  const lower = location.toLowerCase();
  const sortedKeys = Object.keys(COUNTRY_CODE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return COUNTRY_CODE_MAP[key];
    }
  }
  return '';
}
