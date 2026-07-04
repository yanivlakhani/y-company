import { catalogTheme, formatPriceAed } from "@/lib/catalog";
import type { ProductPublic } from "@/lib/types/product";

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

  return (
    <div className={`min-h-[100dvh] ${theme.page}`}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 pb-16 pt-16 md:grid-cols-2 md:gap-16 md:px-10 md:pb-20 md:pt-20">
        <ProductGallery images={product.images} borderClassName={theme.border} />

        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h1 className={`text-sm lowercase tracking-[0.3em] ${theme.heading}`}>
              {product.name}
            </h1>
            <p className="text-xs lowercase tracking-[0.2em]">
              {formatPriceAed(product.price_fils)}
            </p>
          </div>

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
            {checkoutEnabled ? (
              <CheckoutButton
                productId={product.id}
                className={`rounded-none border px-6 py-3 text-xs lowercase tracking-[0.3em] transition-opacity duration-200 ease-out hover:opacity-70 disabled:opacity-60 ${theme.border}`}
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
