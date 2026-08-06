import { beforeEach, describe, expect, it, vi } from "vitest";

const createSignedUrl = vi.fn();
const getPublicUrl = vi.fn((path: string) => ({
  data: { publicUrl: `https://supabase.test/storage/v1/object/public/current/${path}` },
}));

vi.mock("../src/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn((bucket: string) => ({
        createSignedUrl: (path: string, ttl: number) => createSignedUrl(bucket, path, ttl),
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://supabase.test/storage/v1/object/public/${bucket}/${path}`,
          },
        }),
      })),
    },
  },
}));

describe("selective V1 recovery media policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves public profile photos as stable public URLs without signing", async () => {
    const { classifyProfilePhotoSource, refreshSignedProfilePhoto } =
      await import("../src/lib/photoUrl");

    const source = classifyProfilePhotoSource("avatars/user-a/main.webp");
    expect(source).toEqual({
      kind: "public",
      path: "avatars/user-a/main.webp",
      url: "https://supabase.test/storage/v1/object/public/profile-photos/avatars/user-a/main.webp",
    });

    await expect(refreshSignedProfilePhoto("avatars/user-a/main.webp", "user-a")).resolves.toBe(
      source.url,
    );
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("serves public pet images as stable public URLs without signing", async () => {
    const { classifyPetMediaSource, resolvePetImage } = await import("../src/lib/petCatalog");

    const source = classifyPetMediaSource("catalog/dogs/golden.webp");
    expect(source).toMatchObject({
      kind: "public",
      path: "catalog/dogs/golden.webp",
      url: "https://supabase.test/storage/v1/object/public/pets/catalog/dogs/golden.webp",
    });

    await expect(resolvePetImage("catalog/dogs/golden.webp")).resolves.toBe(source.url);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("converts legacy signed profile and pet URLs into stable public URLs", async () => {
    const { classifyProfilePhotoSource } = await import("../src/lib/photoUrl");
    const { classifyPetMediaSource, resolvePetDisplayImage } =
      await import("../src/lib/petCatalog");

    expect(
      classifyProfilePhotoSource(
        "https://supabase.test/storage/v1/object/sign/profile-photos/avatars/user-a/main.webp?token=expired",
      ),
    ).toMatchObject({
      kind: "public",
      url: "https://supabase.test/storage/v1/object/public/profile-photos/avatars/user-a/main.webp",
    });
    expect(
      classifyPetMediaSource(
        "https://supabase.test/storage/v1/object/sign/pets/catalog/cats/mila.webp?token=expired",
      ),
    ).toMatchObject({
      kind: "public",
      url: "https://supabase.test/storage/v1/object/public/pets/catalog/cats/mila.webp",
    });
    expect(resolvePetDisplayImage({ image_url: "catalog/cats/mila.webp" }, undefined)).toBe(
      "https://supabase.test/storage/v1/object/public/pets/catalog/cats/mila.webp",
    );
  });

  it("uses signed URLs only for explicitly private media and deduplicates concurrent requests", async () => {
    const { clearPrivateSignedUrlCache, getCachedPrivateSignedUrl } =
      await import("../src/lib/privateSignedUrlCache");
    clearPrivateSignedUrlCache();
    const signer = vi.fn(async () => "https://signed.test/doc.webp?token=one");

    const first = getCachedPrivateSignedUrl({
      bucket: "private-docs",
      path: "user-a/doc.webp",
      userId: "user-a",
      ttlSeconds: 3600,
      signer,
    });
    const second = getCachedPrivateSignedUrl({
      bucket: "private-docs",
      path: "user-a/doc.webp",
      userId: "user-a",
      ttlSeconds: 3600,
      signer,
    });

    expect(first.pending).toBe(second.pending);
    await expect(first.pending).resolves.toBe("https://signed.test/doc.webp?token=one");
    expect(signer).toHaveBeenCalledTimes(1);
  });

  it("does not reuse private signed URLs across users and renews expired entries", async () => {
    const { clearPrivateSignedUrlCache, getCachedPrivateSignedUrl } =
      await import("../src/lib/privateSignedUrlCache");
    clearPrivateSignedUrlCache();
    const signer = vi
      .fn()
      .mockResolvedValueOnce("https://signed.test/a")
      .mockResolvedValueOnce("https://signed.test/b")
      .mockResolvedValueOnce("https://signed.test/a-renewed");

    await getCachedPrivateSignedUrl({
      bucket: "private-docs",
      path: "doc.webp",
      userId: "user-a",
      ttlSeconds: 3600,
      signer,
      now: 1_000,
    }).pending;
    await getCachedPrivateSignedUrl({
      bucket: "private-docs",
      path: "doc.webp",
      userId: "user-b",
      ttlSeconds: 3600,
      signer,
      now: 1_000,
    }).pending;
    await getCachedPrivateSignedUrl({
      bucket: "private-docs",
      path: "doc.webp",
      userId: "user-a",
      ttlSeconds: 3600,
      signer,
      now: Date.now() + 4_000_000,
      forceRefresh: true,
    }).pending;

    expect(signer).toHaveBeenCalledTimes(3);
  });
});
