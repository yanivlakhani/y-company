import Link from "next/link";

import { PageNav } from "@/components/page-nav";

export default function SuccessPage() {
  return (
    <>
      <PageNav variant="women" />

      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fdfbfc] px-6 pt-16 text-stone-500">
        <div className="max-w-md space-y-8 text-center">
          <h1 className="text-sm lowercase tracking-[0.3em] text-stone-600">
            thank you
          </h1>
          <p className="text-xs lowercase leading-relaxed tracking-[0.2em]">
            your order is confirmed. we will be in touch shortly.
          </p>
          <Link
            href="/"
            className="inline-block text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70"
          >
            return home
          </Link>
        </div>
      </div>
    </>
  );
}
