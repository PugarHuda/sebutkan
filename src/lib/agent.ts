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

export type CitationPayout = {
  author: `0x${string}`;
  authorName: string;
  weightBps: number;
  workTitle: string;
  url: string;
};

export type ResearchResult = {
  query: string;
  synthesis: string;
  webCitations: { title?: string; url?: string }[];
  works: Work[];
  payouts: CitationPayout[];
  /** "live" = Venice synthesized; "fallback" = dev mode (no Venice credit). */
  venice: "live" | "fallback";
};

/**
 * Weight citations across the works' authors. Higher-ranked works get more
 * weight (linear decay), split evenly among that work's authors. Returns
 * basis-point weights that sum to exactly 10_000.
 */
export function weightCitations(works: Work[]): CitationPayout[] {
  const flat: Omit<CitationPayout, "weightBps">[] = [];
  const rawWeights: number[] = [];

  works.forEach((w, i) => {
    const workWeight = works.length - i; // rank 0 → highest
    const share = w.authors.length ? workWeight / w.authors.length : 0;
    for (const a of w.authors) {
      flat.push({ author: a.wallet, authorName: a.name, workTitle: w.title, url: w.url });
      rawWeights.push(share);
    }
  });

  const total = rawWeights.reduce((s, x) => s + x, 0) || 1;
  let distributed = 0;
  return flat.map((c, i) => {
    const isLast = i === flat.length - 1;
    const bps = isLast
      ? 10_000 - distributed
      : Math.floor((rawWeights[i] / total) * 10_000);
    distributed += bps;
    return { ...c, weightBps: bps };
  });
}

/** Run a full research query and return synthesis + payout plan. */
export async function runResearch(query: string, opts: { papers?: number } = {}): Promise<ResearchResult> {
  const works = await searchCorpus(query, opts.papers ?? 5);

  const sources = works
    .map((w, i) => `[${i + 1}] "${w.title}" (${w.year ?? "n.d."}) — ${w.authors.map((a) => a.name).join(", ")}\n${w.abstract}`)
    .join("\n\n");

  try {
    const { text, citations } = await veniceChat({
      webSearch: true,
      messages: [
        {
          role: "system",
          content:
            "You are a rigorous research assistant. Synthesize a concise, well-structured answer " +
            "grounded in the provided papers and live web search. Cite sources inline as [1], [2]. " +
            "Be precise and neutral.",
        },
        { role: "user", content: `Question: ${query}\n\nCandidate papers:\n${sources}` },
      ],
    });
    return { query, synthesis: text, webCitations: citations, works, payouts: weightCitations(works) , venice: "live" };
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
    return { query, synthesis, webCitations: [], works, payouts: weightCitations(works), venice: "fallback" };
  }
}
