"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = new Set(["unfulfilled", "shipped"]);

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const orderId = formData.get("orderId");
  const status = formData.get("status");

  if (typeof orderId !== "string" || !orderId) {
    throw new Error("Invalid order id");
  }

  if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid status");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  revalidatePath("/admin");
}

export async function updateVariantStock(formData: FormData): Promise<void> {
  await requireAdmin();

  const variantId = formData.get("variantId");
  const stockRaw = formData.get("stock");

  if (typeof variantId !== "string" || !variantId) {
    throw new Error("Invalid variant id");
  }

  const stock = Number.parseInt(String(stockRaw ?? ""), 10);
  if (Number.isNaN(stock) || stock < 0) {
    throw new Error("Invalid stock");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ stock })
    .eq("id", variantId);

  if (error) {
    throw new Error(`Failed to update variant stock: ${error.message}`);
  }

  revalidatePath("/admin");
}

export async function setDefaultVariant(formData: FormData): Promise<void> {
  await requireAdmin();

  const variantId = formData.get("variantId");

  if (typeof variantId !== "string" || !variantId) {
    throw new Error("Invalid variant id");
  }

  const supabase = createAdminClient();

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError || !variant) {
    throw new Error("Variant not found");
  }

  const { error: clearError } = await supabase
    .from("product_variants")
    .update({ is_default: false })
    .eq("product_id", variant.product_id);

  if (clearError) {
    throw new Error(`Failed to clear default variants: ${clearError.message}`);
  }

  const { error: setError } = await supabase
    .from("product_variants")
    .update({ is_default: true })
    .eq("id", variantId);

  if (setError) {
    throw new Error(`Failed to set default variant: ${setError.message}`);
  }

  revalidatePath("/admin");
}
