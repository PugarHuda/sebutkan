/**
 * Agent mesh — Sebutkan (A2A coordination)
 *
 * The user grants ONE budget to the Researcher. The Researcher then REDELEGATES
 * a narrowed slice to the Summarizer — a specialized sub-agent it subcontracts
 * summarization to. Authority only narrows: the Summarizer's budget, scope, and
 * expiry are all strictly tighter than the Researcher's. This is the
 * "Best A2A Coordination" track's redelegation, mapped to a real use case.
 */

export type AgentRole = {
  id: "user" | "researcher" | "summarizer";
  label: string;
  blurb: string;
  /** Fraction of the parent's budget this agent may redeem (0–1). */
  budgetFraction: number;
  /** Expiry as a fraction of the parent's remaining window (0–1). */
  expiryFraction: number;
  /** Human description of the narrowing caveats applied at this hop. */
  caveats: string[];
};

/** The delegation chain, root → leaf. Each hop strictly narrows authority. */
export const AGENT_MESH: AgentRole[] = [
  {
    id: "user",
    label: "You",
    blurb: "Grant one periodic-USDC budget via ERC-7715. Keep custody; never sign again.",
    budgetFraction: 1,
    expiryFraction: 1,
    caveats: ["erc20-token-periodic", "token: USDC", "redeemer: Researcher"],
  },
  {
    id: "researcher",
    label: "Researcher agent",
    blurb: "Searches the corpus, buys papers via x402, reads them with Venice, computes payouts.",
    budgetFraction: 1,
    expiryFraction: 1,
    caveats: ["inherits full budget", "may redelegate ≤ its authority"],
  },
  {
    id: "summarizer",
    label: "Summarizer sub-agent",
    blurb: "Subcontracted to condense findings. Paid from a narrowed sub-budget it can't exceed.",
    budgetFraction: 0.05, // 5% sub-budget
    expiryFraction: 0.25, // shorter-lived
    caveats: ["budget ≤ 5% of parent", "expiry ≤ 25% of parent", "scope: summarize-only"],
  },
];

/** Compute the concrete narrowed budget/expiry for a hop, given the root grant. */
export function narrowedFor(
  role: AgentRole,
  rootBudgetUSDC: number,
  rootExpiryUnix: number,
  nowUnix: number,
): { budgetUSDC: number; expiryUnix: number } {
  const window = Math.max(0, rootExpiryUnix - nowUnix);
  return {
    budgetUSDC: rootBudgetUSDC * role.budgetFraction,
    expiryUnix: nowUnix + window * role.expiryFraction,
  };
}
