import { supabase } from "@/integrations/supabase/client";
import type { Pet, PetRarity, UserPet, UserPetWithPet } from "@/types/pet";

const BUCKET = "pets";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 ano

function isStoragePath(value: string | null | undefined) {
  return !!value && !/^https?:\/\//i.test(value);
}

async function resolveImageUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (!isStoragePath(value)) return value;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(value, SIGNED_TTL);
  return data?.signedUrl ?? null;
}

async function hydratePet<T extends Pet>(pet: T): Promise<T> {
  const [image_url, preview_url] = await Promise.all([
    resolveImageUrl(pet.image_url),
    resolveImageUrl(pet.preview_url),
  ]);
  return { ...pet, image_url, preview_url };
}

async function hydratePets(pets: Pet[]): Promise<Pet[]> {
  return Promise.all(pets.map(hydratePet));
}

export async function listActivePets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydratePets((data ?? []) as Pet[]);
}

export async function listAllPetsAdmin(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return hydratePets((data ?? []) as Pet[]);
}

export async function listMyPets(userId: string): Promise<UserPetWithPet[]> {
  const { data, error } = await supabase
    .from("user_pets")
    .select("*, pet:pets(*)")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as UserPetWithPet[];
  return Promise.all(
    rows.map(async (r) => ({ ...r, pet: await hydratePet(r.pet) })),
  );
}

export async function getEquippedPet(userId: string): Promise<UserPetWithPet | null> {
  const { data, error } = await supabase
    .from("user_pets")
    .select("*, pet:pets(*)")
    .eq("user_id", userId)
    .eq("is_equipped", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as UserPetWithPet;
  return { ...row, pet: await hydratePet(row.pet) };
}

export async function claimPet(petId: string): Promise<UserPet> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Você precisa estar logado.");
  const { data, error } = await supabase
    .from("user_pets")
    .insert({ user_id: uid, pet_id: petId, is_equipped: false })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserPet;
}

export async function equipPet(userPetId: string): Promise<void> {
  const { error } = await supabase.rpc("equip_pet", { _user_pet_id: userPetId });
  if (error) throw error;
}

export async function renamePet(userPetId: string, customName: string | null): Promise<void> {
  const value = customName?.trim() ? customName.trim().slice(0, 30) : null;
  const { error } = await supabase
    .from("user_pets")
    .update({ custom_name: value })
    .eq("id", userPetId);
  if (error) throw error;
}

// ---------- Admin helpers ----------

export type PetWritable = {
  name: string;
  slug: string;
  species: string;
  description?: string | null;
  rarity: PetRarity;
  is_active?: boolean;
  sort_order?: number;
  image_url?: string | null;
};

export async function uploadPetImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext}`,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path; // armazenamos o storage path; URL é resolvida no read
}

export async function createPet(input: PetWritable): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return hydratePet(data as Pet);
}

export async function updatePet(id: string, patch: Partial<PetWritable>): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return hydratePet(data as Pet);
}

export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw error;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}