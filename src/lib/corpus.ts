/**
 * Corpus search — Sebutkan
 *
 * Finds the papers an agent will read and pay for. Uses OpenAlex (free, no key).
 * Each work carries its authors, which is who Sebutkan pays on settlement.
 */
import { resolveAuthorWallets, demoWallet } from "./registry";
import { normalizeOrcid } from "./orcid";

export type Author = {
  id: string;
  name: string;
  /** Normalized ORCID (if OpenAlex has one) — the identity used for claims. */
  orcid?: string;
  /** Resolved wallet: the real claimed wallet if bound in NameRegistry, else a
   *  deterministic demo address. `claimed` says which. */
  wallet: `0x${string}`;
  claimed: boolean;
};

/** The registry identity for an author: their ORCID if known, else OpenAlex id. */
function identityOf(a: { id: string; orcid?: string }): string {
  return a.orcid ? a.orcid : a.id;
}

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
  authorships?: { author: { id: string; display_name: string; orcid?: string | null } }[];
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
  const results = json.results ?? [];

  // Each author's identity = their ORCID (if OpenAlex has one) else OpenAlex id.
  // Resolve wallets from the on-chain NameRegistry (real claimed) with a labeled
  // demo fallback for unclaimed.
  const enriched = results.map((w) => ({
    w,
    authors: (w.authorships ?? []).slice(0, 4).map((a) => ({
      id: a.author.id,
      name: a.author.display_name,
      orcid: a.author.orcid ? normalizeOrcid(a.author.orcid) : undefined,
    })),
  }));
  const identities = enriched.flatMap((e) => e.authors.map(identityOf));
  const wallets = await resolveAuthorWallets(identities);

  return enriched.map(({ w, authors }, rank) => ({
    id: w.id,
    title: w.title ?? "(untitled)",
    year: w.publication_year,
    url: w.primary_location?.landing_page_url ?? (w.doi ? `https://doi.org/${w.doi}` : w.id),
    abstract: deinvert(w.abstract_inverted_index).slice(0, 1200),
    rank,
    authors: authors.map((a) => {
      const r = wallets.get(identityOf(a)) ?? { wallet: demoWallet(identityOf(a)), claimed: false };
      return { id: a.id, name: a.name, orcid: a.orcid, wallet: r.wallet, claimed: r.claimed };
    }),
  }));
}
