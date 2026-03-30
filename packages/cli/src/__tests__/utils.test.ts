import { describe, it, expect } from "vitest";
import { slugify, topN, increment } from "../utils.js";

describe("slugify", () => {
  it("converts a normal name to kebab-case", () => {
    expect(slugify("Alice Smith")).toBe("alice-smith");
  });

  it("handles already-lowered names", () => {
    expect(slugify("bob")).toBe("bob");
  });

  it("strips special characters", () => {
    expect(slugify("Jean-Claude Van Damme!")).toBe("jean-claude-van-damme");
  });

  it("handles unicode characters", () => {
    expect(slugify("José García")).toBe("jos-garc-a");
  });

  it("collapses consecutive non-alphanumeric characters", () => {
    expect(slugify("a   ---  b")).toBe("a-b");
  });

  it("removes leading and trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("returns empty string for only special chars", () => {
    expect(slugify("!@#$%")).toBe("");
  });

  it("handles path traversal attempts", () => {
    const result = slugify("../../etc/passwd");
    expect(result).not.toContain("/");
    expect(result).not.toContain("..");
    expect(result).toBe("etc-passwd");
  });

  it("strips shell metacharacters", () => {
    const result = slugify("; rm -rf /");
    expect(result).not.toContain(";");
    expect(result).not.toContain("/");
    expect(result).toBe("rm-rf");
  });

  it("strips command substitution syntax", () => {
    const result = slugify("$(whoami)");
    expect(result).not.toContain("$");
    expect(result).not.toContain("(");
    expect(result).toBe("whoami");
  });

  it("strips backtick injection", () => {
    const result = slugify("`id`");
    expect(result).not.toContain("`");
    expect(result).toBe("id");
  });
});

describe("topN", () => {
  it("returns top entries sorted by count descending", () => {
    const record = { a: 10, b: 5, c: 20 };
    expect(topN(record, 2)).toEqual([["c", 20], ["a", 10]]);
  });

  it("returns all entries when n exceeds record size", () => {
    const record = { a: 1, b: 2 };
    expect(topN(record, 5)).toEqual([["b", 2], ["a", 1]]);
  });

  it("returns empty array for empty record", () => {
    expect(topN({}, 5)).toEqual([]);
  });

  it("returns empty array when n is 0", () => {
    expect(topN({ a: 1 }, 0)).toEqual([]);
  });

  it("handles ties deterministically", () => {
    const record = { a: 5, b: 5, c: 5 };
    const result = topN(record, 2);
    expect(result).toHaveLength(2);
    expect(result[0][1]).toBe(5);
    expect(result[1][1]).toBe(5);
  });
});

describe("increment", () => {
  it("initializes a new key to the amount", () => {
    const record: Record<string, number> = {};
    increment(record, "foo");
    expect(record.foo).toBe(1);
  });

  it("increments an existing key", () => {
    const record: Record<string, number> = { foo: 3 };
    increment(record, "foo");
    expect(record.foo).toBe(4);
  });

  it("uses custom amount", () => {
    const record: Record<string, number> = { foo: 2 };
    increment(record, "foo", 10);
    expect(record.foo).toBe(12);
  });

  it("initializes new key with custom amount", () => {
    const record: Record<string, number> = {};
    increment(record, "bar", 5);
    expect(record.bar).toBe(5);
  });
});
