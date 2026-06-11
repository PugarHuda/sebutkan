/**
 * Corpus search — Sebutkan
 *
 * Finds the papers an agent will read and pay for. Uses OpenAlex (free, no key).
 * Each work carries its authors, which is who Sebutkan pays on settlement.
 */

export type Author = {
  id: string;
  name: string;
  /** Demo wallet derived deterministically from the OpenAlex author id.
   *  Production path: ORCID OAuth → on-chain wallet binding (see roadmap). */
  wallet: `0x${string}`;
};

export type Work = {
  id: string;
  title: string;
  year?: number;
  url: string;
  abstract: string;
  authors: Author[];
  /** Relevance rank (0 = most relevant) used to weight citation payouts. */
  rank: number;
};

/** Deterministic demo wallet from an OpenAlex id (stable across runs). */
function demoWallet(seed: string): `0x${string}` {
  let h = 0n;
  for (const ch of seed) h = (h * 131n + BigInt(ch.charCodeAt(0))) % (1n << 160n);
  return `0x${h.toString(16).padStart(40, "0")}` as `0x${string}`;
}

/** Reconstruct an abstract from OpenAlex's inverted index. */
function deinvert(idx?: Record<string, number[]>): string {
  if (!idx) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) words[p] = word;
  }
  return words.join(" ");
}

type OpenAlexWork = {
  id: string;
  title: string | null;
  publication_year?: number;
  primary_location?: { landing_page_url?: string } | null;
  doi?: string | null;
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: { author: { id: string; display_name: string } }[];
};

/** Search OpenAlex and return the top `limit` works with authors + abstracts. */
export async function searchCorpus(query: string, limit = 5): Promise<Work[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", String(limit));
  url.searchParams.set("sort", "relevance_score:desc");
  // A mailto is polite and gets us the faster pool.
  url.searchParams.set("mailto", "research@sebutkan.app");

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { results?: OpenAlexWork[] };

  return (json.results ?? []).map((w, rank) => ({
    id: w.id,
    title: w.title ?? "(untitled)",
    year: w.publication_year,
    url: w.primary_location?.landing_page_url ?? (w.doi ? `https://doi.org/${w.doi}` : w.id),
    abstract: deinvert(w.abstract_inverted_index).slice(0, 1200),
    rank,
    authors: (w.authorships ?? []).slice(0, 4).map((a) => ({
      id: a.author.id,
      name: a.author.display_name,
      wallet: demoWallet(a.author.id),
    })),
  }));
}
