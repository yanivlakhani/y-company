"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageNav } from "@/components/page-nav";

type HoveredPanel = "men" | "women" | null;

function useMinMd() {
  const [minMd, setMinMd] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setMinMd(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return minMd;
}

export function LandingSplit() {
  const minMd = useMinMd();
  const [hovered, setHovered] = useState<HoveredPanel>(null);

  useEffect(() => {
    if (!minMd) {
      setHovered(null);
    }
  }, [minMd]);

  const activeHover = minMd ? hovered : null;

  const menFlexBasis =
    activeHover === "men" ? "53%" : activeHover === "women" ? "47%" : "50%";
  const womenFlexBasis =
    activeHover === "women" ? "53%" : activeHover === "men" ? "47%" : "50%";

  const menPanelTone =
    activeHover === "men"
      ? "bg-[#121214]"
      : activeHover === "women"
        ? "bg-[#08080a]"
        : "bg-[#0c0c0e]";

  const womenPanelTone =
    activeHover === "women"
      ? "bg-[#ffffff]"
      : activeHover === "men"
        ? "bg-[#f5f3f4]"
        : "bg-[#fdfbfc]";

  return (
    <>
      <PageNav variant="landing" />

      <main
        className="flex min-h-[100dvh] w-full flex-1 flex-col md:flex-row"
        onMouseLeave={() => setHovered(null)}
      >
        <Link
          href="/men"
          onMouseEnter={() => minMd && setHovered("men")}
          className={`relative flex min-h-[50dvh] flex-1 flex-col justify-end overflow-hidden rounded-none border-b border-zinc-800 p-8 transition-[flex-basis,background-color] duration-200 ease-out md:min-h-0 md:border-b-0 md:border-r md:p-12 ${menPanelTone}`}
          style={minMd ? { flex: `1 1 ${menFlexBasis}` } : undefined}
        >
          <span className="relative z-10 lowercase tracking-[0.3em] text-zinc-400">
            men
          </span>
        </Link>

        <Link
          href="/women"
          onMouseEnter={() => minMd && setHovered("women")}
          className={`relative flex min-h-[50dvh] flex-1 flex-col justify-end overflow-hidden rounded-none p-8 transition-[flex-basis,background-color] duration-200 ease-out md:min-h-0 md:p-12 ${womenPanelTone}`}
          style={minMd ? { flex: `1 1 ${womenFlexBasis}` } : undefined}
        >
          <span className="relative z-10 lowercase tracking-[0.3em] text-stone-500">
            women
          </span>
        </Link>
      </main>
    </>
  );
}
