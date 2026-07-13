const attempts = new Map<string, { count: number; reset: number }>();
export function checkRateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.reset < now) {
    attempts.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count++;
  return true;
}
