// Web Push dispatcher using VAPID (RFC 8292) + aes128gcm (RFC 8291).
// Runs on Cloudflare Workers via Web Crypto — no native deps.

import { VAPID_PUBLIC_KEY } from "@/lib/pushVapid";

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
};

type Subscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function b64UrlToBytes(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function importVapidPrivateKey(privateKeyB64Url: string): Promise<CryptoKey> {
  const d = b64UrlToBytes(privateKeyB64Url);
  const pub = b64UrlToBytes(VAPID_PUBLIC_KEY); // uncompressed point 0x04 || X(32) || Y(32)
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error("invalid VAPID public key");
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: bytesToB64Url(d),
    x: bytesToB64Url(x),
    y: bytesToB64Url(y),
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
  ]);
}

function ecdsaDerToJose(der: Uint8Array): Uint8Array {
  // Web Crypto ECDSA already returns r||s concatenated (64 bytes), not DER. Safety guard.
  if (der.length === 64) return der;
  // Parse DER (SEQUENCE { INTEGER r, INTEGER s }) → 64-byte r||s.
  let i = 0;
  if (der[i++] !== 0x30) throw new Error("bad sig");
  if (der[i] & 0x80) i += (der[i] & 0x7f) + 1;
  else i++;
  if (der[i++] !== 0x02) throw new Error("bad sig r");
  let rLen = der[i++];
  let r = der.slice(i, i + rLen);
  i += rLen;
  if (der[i++] !== 0x02) throw new Error("bad sig s");
  let sLen = der[i++];
  let s = der.slice(i, i + sLen);
  if (r.length > 32) r = r.slice(r.length - 32);
  if (s.length > 32) s = s.slice(s.length - 32);
  const out = new Uint8Array(64);
  out.set(r, 32 - r.length);
  out.set(s, 64 - s.length);
  return out;
}

async function signVapidJwt(endpoint: string): Promise<string> {
  const privateKeyB64Url = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:contato@vaidarnamoro.com";
  if (!privateKeyB64Url) throw new Error("WEB_PUSH_PRIVATE_KEY missing");

  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };
  const enc = new TextEncoder();
  const headerB64 = bytesToB64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToB64Url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await importVapidPrivateKey(privateKeyB64Url);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput),
  );
  return `${signingInput}.${bytesToB64Url(ecdsaDerToJose(new Uint8Array(sig)))}`;
}

async function encryptPayload(
  payload: Uint8Array,
  uaPublicKey: Uint8Array, // p256dh raw uncompressed (65 bytes)
  authSecret: Uint8Array,
): Promise<{ body: Uint8Array; serverPublicKey: Uint8Array }> {
  // Generate ephemeral ECDH key pair.
  const ecdh = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const serverJwk = await crypto.subtle.exportKey("jwk", ecdh.publicKey);
  const serverPublicKey = concat(
    new Uint8Array([0x04]),
    b64UrlToBytes(serverJwk.x!),
    b64UrlToBytes(serverJwk.y!),
  );

  const uaKey = await crypto.subtle.importKey(
    "raw",
    uaPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: uaKey },
    ecdh.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedBits);

  // RFC 8291 — aes128gcm.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  // PRK_key = HKDF(authSecret, sharedSecret, "WebPush: info\0" || ua_public || as_public, 32)
  const keyInfo = concat(
    enc.encode("WebPush: info\0"),
    uaPublicKey,
    serverPublicKey,
  );
  const ikm = await hkdf(sharedSecret, authSecret, keyInfo, 32);

  // CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(ikm, salt, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  // NONCE = HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(ikm, salt, enc.encode("Content-Encoding: nonce\0"), 12);

  // Plaintext padded: payload || 0x02 (last record delimiter).
  const plaintext = concat(payload, new Uint8Array([0x02]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, plaintext),
  );

  // Header: salt(16) || rs(4, big-endian = 4096) || idlen(1) || keyid(idlen)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const header = concat(salt, rs, new Uint8Array([serverPublicKey.length]), serverPublicKey);
  return { body: concat(header, ciphertext), serverPublicKey };
}

export type SendResult = {
  endpoint: string;
  ok: boolean;
  status: number;
  removed?: boolean;
  error?: string;
};

export async function sendPushToSubscription(
  sub: Subscription,
  payload: PushPayload,
): Promise<SendResult> {
  try {
    const jwt = await signVapidJwt(sub.endpoint);
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const uaPublicKey = b64UrlToBytes(sub.p256dh);
    const authSecret = b64UrlToBytes(sub.auth);
    const { body } = await encryptPayload(payloadBytes, uaPublicKey, authSecret);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "2419200",
        Urgency: "normal",
      },
      body,
    });

    const removed = res.status === 404 || res.status === 410;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        endpoint: sub.endpoint,
        ok: false,
        status: res.status,
        removed,
        error: text.slice(0, 300),
      };
    }
    return { endpoint: sub.endpoint, ok: true, status: res.status };
  } catch (err) {
    return {
      endpoint: sub.endpoint,
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const results = await Promise.all(
    data.map((row) =>
      sendPushToSubscription(
        { endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
        payload,
      ),
    ),
  );

  const toRemove = results.filter((r) => r.removed).map((r) => r.endpoint);
  if (toRemove.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toRemove);
  }
  return results;
}