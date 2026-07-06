import Link from "next/link";

import {
  setDefaultVariant,
  updateOrderStatus,
  updateVariantStock,
} from "@/app/admin/actions";
import {
  formatAmountAed,
  formatRelativeTime,
  formatShippingAddress,
  sortAdminVariants,
  type OrderRecord,
  type ProductInventoryRow,
  type VariantStockRow,
} from "@/lib/admin/orders";

type OrdersDashboardProps = {
  orders: OrderRecord[];
  products: ProductInventoryRow[];
};

function StatusActions({ order }: { order: OrderRecord }) {
  const nextStatus = order.status === "shipped" ? "unfulfilled" : "shipped";
  const label =
    order.status === "shipped" ? "mark unfulfilled" : "mark shipped";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-xs lowercase tracking-[0.2em]">{order.status}</span>
      <form action={updateOrderStatus}>
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="status" value={nextStatus} />
        <button
          type="submit"
          className="rounded-none border border-stone-200 px-3 py-2 text-xs lowercase tracking-[0.2em] transition-opacity duration-200 ease-out hover:opacity-70"
        >
          {label}
        </button>
      </form>
    </div>
  );
}

function VariantStockEditor({ variant }: { variant: VariantStockRow }) {
  return (
    <form action={updateVariantStock} className="flex items-center gap-2">
      <input type="hidden" name="variantId" value={variant.id} />
      <input
        type="number"
        name="stock"
        min={0}
        step={1}
        defaultValue={variant.stock}
        className="w-20 rounded-none border border-stone-200 bg-[#fdfbfc] px-2 py-1 text-xs lowercase tracking-[0.2em] text-stone-500"
      />
      <button
        type="submit"
        className="rounded-none border border-stone-200 px-2 py-1 text-xs lowercase tracking-[0.2em] transition-opacity duration-200 ease-out hover:opacity-70"
      >
        save
      </button>
    </form>
  );
}

function DefaultVariantControl({ variant }: { variant: VariantStockRow }) {
  if (variant.is_default) {
    return (
      <span className="text-xs lowercase tracking-[0.2em] text-stone-600">
        default
      </span>
    );
  }

  return (
    <form action={setDefaultVariant}>
      <input type="hidden" name="variantId" value={variant.id} />
      <button
        type="submit"
        className="rounded-none border border-stone-200 px-2 py-1 text-xs lowercase tracking-[0.2em] transition-opacity duration-200 ease-out hover:opacity-70"
      >
        set default
      </button>
    </form>
  );
}

export function OrdersDashboard({ orders, products }: OrdersDashboardProps) {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 md:px-10">
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <h1 className="text-sm lowercase tracking-[0.3em] text-stone-600">
          orders
        </h1>
        <p className="text-xs lowercase tracking-[0.2em]">
          {orders.length} total
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xs lowercase tracking-[0.3em] text-stone-600">
          inventory
        </h2>
        <div className="overflow-x-auto border border-stone-200">
          <table className="w-full min-w-[800px] text-left text-xs lowercase tracking-[0.2em]">
            <thead className="border-b border-stone-200 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-normal">product</th>
                <th className="px-4 py-3 font-normal">gender</th>
                <th className="px-4 py-3 font-normal">type</th>
                <th className="px-4 py-3 font-normal">color</th>
                <th className="px-4 py-3 font-normal">stock</th>
                <th className="px-4 py-3 font-normal">default</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variants = sortAdminVariants(product.variants);

                if (variants.length === 0) {
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-stone-200 last:border-b-0"
                    >
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">{product.gender}</td>
                      <td className="px-4 py-3">{product.accessory_type}</td>
                      <td className="px-4 py-3 opacity-60" colSpan={3}>
                        no variants
                      </td>
                    </tr>
                  );
                }

                return variants.map((variant, index) => (
                  <tr
                    key={variant.id}
                    className="border-b border-stone-200 last:border-b-0"
                  >
                    {index === 0 ? (
                      <>
                        <td
                          className="px-4 py-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.name}
                        </td>
                        <td
                          className="px-4 py-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.gender}
                        </td>
                        <td
                          className="px-4 py-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.accessory_type}
                        </td>
                      </>
                    ) : null}
                    <td className="px-4 py-3">{variant.color}</td>
                    <td className="px-4 py-3">
                      <VariantStockEditor variant={variant} />
                    </td>
                    <td className="px-4 py-3">
                      <DefaultVariantControl variant={variant} />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs lowercase tracking-[0.3em] text-stone-600">
          recent orders
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs lowercase tracking-[0.2em] opacity-60">
            no orders yet
          </p>
        ) : (
          <ul className="space-y-6">
            {orders.map((order) => (
              <li
                key={order.id}
                className="space-y-4 border border-stone-200 p-4 md:p-6"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs lowercase tracking-[0.2em] text-stone-600">
                      {formatRelativeTime(order.created_at)}
                    </p>
                    <p className="text-xs lowercase tracking-[0.2em]">
                      {formatAmountAed(order.amount_total_fils, order.currency)}
                    </p>
                  </div>
                  <StatusActions order={order} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs lowercase tracking-[0.3em] text-stone-600">
                      items
                    </p>
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li
                          key={`${order.id}-${item.variant_id ?? item.product_id}`}
                          className="text-xs lowercase tracking-[0.2em]"
                        >
                          {item.name}
                          {item.color && item.color !== "default"
                            ? ` — ${item.color}`
                            : ""}{" "}
                          × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs lowercase tracking-[0.3em] text-stone-600">
                        email
                      </p>
                      <p className="text-xs lowercase tracking-[0.2em]">
                        {order.email ?? "—"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs lowercase tracking-[0.3em] text-stone-600">
                        shipping
                      </p>
                      <p className="text-xs lowercase leading-relaxed tracking-[0.2em]">
                        {formatShippingAddress(order.shipping_address)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs lowercase tracking-[0.2em]">
        <Link
          href="/"
          className="transition-opacity duration-200 ease-out hover:opacity-70"
        >
          ← storefront
        </Link>
      </p>
    </div>
  );
}
