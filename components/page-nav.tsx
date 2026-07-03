import Link from "next/link";

import type { Gender } from "@/lib/types/product";

type PageNavProps = {
  variant: "landing" | Gender;
  backHref?: string;
};

const catalogNavTheme = {
  men: { wordmark: "text-zinc-400", back: "text-zinc-500" },
  women: { wordmark: "text-stone-500", back: "text-stone-400" },
} as const;

export function PageNav({ variant, backHref }: PageNavProps) {
  const wordmarkClass =
    variant === "landing"
      ? "text-white mix-blend-difference"
      : catalogNavTheme[variant].wordmark;
  const backClass =
    variant === "landing" ? undefined : catalogNavTheme[variant].back;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex justify-center pt-8 md:pt-12">
        <Link
          href="/"
          className={`text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 ${wordmarkClass}`}
        >
          y company
        </Link>
      </div>

      {backHref ? (
        <div className="fixed left-0 top-0 z-30 pt-8 pl-6 md:pt-12 md:pl-10">
          <Link
            href={backHref}
            className={`text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 ${backClass}`}
          >
            ← back
          </Link>
        </div>
      ) : null}
    </>
  );
}
