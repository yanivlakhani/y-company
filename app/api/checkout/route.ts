import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// TODO: Apple Pay domain verification on the deployed domain.

type CheckoutItem = {
  id: string;
  qty: number;
};

class CheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new CheckoutError("Checkout is not configured", 503);
  }

  return baseUrl.replace(/\/$/, "");
}

function parseCheckoutBody(body: unknown): CheckoutItem[] {
  if (!body || typeof body !== "object") {
    throw new CheckoutError("Invalid request body", 400);
  }

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length === 1 && keys[0] === "id") {
    if (typeof record.id !== "string" || !record.id) {
      throw new CheckoutError("Invalid product id", 400);
    }

    return [{ id: record.id, qty: 1 }];
  }

  if (keys.length === 1 && keys[0] === "items") {
    if (!Array.isArray(record.items) || record.items.length === 0) {
      throw new CheckoutError("Invalid items", 400);
    }

    return record.items.map((item) => {
      if (!item || typeof item !== "object") {
        throw new CheckoutError("Invalid item", 400);
      }

      const entry = item as Record<string, unknown>;
      const itemKeys = Object.keys(entry);

      if (
        itemKeys.length === 0 ||
        itemKeys.some((key) => key !== "id" && key !== "qty")
      ) {
        throw new CheckoutError("Invalid item shape", 400);
      }

      if (typeof entry.id !== "string" || !entry.id) {
        throw new CheckoutError("Invalid product id", 400);
      }

      const qty = entry.qty === undefined ? 1 : Number(entry.qty);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new CheckoutError("Invalid quantity", 400);
      }

      return { id: entry.id, qty };
    });
  }

  throw new CheckoutError("Invalid request body", 400);
}

export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!stripeSecretKey || !supabaseSecretKey) {
      throw new CheckoutError("Checkout is not configured", 503);
    }

    const items = parseCheckoutBody(await request.json());
    const supabase = createAdminClient();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, name, price_fils, stock")
        .eq("id", item.id)
        .maybeSingle();

      if (error || !product) {
        throw new CheckoutError("Product not found", 404);
      }

      if (product.stock < item.qty) {
        throw new CheckoutError("Product out of stock", 400);
      }

      lineItems.push({
        quantity: item.qty,
        price_data: {
          currency: "aed",
          unit_amount: product.price_fils,
          product_data: {
            name: product.name,
          },
        },
      });
    }

    const baseUrl = getBaseUrl();
    const primaryProductId = items[0].id;
    const cancelPath =
      items.length === 1 ? `/product/${primaryProductId}` : "/";

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        items: JSON.stringify(
          items.map(({ id, qty }) => ({
            id,
            qty,
          })),
        ),
      },
      // TODO: re-add shipping_options (e.g. next-day local courier) when shipping is enabled.
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}`,
    });

    if (!session.url) {
      throw new CheckoutError("Failed to create checkout session", 500);
    }

    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}
