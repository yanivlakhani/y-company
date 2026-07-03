import type { ProductPublic } from "@/lib/types/product";

type MockProduct = ProductPublic & { stock: number };

const mockProducts: MockProduct[] = [
  {
    id: "11111111-1111-4111-8111-111111110001",
    gender: "men",
    accessory_type: "bracelets",
    folder_index: 1,
    slug: "matte-black-bracelet",
    name: "matte black bracelet",
    material: "316l stainless steel and matte volcanic obsidian",
    properties: ["custom steel clasp", "waterproof", "sweat-resistant"],
    description:
      "a heavy industrial link stack engineered for daily wear",
    price_fils: 12900,
    stock: 45,
    thumb_url: "/placeholders/men/bracelets/1/thumb.svg",
    lookbook_url: "/placeholders/men/bracelets/1/lookbook.svg",
    created_at: null,
  },
  {
    id: "11111111-1111-4111-8111-111111110002",
    gender: "men",
    accessory_type: "rings",
    folder_index: 1,
    slug: "brushed-steel-signet",
    name: "brushed steel signet",
    material: "316l stainless steel",
    properties: ["waterproof", "sweat-resistant"],
    description: "a flat signet band with a brushed steel finish",
    price_fils: 8900,
    stock: 30,
    thumb_url: "/placeholders/men/rings/1/thumb.svg",
    lookbook_url: "/placeholders/men/rings/1/lookbook.svg",
    created_at: null,
  },
  {
    id: "11111111-1111-4111-8111-111111110003",
    gender: "men",
    accessory_type: "bracelets",
    folder_index: 2,
    slug: "chain-link-cuff",
    name: "chain link cuff",
    material: "316l stainless steel",
    properties: ["magnetic clasp", "waterproof", "sweat-resistant"],
    description: "a rigid cuff built from interlocked steel segments",
    price_fils: 14900,
    stock: 22,
    thumb_url: "/placeholders/men/bracelets/2/thumb.svg",
    lookbook_url: "/placeholders/men/bracelets/2/lookbook.svg",
    created_at: null,
  },
  {
    id: "22222222-2222-4222-8222-222222220001",
    gender: "women",
    accessory_type: "anklets",
    folder_index: 1,
    slug: "fine-chain-anklet",
    name: "fine chain anklet",
    material: "316l stainless steel",
    properties: ["waterproof", "sweat-resistant"],
    description: "a minimal chain anklet for daily wear",
    price_fils: 7900,
    stock: 38,
    thumb_url: "/placeholders/women/anklets/1/thumb.svg",
    lookbook_url: "/placeholders/women/anklets/1/lookbook.svg",
    created_at: null,
  },
  {
    id: "22222222-2222-4222-8222-222222220002",
    gender: "women",
    accessory_type: "bracelets",
    folder_index: 1,
    slug: "pearl-thread-bracelet",
    name: "pearl thread bracelet",
    material: "freshwater pearl and silk thread",
    properties: ["adjustable tie", "waterproof", "sweat-resistant"],
    description: "a single pearl suspended on a silk thread band",
    price_fils: 6900,
    stock: 50,
    thumb_url: "/placeholders/women/bracelets/1/thumb.svg",
    lookbook_url: "/placeholders/women/bracelets/1/lookbook.svg",
    created_at: null,
  },
  {
    id: "22222222-2222-4222-8222-222222220003",
    gender: "women",
    accessory_type: "rings",
    folder_index: 1,
    slug: "thin-stack-ring",
    name: "thin stack ring",
    material: "316l stainless steel",
    properties: ["waterproof", "sweat-resistant"],
    description: "a slim band designed to stack with others",
    price_fils: 5900,
    stock: 60,
    thumb_url: "/placeholders/women/rings/1/thumb.svg",
    lookbook_url: "/placeholders/women/rings/1/lookbook.svg",
    created_at: null,
  },
];

function toPublic(product: MockProduct): ProductPublic {
  return {
    id: product.id,
    gender: product.gender,
    accessory_type: product.accessory_type,
    folder_index: product.folder_index,
    slug: product.slug,
    name: product.name,
    material: product.material,
    properties: product.properties,
    description: product.description,
    price_fils: product.price_fils,
    thumb_url: product.thumb_url,
    lookbook_url: product.lookbook_url,
    created_at: product.created_at,
  };
}

export function getMockProductsByGender(gender: "men" | "women"): ProductPublic[] {
  return mockProducts.filter((p) => p.gender === gender).map(toPublic);
}

export function getMockProductById(id: string): ProductPublic | null {
  const product = mockProducts.find((p) => p.id === id);
  return product ? toPublic(product) : null;
}
