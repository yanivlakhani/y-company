export type OrderItem = {
  variant_id?: string;
  product_id: string;
  name: string;
  color?: string | null;
  quantity: number;
  price_fils: number;
};

export type ShippingAddress = {
  name?: string;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type OrderRecord = {
  id: string;
  stripe_session_id: string;
  email: string | null;
  shipping_address: ShippingAddress | null;
  items: OrderItem[];
  amount_total_fils: number;
  currency: string;
  status: string;
  created_at: string;
};

export type VariantStockRow = {
  id: string;
  color: string;
  stock: number;
  is_default: boolean;
};

export type ProductInventoryRow = {
  id: string;
  name: string;
  gender: string;
  accessory_type: string;
  folder_index: number;
  variants: VariantStockRow[];
};

export function sortAdminVariants(
  variants: VariantStockRow[],
): VariantStockRow[] {
  return [...variants].sort((a, b) => {
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }

    return a.color.localeCompare(b.color);
  });
}

/** @deprecated Use ProductInventoryRow */
export type ProductStockRow = ProductInventoryRow;

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatShippingAddress(
  address: ShippingAddress | null,
): string {
  if (!address) {
    return "—";
  }

  const parts = [
    address.name,
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

export function formatAmountAed(amountFils: number, currency: string): string {
  return `${currency} ${amountFils / 100}`;
}
