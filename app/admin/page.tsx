import Link from "next/link";

import { OrdersDashboard } from "@/components/admin/orders-dashboard";
import { requireAdmin } from "@/lib/admin-auth";
import type { OrderRecord, ProductInventoryRow } from "@/lib/admin/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const supabase = createAdminClient();

  const [{ data: orders, error: ordersError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select(
          "id, name, gender, accessory_type, folder_index, product_variants (id, color, stock, is_default)",
        )
        .order("gender")
        .order("accessory_type")
        .order("folder_index"),
    ]);

  if (ordersError) {
    throw new Error(`Failed to load orders: ${ordersError.message}`);
  }

  if (productsError) {
    throw new Error(`Failed to load inventory: ${productsError.message}`);
  }

  const inventory: ProductInventoryRow[] = (products ?? []).map((product) => {
    const row = product as {
      id: string;
      name: string;
      gender: string;
      accessory_type: string;
      folder_index: number;
      product_variants: ProductInventoryRow["variants"] | null;
    };

    return {
      id: row.id,
      name: row.name,
      gender: row.gender,
      accessory_type: row.accessory_type,
      folder_index: row.folder_index,
      variants: row.product_variants ?? [],
    };
  });

  return (
    <div className="min-h-[100dvh] bg-[#fdfbfc] text-stone-500">
      <div className="fixed inset-x-0 top-0 z-30 flex justify-center pt-8 md:pt-12">
        <Link
          href="/"
          className="text-xs lowercase tracking-[0.3em] text-stone-500 transition-opacity duration-200 ease-out hover:opacity-70"
        >
          y company
        </Link>
      </div>

      <OrdersDashboard
        orders={(orders ?? []) as OrderRecord[]}
        products={inventory}
      />
    </div>
  );
}
