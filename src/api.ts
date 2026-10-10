// The only file that talks to the database. Every screen imports from here.
// VITE_DEMO=1 swaps in an in-memory mirror so Playwright runs with no database;
// every rule the server enforces gets a twin here, so the same specs prove both.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const DEMO = import.meta.env.VITE_DEMO === "1";
export const CONFIGURED = DEMO || Boolean(url && key);

export type Me = { email: string; name: string } | null;
export type Note = { id: number; body: string; created_at: string };

export interface Api {
  me(): Promise<Me>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  notes(): Promise<Note[]>;
  addNote(body: string): Promise<Note>;
}

function supabaseApi(): Api {
  const sb = createClient(url!, key!);
  return {
    async me() { const { data } = await sb.auth.getUser(); return data.user ? { email: data.user.email ?? "", name: data.user.email ?? "" } : null; },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message); },
    async signOut() { await sb.auth.signOut(); },
    async notes() { const { data, error } = await sb.from("mf-drops_notes").select("*").order("created_at"); if (error) throw new Error(error.message); return data as Note[]; },
    async addNote(body) { const { data, error } = await sb.rpc("mf-drops_add_note", { p_body: body }); if (error) throw new Error(error.message); return data as Note; },
  };
}

function demoApi(): Api {
  let me: Me = null;
  const notes: Note[] = [{ id: 1, body: "First note on mf-drops", created_at: new Date().toISOString() }];
  return {
    async me() { return me; },
    async signIn(email, password) { if (password.length < 12) throw new Error("Password must be at least 12 characters"); me = { email, name: email }; },
    async signOut() { me = null; },
    async notes() { return notes.slice(); },
    async addNote(body) {
      if (!me) throw new Error("Sign in first");
      if (!body.trim()) throw new Error("A note needs some text");
      const n = { id: notes.length + 1, body: body.trim(), created_at: new Date().toISOString() }; notes.push(n); return n;
    },
  };
}

export const api: Api = DEMO ? demoApi() : supabaseApi();
