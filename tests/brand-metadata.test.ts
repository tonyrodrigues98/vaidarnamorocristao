import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { brand } from "../src/config/brand";
import {
  inicioMetadata,
  instalarMetadata,
  liveHomeMetadata,
  lojaMetadata,
  rootMetadata,
} from "../src/config/route-metadata";
import {
  absoluteBrandUrl,
  canonicalUrl,
  createPrivatePageMetadata,
  createPublicPageMetadata,
  hasDuplicateMetadataKeys,
  metadataEntryKey,
  pageTitle,
  type MetadataEntry,
  type PageMetadata,
} from "../src/lib/metadata";

function entry(metadata: PageMetadata, key: string): MetadataEntry | undefined {
  return metadata.meta.find((item) => metadataEntryKey(item) === key);
}

function content(metadata: PageMetadata, key: string): string | undefined {
  const item = entry(metadata, key);
  if (!item || !("content" in item)) return undefined;
  return item.content;
}

describe("brand metadata contract", () => {
  it("builds absolute same-origin URLs and strips canonical fragments", () => {
    expect(absoluteBrandUrl("/loja")).toBe("https://vaidarnamoro.com/loja");
    expect(absoluteBrandUrl("https://vaidarnamoro.com/instalar")).toBe(
      "https://vaidarnamoro.com/instalar",
    );
    expect(canonicalUrl("/inicio?source=push#top")).toBe("https://vaidarnamoro.com/inicio");
    expect(() => absoluteBrandUrl("https://example.com/phishing")).toThrow(
      "Brand URLs must remain on the configured origin.",
    );
    expect(() => absoluteBrandUrl("//example.com/phishing")).toThrow(
      "Brand URLs must remain on the configured origin.",
    );
  });

  it("composes predictable titles without duplicating the brand", () => {
    expect(pageTitle("Loja")).toBe("Loja — VaiDarNamoro");
    expect(pageTitle("Instalar VaiDarNamoro")).toBe("Instalar VaiDarNamoro");
    expect(pageTitle("Caren | Vai Dar Namoro Cristão", true)).toBe(
      "Caren | Vai Dar Namoro Cristão",
    );
  });

  it("generates complete public Open Graph and Twitter metadata without duplicate keys", () => {
    const metadata = createPublicPageMetadata({
      title: "Página pública",
      description: "Descrição pública.",
      path: "/publica",
    });

    expect(hasDuplicateMetadataKeys(metadata.meta)).toBe(false);
    expect(content(metadata, "property:og:url")).toBe("https://vaidarnamoro.com/publica");
    expect(content(metadata, "property:og:image")).toBe("https://vaidarnamoro.com/og-image.jpg");
    expect(content(metadata, "name:twitter:card")).toBe("summary_large_image");
    expect(content(metadata, "name:twitter:image")).toBe("https://vaidarnamoro.com/og-image.jpg");
    expect(metadata.links).toEqual([
      { rel: "canonical", href: "https://vaidarnamoro.com/publica" },
    ]);
  });

  it("keeps private pages noindex and excludes social/canonical metadata", () => {
    const metadata = createPrivatePageMetadata({
      title: "Conta",
      description: "Dados da conta.",
      path: "/conta",
    });

    expect(content(metadata, "name:robots")).toBe("noindex, nofollow");
    expect(entry(metadata, "property:og:url")).toBeUndefined();
    expect(entry(metadata, "name:twitter:card")).toBeUndefined();
    expect(metadata.links).toBeUndefined();
  });

  it("references only official assets that exist in public", () => {
    for (const asset of Object.values(brand.assets)) {
      expect(asset.startsWith("/")).toBe(true);
      expect(existsSync(resolve(process.cwd(), "public", asset.slice(1)))).toBe(true);
    }
  });

  it("preserves the four sampled route contracts", () => {
    expect(entry(liveHomeMetadata, "title")).toEqual({
      title: "VaiDarNamoro — Comunidade cristã 18+",
    });
    expect(liveHomeMetadata.links).toContainEqual({
      rel: "canonical",
      href: "https://vaidarnamoro.com/",
    });
    expect(content(inicioMetadata, "name:robots")).toBe("noindex, nofollow");
    expect(content(lojaMetadata, "name:robots")).toBe("noindex, nofollow");
    expect(content(instalarMetadata, "name:robots")).toBe("noindex, follow");
    expect(content(instalarMetadata, "property:og:url")).toBe("https://vaidarnamoro.com/instalar");

    for (const metadata of [
      rootMetadata,
      liveHomeMetadata,
      inicioMetadata,
      lojaMetadata,
      instalarMetadata,
    ]) {
      expect(hasDuplicateMetadataKeys(metadata.meta)).toBe(false);
    }
  });
});
