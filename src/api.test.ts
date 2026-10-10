import { describe, expect, it } from "vitest";

// The demo mirror carries the same rules the database enforces; test them here.
describe("demo api rules", async () => {
  process.env.VITE_DEMO = "1";
  const { api } = await import("./api");
  it("refuses a short password, like the Auth switch does", async () => {
    await expect(api.signIn("a@b.co", "short")).rejects.toThrow(/12 characters/);
  });
  it("refuses a note before sign-in and an empty note after", async () => {
    await expect(api.addNote("x")).rejects.toThrow(/Sign in/);
    await api.signIn("a@b.co", "twelve-long-pw");
    await expect(api.addNote("   ")).rejects.toThrow(/needs some text/);
    const n = await api.addNote("hello");
    expect((await api.notes()).some((x) => x.id === n.id)).toBe(true);
  });
});
