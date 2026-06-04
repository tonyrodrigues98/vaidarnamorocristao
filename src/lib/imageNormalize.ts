/**
 * Normalize a user-picked image File for upload + AI verification.
 *
 * - Converts HEIC/HEIF (iPhone) to JPEG using heic2any, since browsers
 *   outside Safari can't decode HEIC with <img>/canvas, and the AI gateway
 *   does not accept HEIC.
 * - Re-encodes renderable images as compressed JPEG with bounded dimensions,
 *   so uploaded profile photos are stable on mobile browsers and not huge.
 * - Never throws: on failure returns the original file (we'd rather try the
 *   upload than block the user).
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.88;

function replaceExtension(name: string, fallback: string) {
  const base = (name || fallback).replace(/\.[^.]+$/i, "");
  return `${base || fallback}.jpg`;
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_decode_error"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

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
  let source: Blob = file;

  try {
    if (isHeic) {
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      source = Array.isArray(out) ? out[0] : out;
    }

    const img = await blobToImage(source);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await canvasToBlob(canvas);
    if (!blob) return file;
    return new File([blob], replaceExtension(file.name, "avatar"), { type: "image/jpeg" });
  } catch (e) {
    console.warn("Image normalization failed, sending original", e);
    return file;
  }
}
