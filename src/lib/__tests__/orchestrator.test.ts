import { describe, it, expect } from "vitest";
import { parseConfidence, needsRevision, buildRedelegations, scoreAgents } from "../orchestrator";

describe("parseConfidence", () => {
  it("reads an explicit confidence line", () => {
    expect(parseConfidence("All good.\nConfidence: high")).toBe("high");
    expect(parseConfidence("Confidence: medium")).toBe("medium");
    expect(parseConfidence("confidence:  low")).toBe("low");
  });
  it("infers low from refuting language", () => {
    expect(parseConfidence("This claim is unsupported and contested.")).toBe("low");
    expect(parseConfidence("No evidence was found for the main result.")).toBe("low");
  });
  it("infers medium from hedging language", () => {
    expect(parseConfidence("The result is partially supported but uncertain.")).toBe("medium");
  });
  it("defaults to high when nothing is flagged", () => {
    expect(parseConfidence("The answer is well-supported by the sources.")).toBe("high");
  });
});

describe("needsRevision", () => {
  it("only low confidence forces a revision round", () => {
    expect(needsRevision("low")).toBe(true);
    expect(needsRevision("medium")).toBe(false);
    expect(needsRevision("high")).toBe(false);
  });
});

describe("buildRedelegations", () => {
  const now = 1_000_000;
  const hops = buildRedelegations(10, now + 86_400, now);

  it("creates one narrowed hop per depth-2 specialist", () => {
    expect(hops.map((h) => h.agent).sort()).toEqual(["factchecker", "reader", "summarizer"]);
  });
  it("every hop redelegates FROM the researcher", () => {
    expect(hops.every((h) => h.redelegation?.from === "researcher")).toBe(true);
  });
  it("authority only narrows — each sub-budget is < the root budget", () => {
    expect(hops.every((h) => (h.budgetUSDC ?? Infinity) < 10)).toBe(true);
  });
  it("expiry never exceeds the root window (24h)", () => {
    expect(hops.every((h) => (h.expiryHours ?? 99) <= 24)).toBe(true);
  });
});

describe("scoreAgents", () => {
  it("the fact-checker earns more when it forces a revision", () => {
    const noRev = scoreAgents({ readersUsed: 2, confidence: "high", revised: false });
    const rev = scoreAgents({ readersUsed: 2, confidence: "low", revised: true });
    const fc = (xs: ReturnType<typeof scoreAgents>) => xs.find((x) => x.agent === "factchecker")!.delta;
    expect(fc(rev)).toBeGreaterThan(fc(noRev));
  });
  it("a reader that read nothing earns nothing", () => {
    const s = scoreAgents({ readersUsed: 0, confidence: "high", revised: false });
    expect(s.find((x) => x.agent === "reader")).toBeUndefined();
  });
  it("the summarizer is not rewarded on a low-confidence run", () => {
    const s = scoreAgents({ readersUsed: 1, confidence: "low", revised: true });
    expect(s.find((x) => x.agent === "summarizer")).toBeUndefined();
  });
  it("the researcher always earns for orchestrating", () => {
    const s = scoreAgents({ readersUsed: 0, confidence: "high", revised: false });
    expect(s.find((x) => x.agent === "researcher")?.delta).toBe(1);
  });
});
