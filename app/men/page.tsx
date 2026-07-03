import { CatalogView } from "@/components/catalog/catalog-view";
import { getProductsByGender } from "@/lib/products";

export default async function MenPage() {
  const products = await getProductsByGender("men");

  return <CatalogView gender="men" products={products} />;
}
