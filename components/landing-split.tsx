"use client";

import Image from "next/image";
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

  const menBrightness =
    activeHover === "men"
      ? "brightness-110"
      : activeHover === "women"
        ? "brightness-90"
        : "brightness-100";

  const womenBrightness =
    activeHover === "women"
      ? "brightness-110"
      : activeHover === "men"
        ? "brightness-90"
        : "brightness-100";

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
        className="relative flex min-h-[50dvh] flex-1 flex-col justify-end overflow-hidden rounded-none border-b border-zinc-800 bg-[#0c0c0e] p-8 transition-[flex-basis,filter] duration-200 ease-out md:min-h-0 md:border-b-0 md:border-r md:p-12"
        style={minMd ? { flex: `1 1 ${menFlexBasis}` } : undefined}
      >
        <Image
          src="/placeholders/model-men.svg"
          alt=""
          fill
          priority
          className={`object-cover object-center transition-[filter] duration-200 ease-out ${menBrightness}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="relative z-10 lowercase tracking-[0.3em] text-zinc-400">
          men
        </span>
      </Link>

      <Link
        href="/women"
        onMouseEnter={() => minMd && setHovered("women")}
        className="relative flex min-h-[50dvh] flex-1 flex-col justify-end overflow-hidden rounded-none bg-[#fdfbfc] p-8 transition-[flex-basis,filter] duration-200 ease-out md:min-h-0 md:p-12"
        style={minMd ? { flex: `1 1 ${womenFlexBasis}` } : undefined}
      >
        <Image
          src="/placeholders/model-women.svg"
          alt=""
          fill
          priority
          className={`object-cover object-center transition-[filter] duration-200 ease-out ${womenBrightness}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="relative z-10 lowercase tracking-[0.3em] text-stone-500">
          women
        </span>
      </Link>
    </main>
    </>
  );
}
