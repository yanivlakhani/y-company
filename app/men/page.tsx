import { CatalogView } from "@/components/catalog/catalog-view";
import { getProductsByGender } from "@/lib/products";

export const revalidate = 30;

export default async function MenPage() {
  const products = await getProductsByGender("men");

  return <CatalogView gender="men" products={products} />;
}
