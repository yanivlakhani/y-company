"use client";

import { useEffect, useState } from "react";

type CheckoutButtonProps = {
  variantId: string;
  className?: string;
  disabled?: boolean;
  soldOut?: boolean;
};

export function CheckoutButton({
  variantId,
  className,
  disabled = false,
  soldOut = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setLoading(false);
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleCheckout() {
    if (disabled || soldOut) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId }),
      });

      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "checkout failed");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "checkout failed";
      setError(message);
      setLoading(false);
    }
  }

  const isDisabled = disabled || soldOut || loading;
  const label = soldOut ? "sold out" : loading ? "redirecting…" : "express checkout";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isDisabled}
        className={className}
      >
        {label}
      </button>
      {error ? (
        <p className="text-xs lowercase tracking-[0.2em] opacity-60">{error}</p>
      ) : null}
    </div>
  );
}
