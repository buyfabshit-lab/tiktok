import { useEffect, useState } from "react";
import { api, CONFIGURED, type Me, type Note } from "./api";

export default function App() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [notes, setNotes] = useState<Note[]>([]);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [body, setBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { api.me().then(setMe); }, []);
  useEffect(() => { if (me) api.notes().then(setNotes).catch((e) => setError(e.message)); }, [me]);

  if (!CONFIGURED) return <main className="center"><div className="card"><h1>Almost there</h1><p>Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_PUBLISHABLE_KEY</b> in Railway → Variables, then redeploy.</p></div></main>;
  if (me === undefined) return <main className="center">Loading…</main>;
  if (!me) return (
    <main className="center">
      <form className="card" onSubmit={async (e) => { e.preventDefault(); setError(""); try { await api.signIn(email, password); setMe(await api.me()); } catch (err) { setError((err as Error).message); } }}>
        <p className="eyebrow">Midnight Fusion drops: upload videos and pictures, take them down, let people download or upload their own</p>
        <h1>mf-drops</h1>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="err">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
  return (
    <main>
      <header><strong>mf-drops</strong><span>{me.email}</span><button onClick={() => api.signOut().then(() => setMe(null))}>Sign out</button></header>
      <section>
        <h2>Notes</h2>
        <ul>{notes.map((n) => <li key={n.id}>{n.body}</li>)}</ul>
        <form onSubmit={async (e) => { e.preventDefault(); setError(""); try { const n = await api.addNote(body); setNotes((all) => [...all, n]); setBody(""); } catch (err) { setError((err as Error).message); } }}>
          <input aria-label="New note" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note" />
          <button type="submit">Add</button>
        </form>
        {error && <p className="err">{error}</p>}
      </section>
    </main>
  );
}
