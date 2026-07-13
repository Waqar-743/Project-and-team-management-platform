import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";
describe("authentication throttling", () => {
  it("rejects attempts above the configured limit", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 2)).toBe(true);
    expect(checkRateLimit(key, 2)).toBe(true);
    expect(checkRateLimit(key, 2)).toBe(false);
  });
});
