"use client";

import { useState } from "react";

import { catalogTheme, formatPriceAed } from "@/lib/catalog";
import {
  getInitialSelectedVariant,
  isProductFullySoldOut,
  type ProductPublic,
  type VariantPublic,
} from "@/lib/types/product";

import { CheckoutButton } from "@/components/product/checkout-button";
import { ProductGallery } from "@/components/product/product-gallery";

type ProductDetailProps = {
  product: ProductPublic;
  checkoutEnabled: boolean;
};

function descriptionParagraphs(description: string | null): string[] {
  if (!description) {
    return [];
  }

  return description
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ProductDetail({ product, checkoutEnabled }: ProductDetailProps) {
  const theme = catalogTheme(product.gender);
  const paragraphs = descriptionParagraphs(product.description);
  const variants = product.variants;
  const showColorToggle = variants.length > 1;
  const fullySoldOut = isProductFullySoldOut(product);

  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getInitialSelectedVariant(product)?.id ?? "",
  );

  const selectedVariant: VariantPublic | null =
    variants.find((variant) => variant.id === selectedVariantId) ??
    getInitialSelectedVariant(product);

  const soldOut =
    fullySoldOut || (selectedVariant !== null && !selectedVariant.available);

  return (
    <div className={`min-h-[100dvh] ${theme.page}`}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 pb-16 pt-16 md:grid-cols-2 md:gap-16 md:px-10 md:pb-20 md:pt-20">
        <ProductGallery
          variantKey={selectedVariant?.id ?? "none"}
          images={selectedVariant?.images ?? []}
          borderClassName={theme.border}
        />

        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h1 className={`text-sm lowercase tracking-[0.3em] ${theme.heading}`}>
              {product.name}
            </h1>
            <p className="text-xs lowercase tracking-[0.2em]">
              {formatPriceAed(product.price_fils)}
            </p>
          </div>

          {showColorToggle ? (
            <div className="space-y-2">
              <p className={`text-xs lowercase tracking-[0.3em] ${theme.heading}`}>
                color
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant?.id;
                  const isUnavailable = !variant.available;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => {
                        if (!isUnavailable) {
                          setSelectedVariantId(variant.id);
                        }
                      }}
                      className={`rounded-none border px-3 py-2 text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out ${theme.border} ${
                        isUnavailable
                          ? "cursor-not-allowed line-through opacity-40"
                          : isSelected
                            ? "opacity-100"
                            : "opacity-60 hover:opacity-80"
                      }`}
                    >
                      {variant.color}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {product.material ? (
            <div className="space-y-2">
              <p className={`text-xs lowercase tracking-[0.3em] ${theme.heading}`}>
                material
              </p>
              <p className="text-xs lowercase tracking-[0.2em]">
                {product.material}
              </p>
            </div>
          ) : null}

          {product.properties.length > 0 ? (
            <div className="space-y-2">
              <p className={`text-xs lowercase tracking-[0.3em] ${theme.heading}`}>
                properties
              </p>
              <ul className="space-y-1">
                {product.properties.map((property) => (
                  <li
                    key={property}
                    className="text-xs lowercase tracking-[0.2em]"
                  >
                    {property}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-prose text-xs lowercase leading-relaxed tracking-[0.2em]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          <div className="pt-2">
            {checkoutEnabled && selectedVariant ? (
              <CheckoutButton
                variantId={selectedVariant.id}
                disabled={soldOut}
                soldOut={soldOut}
                className={`rounded-none border px-6 py-3 text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60 ${theme.border}`}
              />
            ) : (
              <p className="text-xs lowercase tracking-[0.3em] opacity-60">
                preview mode, checkout disabled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
