export type SemanticRecord = Readonly<Record<string, unknown>>;

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return '"__undefined__"';
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("Semantic checksums require finite numbers.");
  }
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
  return `{${entries.join(",")}}`;
}

export function createSemanticPayload(
  records: readonly SemanticRecord[],
  fields: readonly string[],
): string {
  if (fields.length === 0) throw new TypeError("At least one semantic field is required.");
  const uniqueFields = [...new Set(fields)].sort();
  const rows = records
    .map((record) =>
      canonicalize(Object.fromEntries(uniqueFields.map((field) => [field, record[field]]))),
    )
    .sort();
  return canonicalize({ fields: uniqueFields, rows });
}

export async function createSemanticChecksum(
  records: readonly SemanticRecord[],
  fields: readonly string[],
  cryptoProvider: Crypto = globalThis.crypto,
): Promise<string> {
  if (!cryptoProvider?.subtle) {
    throw new Error("Web Crypto is required to produce a semantic checksum.");
  }
  const payload = new TextEncoder().encode(createSemanticPayload(records, fields));
  const digest = await cryptoProvider.subtle.digest("SHA-256", payload);
  const hexadecimal = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `sha256:${hexadecimal}`;
}
