"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative "falling research paper" field behind the hero — pure CSS + DOM,
 * no dependencies. Technique follows the classic CSS falling-leaves pattern
 * (compound transforms + staggered negative delays) layered as three nested
 * motions: fall ▸ sway ▸ 3D flutter. References:
 *   - premiumcoding.com/css3-tricks-falling-leaves-css (compound fall+rotate)
 *   - codepen.io/dudleystorey/pen/kKBOmV  (3D rotateX flutter + shadow)
 * A few big sheets hover at the edges and a messy stack sits in a corner; the
 * whole field parallaxes with the cursor. Honors prefers-reduced-motion.
 */

type V = Record<string, string | number>;

// Deterministic so server and client render identically (no Math.random → no
// hydration mismatch). Values vary by index to feel scattered and irregular.
const FALL_COUNT = 24;
const FALLERS = Array.from({ length: FALL_COUNT }, (_, i) => {
  const left = (i * 41 + 4) % 97; // spread across the width
  const w = 70 + ((i * 47) % 116); // 70–186px
  const h = Math.round(w * 1.3);
  const vars: V = {
    "--op": (0.28 + ((i * 7) % 14) / 100).toFixed(2), // 0.28–0.41
    "--dur": `${11 + ((i * 17) % 12)}s`, // 11–22s (varied fall speed)
    "--delay": `-${(i * 13) % 24}s`, // pre-populate on load
    "--spin": `${140 + ((i * 53) % 220)}deg`, // lazy spin while falling
    "--sway": `${24 + ((i * 11) % 34)}px`,
    "--swayDur": `${(30 + ((i * 9) % 34)) / 10}s`, // 3.0–6.3s
    "--flutterDur": `${(38 + ((i * 7) % 40)) / 10}s`, // 3.8–7.7s
  };
  return { left: `${left}%`, w, h, vars };
});

// Big sheets that hover in place near the edges, for a scattered "desk" feel.
const FLOATERS: { top: string; left?: string; right?: string; w: number; h: number; vars: V }[] = [
  { top: "5%", left: "4%", w: 158, h: 200, vars: { "--rot": "-13deg", "--dur": "9s", "--delay": "0s" } },
  { top: "57%", left: "3%", w: 128, h: 162, vars: { "--rot": "7deg", "--dur": "11s", "--delay": "1s" } },
  { top: "9%", right: "4%", w: 150, h: 188, vars: { "--rot": "11deg", "--dur": "10s", "--delay": "0.4s" } },
  { top: "60%", right: "6%", w: 132, h: 166, vars: { "--rot": "-9deg", "--dur": "12s", "--delay": "1.6s" } },
];

// A bigger messy stack of overlapping sheets in a corner.
const STACK: { rot: string; x: number; y: number }[] = [
  { rot: "-11deg", x: 0, y: 10 },
  { rot: "6deg", x: 10, y: 5 },
  { rot: "-4deg", x: 3, y: 0 },
  { rot: "13deg", x: 16, y: 12 },
  { rot: "2deg", x: 7, y: 3 },
  { rot: "-8deg", x: 20, y: 7 },
];

export function FloatingPapers() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = (e.clientX / window.innerWidth - 0.5) * 28;
        const dy = (e.clientY / window.innerHeight - 0.5) * 22;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1040px] overflow-hidden transition-transform duration-300 ease-out [will-change:transform]"
    >
      {/* falling → swaying → fluttering sheets */}
      {FALLERS.map((s, i) => (
        <span key={`fa${i}`} className="paper-fall absolute top-0" style={{ left: s.left, ...s.vars } as React.CSSProperties}>
          <span className="paper-sway" style={s.vars as React.CSSProperties}>
            <span
              className="paper-sheet paper-flutter"
              style={{ position: "relative", top: 0, left: 0, width: s.w, height: s.h, ...s.vars } as React.CSSProperties}
            />
          </span>
        </span>
      ))}

      {/* big hovering sheets near the edges */}
      {FLOATERS.map((s, i) => (
        <span
          key={`fl${i}`}
          className="paper-sheet paper-float"
          style={{ top: s.top, left: s.left, right: s.right, width: s.w, height: s.h, opacity: 0.32, ...s.vars } as React.CSSProperties}
        />
      ))}

      {/* a bigger messy stack, lower-left whitespace (hidden on small screens) */}
      <div className="absolute left-[2%] top-[74%] hidden h-44 w-40 lg:block">
        {STACK.map((p, i) => (
          <span
            key={`st${i}`}
            className="paper-sheet"
            style={{ top: p.y, left: p.x, width: 138, height: 176, transform: `rotate(${p.rot})`, opacity: 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}
