import { notFound } from "next/navigation";

import { PageNav } from "@/components/page-nav";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductById, getProductsByGender } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 30;

export async function generateStaticParams() {
  const [men, women] = await Promise.all([
    getProductsByGender("men"),
    getProductsByGender("women"),
  ]);

  return [...men, ...women].map((product) => ({ id: product.id }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const checkoutEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <>
      <PageNav variant={product.gender} backHref={`/${product.gender}`} />
      <ProductDetail product={product} checkoutEnabled={checkoutEnabled} />
    </>
  );
}
