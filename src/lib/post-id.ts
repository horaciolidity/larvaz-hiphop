/**
 * Identificadores de publicación.
 *
 * Las publicaciones reales viven en Supabase con un UUID. Las publicaciones
 * semilla del muro (post-1, post-2, ...) no existen en la base y sus
 * comentarios no se podían guardar porque `comments.post_id` era UUID.
 *
 * Para que esos comentarios también persistan (y los vea todo el mundo) los
 * mapeamos a un UUID determinista, igual en el servidor y en el navegador.
 * Así no hace falta ninguna dependencia ni tabla extra.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value || '');
}

/** Hash determinista (xmur3) de 32 caracteres hex, sin dependencias. */
function hashHex32(input: string): string {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  const nextWord = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };

  let hex = '';
  for (let i = 0; i < 4; i += 1) {
    hex += nextWord().toString(16).padStart(8, '0');
  }
  return hex;
}

/**
 * Devuelve el id que usamos en la base de datos para una publicación.
 * - UUID real → se usa tal cual (normalizado a minúsculas).
 * - Cualquier otro id (post-1, post-2...) → UUID v5 determinista.
 */
export function toDbPostId(postId: string): string {
  const value = String(postId || '').trim();
  if (!value) return value;
  if (isUuid(value)) return value.toLowerCase();

  const hex = hashHex32(`larvaz:post:${value}`);
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

/** true cuando el id no es un UUID real (publicación semilla del muro). */
export function isSeedPostId(postId: string): boolean {
  const value = String(postId || '').trim();
  return Boolean(value) && !isUuid(value);
}
