import { CatalogView } from "@/components/catalog/catalog-view";
import { getProductsByGender } from "@/lib/products";

export const revalidate = 30;

export default async function WomenPage() {
  const products = await getProductsByGender("women");

  return <CatalogView gender="women" products={products} />;
}
