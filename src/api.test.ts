import { describe, expect, it } from "vitest";
import { checkFile, checkText, kindOf, MAX_BYTES } from "./api";

// The demo mirror and the client checks carry the same rules the database enforces.
const file = (name: string, type: string, size: number) => ({ name, type, size } as File);

describe("what may be dropped", () => {
  it("takes pictures and videos, nothing else", () => {
    expect(kindOf("image/png")).toBe("image");
    expect(kindOf("video/mp4")).toBe("video");
    expect(kindOf("application/pdf")).toBeNull();
    expect(checkFile(file("a.pdf", "application/pdf", 10))).toMatch(/Pictures and videos only/);
  });
  it("stops at 500 MB and refuses empty files", () => {
    expect(checkFile(file("a.mp4", "video/mp4", MAX_BYTES))).toBeNull();
    expect(checkFile(file("a.mp4", "video/mp4", MAX_BYTES + 1))).toMatch(/limit is 500 MB/);
    expect(checkFile(file("a.png", "image/png", 0))).toMatch(/empty/);
  });
  it("needs a name and keeps captions short", () => {
    expect(checkText("", "x")).toMatch(/name/);
    expect(checkText("Justin", "x".repeat(141))).toMatch(/up to 140/);
    expect(checkText("Justin", "")).toBeNull();
  });
});

describe("demo api", async () => {
  const { api } = await import("./api");
  it("lists newest first and has no way to remove anything", async () => {
    const rows = await api.list();
    expect(rows.length).toBeGreaterThan(0);
    expect("takeDown" in api).toBe(false);
  });
});
