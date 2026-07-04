"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  catalogTheme,
  formatPriceAed,
  groupProductsByAccessoryType,
} from "@/lib/catalog";
import type { Gender, ProductPublic } from "@/lib/types/product";

import { PageNav } from "@/components/page-nav";

type CatalogViewProps = {
  gender: Gender;
  products: ProductPublic[];
};

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
  const primary = product.images[0];
  const secondary = product.images[1];
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
        </div>
      </Link>
    </li>
  );
}

export function CatalogView({ gender, products }: CatalogViewProps) {
  const minMd = useMinMd();
  const theme = catalogTheme(gender);
  const groups = groupProductsByAccessoryType(products);

  return (
    <>
      <PageNav variant={gender} backHref="/" />

      <div className={`min-h-[100dvh] ${theme.page}`}>
        <div className="px-6 pb-10 pt-16 md:px-10 md:pb-12 md:pt-20">
          {groups.map(({ accessoryType, products: typeProducts }) => (
            <section key={accessoryType} className="mb-12 last:mb-0">
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
    </>
  );
}
