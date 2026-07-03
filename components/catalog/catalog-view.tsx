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

export function CatalogView({ gender, products }: CatalogViewProps) {
  const minMd = useMinMd();
  const [activeId, setActiveId] = useState<string | null>(null);
  const theme = catalogTheme(gender);
  const groups = groupProductsByAccessoryType(products);
  const modelSrc =
    gender === "men"
      ? "/placeholders/model-men.svg"
      : "/placeholders/model-women.svg";

  const handleGridMouseLeave = () => {
    if (minMd) {
      setActiveId(null);
    }
  };

  const handleCardMouseEnter = (id: string) => {
    if (minMd) {
      setActiveId(id);
    }
  };

  const handleCardClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (minMd) {
      return;
    }

    if (activeId !== id) {
      event.preventDefault();
      setActiveId(id);
    }
  };

  return (
    <>
      <PageNav variant={gender} backHref="/" />

      <div className={`flex min-h-[100dvh] flex-col md:flex-row ${theme.page}`}>
      <aside className="sticky top-0 z-10 h-[45dvh] w-full shrink-0 md:h-[100dvh] md:w-1/2 lg:w-[45%]">
        <div className="relative h-full w-full">
          <Image
            src={modelSrc}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
          {products.map((product) =>
            product.lookbook_url ? (
              <Image
                key={product.id}
                src={product.lookbook_url}
                alt=""
                fill
                className={`object-cover object-center transition-opacity duration-200 ease-out ${
                  activeId === product.id ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            ) : null,
          )}
        </div>
      </aside>

      <div
        className="flex-1 px-6 pb-10 pt-16 md:px-10 md:pb-12 md:pt-20"
        onMouseLeave={handleGridMouseLeave}
      >
        {groups.map(({ accessoryType, products: typeProducts }) => (
          <section key={accessoryType} className="mb-12 last:mb-0">
            <h2
              className={`mb-6 border-b pb-3 text-xs lowercase tracking-[0.3em] ${theme.border} ${theme.heading}`}
            >
              {accessoryType}
            </h2>
            <ul className="grid grid-cols-2 gap-4 md:gap-6">
              {typeProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.id}`}
                    onMouseEnter={() => handleCardMouseEnter(product.id)}
                    onClick={(event) => handleCardClick(event, product.id)}
                    className={`group block rounded-none border transition-colors duration-200 ease-out ${theme.border} ${theme.cardHover}`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden">
                      {product.thumb_url ? (
                        <Image
                          src={product.thumb_url}
                          alt=""
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 45vw, 25vw"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-1 border-t p-3 md:p-4">
                      <p className="text-xs lowercase tracking-[0.3em]">
                        {product.name}
                      </p>
                      <p className="text-xs lowercase tracking-[0.2em]">
                        {formatPriceAed(product.price_fils)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
    </>
  );
}
