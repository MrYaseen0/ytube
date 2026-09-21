import { describe, it, expect } from "vitest";
import { sanitizeSearchQuery } from "./search";

describe("sanitizeSearchQuery", () => {
  it("leaves normal queries untouched", () => {
    expect(sanitizeSearchQuery("funny cats")).toBe("funny cats");
    expect(sanitizeSearchQuery("music 2024")).toBe("music 2024");
  });
  it("strips LIKE wildcards % and _", () => {
    expect(sanitizeSearchQuery("100%_coverage")).toBe("100coverage");
  });
  it("strips PostgREST filter metacharacters , ( ) \"", () => {
    expect(sanitizeSearchQuery("a,b")).toBe("ab");
    expect(sanitizeSearchQuery("a(b)c")).toBe("abc");
    expect(sanitizeSearchQuery('a"b')).toBe("ab");
  });
  it("strips backslash so it cannot escape sanitization", () => {
    expect(sanitizeSearchQuery("a\\b")).toBe("ab");
  });
  it("neutralizes a filter-injection payload", () => {
    const payload = "test,id.neq.00000000-0000-0000-0000-000000000000";
    const clean = sanitizeSearchQuery(payload);
    expect(clean).not.toContain(",");
    const filter = `title.ilike.%${clean}%,description.ilike.%${clean}%`;
    // the only comma left is the single structural one we built ourselves
    expect(filter.split(",").length).toBe(2);
  });
  it("neutralizes a paren-breakout payload", () => {
    const clean = sanitizeSearchQuery("),(title.ilike.%");
    expect(clean).toBe("title.ilike.");
    expect(clean).not.toMatch(/[()]/);
  });
});
