interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  /**
   * Check and consume one hit from the rate limit.
   * @param key Identifier (e.g. `otp:req:+919876543210` or `otp:ip:127.0.0.1`)
   * @param maxHits Maximum allowed hits within window
   * @param windowMs Time window in milliseconds
   */
  public check(
    key: string,
    maxHits: number,
    windowMs: number
  ): { success: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // First request or window expired
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: maxHits - 1, resetInMs: windowMs };
    }

    if (entry.count >= maxHits) {
      return {
        success: false,
        remaining: 0,
        resetInMs: Math.max(0, entry.resetAt - now),
      };
    }

    entry.count += 1;
    return {
      success: true,
      remaining: maxHits - entry.count,
      resetInMs: Math.max(0, entry.resetAt - now),
    };
  }

  /**
   * Clear an entry (e.g., when an action is successfully verified)
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Prune stale entries periodically to prevent memory leaks
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
