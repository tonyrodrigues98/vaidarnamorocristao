import { p256 } from "@noble/curves/nist.js";

const P256_ORDER = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  if (!BASE64URL_RE.test(value)) return null;
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return new Uint8Array(Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
}

function bytesToBigInt(bytes: Uint8Array) {
  return BigInt(`0x${Buffer.from(bytes).toString("hex") || "0"}`);
}

function bigIntTo32Bytes(value: bigint) {
  const hex = value.toString(16).padStart(64, "0");
  return new Uint8Array(Buffer.from(hex, "hex"));
}

function isValidP256Scalar(bytes: Uint8Array) {
  if (bytes.length !== 32) return false;
  const value = bytesToBigInt(bytes);
  return value > 0n && value < P256_ORDER;
}

function extractRawScalarFromPkcs8(bytes: Uint8Array) {
  for (let index = 0; index < bytes.length - 34; index += 1) {
    if (bytes[index] === 0x04 && bytes[index + 1] === 0x20) {
      const scalar = bytes.slice(index + 2, index + 34);
      if (isValidP256Scalar(scalar)) return scalar;
    }
  }
  return null;
}

async function deriveScalarFromSeed(seed: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)));
  const scalar = (bytesToBigInt(digest) % (P256_ORDER - 1n)) + 1n;
  return bigIntTo32Bytes(scalar);
}

async function getPrivateScalar() {
  const configured = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  if (!configured) throw new Error("WEB_PUSH_PRIVATE_KEY missing");

  const decoded = base64UrlToBytes(configured);
  if (decoded) {
    if (isValidP256Scalar(decoded)) return decoded;
    const pkcs8Scalar = extractRawScalarFromPkcs8(decoded);
    if (pkcs8Scalar) return pkcs8Scalar;
  }

  return deriveScalarFromSeed(configured);
}

export async function getPushVapidDetails() {
  const privateScalar = await getPrivateScalar();
  const publicKey = p256.getPublicKey(privateScalar, false);

  return {
    subject: process.env.WEB_PUSH_SUBJECT || "mailto:contato@vaidarnamoro.com",
    publicKey: bytesToBase64Url(publicKey),
    privateKey: bytesToBase64Url(privateScalar),
  };
}