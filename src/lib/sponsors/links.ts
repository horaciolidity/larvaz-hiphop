import type { SponsorBrand } from '@/types/sponsors';

/** Ruta pública del perfil de una marca. */
export function brandHref(brand?: SponsorBrand | null): string {
  return brand ? `/sponsors/marca/${brand.slug}` : '/sponsors/marcas';
}
