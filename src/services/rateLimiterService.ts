interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

class RateLimiterService {
  private readonly WINDOW_MS = 3600000; // 1 hour
  private readonly MAX_ATTEMPTS = 3;
  private readonly STORAGE_KEY = 'rate_limits';

  private getEntries(): Record<string, RateLimitEntry> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private saveEntries(entries: Record<string, RateLimitEntry>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
  }

  checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; msBeforeReset: number } {
    const now = Date.now();
    const entries = this.getEntries();
    const entry = entries[identifier];

    // Clean up expired entries
    this.cleanup();

    if (!entry) {
      // First attempt
      entries[identifier] = { count: 1, firstAttempt: now };
      this.saveEntries(entries);
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1, msBeforeReset: this.WINDOW_MS };
    }

    const timePassed = now - entry.firstAttempt;
    if (timePassed > this.WINDOW_MS) {
      // Reset window
      entries[identifier] = { count: 1, firstAttempt: now };
      this.saveEntries(entries);
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1, msBeforeReset: this.WINDOW_MS };
    }

    if (entry.count >= this.MAX_ATTEMPTS) {
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        msBeforeReset: this.WINDOW_MS - timePassed 
      };
    }

    // Increment attempt count
    entry.count += 1;
    this.saveEntries(entries);
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_ATTEMPTS - entry.count,
      msBeforeReset: this.WINDOW_MS - timePassed 
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = this.getEntries();
    const cleanEntries: Record<string, RateLimitEntry> = {};

    Object.entries(entries).forEach(([key, entry]) => {
      if (now - entry.firstAttempt < this.WINDOW_MS) {
        cleanEntries[key] = entry;
      }
    });

    this.saveEntries(cleanEntries);
  }
}

export const rateLimiterService = new RateLimiterService(); 