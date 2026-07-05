import { describe, it, expect } from "vitest";
import { pickNewer, mergeById } from "./sync";

const row = (id: string, updated_at?: string) => ({ id, updated_at });

describe("pickNewer", () => {
  it("keeps the row with the later updated_at", () => {
    const a = row("1", "2026-01-01T00:00:00Z");
    const b = row("1", "2026-02-01T00:00:00Z");
    expect(pickNewer(a, b)).toBe(b);
    expect(pickNewer(b, a)).toBe(b);
  });

  it("treats a missing timestamp as oldest", () => {
    const a = row("1");
    const b = row("1", "2026-01-01T00:00:00Z");
    expect(pickNewer(a, b)).toBe(b);
  });

  it("prefers the first arg on a tie", () => {
    const a = row("1", "2026-01-01T00:00:00Z");
    const b = row("1", "2026-01-01T00:00:00Z");
    expect(pickNewer(a, b)).toBe(a);
  });
});

describe("mergeById", () => {
  it("unions rows by id", () => {
    const merged = mergeById([row("1")], [row("2")]);
    expect(merged.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });

  it("resolves conflicts with last-write-wins", () => {
    const local = [row("1", "2026-01-01T00:00:00Z")];
    const remote = [row("1", "2026-03-01T00:00:00Z")];
    const merged = mergeById(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].updated_at).toBe("2026-03-01T00:00:00Z");
  });

  it("keeps a newer local edit over a stale server row", () => {
    const local = [row("1", "2026-05-01T00:00:00Z")];
    const remote = [row("1", "2026-01-01T00:00:00Z")];
    const merged = mergeById(local, remote);
    expect(merged[0].updated_at).toBe("2026-05-01T00:00:00Z");
  });
});
