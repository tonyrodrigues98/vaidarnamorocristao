import { brand } from "@/config/brand";

export type MetadataEntry =
  | { title: string }
  | { charSet: string }
  | { name: string; content: string; media?: string }
  | { property: string; content: string };

export type MetadataLink = {
  rel: string;
  href: string;
  as?: string;
  type?: string;
  sizes?: string;
  media?: string;
  crossOrigin?: "anonymous" | "use-credentials";
};

export type PageMetadata = {
  meta: MetadataEntry[];
  links?: MetadataLink[];
};

type RobotsPolicy = "public" | "private" | "noindex-follow";

export type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  robots?: RobotsPolicy;
  exactTitle?: boolean;
  social?: boolean;
  canonical?: boolean;
  image?: string;
  ogDescription?: string;
  twitterDescription?: string;
  keywords?: string;
};

const ROBOTS: Record<RobotsPolicy, string> = {
  public: "index, follow, max-image-preview:large, max-snippet:-1",
  private: "noindex, nofollow",
  "noindex-follow": "noindex, follow",
};

export function absoluteBrandUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (!value) throw new Error("A brand URL cannot be empty.");

  const url = new URL(value, `${brand.origin}/`);
  if (url.origin !== brand.origin) {
    throw new Error("Brand URLs must remain on the configured origin.");
  }

  return url.href;
}

export function canonicalUrl(path: string): string {
  const url = new URL(absoluteBrandUrl(path));
  url.search = "";
  url.hash = "";
  return url.href;
}

export function pageTitle(title: string, exact = false): string {
  if (exact || title.includes(brand.name) || title.includes(brand.displayName)) return title;
  return `${title} — ${brand.name}`;
}

export function metadataEntryKey(entry: MetadataEntry): string {
  if ("title" in entry) return "title";
  if ("charSet" in entry) return "charset";
  if ("name" in entry) return `name:${entry.name}`;
  return `property:${entry.property}`;
}

export function hasDuplicateMetadataKeys(entries: MetadataEntry[]): boolean {
  const keys = entries.map(metadataEntryKey);
  return new Set(keys).size !== keys.length;
}

export function createPageMetadata(options: PageMetadataOptions): PageMetadata {
  const robots = options.robots ?? "public";
  const title = pageTitle(options.title, options.exactTitle);
  const url = canonicalUrl(options.path);
  const social = options.social ?? robots === "public";
  const image = absoluteBrandUrl(options.image ?? brand.assets.socialImage);
  const meta: MetadataEntry[] = [
    { title },
    { name: "description", content: options.description },
    { name: "robots", content: ROBOTS[robots] },
  ];

  if (options.keywords) meta.push({ name: "keywords", content: options.keywords });

  if (social) {
    meta.push(
      { property: "og:title", content: title },
      { property: "og:description", content: options.ogDescription ?? options.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      {
        name: "twitter:description",
        content: options.twitterDescription ?? options.ogDescription ?? options.description,
      },
      { name: "twitter:image", content: image },
    );
  }

  if (hasDuplicateMetadataKeys(meta)) {
    throw new Error(`Duplicate metadata key generated for ${options.path}.`);
  }

  return {
    meta,
    links: options.canonical === false ? undefined : [{ rel: "canonical", href: url }],
  };
}

export function createPublicPageMetadata(
  options: Omit<PageMetadataOptions, "robots">,
): PageMetadata {
  return createPageMetadata({ ...options, robots: "public" });
}

export function createPrivatePageMetadata(
  options: Omit<PageMetadataOptions, "robots" | "social" | "canonical">,
): PageMetadata {
  return createPageMetadata({
    ...options,
    robots: "private",
    social: false,
    canonical: false,
  });
}
