/**
 * Normalize a user-picked image File for upload + AI verification.
 *
 * - Converts HEIC/HEIF (iPhone) to JPEG using heic2any, since browsers
 *   outside Safari can't decode HEIC with <img>/canvas, and the AI gateway
 *   does not accept HEIC.
 * - Leaves other formats unchanged.
 * - Never throws: on failure returns the original file (we'd rather try the
 *   upload than block the user).
 */
export async function normalizeImageFile(file: File): Promise<File> {
  const name = (file.name || "").toLowerCase();
  const mime = (file.type || "").toLowerCase();
  const isHeic =
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "image/heic-sequence" ||
    mime === "image/heif-sequence" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif");
  if (!isHeic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(out) ? out[0] : out;
    const newName = name.replace(/\.(heic|heif)(?:\?.*)?$/i, ".jpg") || "avatar.jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (e) {
    console.warn("HEIC conversion failed, sending original", e);
    return file;
  }
}
