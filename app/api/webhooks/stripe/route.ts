import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PurchasedItem = {
  id: string;
  qty: number;
  product_id: string | null;
};

type OrderItem = {
  variant_id: string;
  product_id: string;
  name: string;
  color: string | null;
  quantity: number;
  price_fils: number;
};

function getStripe(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(stripeSecretKey);
}

function parsePurchasedItems(metadata: Stripe.Metadata): PurchasedItem[] {
  const rawItems = metadata.items;
  if (!rawItems) {
    throw new Error("Checkout session metadata missing items");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawItems);
  } catch {
    throw new Error("Checkout session metadata items is not valid JSON");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Checkout session metadata items is empty");
  }

  return parsed.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Invalid purchased item in session metadata");
    }

    const item = entry as Record<string, unknown>;
    const qty = Number(item.qty);

    if (typeof item.id !== "string" || !item.id) {
      throw new Error("Invalid variant id in session metadata");
    }

    if (!Number.isInteger(qty) || qty < 1) {
      throw new Error("Invalid quantity in session metadata");
    }

    const productId =
      typeof item.product_id === "string" && item.product_id
        ? item.product_id
        : null;

    return { id: item.id, qty, product_id: productId };
  });
}

async function orderAlreadyRecorded(sessionId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check existing order: ${error.message}`);
  }

  return Boolean(data);
}

async function decrementStock(items: PurchasedItem[]): Promise<void> {
  const supabase = createAdminClient();

  for (const item of items) {
    const { data: variant, error } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.id)
      .maybeSingle();

    if (error || !variant) {
      throw new Error(`Variant not found for stock decrement: ${item.id}`);
    }

    const nextStock = Math.max(0, variant.stock - item.qty);

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: nextStock })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(`Failed to decrement stock for variant ${item.id}`);
    }
  }
}

async function buildOrderItems(items: PurchasedItem[]): Promise<OrderItem[]> {
  const supabase = createAdminClient();
  const orderItems: OrderItem[] = [];

  for (const item of items) {
    const { data: variant, error } = await supabase
      .from("product_variants")
      .select("id, color, product_id, products (id, name, price_fils)")
      .eq("id", item.id)
      .maybeSingle();

    if (error || !variant) {
      throw new Error(`Variant not found for order record: ${item.id}`);
    }

    const product = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products;

    if (!product) {
      throw new Error(`Product not found for variant order record: ${item.id}`);
    }

    orderItems.push({
      variant_id: variant.id,
      product_id: product.id,
      name: product.name,
      color: variant.color ?? null,
      quantity: item.qty,
      price_fils: product.price_fils,
    });
  }

  return orderItems;
}

async function recordOrder(
  session: Stripe.Checkout.Session,
  orderItems: OrderItem[],
): Promise<void> {
  const supabase = createAdminClient();

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;

  const shippingDetails = session.collected_information?.shipping_details;
  const shippingAddress = shippingDetails
    ? {
        name: shippingDetails.name,
        line1: shippingDetails.address.line1,
        line2: shippingDetails.address.line2,
        city: shippingDetails.address.city,
        state: shippingDetails.address.state,
        postal_code: shippingDetails.address.postal_code,
        country: shippingDetails.address.country,
      }
    : (session.customer_details?.address ?? null);

  if (session.amount_total === null || session.currency === null) {
    throw new Error("Checkout session missing amount_total or currency");
  }

  const { error } = await supabase.from("orders").insert({
    stripe_session_id: session.id,
    email,
    shipping_address: shippingAddress,
    items: orderItems,
    amount_total_fils: session.amount_total,
    currency: session.currency,
    status: "unfulfilled",
  });

  if (error?.code === "23505") {
    return;
  }

  if (error) {
    throw new Error(`Failed to record order: ${error.message}`);
  }
}

async function claimEvent(
  eventId: string,
  sessionId: string,
): Promise<"claimed" | "duplicate"> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("stripe_webhook_events").insert({
    event_id: eventId,
    session_id: sessionId,
  });

  if (error?.code === "23505") {
    return "duplicate";
  }

  if (error) {
    throw new Error(`Failed to claim webhook event: ${error.message}`);
  }

  return "claimed";
}

async function releaseEventClaim(eventId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("stripe_webhook_events").delete().eq("event_id", eventId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook is not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("OK", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.id) {
    return new Response("Missing checkout session id", { status: 400 });
  }

  let claimed = false;

  try {
    const claim = await claimEvent(event.id, session.id);
    if (claim === "duplicate") {
      return new Response("OK", { status: 200 });
    }

    if (await orderAlreadyRecorded(session.id)) {
      return new Response("OK", { status: 200 });
    }

    claimed = true;

    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    const items = parsePurchasedItems(fullSession.metadata ?? {});
    await decrementStock(items);

    const orderItems = await buildOrderItems(items);
    await recordOrder(fullSession, orderItems);

    return new Response("OK", { status: 200 });
  } catch (error) {
    if (claimed) {
      await releaseEventClaim(event.id);
    }

    console.error(error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
