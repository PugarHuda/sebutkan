"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative "flying / scattered paper" field behind the hero — pure CSS + DOM,
 * no dependencies. A few sheets drift across and tumble (paper-fly), a few hover
 * in place (paper-float), and a small messy stack sits in a corner. The whole
 * field parallaxes gently with the cursor. Honors prefers-reduced-motion (the CSS
 * animations stop; the scattered layout stays). Purely cosmetic, aria-hidden.
 */

type Sheet = { top: string; left?: string; right?: string; w: number; h: number; vars: Record<string, string | number> };

// Sheets that hover in place at scattered positions.
const FLOATERS: Sheet[] = [
  { top: "8%", left: "6%", w: 64, h: 84, vars: { "--rot": "-12deg", "--dur": "8s", "--delay": "0s" } },
  { top: "20%", left: "16%", w: 44, h: 58, vars: { "--rot": "7deg", "--dur": "11s", "--delay": "1.2s" } },
  { top: "62%", left: "9%", w: 56, h: 74, vars: { "--rot": "5deg", "--dur": "9.5s", "--delay": "0.6s" } },
  { top: "12%", right: "8%", w: 58, h: 76, vars: { "--rot": "10deg", "--dur": "10s", "--delay": "0.3s" } },
  { top: "70%", right: "14%", w: 48, h: 62, vars: { "--rot": "-8deg", "--dur": "12s", "--delay": "1.8s" } },
  { top: "44%", right: "5%", w: 40, h: 52, vars: { "--rot": "-4deg", "--dur": "9s", "--delay": "2.4s" } },
];

// Sheets that fly across the hero and tumble on a loop.
const FLYERS: Sheet[] = [
  { top: "30%", left: "2%", w: 50, h: 66, vars: { "--rot": "-6deg", "--op": 0.13, "--dur": "17s", "--delay": "0s", "--dx": "180px", "--dy": "-160px", "--dr": "150deg" } },
  { top: "78%", left: "22%", w: 42, h: 56, vars: { "--rot": "4deg", "--op": 0.1, "--dur": "21s", "--delay": "3s", "--dx": "240px", "--dy": "-220px", "--dr": "-120deg" } },
  { top: "55%", right: "2%", w: 46, h: 60, vars: { "--rot": "8deg", "--op": 0.11, "--dur": "19s", "--delay": "6s", "--dx": "-200px", "--dy": "-180px", "--dr": "200deg" } },
  { top: "5%", left: "40%", w: 38, h: 50, vars: { "--rot": "-10deg", "--op": 0.09, "--dur": "23s", "--delay": "9s", "--dx": "120px", "--dy": "160px", "--dr": "-90deg" } },
];

// A small messy stack of overlapping sheets in a corner.
const STACK: { rot: string; x: number; y: number }[] = [
  { rot: "-9deg", x: 0, y: 6 },
  { rot: "5deg", x: 6, y: 3 },
  { rot: "-3deg", x: 2, y: 0 },
  { rot: "11deg", x: 10, y: 8 },
  { rot: "1deg", x: 4, y: 2 },
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
        const dx = (e.clientX / window.innerWidth - 0.5) * 18;
        const dy = (e.clientY / window.innerHeight - 0.5) * 18;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const sheet = (s: Sheet, cls: string, key: string) => (
    <span
      key={key}
      className={`paper-sheet ${cls}`}
      style={{
        top: s.top,
        left: s.left,
        right: s.right,
        width: s.w,
        height: s.h,
        ...s.vars,
      } as unknown as React.CSSProperties}
    />
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-70 transition-transform duration-300 ease-out [will-change:transform]"
    >
      {FLOATERS.map((s, i) => sheet(s, "paper-float", `fl${i}`))}
      {FLYERS.map((s, i) => sheet(s, "paper-fly", `fy${i}`))}

      {/* messy stack, lower-left whitespace (hidden on small screens) */}
      <div className="absolute left-[3%] top-[78%] hidden h-32 w-28 lg:block">
        {STACK.map((p, i) => (
          <span
            key={`st${i}`}
            className="paper-sheet"
            style={{
              top: p.y,
              left: p.x,
              width: 96,
              height: 120,
              transform: `rotate(${p.rot})`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
