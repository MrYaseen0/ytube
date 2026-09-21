import { describe, it, expect } from "vitest";
import { formatViews, timeAgo, formatDuration, avatarColor } from "./format";

describe("formatViews", () => {
  it("returns raw number under 1000", () => {
    expect(formatViews(0)).toBe("0");
    expect(formatViews(999)).toBe("999");
  });
  it("formats thousands with K", () => {
    expect(formatViews(1000)).toBe("1K");
    expect(formatViews(1500)).toBe("1.5K");
    expect(formatViews(999999)).toBe("1000K");
  });
  it("formats millions with M", () => {
    expect(formatViews(1_000_000)).toBe("1M");
    expect(formatViews(2_500_000)).toBe("2.5M");
  });
});

describe("timeAgo", () => {
  it("says 'just now' under a minute", () => {
    expect(timeAgo(new Date(Date.now() - 30_000).toISOString())).toBe("just now");
  });
  it("handles singular/plural minutes", () => {
    expect(timeAgo(new Date(Date.now() - 60_000).toISOString())).toBe("1 minute ago");
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5 minutes ago");
  });
  it("handles hours, days, weeks, months, years", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 3_600_000).toISOString())).toBe("2 hours ago");
    expect(timeAgo(new Date(Date.now() - 3 * 86_400_000).toISOString())).toBe("3 days ago");
    expect(timeAgo(new Date(Date.now() - 14 * 86_400_000).toISOString())).toBe("2 weeks ago");
    expect(timeAgo(new Date(Date.now() - 60 * 86_400_000).toISOString())).toBe("2 months ago");
    expect(timeAgo(new Date(Date.now() - 400 * 86_400_000).toISOString())).toBe("1 year ago");
  });
});

describe("formatDuration", () => {
  it("returns empty for null/zero/negative", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(-5)).toBe("");
  });
  it("formats m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
  it("formats h:mm:ss", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});

describe("avatarColor", () => {
  it("is deterministic per name", () => {
    expect(avatarColor("EduLearn")).toBe(avatarColor("EduLearn"));
  });
  it("returns a valid tailwind bg class", () => {
    expect(avatarColor("x")).toMatch(/^bg-(red|blue|green|purple|orange|teal|pink|indigo)-600$/);
  });
});
