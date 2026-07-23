export type TrustedUrlOptions = {
  allowRelative?: boolean;
  allowedOrigins?: readonly string[];
};

const MAX_URL_LENGTH = 2_048;
const ALLOWED_BLOG_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "ul",
]);
const VOID_TAGS = new Set(["br"]);

function hasUnsafeUrlCharacters(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 || character === "\\";
  });
}

export function normalizeTrustedUrl(
  value: string | null | undefined,
  options: TrustedUrlOptions = {},
): string | null {
  const candidate = value?.trim();
  if (!candidate || candidate.length > MAX_URL_LENGTH || hasUnsafeUrlCharacters(candidate)) {
    return null;
  }

  if (options.allowRelative !== false && candidate.startsWith("/") && !candidate.startsWith("//")) {
    try {
      const parsed = new URL(candidate, "https://relative.invalid");
      if (parsed.origin !== "https://relative.invalid") return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  const allowedOrigins = new Set(
    (options.allowedOrigins ?? []).flatMap((origin) => {
      try {
        return [new URL(origin).origin];
      } catch {
        return [];
      }
    }),
  );
  if (allowedOrigins.size === 0 || !allowedOrigins.has(parsed.origin)) return null;
  return parsed.href;
}

export function normalizeTikTokProfileUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const candidate = trimmed.startsWith("@")
    ? `https://www.tiktok.com/${trimmed}`
    : /^[a-z0-9._-]+$/i.test(trimmed)
      ? `https://www.tiktok.com/@${trimmed}`
      : trimmed;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") return null;
    if (!["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&(?!(?:amp|lt|gt|quot|#39|#\d+|#x[a-f0-9]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function parseQuotedAttributes(raw: string) {
  const attributes = new Map<string, string>();
  let cursor = 0;

  while (cursor < raw.length) {
    const whitespace = /^\s+/.exec(raw.slice(cursor));
    if (whitespace) {
      cursor += whitespace[0].length;
      continue;
    }

    const match = /^([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(raw.slice(cursor));
    if (!match) return null;
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "");
    cursor += match[0].length;
  }

  return attributes;
}

function sanitizeBlogLink(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  if (/^#[a-z0-9_-]+$/i.test(candidate)) return candidate;

  const relative = normalizeTrustedUrl(candidate, { allowRelative: true });
  if (relative) return relative;

  try {
    const external = new URL(candidate);
    return external.protocol === "https:" ? external.href : null;
  } catch {
    return null;
  }
}

function sanitizeTag(token: string, openTags: string[]) {
  const match = /^<\s*(\/)?\s*([a-z0-9]+)([\s\S]*?)(\/?)\s*>$/i.exec(token);
  if (!match) return "";

  const closing = Boolean(match[1]);
  const tag = match[2].toLowerCase();
  if (!ALLOWED_BLOG_TAGS.has(tag)) return "";
  if (closing) {
    if (VOID_TAGS.has(tag) || openTags.at(-1) !== tag) return "";
    openTags.pop();
    return `</${tag}>`;
  }

  const attributes = parseQuotedAttributes(match[3]);
  if (!attributes) return "";
  if (tag !== "a") {
    if (!VOID_TAGS.has(tag)) openTags.push(tag);
    return `<${tag}>`;
  }

  const href = sanitizeBlogLink(attributes.get("href"));
  if (!href) return "";
  const title = attributes.get("title");
  openTags.push(tag);
  return `<a href="${escapeAttribute(href)}"${title ? ` title="${escapeAttribute(title)}"` : ""} target="_blank" rel="noopener noreferrer">`;
}

export function sanitizeBlogHtml(value: string) {
  const withoutExecutableBlocks = value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const openTags: string[] = [];
  const result = (withoutExecutableBlocks.match(/<[^>]*>|[^<]+/g) ?? [])
    .map((token) => (token.startsWith("<") ? sanitizeTag(token, openTags) : escapeHtml(token)))
    .join("");
  return `${result}${openTags
    .reverse()
    .map((tag) => `</${tag}>`)
    .join("")}`;
}
