import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// TODO: record a full order record (customer, line items) on checkout.session.completed.

type PurchasedItem = {
  id: string;
  qty: number;
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
      throw new Error("Invalid product id in session metadata");
    }

    if (!Number.isInteger(qty) || qty < 1) {
      throw new Error("Invalid quantity in session metadata");
    }

    return { id: item.id, qty };
  });
}

async function decrementStock(items: PurchasedItem[]): Promise<void> {
  const supabase = createAdminClient();

  for (const item of items) {
    const { data: product, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .maybeSingle();

    if (error || !product) {
      throw new Error(`Product not found for stock decrement: ${item.id}`);
    }

    const nextStock = Math.max(0, product.stock - item.qty);

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(`Failed to decrement stock for ${item.id}`);
    }
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

    claimed = true;
    const items = parsePurchasedItems(session.metadata ?? {});
    await decrementStock(items);

    return new Response("OK", { status: 200 });
  } catch (error) {
    if (claimed) {
      await releaseEventClaim(event.id);
    }

    console.error(error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
