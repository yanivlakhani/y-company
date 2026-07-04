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

export async function updateProductStock(formData: FormData): Promise<void> {
  await requireAdmin();

  const productId = formData.get("productId");
  const stockRaw = formData.get("stock");

  if (typeof productId !== "string" || !productId) {
    throw new Error("Invalid product id");
  }

  const stock = Number.parseInt(String(stockRaw ?? ""), 10);
  if (Number.isNaN(stock) || stock < 0) {
    throw new Error("Invalid stock");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update stock: ${error.message}`);
  }

  revalidatePath("/admin");
}
