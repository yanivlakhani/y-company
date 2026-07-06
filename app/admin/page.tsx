import Link from "next/link";

import { OrdersDashboard } from "@/components/admin/orders-dashboard";
import { requireAdmin } from "@/lib/admin-auth";
import type { OrderRecord, ProductStockRow } from "@/lib/admin/orders";
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
        .select("id, name, gender, accessory_type, folder_index, stock")
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
        products={(products ?? []) as ProductStockRow[]}
      />
    </div>
  );
}
