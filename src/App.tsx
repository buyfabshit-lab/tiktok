import { useEffect, useRef, useState } from "react";
import { api, CONFIGURED, checkFile, checkText, type Drop } from "./api";
import BubbleRim from "./BubbleRim";

const fmt = (b: number) => b >= 1048576 ? `${(b / 1048576).toFixed(b >= 10485760 ? 0 : 1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function App() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => { api.list().then(setDrops).catch(e => setError(e.message)); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);

  if (!CONFIGURED) return <main className="center"><div className="card"><h1>Almost there</h1><p>Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_PUBLISHABLE_KEY</b> in Railway → Variables, then redeploy.</p></div></main>;

  return (
    <main>
      <header>
        <div className="brand"><p className="eyebrow">Midnight Fusion</p><h1>Drops</h1></div>
        <p className="lede">Pictures and videos from the shop. Watch them, take them, put up your own. What goes up stays up.</p>
      </header>

      <Uploader onDone={d => { setDrops(all => [d, ...all]); setToast(`${d.title || d.by} is up.`); }} />

      {error && <p className="err">{error}</p>}
      {drops.length === 0 ? <div className="empty">Nothing here yet. Be the first to drop something.</div> : (
        <div className="grid">
          {drops.map(d => (
            <figure key={d.id} className={d.kind}>
              <div className="plate">
                <BubbleRim seed={d.id} />
                {d.kind === "image" ? <img src={d.url} alt={d.title || d.by} loading="lazy" /> : d.url ? <video src={d.url} controls preload="metadata" playsInline /> : <span className="muted">video</span>}
              </div>
              <figcaption>
                <div className="title">{d.title || <span className="muted">Untitled</span>}</div>
                <div className="meta">{d.by} · {when(d.created_at)} · {fmt(d.bytes)}</div>
                <div className="acts">
                  <a className="btn" href={d.url} download target="_blank" rel="noopener">Download</a>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function Uploader({ onDone }: { onDone: (d: Drop) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [by, setBy] = useState(() => { try { return localStorage.getItem("drops.by") || ""; } catch { return ""; } });
  const [title, setTitle] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => { setMsg(""); if (!f) return; const bad = checkFile(f); if (bad) { setMsg(bad); return; } setFile(f); if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")); };
  const go = async () => {
    if (!file) { setMsg("Pick a picture or a video first."); return; }
    const bad = checkText(by, title); if (bad) { setMsg(bad); return; }
    setMsg(""); setPct(0);
    try {
      const d = await api.upload(file, by, title, setPct);
      try { localStorage.setItem("drops.by", by); } catch {}
      onDone(d); setFile(null); setTitle(""); if (input.current) input.current.value = "";
    } catch (e) { setMsg((e as Error).message); }
    finally { setPct(null); }
  };

  return (
    <section className={`drop ${over ? "over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0] ?? null); }}>
      <div className="dropline">
        <button type="button" className="btn" onClick={() => input.current?.click()}>Choose a file</button>
        <input ref={input} type="file" accept="image/*,video/*" hidden aria-label="Picture or video" onChange={e => pick(e.target.files?.[0] ?? null)} />
        <span className="hint">{file ? `${file.name} · ${fmt(file.size)}` : "or drag a picture or video here. Up to 500 MB."}</span>
      </div>
      <div className="fields">
        <input aria-label="Your name" placeholder="Your name" value={by} maxLength={40} onChange={e => setBy(e.target.value)} />
        <input aria-label="Caption" placeholder="Caption (optional)" value={title} maxLength={140} onChange={e => setTitle(e.target.value)} />
        <button type="button" className="btn primary" disabled={pct !== null} onClick={go}>{pct === null ? "Drop it" : `Uploading ${pct}%`}</button>
      </div>
      {pct !== null && <progress max={100} value={pct} aria-label="Upload progress" />}
      {msg && <p className="err">{msg}</p>}
    </section>
  );
}
