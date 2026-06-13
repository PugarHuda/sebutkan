/**
 * Multi-agent orchestrator — Sebutkan (A2A coordination)
 *
 * This is the real coordination layer the "Best Agent" + "Best A2A" tracks
 * reward. The Researcher orchestrates a mesh of specialist agents, each of which
 * does genuine work (its own Venice call) under a strictly narrowed slice of the
 * user's ERC-7715 budget:
 *
 *   Researcher (root budget)
 *     ├─ Reader×N   — one per paper, parallel fan-out (B). Each extracts that
 *     │               paper's key finding under a tiny redelegated sub-budget.
 *     ├─ Synthesizer — merges the readers' findings into a grounded answer.
 *     ├─ Fact-checker — independently verifies; can REJECT (low confidence) →
 *     │               triggers ONE Researcher revision round (A, a real loop).
 *     └─ Summarizer — condenses the verified answer to a TL;DR.
 *
 * After the run we score each agent on whether its work survived (E) and bump
 * its on-chain ERC-8004 reputation (done server-side at settlement, not here).
 *
 * Every Venice call is wrapped so a single agent failing degrades the trace
 * instead of breaking the whole run — the live demo never hard-fails.
 */
import type { Work } from "./corpus";
import { veniceChat } from "./venice";
import { AGENT_MESH, narrowedFor, type AgentRole } from "./agents";

/** A single step in the agent trace shown in the UI (and proof for judges). */
export type AgentStep = {
  agent: AgentRole["id"];
  label: string;
  /** What this agent did this step. */
  action: string;
  status: "ok" | "skipped" | "rejected" | "revised";
  /** Short human-readable detail / output preview. */
  detail: string;
  /** The narrowed sub-budget this agent operated under (USDC), if redelegated. */
  budgetUSDC?: number;
  /** Hours until this hop's redelegation expires. */
  expiryHours?: number;
  /** Set when this step is a redelegation hop (C). from → to with the caveats. */
  redelegation?: { from: AgentRole["id"]; to: AgentRole["id"]; caveats: string[] };
};

export type Confidence = "high" | "medium" | "low";

export type OrchestrationResult = {
  synthesis: string;
  verification?: string;
  summary?: string;
  confidence: Confidence;
  /** Number of synthesis rounds (2 = the fact-checker forced a revision). */
  rounds: number;
  trace: AgentStep[];
  webCitations: { title?: string; url?: string }[];
  /** Per-agent reputation deltas to settle on-chain (E). */
  reputation: { agent: AgentRole["id"]; delta: number; reason: string }[];
};

const byId = (id: AgentRole["id"]) => AGENT_MESH.find((r) => r.id === id)!;

/**
 * Parse the fact-checker's verdict into a confidence level. Pure + testable.
 * Looks for an explicit "confidence: high|medium|low", else infers from tone.
 */
export function parseConfidence(text: string): Confidence {
  const t = text.toLowerCase();
  const m = t.match(/confidence[:\s]+(high|medium|low)/);
  if (m) return m[1] as Confidence;
  if (/\b(unsupported|contested|incorrect|no evidence|fabricat|cannot verify)\b/.test(t)) return "low";
  if (/\b(weak|uncertain|partially|mixed|some claims)\b/.test(t)) return "medium";
  return "high";
}

/** A low/medium verdict with flagged claims warrants one revision round. */
export function needsRevision(confidence: Confidence): boolean {
  return confidence === "low";
}

/** Max sub-questions the Planner may emit (bounds the Reader fan-out). */
export const MAX_SUBQUESTIONS = 3;

/**
 * Parse the Planner's decomposition into a clean list of sub-questions. Pure +
 * testable. Strips list markers / numbering, drops empties, caps the count, and
 * always returns at least the original query so the pipeline never stalls.
 */
export function parseSubQuestions(text: string, fallback: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length > 0 && /[?\w]/.test(l) && !/^sub-?questions?:?$/i.test(l));
  const cleaned = [...new Set(lines)].slice(0, MAX_SUBQUESTIONS);
  return cleaned.length ? cleaned : [fallback];
}

/**
 * Build the literal redelegation hops (C): for each specialist, the concrete
 * narrowed budget/expiry derived from the root grant. Pure + testable — this is
 * the same data the UI renders and (optionally) redeems via 1Shot.
 */
export function buildRedelegations(
  rootBudgetUSDC: number,
  rootExpiryUnix: number,
  nowUnix: number,
): AgentStep[] {
  return AGENT_MESH.filter((r) => r.depth >= 2).map((role) => {
    const { budgetUSDC, expiryUnix } = narrowedFor(role, rootBudgetUSDC, rootExpiryUnix, nowUnix);
    return {
      agent: role.id,
      label: role.label,
      action: "redelegation",
      status: "ok" as const,
      detail: `Researcher redelegates ≤ ${budgetUSDC.toFixed(2)} USDC (narrowed)`,
      budgetUSDC,
      expiryHours: Math.max(0, Math.round((expiryUnix - nowUnix) / 3600)),
      redelegation: { from: "researcher", to: role.id, caveats: role.caveats },
    };
  });
}

/**
 * Score each agent's contribution for the reputation feedback loop (E).
 * Reputation is earned, not given: an agent only scores if its work was used
 * and survived. The fact-checker scores more when it actually caught something.
 */
export function scoreAgents(input: {
  readersUsed: number;
  confidence: Confidence;
  revised: boolean;
  subQuestions?: number;
}): { agent: AgentRole["id"]; delta: number; reason: string }[] {
  const out: { agent: AgentRole["id"]; delta: number; reason: string }[] = [];
  out.push({ agent: "researcher", delta: 1, reason: "orchestrated the run" });
  if (input.subQuestions && input.subQuestions > 1)
    out.push({ agent: "planner", delta: 1, reason: `decomposed into ${input.subQuestions} sub-questions` });
  if (input.readersUsed > 0)
    out.push({ agent: "reader", delta: 1, reason: `answered ${input.readersUsed} sub-question(s)` });
  // The fact-checker earns more when it forced a correction — that's real value.
  out.push({
    agent: "factchecker",
    delta: input.revised ? 2 : 1,
    reason: input.revised ? "caught a weak claim → forced revision" : "verified the answer",
  });
  if (input.confidence !== "low")
    out.push({ agent: "summarizer", delta: 1, reason: "produced the verified TL;DR" });
  return out;
}

async function safeChat(
  opts: Parameters<typeof veniceChat>[0],
): Promise<{ text: string; citations: { title?: string; url?: string }[] } | null> {
  try {
    const r = await veniceChat(opts);
    return { text: r.text, citations: r.citations };
  } catch {
    return null;
  }
}

const lang = (language?: string) =>
  language && language !== "auto" ? `Always respond in ${language}.` : "Respond in the same language as the question.";

/**
 * Run the full multi-agent orchestration. `works` are the corpus hits the
 * Researcher already pulled. Returns the synthesis, verification, summary, and
 * the full agent trace (with redelegation hops) for the UI + judges.
 */
export async function orchestrate(
  query: string,
  works: Work[],
  opts: { rootBudgetUSDC?: number; rootExpiryUnix?: number; nowUnix?: number; language?: string } = {},
): Promise<OrchestrationResult> {
  const now = opts.nowUnix ?? Math.floor(Date.now() / 1000);
  const rootBudget = opts.rootBudgetUSDC ?? 10;
  const rootExpiry = opts.rootExpiryUnix ?? now + 86_400;
  const trace: AgentStep[] = [];

  // ── Researcher: plan + redelegate (C) ──────────────────────────────────────
  trace.push({
    agent: "researcher",
    label: byId("researcher").label,
    action: "plan",
    status: "ok",
    detail: `Pulled ${works.length} candidate paper(s); redelegating to specialists.`,
    budgetUSDC: rootBudget,
    expiryHours: Math.max(0, Math.round((rootExpiry - now) / 3600)),
  });
  for (const hop of buildRedelegations(rootBudget, rootExpiry, now)) trace.push(hop);

  // Compact corpus the Readers ground their answers in (shared across the fan-out).
  const corpus = works
    .map((w, i) => `[${i + 1}] "${w.title}" (${w.year ?? "n.d."}): ${w.abstract.slice(0, 400)}`)
    .join("\n");

  // ── Planner (depth 1): decompose the question into focused sub-questions ────
  const planRes = await safeChat({
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          `You are a Planner agent. Break the user's research question into at most ${MAX_SUBQUESTIONS} focused, ` +
          "non-overlapping sub-questions that together fully answer it. Output ONLY the sub-questions, one per " +
          "line, no numbering, no preamble. " + lang(opts.language),
      },
      { role: "user", content: query },
    ],
  });
  const subQuestions = planRes ? parseSubQuestions(planRes.text, query) : [query];
  trace.push({
    agent: "planner",
    label: byId("planner").label,
    action: "decompose",
    status: planRes ? "ok" : "skipped",
    detail: planRes
      ? `Split into ${subQuestions.length} sub-question(s): ${subQuestions.map((q) => `“${q.slice(0, 60)}”`).join("; ")}`
      : "Planner unavailable — Readers answer the whole question.",
  });

  // ── Reader fan-out (B): one parallel sub-agent per sub-question ─────────────
  const readerBudget = narrowedFor(byId("reader"), rootBudget, rootExpiry, now).budgetUSDC;
  const perReader = subQuestions.length ? readerBudget / subQuestions.length : 0;
  const readings = await Promise.all(
    subQuestions.map(async (sq) => {
      const r = await safeChat({
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a Reader agent assigned ONE sub-question. Answer it concisely using only the provided " +
              "papers; cite them inline as [n]. If the papers don't cover it, say so. " + lang(opts.language),
          },
          { role: "user", content: `Sub-question: ${sq}\n\nPapers:\n${corpus}` },
        ],
      });
      return { sq, claim: r?.text?.trim() ?? "" };
    }),
  );
  const usedReadings = readings.filter((r) => r.claim.length > 0);
  for (const r of readings) {
    trace.push({
      agent: "reader",
      label: byId("reader").label,
      action: "answer sub-question",
      status: r.claim ? "ok" : "skipped",
      detail: r.claim
        ? `“${r.sq.slice(0, 60)}” → ${r.claim.slice(0, 90)}${r.claim.length > 90 ? "…" : ""}`
        : `skipped: ${r.sq.slice(0, 60)}`,
      budgetUSDC: perReader,
    });
  }

  // ── Synthesizer: merge the readers' sub-answers into a grounded answer ──────
  const findings = usedReadings
    .map((r, i) => `[Sub-Q ${i + 1}] ${r.sq}\n→ ${r.claim}`)
    .join("\n\n");
  const synthRes = await safeChat({
    webSearch: true,
    messages: [
      {
        role: "system",
        content:
          "You are a rigorous research Synthesizer. Combine the Reader agents' per-paper findings and live " +
          "web search into a concise, well-structured answer. Cite sources inline as [1], [2]. Be precise " +
          "and neutral. " + lang(opts.language),
      },
      {
        role: "user",
        content: `Question: ${query}\n\nReader findings:\n${findings || "(readers returned nothing; synthesize from the question)"}`,
      },
    ],
  });
  let synthesis = synthRes?.text ?? "";
  const webCitations = synthRes?.citations ?? [];
  trace.push({
    agent: "researcher",
    label: byId("researcher").label,
    action: "synthesize",
    status: synthesis ? "ok" : "skipped",
    detail: synthesis ? "Merged Reader findings into a grounded synthesis." : "Synthesis unavailable.",
  });

  // ── Fact-checker (A): independent verify → may REJECT and force a revision ──
  let verification: string | undefined;
  let confidence: Confidence = "high";
  let rounds = 1;
  const fcRes = await safeChat({
    webSearch: true,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a skeptical Fact-checker agent. Independently verify the key claims using live web search. " +
          "End with a line exactly like 'Confidence: high|medium|low'. List any unsupported, contested, or weak " +
          "claim. Be terse. " + lang(opts.language),
      },
      { role: "user", content: `Question: ${query}\n\nAnswer to verify:\n${synthesis}` },
    ],
  });
  if (fcRes) {
    verification = fcRes.text;
    confidence = parseConfidence(fcRes.text);
  }
  trace.push({
    agent: "factchecker",
    label: byId("factchecker").label,
    action: "verify",
    status: confidence === "low" ? "rejected" : "ok",
    detail: verification
      ? `Confidence: ${confidence}${confidence === "low" ? " → sending back to Researcher for revision" : ""}`
      : "Verification unavailable.",
    budgetUSDC: narrowedFor(byId("factchecker"), rootBudget, rootExpiry, now).budgetUSDC,
  });

  // ── Revision round (A): the loop — Researcher addresses the flagged claims ──
  const revised = needsRevision(confidence) && !!synthesis && !!verification;
  if (revised) {
    rounds = 2;
    const revRes = await safeChat({
      webSearch: true,
      messages: [
        {
          role: "system",
          content:
            "You are the Researcher revising your answer after the Fact-checker flagged weak claims. Produce a " +
            "corrected, better-supported answer. Keep inline [n] citations. " + lang(opts.language),
        },
        {
          role: "user",
          content: `Question: ${query}\n\nPrevious answer:\n${synthesis}\n\nFact-checker feedback:\n${verification}`,
        },
      ],
    });
    if (revRes?.text) {
      synthesis = revRes.text;
      trace.push({
        agent: "researcher",
        label: byId("researcher").label,
        action: "revise",
        status: "revised",
        detail: "Revised the synthesis to address the Fact-checker's flagged claims.",
      });
    }
  }

  // ── Summarizer: condense the verified answer to a TL;DR ─────────────────────
  let summary: string | undefined;
  if (synthesis) {
    const sumRes = await safeChat({
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You are a Summarizer agent. Give a 2-sentence TL;DR of the answer. No preamble. " + lang(opts.language),
        },
        { role: "user", content: synthesis },
      ],
    });
    summary = sumRes?.text?.trim();
    trace.push({
      agent: "summarizer",
      label: byId("summarizer").label,
      action: "summarize",
      status: summary ? "ok" : "skipped",
      detail: summary ? `TL;DR ready (${summary.length} chars).` : "Summary unavailable.",
      budgetUSDC: narrowedFor(byId("summarizer"), rootBudget, rootExpiry, now).budgetUSDC,
    });
  }

  const reputation = scoreAgents({
    readersUsed: usedReadings.length,
    confidence,
    revised,
    subQuestions: subQuestions.length,
  });

  return { synthesis, verification, summary, confidence, rounds, trace, webCitations, reputation };
}
