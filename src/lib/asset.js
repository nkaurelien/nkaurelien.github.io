// Prefixe les chemins d'assets absolus avec le basePath (deploiement en sous-chemin).
// A utiliser pour les <img> simples (Mantine Image) ; next/image applique deja le basePath.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBase(src) {
  if (!src) return src;
  if (/^https?:\/\//.test(src) || src.startsWith('data:')) return src;
  return `${BASE_PATH}${src.startsWith('/') ? '' : '/'}${src}`;
}
