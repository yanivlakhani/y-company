"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json();
        throw new Error(data.error ?? "login failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "login failed";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="admin-secret"
          className="block text-xs lowercase tracking-[0.3em] text-stone-600"
        >
          admin secret
        </label>
        <input
          id="admin-secret"
          name="secret"
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          className="w-full rounded-none border border-stone-200 bg-[#fdfbfc] px-4 py-3 text-xs lowercase tracking-[0.2em] text-stone-600 outline-none transition-colors duration-200 ease-out focus:border-stone-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !secret}
        className="w-full rounded-none border border-stone-200 px-4 py-3 text-xs lowercase tracking-[0.3em] text-stone-600 transition-opacity duration-200 ease-out hover:opacity-70 disabled:opacity-60"
      >
        {loading ? "signing in…" : "enter"}
      </button>

      {error ? (
        <p className="text-xs lowercase tracking-[0.2em] text-stone-500 opacity-60">
          {error}
        </p>
      ) : null}
    </form>
  );
}
