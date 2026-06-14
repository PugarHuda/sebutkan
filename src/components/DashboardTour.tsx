"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

/** Pick the most natural English voice available. */
function pickVoice(): SpeechSynthesisVoice | null {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) return null;
  const vs = synth.getVoices();
  if (!vs.length) return null;
  const rank = (v: SpeechSynthesisVoice) => {
    const nm = v.name.toLowerCase();
    let s = 0;
    if (/google/.test(nm)) s += 6;
    if (/natural|neural|premium|enhanced|online/.test(nm)) s += 5;
    if (/(aria|jenny|guy|sonia|ryan|libby|emma|ava|samantha|daniel)/.test(nm)) s += 3;
    if (/microsoft/.test(nm)) s += 2;
    if (/en[-_]us/i.test(v.lang)) s += 2;
    else if (/^en/i.test(v.lang)) s += 1;
    return s;
  };
  return [...vs].filter((v) => /^en/i.test(v.lang)).sort((a, b) => rank(b) - rank(a))[0] ?? vs[0] ?? null;
}

type Step = { href: string; selector: string; title: string; narration: string };

/** A guided tour of EVERY sidebar section — navigates page to page (interactive,
 *  like clicking the nav), spotlights the section with a visible pointer, and
 *  narrates it. Start it with `window.dispatchEvent(new Event("sebutkan:start-tour"))`. */
const STEPS: Step[] = [
  { href: "/dashboard", selector: 'aside a[href="/dashboard"]', title: "Overview", narration: "Welcome to Sebutkan — the research agent that cites and pays its sources. This is the Overview: live on-chain stats — attestations recorded, U.S.D.C. attributed to authors, and how many authors have been cited. All read straight from Sepolia." },
  { href: "/dashboard/research", selector: 'aside a[href="/dashboard/research"]', title: "Research", narration: "Research is the heart of it. You grant one scoped budget, ask a question, and a mesh of A.I. agents answers it with Venice — then splits U.S.D.C. back to every author it cites. We'll come back here for the full flow." },
  { href: "/dashboard/library", selector: 'aside a[href="/dashboard/library"]', title: "Library", narration: "Every finished run is saved in your Library — the full synthesis, the agent trace, the cited journals, and the payout plan. You can re-open or share any of them, no re-paying." },
  { href: "/dashboard/agents", selector: 'aside a[href="/dashboard/agents"]', title: "Agents", narration: "Here's the agent mesh: five specialists — a Researcher, Planner, Reader, Fact-checker, and Summarizer. Each is a real on-chain principal in the E.R.C. eighty-oh-four registry, and earns reputation as it works." },
  { href: "/dashboard/bounties", selector: 'aside a[href="/dashboard/bounties"]', title: "Bounties", narration: "Anyone can sponsor a research topic with U.S.D.C. When Sebutkan satisfies it, the deposit is paid to the cited authors — with no platform fee. Unsettled bounties are refundable." },
  { href: "/dashboard/claim", selector: 'aside a[href="/dashboard/claim"]', title: "Claim earnings", narration: "This is where authors get paid. They prove their ORCID, bind their wallet with one signature, and withdraw their earnings — plus a twelve-percent citation-loyalty yield that ticks up live while it waits." },
  { href: "/dashboard/activity", selector: 'aside a[href="/dashboard/activity"]', title: "Activity", narration: "And it's all public. Activity is a live read of every attestation and payment on-chain, with a leaderboard of the most-cited authors. That's Sebutkan — every citation, a real payment." },
];

export function DashboardTour() {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  useEffect(() => {
    const start = () => {
      setIdx(0);
      setActive(true);
    };
    window.addEventListener("sebutkan:start-tour", start);
    return () => window.removeEventListener("sebutkan:start-tour", start);
  }, []);

  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return;
    const load = () => (voiceRef.current = pickVoice());
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  const close = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setActive(false);
    setRect(null);
  }, []);

  const advance = useCallback(() => {
    setIdx((x) => {
      if (x < STEPS.length - 1) return x + 1;
      close();
      return x;
    });
  }, [close]);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Navigate (if needed), then spotlight + narrate the current section.
  useEffect(() => {
    if (!active) return;
    const step = STEPS[idx];
    if (!step) return;
    if (pathname !== step.href) {
      router.push(step.href);
      return; // effect re-runs when pathname updates
    }
    const t = setTimeout(() => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (synth) {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(step.narration);
        u.rate = 0.98;
        if (voiceRef.current) u.voice = voiceRef.current;
        u.onend = () => advanceRef.current();
        synth.speak(u);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [active, idx, pathname, router]);

  // Track the highlighted element on scroll/resize.
  useEffect(() => {
    if (!active) return;
    const remeasure = () => {
      const el = document.querySelector(STEPS[idx]?.selector ?? "") as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [active, idx]);

  if (!active || typeof document === "undefined") return null;
  const step = STEPS[idx];
  const pad = 6;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      {/* Dim + spotlight on the current nav item. */}
      {rect ? (
        <>
          <div
            className="pointer-events-none absolute rounded-lg ring-2 ring-[var(--accent)] transition-all duration-300"
            style={{
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            }}
          />
          {/* Visible animated pointer (a finger) at the right edge of the item. */}
          <div
            className="pointer-events-none absolute animate-bounce text-2xl"
            style={{ top: rect.top + rect.height / 2 - 14, left: rect.left + rect.width + 6 }}
          >
            👉
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Caption + controls. */}
      <div className="absolute inset-x-0 bottom-0 z-[121] flex justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
              {step?.title} · {idx + 1}/{STEPS.length}
            </span>
            <button onClick={close} className="text-[11px] text-[var(--muted)] hover:text-red-600">
              ✕ end tour
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-[var(--ink)]">{step?.narration}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setIdx((x) => Math.max(0, x - 1))}
              disabled={idx === 0}
              className="rounded-md border border-[var(--rule)] px-2.5 py-1 text-[11px] disabled:opacity-40"
            >
              ← back
            </button>
            <button
              onClick={() => advanceRef.current()}
              className="rounded-md bg-[var(--accent)] px-3 py-1 text-[11px] font-medium text-white"
            >
              {idx === STEPS.length - 1 ? "Finish" : "Next →"}
            </button>
            <span className="ml-auto text-[10px] text-[var(--muted)]">narrating… auto-advances</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
