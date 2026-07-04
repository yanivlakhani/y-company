import type { Gender, ProductPublic } from "@/lib/types/product";

export function groupProductsByAccessoryType(
  products: ProductPublic[],
): { accessoryType: string; products: ProductPublic[] }[] {
  const groups: { accessoryType: string; products: ProductPublic[] }[] = [];
  const indexByType = new Map<string, number>();

  for (const product of products) {
    let index = indexByType.get(product.accessory_type);
    if (index === undefined) {
      index = groups.length;
      indexByType.set(product.accessory_type, index);
      groups.push({ accessoryType: product.accessory_type, products: [] });
    }
    groups[index].products.push(product);
  }

  return groups;
}

export function formatPriceAed(priceFils: number): string {
  return `aed ${priceFils / 100}`;
}

export function accessorySectionId(accessoryType: string): string {
  const slug = accessoryType
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `shop-${slug}`;
}

export function catalogTheme(gender: Gender) {
  if (gender === "men") {
    return {
      page: "bg-[#0c0c0e] text-zinc-400",
      surface: "bg-[#0c0c0e]",
      border: "border-zinc-800",
      heading: "text-zinc-300",
      cardHover: "hover:border-zinc-600",
    };
  }

  return {
    page: "bg-[#fdfbfc] text-stone-500",
    surface: "bg-[#fdfbfc]",
    border: "border-stone-200",
    heading: "text-stone-600",
    cardHover: "hover:border-stone-400",
  };
}
