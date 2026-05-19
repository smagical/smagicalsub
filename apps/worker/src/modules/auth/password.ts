const passwordIterations = 100_000;
const passwordHashAlgorithm = "pbkdf2-sha256";

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePasswordHash(password, salt, passwordIterations);

  return [passwordHashAlgorithm, String(passwordIterations), base64UrlEncode(salt), base64UrlEncode(hash)].join("$");
}

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, iterations, salt, hash] = storedHash.split("$");

  if (algorithm !== passwordHashAlgorithm || !iterations || !salt || !hash) {
    return false;
  }

  const expected = base64UrlDecode(hash);
  const actual = await derivePasswordHash(password, base64UrlDecode(salt), Number(iterations));

  return constantTimeEqual(actual, expected);
}

export async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

export function randomToken(prefix: string) {
  return `${prefix}_${base64UrlEncode(randomBytes(32))}`;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, key, 256);

  return new Uint8Array(bits);
}

function constantTimeEqual(actual: Uint8Array, expected: Uint8Array) {
  if (actual.length !== expected.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual[index] ^ expected[index];
  }

  return diff === 0;
}

function base64UrlEncode(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
