import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? process.env.TURSO_DATABASE_URL ?? "100days-dev-secret";
}

/** Sign a slug into a tamper-proof cookie value: "<slug>.<hmac>". */
export function signSessionValue(slug: string): string {
  const sig = createHmac("sha256", sessionSecret()).update(slug).digest("base64url");
  return `${slug}.${sig}`;
}

/** Verify a signed cookie value and return the slug, or null if tampered. */
export function verifySessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const slug = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(slug).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? slug : null;
}

/** Hash a password into "salt:hash" (both hex) using scrypt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time check of a password against a stored "salt:hash" value. */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = await scrypt(password, salt, expected.length || KEYLEN);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
