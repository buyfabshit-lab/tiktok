import { useEffect, useRef, useState } from "react";

/** A chain of small bubbles around the edge of its parent, each joined to the next, breathing slowly. */
export default function BubbleRim({ seed = 1, round = false }: { seed?: number; round?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current?.parentElement; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  if (!w || !h) return <svg ref={ref} className="rim" aria-hidden="true" />;

  // bubbles sit a little outside the plate, spaced about 22px apart along the perimeter
  const pad = 7, W = w + pad * 2, H = h + pad * 2, per = 2 * (W + H);
  const n = Math.max(12, Math.round(per / 30));
  const rand = mulberry(seed);
  const pts = Array.from({ length: n }, (_, i) => {
    let x: number, y: number;
    if (round) { // a circle of beads around a round avatar
      const a = (i / n) * Math.PI * 2 + rand() * 0.1;
      x = W / 2 + Math.cos(a) * (W / 2 - 1); y = H / 2 + Math.sin(a) * (H / 2 - 1);
    } else {
      let d = (i / n) * per + rand() * 6; d %= per;
      if (d < W) { x = d; y = 0; } else if (d < W + H) { x = W; y = d - W; } else if (d < 2 * W + H) { x = 2 * W + H - d; y = H; } else { x = 0; y = per - d; }
    }
    return { x, y, r: 1.8 + rand() * 2.2, delay: rand() * 6, dur: 4 + rand() * 4 };
  });
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg ref={ref} className="rim" aria-hidden="true" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ left: -pad, top: -pad }}>
      <path d={path} className="rim-string" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} className="rim-bubble" style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transformOrigin: `${p.x}px ${p.y}px` }} />
      ))}
    </svg>
  );
}

function mulberry(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
