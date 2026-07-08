"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  accessorySectionId,
  catalogTheme,
  formatPriceAed,
  groupProductsByAccessoryType,
} from "@/lib/catalog";
import {
  getDefaultVariant,
  isProductFullySoldOut,
  type Gender,
  type ProductPublic,
} from "@/lib/types/product";

type CatalogViewProps = {
  gender: Gender;
  products: ProductPublic[];
};

const catalogNavTheme = {
  men: { wordmark: "text-zinc-400", back: "text-zinc-500" },
  women: { wordmark: "text-stone-500", back: "text-stone-400" },
} as const;

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

type CatalogProductCardProps = {
  product: ProductPublic;
  minMd: boolean;
  theme: ReturnType<typeof catalogTheme>;
};

function CatalogProductCard({ product, minMd, theme }: CatalogProductCardProps) {
  const [showAlt, setShowAlt] = useState(false);
  const defaultVariant = getDefaultVariant(product);
  const soldOut = isProductFullySoldOut(product);
  const primary = defaultVariant?.images[0];
  const secondary = defaultVariant?.images[1];
  const hasAlt = Boolean(secondary);

  const handleMouseEnter = () => {
    if (minMd && hasAlt) {
      setShowAlt(true);
    }
  };

  const handleMouseLeave = () => {
    if (minMd) {
      setShowAlt(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (minMd || !hasAlt || showAlt) {
      return;
    }

    event.preventDefault();
    setShowAlt(true);
  };

  return (
    <li>
      <Link
        href={`/product/${product.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`group block rounded-none border transition-colors duration-200 ease-out ${theme.border} ${theme.cardHover}`}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          {primary ? (
            <Image
              src={primary}
              alt=""
              fill
              className={`object-cover object-center transition-opacity duration-200 ease-out ${
                showAlt && hasAlt ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 45vw, 25vw"
            />
          ) : null}
          {secondary ? (
            <Image
              src={secondary}
              alt=""
              fill
              className={`object-cover object-center transition-opacity duration-200 ease-out ${
                showAlt ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 768px) 45vw, 25vw"
            />
          ) : null}
        </div>
        <div className="space-y-1 border-t p-3 md:p-4">
          <p className="text-xs lowercase tracking-[0.3em]">{product.name}</p>
          <p className="text-xs lowercase tracking-[0.2em]">
            {formatPriceAed(product.price_fils)}
          </p>
          {soldOut ? (
            <p className="text-xs lowercase tracking-[0.3em] opacity-60">
              sold out
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function scrollToAccessorySection(accessoryType: string): void {
  const section = document.getElementById(accessorySectionId(accessoryType));
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type CatalogStickyHeaderProps = {
  gender: Gender;
  groups: ReturnType<typeof groupProductsByAccessoryType>;
  theme: ReturnType<typeof catalogTheme>;
};

function CatalogStickyHeader({ gender, groups, theme }: CatalogStickyHeaderProps) {
  const navTheme = catalogNavTheme[gender];
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeight = () => setHeaderHeight(header.offsetHeight);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [groups.length]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 border-b ${theme.border} ${theme.surface}`}
      >
        <div className="relative">
          <div className="relative flex items-center justify-center px-6 pb-4 pt-8 md:px-10 md:pt-10">
            <Link
              href="/"
              className={`absolute left-6 top-8 text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 md:left-10 md:top-10 ${navTheme.back}`}
            >
              ← back
            </Link>
            <Link
              href="/"
              className={`text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 ${navTheme.wordmark}`}
            >
              y company
            </Link>
          </div>

          {groups.length > 0 ? (
            <nav
              aria-label="shop by category"
              className="flex flex-nowrap gap-3 overflow-x-auto px-6 pb-5 md:flex-wrap md:overflow-visible md:px-10 md:pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {groups.map(({ accessoryType }) => (
                <button
                  key={accessoryType}
                  type="button"
                  onClick={() => scrollToAccessorySection(accessoryType)}
                  className={`shrink-0 rounded-none border px-3 py-2 text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 ${theme.border}`}
                >
                  shop {accessoryType}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <div aria-hidden style={{ height: headerHeight }} />
    </>
  );
}

export function CatalogView({ gender, products }: CatalogViewProps) {
  const minMd = useMinMd();
  const theme = catalogTheme(gender);
  const groups = groupProductsByAccessoryType(products);

  return (
    <div className={`min-h-[100dvh] ${theme.page}`}>
      <CatalogStickyHeader gender={gender} groups={groups} theme={theme} />

      <div className="relative z-0 px-6 pb-10 pt-8 md:px-10 md:pb-12 md:pt-10">
        {groups.map(({ accessoryType, products: typeProducts }) => (
          <section
            key={accessoryType}
            id={accessorySectionId(accessoryType)}
            className="mb-12 scroll-mt-36 last:mb-0 md:scroll-mt-40"
          >
            <h2
              className={`mb-6 border-b pb-3 text-xs lowercase tracking-[0.3em] ${theme.border} ${theme.heading}`}
            >
              {accessoryType}
            </h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {typeProducts.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  minMd={minMd}
                  theme={theme}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
