import {
  existsSync,
  readFileSync,
  readdirSync,
  type Dirent,
} from "fs";
import { join } from "path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const RAW_IMPORTS_DIR = join(process.cwd(), "raw-imports");
const BUCKET = "products";
const BASELINE_PROPERTIES = ["waterproof", "sweat-resistant"] as const;
const NUMBERED_IMAGE_PATTERN = /^(\d+)\.(png|jpe?g|webp)$/i;
const VALID_GENDERS = new Set(["men", "women"]);

type Gender = "men" | "women";

type NumberedImageFile = {
  index: number;
  fileName: string;
  extension: string;
};

type ParsedMetadata = {
  name: string;
  material: string | null;
  properties: string[];
  description: string | null;
  price_fils: number;
  defaultColor: string | null;
  stockByColor: Map<string, number>;
};

type ProductFolder = {
  gender: Gender;
  accessory_type: string;
  folder_index: number;
  folderPath: string;
};

type VariantSource = {
  color: string;
  folderPath: string;
  storagePrefix: string;
};

function loadEnvLocal(): void {
  const envPath = join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseMetadataLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return null;
  }

  return [trimmed.slice(0, spaceIndex), trimmed.slice(spaceIndex + 1).trim()];
}

function parsePropertiesValue(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mergeBaselineProperties(properties: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const property of [...properties, ...BASELINE_PROPERTIES]) {
    if (seen.has(property)) {
      continue;
    }

    seen.add(property);
    merged.push(property);
  }

  return merged;
}

function parseStockLineValue(
  value: string,
  folderPath: string,
): { color: string; stock: number } {
  const trimmed = value.trim();

  if (!trimmed.includes(" ")) {
    const stock = Number.parseInt(trimmed, 10);
    if (Number.isNaN(stock)) {
      throw new Error(`Invalid stock in ${folderPath}/metadata.txt: ${value}`);
    }

    return { color: "default", stock };
  }

  const lastSpace = trimmed.lastIndexOf(" ");
  const color = trimmed.slice(0, lastSpace).trim();
  const stock = Number.parseInt(trimmed.slice(lastSpace + 1).trim(), 10);

  if (!color || Number.isNaN(stock)) {
    throw new Error(`Invalid stock line in ${folderPath}/metadata.txt: ${value}`);
  }

  return { color, stock };
}

function parseMetadata(content: string, folderPath: string): ParsedMetadata {
  const fields: Record<string, string> = {};
  const stockByColor = new Map<string, number>();

  for (const line of content.split("\n")) {
    const parsed = parseMetadataLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;

    if (key === "stock") {
      const { color, stock } = parseStockLineValue(value, folderPath);
      stockByColor.set(color, stock);
      continue;
    }

    fields[key] = value;
  }

  if (!fields.name) {
    throw new Error(`Missing name in ${folderPath}/metadata.txt`);
  }

  const price = Number.parseInt(fields.price ?? "", 10);
  if (Number.isNaN(price)) {
    throw new Error(`Invalid price in ${folderPath}/metadata.txt`);
  }

  return {
    name: fields.name,
    material: fields.material ?? null,
    properties: mergeBaselineProperties(parsePropertiesValue(fields.properties)),
    description: fields.description ?? null,
    price_fils: price * 100,
    defaultColor: fields.default ?? null,
    stockByColor,
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumberedImageFile(fileName: string): NumberedImageFile | null {
  const match = fileName.match(NUMBERED_IMAGE_PATTERN);
  if (!match) {
    return null;
  }

  const index = Number.parseInt(match[1], 10);
  if (Number.isNaN(index)) {
    return null;
  }

  return {
    index,
    fileName,
    extension: match[2].toLowerCase(),
  };
}

function discoverNumberedImageFiles(folderPath: string): NumberedImageFile[] {
  const byIndex = new Map<number, NumberedImageFile>();

  for (const fileName of readdirSync(folderPath)) {
    const parsed = parseNumberedImageFile(fileName);
    if (!parsed) {
      continue;
    }

    const existing = byIndex.get(parsed.index);
    if (existing) {
      throw new Error(
        `Multiple numbered images for index ${parsed.index} in ${folderPath}: ${existing.fileName} and ${parsed.fileName}`,
      );
    }

    byIndex.set(parsed.index, parsed);
  }

  return [...byIndex.values()].sort((a, b) => a.index - b.index);
}

function contentTypeForExtension(extension: string): string {
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      throw new Error(`Unsupported image extension: ${extension}`);
  }
}

function listColorSubfolders(folderPath: string): string[] {
  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function assertVariantImages(folderPath: string, label: string): NumberedImageFile[] {
  const imageFiles = discoverNumberedImageFiles(folderPath);

  if (imageFiles.length === 0) {
    throw new Error(`No numbered image files found in ${label}`);
  }

  for (const image of imageFiles) {
    const imagePath = join(folderPath, image.fileName);
    if (!existsSync(imagePath)) {
      throw new Error(`Missing required file: ${imagePath}`);
    }
  }

  return imageFiles;
}

function assertMetadataExists(folderPath: string): void {
  const metadataPath = join(folderPath, "metadata.txt");
  if (!existsSync(metadataPath)) {
    throw new Error(`Missing required file: ${metadataPath}`);
  }
}

function discoverVariantSources(
  folder: ProductFolder,
): { variants: VariantSource[]; defaultColor: string; usesColorSubfolders: boolean } {
  assertMetadataExists(folder.folderPath);

  const colorSubfolders = listColorSubfolders(folder.folderPath);
  const looseImageFiles = discoverNumberedImageFiles(folder.folderPath);
  const storageBase = `${folder.gender}/${folder.accessory_type}/${folder.folder_index}`;

  if (colorSubfolders.length > 0 && looseImageFiles.length > 0) {
    throw new Error(
      `Mixed layout in ${folder.folderPath}: use color subfolders OR loose numbered images, not both`,
    );
  }

  if (colorSubfolders.length > 0) {
    const variants: VariantSource[] = colorSubfolders.map((color) => ({
      color,
      folderPath: join(folder.folderPath, color),
      storagePrefix: `${storageBase}/${color}`,
    }));

    for (const variant of variants) {
      assertVariantImages(variant.folderPath, variant.folderPath);
    }

    return {
      variants,
      defaultColor: colorSubfolders.length === 1 ? colorSubfolders[0] : "",
      usesColorSubfolders: true,
    };
  }

  if (looseImageFiles.length === 0) {
    throw new Error(`No images found anywhere in ${folder.folderPath}`);
  }

  assertVariantImages(folder.folderPath, folder.folderPath);

  return {
    variants: [
      {
        color: "default",
        folderPath: folder.folderPath,
        storagePrefix: storageBase,
      },
    ],
    defaultColor: "default",
    usesColorSubfolders: false,
  };
}

function resolveDefaultColor(
  folderPath: string,
  variants: VariantSource[],
  metadata: ParsedMetadata,
  inferredDefault: string,
): string {
  const colors = variants.map((variant) => variant.color);

  if (variants.length === 1) {
    return variants[0].color;
  }

  const defaultColor = metadata.defaultColor ?? inferredDefault;

  if (!defaultColor) {
    throw new Error(
      `Missing default color in ${folderPath}/metadata.txt for multi-variant product (${colors.join(", ")})`,
    );
  }

  if (!colors.includes(defaultColor)) {
    throw new Error(
      `Default color "${defaultColor}" not found in ${folderPath} (available: ${colors.join(", ")})`,
    );
  }

  return defaultColor;
}

function discoverProductFolders(): ProductFolder[] {
  if (!existsSync(RAW_IMPORTS_DIR)) {
    throw new Error(`Missing raw-imports directory at ${RAW_IMPORTS_DIR}`);
  }

  const folders: ProductFolder[] = [];

  for (const genderEntry of readdirSync(RAW_IMPORTS_DIR, { withFileTypes: true })) {
    if (!genderEntry.isDirectory() || !VALID_GENDERS.has(genderEntry.name)) {
      continue;
    }

    const gender = genderEntry.name as Gender;
    const genderPath = join(RAW_IMPORTS_DIR, gender);

    for (const typeEntry of readdirSync(genderPath, { withFileTypes: true })) {
      if (!typeEntry.isDirectory()) {
        continue;
      }

      const accessory_type = typeEntry.name;
      const typePath = join(genderPath, accessory_type);

      for (const indexEntry of readdirSync(typePath, { withFileTypes: true })) {
        if (!indexEntry.isDirectory()) {
          continue;
        }

        const folder_index = Number.parseInt(indexEntry.name, 10);
        if (Number.isNaN(folder_index)) {
          continue;
        }

        folders.push({
          gender,
          accessory_type,
          folder_index,
          folderPath: join(typePath, indexEntry.name),
        });
      }
    }
  }

  return folders.sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender.localeCompare(b.gender);
    }

    if (a.accessory_type !== b.accessory_type) {
      return a.accessory_type.localeCompare(b.accessory_type);
    }

    return a.folder_index - b.folder_index;
  });
}

async function uploadImage(
  supabase: SupabaseClient,
  localPath: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const fileBuffer = readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    upsert: true,
    contentType,
  });

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadVariantImages(
  supabase: SupabaseClient,
  variant: VariantSource,
): Promise<string[]> {
  const imageFiles = discoverNumberedImageFiles(variant.folderPath);
  const images: string[] = [];

  for (const image of imageFiles) {
    const localPath = join(variant.folderPath, image.fileName);
    const storagePath = `${variant.storagePrefix}/${image.index}.${image.extension}`;
    const publicUrl = await uploadImage(
      supabase,
      localPath,
      storagePath,
      contentTypeForExtension(image.extension),
    );
    images.push(publicUrl);
  }

  return images;
}

function initialStockForVariant(
  color: string,
  metadata: ParsedMetadata,
  folderPath: string,
): number {
  const stock = metadata.stockByColor.get(color);

  if (stock === undefined) {
    throw new Error(
      `Missing stock for variant "${color}" in ${folderPath}/metadata.txt (use "stock ${color} <n>" or "stock default <n>")`,
    );
  }

  return stock;
}

async function clearVariantDefaults(
  supabase: SupabaseClient,
  productId: string,
  folderPath: string,
): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .update({ is_default: false })
    .eq("product_id", productId);

  if (error) {
    throw new Error(
      `Failed to clear variant defaults for ${folderPath}: ${error.message}`,
    );
  }
}

async function removeStaleDefaultVariant(
  supabase: SupabaseClient,
  productId: string,
  activeColors: Set<string>,
  folderPath: string,
): Promise<boolean> {
  if (activeColors.has("default")) {
    return false;
  }

  const { data, error } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId)
    .eq("color", "default")
    .select("id");

  if (error) {
    throw new Error(
      `Failed to remove stale default variant for ${folderPath}: ${error.message}`,
    );
  }

  return (data?.length ?? 0) > 0;
}

async function setDefaultVariant(
  supabase: SupabaseClient,
  productId: string,
  defaultColor: string,
  folderPath: string,
): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .update({ is_default: true })
    .eq("product_id", productId)
    .eq("color", defaultColor);

  if (error) {
    throw new Error(
      `Failed to set default variant "${defaultColor}" for ${folderPath}: ${error.message}`,
    );
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const folders = discoverProductFolders();

  if (folders.length === 0) {
    throw new Error(`No product folders found under ${RAW_IMPORTS_DIR}`);
  }

  let productsInserted = 0;
  let productsUpdated = 0;
  let variantsInserted = 0;
  let variantsUpdated = 0;
  let variantsRemoved = 0;

  for (const folder of folders) {
    const metadataPath = join(folder.folderPath, "metadata.txt");
    const metadata = parseMetadata(
      readFileSync(metadataPath, "utf8"),
      folder.folderPath,
    );

    const {
      variants,
      defaultColor: inferredDefault,
      usesColorSubfolders,
    } = discoverVariantSources(folder);
    const defaultColor = resolveDefaultColor(
      folder.folderPath,
      variants,
      metadata,
      inferredDefault,
    );
    const activeColors = new Set(variants.map((variant) => variant.color));

    const productRow = {
      gender: folder.gender,
      accessory_type: folder.accessory_type,
      folder_index: folder.folder_index,
      slug: toSlug(metadata.name),
      name: metadata.name,
      material: metadata.material,
      properties: metadata.properties,
      description: metadata.description,
      price_fils: metadata.price_fils,
    };

    const { data: existingProduct, error: existingProductError } = await supabase
      .from("products")
      .select("id")
      .eq("gender", folder.gender)
      .eq("accessory_type", folder.accessory_type)
      .eq("folder_index", folder.folder_index)
      .maybeSingle();

    if (existingProductError) {
      throw new Error(
        `Failed to check existing product for ${folder.folderPath}: ${existingProductError.message}`,
      );
    }

    let productId: string;

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from("products")
        .update(productRow)
        .eq("id", existingProduct.id);

      if (updateError) {
        throw new Error(`Failed to update product ${folder.folderPath}: ${updateError.message}`);
      }

      productId = existingProduct.id;
      productsUpdated += 1;
      console.log(`updated product ${folder.folderPath}`);
    } else {
      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert(productRow)
        .select("id")
        .single();

      if (insertError || !insertedProduct) {
        throw new Error(`Failed to insert product ${folder.folderPath}: ${insertError?.message}`);
      }

      productId = insertedProduct.id;
      productsInserted += 1;
      console.log(`inserted product ${folder.folderPath}`);
    }

    await clearVariantDefaults(supabase, productId, folder.folderPath);

    if (usesColorSubfolders) {
      const removed = await removeStaleDefaultVariant(
        supabase,
        productId,
        activeColors,
        folder.folderPath,
      );

      if (removed) {
        variantsRemoved += 1;
        console.log(`  removed stale default variant (replaced by color subfolders)`);
      }
    }

    for (const variant of variants) {
      const images = await uploadVariantImages(supabase, variant);

      const { data: existingVariant, error: existingVariantError } = await supabase
        .from("product_variants")
        .select("id, stock")
        .eq("product_id", productId)
        .eq("color", variant.color)
        .maybeSingle();

      if (existingVariantError) {
        throw new Error(
          `Failed to check variant "${variant.color}" for ${folder.folderPath}: ${existingVariantError.message}`,
        );
      }

      const variantRow = {
        product_id: productId,
        color: variant.color,
        images,
        is_default: false,
      };

      if (existingVariant) {
        const { error: updateError } = await supabase
          .from("product_variants")
          .update(variantRow)
          .eq("id", existingVariant.id);

        if (updateError) {
          throw new Error(
            `Failed to update variant "${variant.color}" for ${folder.folderPath}: ${updateError.message}`,
          );
        }

        variantsUpdated += 1;
        console.log(
          `  updated variant ${variant.color} (stock preserved: ${existingVariant.stock})`,
        );
      } else {
        const stock = initialStockForVariant(variant.color, metadata, folder.folderPath);
        const { error: insertError } = await supabase
          .from("product_variants")
          .insert({ ...variantRow, stock });

        if (insertError) {
          throw new Error(
            `Failed to insert variant "${variant.color}" for ${folder.folderPath}: ${insertError.message}`,
          );
        }

        variantsInserted += 1;
        console.log(
          `  inserted variant ${variant.color} (stock set from metadata: ${stock})`,
        );
      }
    }

    await setDefaultVariant(supabase, productId, defaultColor, folder.folderPath);
    console.log(`  set default variant: ${defaultColor}`);
  }

  console.log(
    `done: ${productsInserted} products inserted, ${productsUpdated} products updated, ${variantsInserted} variants inserted, ${variantsUpdated} variants updated, ${variantsRemoved} variants removed, ${folders.length} product folders total`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
