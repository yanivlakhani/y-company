export type Gender = "men" | "women";

/** Client-safe variant fields — stock is never included. */
export type VariantPublic = {
  id: string;
  color: string;
  images: string[];
  is_default: boolean;
  available: boolean;
};

/** Client-safe product fields with nested variants. */
export type ProductPublic = {
  id: string;
  gender: Gender;
  accessory_type: string;
  folder_index: number;
  slug: string | null;
  name: string;
  material: string | null;
  properties: string[];
  description: string | null;
  price_fils: number;
  variants: VariantPublic[];
  created_at: string | null;
};

/** Nested select: stock is fetched server-side only to compute `available`. */
export const PRODUCT_PUBLIC_SELECT =
  "id, gender, accessory_type, folder_index, slug, name, material, properties, description, price_fils, created_at, product_variants (id, color, images, is_default, stock)";

export type ProductVariantRow = {
  id: string;
  color: string;
  images: string[];
  is_default: boolean;
  stock: number;
};

export type ProductRowWithVariants = {
  id: string;
  gender: Gender;
  accessory_type: string;
  folder_index: number;
  slug: string | null;
  name: string;
  material: string | null;
  properties: string[];
  description: string | null;
  price_fils: number;
  created_at: string | null;
  product_variants: ProductVariantRow[] | null;
};

export function sortVariants(variants: VariantPublic[]): VariantPublic[] {
  return [...variants].sort((a, b) => {
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }

    return a.color.localeCompare(b.color);
  });
}

export function mapVariantRow(row: ProductVariantRow): VariantPublic {
  return {
    id: row.id,
    color: row.color,
    images: row.images ?? [],
    is_default: row.is_default,
    available: row.stock > 0,
  };
}

export function mapProductRow(row: ProductRowWithVariants): ProductPublic {
  const variants = sortVariants(
    (row.product_variants ?? []).map(mapVariantRow),
  );

  return {
    id: row.id,
    gender: row.gender,
    accessory_type: row.accessory_type,
    folder_index: row.folder_index,
    slug: row.slug,
    name: row.name,
    material: row.material,
    properties: row.properties,
    description: row.description,
    price_fils: row.price_fils,
    variants,
    created_at: row.created_at,
  };
}

export function getDefaultVariant(
  product: ProductPublic,
): VariantPublic | null {
  return (
    product.variants.find((variant) => variant.is_default) ??
    product.variants[0] ??
    null
  );
}

export function isProductFullySoldOut(product: ProductPublic): boolean {
  return (
    product.variants.length > 0 &&
    product.variants.every((variant) => !variant.available)
  );
}

/** Initial selection: default if in stock, else first available, else default when all sold out. */
export function getInitialSelectedVariant(
  product: ProductPublic,
): VariantPublic | null {
  const defaultVariant = getDefaultVariant(product);
  if (!defaultVariant) {
    return null;
  }

  if (defaultVariant.available) {
    return defaultVariant;
  }

  const firstAvailable = product.variants.find((variant) => variant.available);
  if (firstAvailable) {
    return firstAvailable;
  }

  return defaultVariant;
}
