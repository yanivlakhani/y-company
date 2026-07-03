export type Gender = "men" | "women";

/** Client-safe product fields — stock is never included. */
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
  thumb_url: string | null;
  lookbook_url: string | null;
  created_at: string | null;
};

export const PRODUCT_PUBLIC_SELECT =
  "id, gender, accessory_type, folder_index, slug, name, material, properties, description, price_fils, thumb_url, lookbook_url, created_at";
