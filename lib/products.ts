import { cache } from "react";

import {
  getMockProductById,
  getMockProductsByGender,
} from "@/lib/mock-products";
import { createPublicClient } from "@/lib/supabase/public";
import {
  mapProductRow,
  PRODUCT_PUBLIC_SELECT,
  type Gender,
  type ProductPublic,
  type ProductRowWithVariants,
} from "@/lib/types/product";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const shouldUseMockFallback = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  if (error) {
    return true;
  }

  return (count ?? 0) === 0;
});

export const getProductsByGender = cache(
  async (gender: Gender): Promise<ProductPublic[]> => {
    if (await shouldUseMockFallback()) {
      return getMockProductsByGender(gender);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_PUBLIC_SELECT)
      .eq("gender", gender)
      .order("accessory_type")
      .order("folder_index");

    if (error || !data?.length) {
      return getMockProductsByGender(gender);
    }

    return (data as ProductRowWithVariants[]).map(mapProductRow);
  },
);

export const getProductById = cache(
  async (id: string): Promise<ProductPublic | null> => {
    if (await shouldUseMockFallback()) {
      return getMockProductById(id);
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_PUBLIC_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapProductRow(data as ProductRowWithVariants);
  },
);
