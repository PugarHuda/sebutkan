/**
 * Research agent orchestrator — Sebutkan
 *
 * Pipeline: search corpus → synthesize with Venice (chat + web search) →
 * weight citations → produce the payout plan that AttributionLedger.attestAndSplit
 * settles. Venice does the reasoning (private, uncensored); the payout is what
 * makes every citation an on-chain payment to its author.
 */
import { searchCorpus, type Work } from "./corpus";
import { veniceChat } from "./venice";
import { payForResource } from "./x402pay";
import { getAddress } from "viem";

export type CitationPayout = {
  author: `0x${string}`;
  authorName: string;
  weightBps: number;
  workTitle: string;
  url: string;
  /** Registry identity (ORCID or OpenAlex id) — used to escrow unclaimed shares. */
  identity: string;
  /** true if the wallet is a real claimed wallet (NameRegistry), false if demo. */
  claimed: boolean;
};

export type ResearchResult = {
  query: string;
  synthesis: string;
  webCitations: { title?: string; url?: string }[];
  works: Work[];
  payouts: CitationPayout[];
  /** "live" = Venice synthesized; "fallback" = dev mode (no Venice credit). */
  venice: "live" | "fallback";
  /** Real x402 micropayment to unlock the top paper (or why it was skipped). */
  x402: { paid: boolean; txHash?: string; amountUSDC?: string; reason?: string };
};

/**
 * Weight citations across the works' authors. Higher-ranked works get more
 * weight (linear decay), split evenly among that work's authors. Capped to the
 * top `MAX_PAYOUT_AUTHORS` (keeps on-chain attest/redeem gas bounded and avoids
 * dust splits). Returns basis-point weights that sum to exactly 10_000.
 */
export const MAX_PAYOUT_AUTHORS = 8;

export function weightCitations(works: Work[]): CitationPayout[] {
  const flat: (Omit<CitationPayout, "weightBps"> & { raw: number })[] = [];

  works.forEach((w, i) => {
    const workWeight = works.length - i; // rank 0 → highest
    const share = w.authors.length ? workWeight / w.authors.length : 0;
    for (const a of w.authors) {
      flat.push({
        author: a.wallet,
        authorName: a.name,
        workTitle: w.title,
        url: w.url,
        identity: a.orcid ?? a.id,
        claimed: a.claimed,
        raw: share,
      });
    }
  });
  if (flat.length === 0) return [];

  // Keep the top contributors, then renormalize their weights to sum to 10_000.
  const top = flat.sort((a, b) => b.raw - a.raw).slice(0, MAX_PAYOUT_AUTHORS);
  const total = top.reduce((s, x) => s + x.raw, 0) || 1;
  let distributed = 0;
  return top.map((c, i) => {
    const isLast = i === top.length - 1;
    const bps = isLast ? 10_000 - distributed : Math.floor((c.raw / total) * 10_000);
    distributed += bps;
    const { raw: _raw, ...rest } = c;
    void _raw;
    return { ...rest, weightBps: bps };
  });
}

export type ResearchOptions = {
  papers?: number;
  fromYear?: number;
  toYear?: number;
  /** Answer language: "auto" (match the question) or a language name like "English". */
  language?: string;
};

/** Run a full research query and return synthesis + payout plan. */
export async function runResearch(query: string, opts: ResearchOptions = {}): Promise<ResearchResult> {
  const works = await searchCorpus(query, {
    limit: opts.papers ?? 5,
    fromYear: opts.fromYear,
    toYear: opts.toYear,
  });

  // No corpus hits → return cleanly with no payouts (UI disables settle/redeem).
  if (works.length === 0) {
    return {
      query,
      synthesis: `No papers found for "${query}". Try a broader or more specific research question.`,
      webCitations: [],
      works: [],
      payouts: [],
      venice: "fallback",
      x402: { paid: false, reason: "no papers" },
    };
  }

  // x402: pay a real USDC micropayment to unlock the top paper's full text.
  // On-chain settlement, verifiable. Degrades honestly when the agent is unfunded.
  const PAPER_PRICE_6 = 10_000n; // 0.01 USDC
  let x402: ResearchResult["x402"] = { paid: false, reason: "agent has no test USDC yet" };
  const payTo = process.env.NEXT_PUBLIC_SESSION_ACCOUNT as `0x${string}` | undefined;
  if (payTo) {
    try {
      const txHash = await payForResource(getAddress(payTo), PAPER_PRICE_6);
      x402 = { paid: true, txHash, amountUSDC: "0.01" };
    } catch (e) {
      x402 = { paid: false, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  const sources = works
    .map((w, i) => `[${i + 1}] "${w.title}" (${w.year ?? "n.d."}) — ${w.authors.map((a) => a.name).join(", ")}\n${w.abstract}`)
    .join("\n\n");

  const lang = opts.language && opts.language !== "auto"
    ? `Always respond in ${opts.language}.`
    : "Respond in the same language as the question.";

  try {
    const { text, citations } = await veniceChat({
      webSearch: true,
      messages: [
        {
          role: "system",
          content:
            "You are a rigorous research assistant. Synthesize a concise, well-structured answer " +
            "grounded in the provided papers and live web search. Cite sources inline as [1], [2]. " +
            `Be precise and neutral. ${lang}`,
        },
        { role: "user", content: `Question: ${query}\n\nCandidate papers:\n${sources}` },
      ],
    });
    return { query, synthesis: text, webCitations: citations, works, payouts: weightCitations(works), venice: "live", x402 };
  } catch (e) {
    // Dev fallback: no Venice credit / 402. Build a synthesis from the abstracts
    // so the full research → payout → settle flow stays testable for free.
    // The real demo uses live Venice (this branch is clearly labeled in the UI).
    const reason = e instanceof Error ? e.message : String(e);
    const synthesis =
      `⚠️ Venice fallback (dev mode — no credit): ${reason}\n\n` +
      `Synthesis for "${query}" drawn from ${works.length} papers:\n\n` +
      works
        .map((w, i) => `[${i + 1}] ${w.title} — ${w.abstract.slice(0, 240)}…`)
        .join("\n\n");
    return { query, synthesis, webCitations: [], works, payouts: weightCitations(works), venice: "fallback", x402 };
  }
}
