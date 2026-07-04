import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const RAW_IMPORTS_DIR = join(process.cwd(), "raw-imports");
const BUCKET = "products";
const BASELINE_PROPERTIES = ["waterproof", "sweat-resistant"] as const;
const NUMBERED_IMAGE_PATTERN = /^(\d+)\.png$/i;
const VALID_GENDERS = new Set(["men", "women"]);

type Gender = "men" | "women";

type ParsedMetadata = {
  name: string;
  material: string | null;
  properties: string[];
  description: string | null;
  price_fils: number;
  stock: number;
};

type ProductFolder = {
  gender: Gender;
  accessory_type: string;
  folder_index: number;
  folderPath: string;
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

function parseMetadata(content: string, folderPath: string): ParsedMetadata {
  const fields: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const parsed = parseMetadataLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    fields[key] = value;
  }

  if (!fields.name) {
    throw new Error(`Missing name in ${folderPath}/metadata.txt`);
  }

  const price = Number.parseInt(fields.price ?? "", 10);
  if (Number.isNaN(price)) {
    throw new Error(`Invalid price in ${folderPath}/metadata.txt`);
  }

  const stock = Number.parseInt(fields.stock ?? "", 10);
  if (Number.isNaN(stock)) {
    throw new Error(`Invalid stock in ${folderPath}/metadata.txt`);
  }

  return {
    name: fields.name,
    material: fields.material ?? null,
    properties: mergeBaselineProperties(parsePropertiesValue(fields.properties)),
    description: fields.description ?? null,
    price_fils: price * 100,
    stock,
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function discoverNumberedImageIndexes(folderPath: string): number[] {
  const indexes = readdirSync(folderPath)
    .map((fileName) => {
      const match = fileName.match(NUMBERED_IMAGE_PATTERN);
      if (!match) {
        return null;
      }

      return Number.parseInt(match[1], 10);
    })
    .filter((index): index is number => index !== null && !Number.isNaN(index));

  return [...new Set(indexes)].sort((a, b) => a - b);
}

function assertProductFolder(folderPath: string): number[] {
  const metadataPath = join(folderPath, "metadata.txt");
  if (!existsSync(metadataPath)) {
    throw new Error(`Missing required file: ${metadataPath}`);
  }

  const imageIndexes = discoverNumberedImageIndexes(folderPath);
  if (imageIndexes.length === 0) {
    throw new Error(`No numbered image files found in ${folderPath}`);
  }

  for (const index of imageIndexes) {
    const imagePath = join(folderPath, `${index}.png`);
    if (!existsSync(imagePath)) {
      throw new Error(`Missing required file: ${imagePath}`);
    }
  }

  return imageIndexes;
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
): Promise<string> {
  const fileBuffer = readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    upsert: true,
    contentType: "image/png",
  });

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
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

  let inserted = 0;
  let updated = 0;

  for (const folder of folders) {
    const imageIndexes = assertProductFolder(folder.folderPath);

    const metadataPath = join(folder.folderPath, "metadata.txt");
    const metadata = parseMetadata(
      readFileSync(metadataPath, "utf8"),
      folder.folderPath,
    );

    const storagePrefix = `${folder.gender}/${folder.accessory_type}/${folder.folder_index}`;
    const images: string[] = [];

    for (const index of imageIndexes) {
      const localPath = join(folder.folderPath, `${index}.png`);
      const publicUrl = await uploadImage(
        supabase,
        localPath,
        `${storagePrefix}/${index}.png`,
      );
      images.push(publicUrl);
    }

    const row = {
      gender: folder.gender,
      accessory_type: folder.accessory_type,
      folder_index: folder.folder_index,
      slug: toSlug(metadata.name),
      name: metadata.name,
      material: metadata.material,
      properties: metadata.properties,
      description: metadata.description,
      price_fils: metadata.price_fils,
      stock: metadata.stock,
      images,
    };

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id")
      .eq("gender", folder.gender)
      .eq("accessory_type", folder.accessory_type)
      .eq("folder_index", folder.folder_index)
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Failed to check existing row for ${folder.folderPath}: ${existingError.message}`,
      );
    }

    const { error: upsertError } = await supabase
      .from("products")
      .upsert(row, { onConflict: "gender,accessory_type,folder_index" });

    if (upsertError) {
      throw new Error(`Failed to upsert ${folder.folderPath}: ${upsertError.message}`);
    }

    if (existing) {
      updated += 1;
      console.log(`updated ${folder.folderPath}`);
    } else {
      inserted += 1;
      console.log(`inserted ${folder.folderPath}`);
    }
  }

  console.log(`done: ${inserted} inserted, ${updated} updated, ${folders.length} total`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
