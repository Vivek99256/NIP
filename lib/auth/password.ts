import crypto from "crypto";

/**
 * Hash password using Node.js crypto scrypt with random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verify plaintext password against stored hash (or fallback plain text for dev seed)
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !password) return false;

  // Verify salted scrypt hash
  if (storedHash.includes(":")) {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
      const bufA = Buffer.from(key, "hex");
      const bufB = Buffer.from(derivedKey, "hex");
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  // Plaintext fallback for development seeds
  return password === storedHash;
}

