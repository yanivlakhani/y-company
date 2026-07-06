import {
  mapVariantRow,
  sortVariants,
  type ProductPublic,
  type ProductVariantRow,
} from "@/lib/types/product";

type MockProduct = Omit<ProductPublic, "variants"> & {
  variants: ProductVariantRow[];
};

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
    created_at: null,
    variants: [
      {
        id: "11111111-1111-4111-8111-111111110011",
        color: "black",
        images: [
          "/placeholders/men/bracelets/1/black/1.svg",
          "/placeholders/men/bracelets/1/black/2.svg",
        ],
        is_default: true,
        stock: 45,
      },
      {
        id: "11111111-1111-4111-8111-111111110012",
        color: "gold",
        images: ["/placeholders/men/bracelets/1/gold/1.svg"],
        is_default: false,
        stock: 0,
      },
    ],
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
    created_at: null,
    variants: [
      {
        id: "11111111-1111-4111-8111-111111110021",
        color: "default",
        images: ["/placeholders/men/rings/1/1.svg"],
        is_default: true,
        stock: 30,
      },
    ],
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
    created_at: null,
    variants: [
      {
        id: "11111111-1111-4111-8111-111111110031",
        color: "default",
        images: [
          "/placeholders/men/bracelets/2/1.svg",
          "/placeholders/men/bracelets/2/2.svg",
          "/placeholders/men/bracelets/2/3.svg",
        ],
        is_default: true,
        stock: 22,
      },
    ],
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
    created_at: null,
    variants: [
      {
        id: "22222222-2222-4222-8222-222222220011",
        color: "default",
        images: ["/placeholders/women/anklets/1/1.svg"],
        is_default: true,
        stock: 38,
      },
    ],
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
    created_at: null,
    variants: [
      {
        id: "22222222-2222-4222-8222-222222220021",
        color: "silver",
        images: [
          "/placeholders/women/bracelets/1/silver/1.svg",
          "/placeholders/women/bracelets/1/silver/2.svg",
        ],
        is_default: true,
        stock: 50,
      },
      {
        id: "22222222-2222-4222-8222-222222220022",
        color: "rose",
        images: ["/placeholders/women/bracelets/1/rose/1.svg"],
        is_default: false,
        stock: 0,
      },
    ],
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
    created_at: null,
    variants: [
      {
        id: "22222222-2222-4222-8222-222222220031",
        color: "default",
        images: [
          "/placeholders/women/rings/1/1.svg",
          "/placeholders/women/rings/1/2.svg",
          "/placeholders/women/rings/1/3.svg",
        ],
        is_default: true,
        stock: 60,
      },
    ],
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
    created_at: product.created_at,
    variants: sortVariants(product.variants.map(mapVariantRow)),
  };
}

export function getMockProductsByGender(gender: "men" | "women"): ProductPublic[] {
  return mockProducts.filter((p) => p.gender === gender).map(toPublic);
}

export function getMockProductById(id: string): ProductPublic | null {
  const product = mockProducts.find((p) => p.id === id);
  return product ? toPublic(product) : null;
}
