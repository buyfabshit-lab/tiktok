// The only file that talks to Supabase. Storage holds the files, one table holds the rows.
// VITE_DEMO=1 swaps in an in-memory mirror with the same rules, so e2e runs with no database.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const DEMO = import.meta.env.VITE_DEMO === "1";
export const CONFIGURED = DEMO || Boolean(url && key);

export const MAX_BYTES = 500 * 1024 * 1024;           // 500 MB per file; the bucket enforces the same cap
export const KINDS = ["image", "video"] as const;
export type Kind = (typeof KINDS)[number];
export type Drop = { id: number; kind: Kind; title: string; by: string; path: string; url: string; bytes: number; mime: string; created_at: string };

export interface Api {
  list(): Promise<Drop[]>;
  upload(file: File, by: string, title: string, onProgress?: (pct: number) => void): Promise<Drop>;
}

export function kindOf(mime: string): Kind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}
export function checkFile(file: File): string | null {
  if (!kindOf(file.type)) return "Pictures and videos only.";
  if (file.size > MAX_BYTES) return `That file is ${(file.size / 1048576).toFixed(0)} MB. The limit is 500 MB.`;
  if (file.size === 0) return "That file is empty.";
  return null;
}
export function checkText(by: string, title: string): string | null {
  if (!by.trim()) return "Put a name on it.";
  if (by.length > 40 || title.length > 140) return "Name up to 40 letters, caption up to 140.";
  return null;
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function supabaseApi(): Api {
  // built on first use, so importing this file never throws when the variables are missing
  let client: ReturnType<typeof createClient> | null = null;
  const sb = new Proxy({} as ReturnType<typeof createClient>, { get: (_, p) => (client ??= createClient(url!, key!))[p as keyof ReturnType<typeof createClient>] });
  const bucket = "drops";
  return {
    async list() {
      const { data, error } = await sb.from("mf_drops").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as Omit<Drop, "url">[]).map(d => ({ ...d, url: sb.storage.from(bucket).getPublicUrl(d.path).data.publicUrl }));
    },
    async upload(file, by, title, onProgress) {
      const bad = checkFile(file) || checkText(by, title); if (bad) throw new Error(bad);
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}-${slug(file.name)}`;
      onProgress?.(5);
      const up = await sb.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw new Error(up.error.message);
      onProgress?.(90);
      const { data, error } = await sb.rpc("mf_add_drop", { p_kind: kindOf(file.type), p_title: title.trim(), p_by: by.trim(), p_path: path, p_bytes: file.size, p_mime: file.type });
      if (error) { await sb.storage.from(bucket).remove([path]); throw new Error(error.message); }
      onProgress?.(100);
      const row = data as Omit<Drop, "url">;
      return { ...row, url: sb.storage.from(bucket).getPublicUrl(path).data.publicUrl };
    },
  };
}

function demoApi(): Api {
  let next = 3;
  const seed = (id: number, kind: Kind, title: string, by: string, mime: string, bytes: number): Drop => ({ id, kind, title, by, path: `demo/${id}`, url: kind === "image" ? DEMO_PNG : DEMO_MP4, bytes, mime, created_at: new Date(Date.now() - id * 3600e3).toISOString() });
  const rows: Drop[] = [seed(1, "image", "Three Dogs, Helmet", "Justin", "image/png", 582733), seed(2, "video", "Collision reveal, take 4", "Justin", "video/mp4", 9_400_000)];
  return {
    async list() { return rows.slice(); },
    async upload(file, by, title, onProgress) {
      const bad = checkFile(file) || checkText(by, title); if (bad) throw new Error(bad);
      onProgress?.(50);
      const d: Drop = { id: next++, kind: kindOf(file.type)!, title: title.trim(), by: by.trim(), path: `demo/${next}`, url: URL.createObjectURL(file), bytes: file.size, mime: file.type, created_at: new Date().toISOString() };
      rows.unshift(d); onProgress?.(100); return d;
    },
  };
}
const DEMO_PNG = `${import.meta.env.BASE_URL}demo/three-dogs.png`;   // a real owned mark, so the demo board is not blank
const DEMO_MP4 = "";

export const api: Api = DEMO ? demoApi() : supabaseApi();
