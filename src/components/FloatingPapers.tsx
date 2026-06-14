"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative "flying / scattered paper" field behind the hero — pure CSS + DOM,
 * no dependencies. Sheets fall from the top while swaying side-to-side like a
 * leaf and slowly flipping in 3D (three nested motions: fall ▸ sway ▸ tumble),
 * a few hover in place, and a messy stack sits in a corner. The field parallaxes
 * gently with the cursor. Honors prefers-reduced-motion. Cosmetic, aria-hidden.
 */

type V = Record<string, string | number>;

// Falling sheets — negative delays so the field is already populated on load.
const FALLERS: { left: string; w: number; h: number; vars: V }[] = [
  { left: "3%", w: 132, h: 168, vars: { "--op": 0.26, "--dur": "16s", "--delay": "-2s", "--sway": "40px", "--swayDur": "4.5s", "--r0": "-12deg", "--r1": "10deg", "--tumbleDur": "9s" } },
  { left: "12%", w: 88, h: 112, vars: { "--op": 0.22, "--dur": "13s", "--delay": "-7s", "--sway": "30px", "--swayDur": "3.6s", "--r0": "8deg", "--r1": "-9deg", "--tumbleDur": "7s" } },
  { left: "22%", w: 150, h: 190, vars: { "--op": 0.20, "--dur": "19s", "--delay": "-11s", "--sway": "48px", "--swayDur": "5.2s", "--r0": "-7deg", "--r1": "12deg", "--tumbleDur": "11s" } },
  { left: "33%", w: 74, h: 96, vars: { "--op": 0.24, "--dur": "12s", "--delay": "-4s", "--sway": "26px", "--swayDur": "3.2s", "--r0": "10deg", "--r1": "-6deg", "--tumbleDur": "6s" } },
  { left: "44%", w: 116, h: 148, vars: { "--op": 0.16, "--dur": "17s", "--delay": "-9s", "--sway": "36px", "--swayDur": "4.8s", "--r0": "-9deg", "--r1": "9deg", "--tumbleDur": "10s" } },
  { left: "55%", w: 96, h: 124, vars: { "--op": 0.21, "--dur": "14s", "--delay": "-1s", "--sway": "32px", "--swayDur": "4s", "--r0": "6deg", "--r1": "-11deg", "--tumbleDur": "8s" } },
  { left: "64%", w: 140, h: 178, vars: { "--op": 0.18, "--dur": "20s", "--delay": "-14s", "--sway": "44px", "--swayDur": "5.5s", "--r0": "-11deg", "--r1": "7deg", "--tumbleDur": "12s" } },
  { left: "74%", w: 80, h: 104, vars: { "--op": 0.25, "--dur": "12.5s", "--delay": "-6s", "--sway": "28px", "--swayDur": "3.4s", "--r0": "9deg", "--r1": "-8deg", "--tumbleDur": "6.5s" } },
  { left: "83%", w: 124, h: 158, vars: { "--op": 0.22, "--dur": "15.5s", "--delay": "-10s", "--sway": "38px", "--swayDur": "4.6s", "--r0": "-8deg", "--r1": "11deg", "--tumbleDur": "9.5s" } },
  { left: "92%", w: 92, h: 118, vars: { "--op": 0.20, "--dur": "13.5s", "--delay": "-3s", "--sway": "30px", "--swayDur": "3.8s", "--r0": "7deg", "--r1": "-10deg", "--tumbleDur": "7.5s" } },
  { left: "17%", w: 104, h: 132, vars: { "--op": 0.19, "--dur": "18s", "--delay": "-15s", "--sway": "34px", "--swayDur": "5s", "--r0": "-10deg", "--r1": "8deg", "--tumbleDur": "10.5s" } },
  { left: "49%", w: 70, h: 90, vars: { "--op": 0.23, "--dur": "11s", "--delay": "-8s", "--sway": "24px", "--swayDur": "3s", "--r0": "11deg", "--r1": "-7deg", "--tumbleDur": "5.5s" } },
  { left: "69%", w: 110, h: 140, vars: { "--op": 0.17, "--dur": "16.5s", "--delay": "-12s", "--sway": "40px", "--swayDur": "4.9s", "--r0": "-6deg", "--r1": "12deg", "--tumbleDur": "11.5s" } },
  { left: "88%", w: 78, h: 100, vars: { "--op": 0.24, "--dur": "12.8s", "--delay": "-5s", "--sway": "27px", "--swayDur": "3.5s", "--r0": "8deg", "--r1": "-9deg", "--tumbleDur": "6.8s" } },
];

// Big sheets that hover in place near the edges, for a scattered "desk" feel.
const FLOATERS: { top: string; left?: string; right?: string; w: number; h: number; vars: V }[] = [
  { top: "6%", left: "5%", w: 150, h: 190, vars: { "--rot": "-13deg", "--dur": "9s", "--delay": "0s" } },
  { top: "58%", left: "4%", w: 120, h: 152, vars: { "--rot": "7deg", "--dur": "11s", "--delay": "1s" } },
  { top: "10%", right: "5%", w: 140, h: 176, vars: { "--rot": "11deg", "--dur": "10s", "--delay": "0.4s" } },
  { top: "62%", right: "8%", w: 124, h: 156, vars: { "--rot": "-9deg", "--dur": "12s", "--delay": "1.6s" } },
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

const sheetVisual = (w: number, h: number, extra: React.CSSProperties = {}, cls = "") => (
  <span
    className={`paper-sheet ${cls}`}
    style={{ position: "relative", width: w, height: h, top: 0, left: 0, ...extra } as React.CSSProperties}
  />
);

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
        const dx = (e.clientX / window.innerWidth - 0.5) * 26;
        const dy = (e.clientY / window.innerHeight - 0.5) * 20;
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
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[980px] overflow-hidden transition-transform duration-300 ease-out [will-change:transform]"
      style={{ perspective: "1200px" }}
    >
      {/* falling, swaying, tumbling sheets */}
      {FALLERS.map((s, i) => (
        <span key={`fa${i}`} className="paper-fall absolute top-0" style={{ left: s.left, ...s.vars } as React.CSSProperties}>
          <span className="paper-sway" style={s.vars as React.CSSProperties}>
            {sheetVisual(s.w, s.h, {}, "paper-tumble")}
          </span>
        </span>
      ))}

      {/* big hovering sheets near the edges */}
      {FLOATERS.map((s, i) => (
        <span
          key={`fl${i}`}
          className="paper-sheet paper-float"
          style={{ top: s.top, left: s.left, right: s.right, width: s.w, height: s.h, ...s.vars } as React.CSSProperties}
        />
      ))}

      {/* a bigger messy stack, lower-left whitespace (hidden on small screens) */}
      <div className="absolute left-[2%] top-[72%] hidden h-44 w-40 lg:block">
        {STACK.map((p, i) => (
          <span
            key={`st${i}`}
            className="paper-sheet"
            style={{ top: p.y, left: p.x, width: 136, height: 172, transform: `rotate(${p.rot})`, opacity: 0.55 }}
          />
        ))}
      </div>
    </div>
  );
}
