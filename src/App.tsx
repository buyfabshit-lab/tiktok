import { useEffect, useRef, useState } from "react";
import { api, CONFIGURED, checkFile, checkText, type Drop } from "./api";
import BubbleRim from "./BubbleRim";

const fmt = (b: number) => b >= 1048576 ? `${(b / 1048576).toFixed(b >= 10485760 ? 0 : 1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function App() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [open, setOpen] = useState<Drop | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { api.list().then(setDrops).catch(e => setError(e.message)); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); setAdding(false); } }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);

  if (!CONFIGURED) return <main className="center"><div className="card"><h1>Almost there</h1><p>Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_PUBLISHABLE_KEY</b> in Railway → Variables, then redeploy.</p></div></main>;

  const pics = drops.filter(d => d.kind === "image").length, vids = drops.length - pics;
  return (
    <main>
      <header className="profile">
        <div className="avatar"><BubbleRim seed={7} round /><img src={`${import.meta.env.BASE_URL}mf-seal.png`} alt="" width={88} height={88} /></div>
        <div className="id">
          <h1>midnightfusion</h1>
          <ul className="stats"><li><b>{drops.length}</b> drops</li><li><b>{pics}</b> pictures</li><li><b>{vids}</b> videos</li></ul>
          <p className="bio"><b>Covered in bubbles. You're connected.</b><br />Pictures and videos from the shop. Watch them, take them, put up your own. What goes up stays up.</p>
        </div>
        <button className="btn plus" onClick={() => setAdding(a => !a)} aria-expanded={adding} aria-label="Put up your own">{adding ? "Close" : "+ Drop"}</button>
      </header>

      {adding && <Uploader onDone={d => { setDrops(all => [d, ...all]); setAdding(false); setToast(`${d.title || d.by} is up.`); }} />}
      {error && <p className="err">{error}</p>}

      {drops.length === 0 ? <div className="empty">Nothing here yet. Be the first to drop something.</div> : (
        <div className="tiles" role="list">
          {drops.map(d => (
            <button key={d.id} className={`tile ${d.kind}`} role="listitem" onClick={() => setOpen(d)} aria-label={`${d.title || "Untitled"} by ${d.by}`}>
              <BubbleRim seed={d.id} />
              {d.kind === "image" ? <img src={d.url} alt="" loading="lazy" /> : d.url ? <video src={d.url} muted playsInline preload="metadata" /> : <span className="novid" />}
              {d.kind === "video" && <span className="play" aria-hidden="true">▶</span>}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="post" role="dialog" aria-modal="true" aria-label={open.title || "Drop"} onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <article>
            <div className="media"><BubbleRim seed={open.id} />{open.kind === "image" ? <img src={open.url} alt={open.title || open.by} /> : open.url ? <video src={open.url} controls autoPlay playsInline /> : <span className="novid">video</span>}</div>
            <div className="cap">
              <div className="byline"><span className="dot" /><b>{open.by}</b><span className="muted">{when(open.created_at)} · {fmt(open.bytes)}</span></div>
              {open.title && <p>{open.title}</p>}
              <div className="acts"><a className="btn primary" href={open.url} download target="_blank" rel="noopener">Download</a><button className="btn" onClick={() => setOpen(null)}>Close</button></div>
            </div>
          </article>
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
