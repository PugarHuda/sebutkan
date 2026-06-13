/**
 * Per-agent Venice models — Sebutkan
 *
 * A multi-agent system should use the RIGHT model for each job, not one model for
 * everything. Venice exposes 250+ models through one API, so each specialist picks
 * a model suited to its task — fast/cheap for routing, strong for verification.
 * All defaults are confirmed available on the project key; override via env.
 *
 * Web-search calls (Synthesizer, Fact-checker) stay on venice-uncensored, which
 * reliably supports Venice's server-side web search.
 */
export const AGENT_MODELS = {
  /** Query → clean academic keywords. Tiny, fast. */
  refine: process.env.VENICE_MODEL_REFINE ?? "mistral-small-3-2-24b-instruct",
  /** Decompose the question into sub-questions. Fast reasoning. */
  planner: process.env.VENICE_MODEL_PLANNER ?? "qwen3-5-9b",
  /** Read papers + answer a sub-question. Strong comprehension. */
  reader: process.env.VENICE_MODEL_READER ?? "llama-3.3-70b",
  /** Merge into a grounded answer (+ web search). Private + uncensored. */
  synth: process.env.VENICE_MODEL_SYNTH ?? "venice-uncensored",
  /** Skeptical verification (+ web search). */
  factcheck: process.env.VENICE_MODEL_FACTCHECK ?? "venice-uncensored",
  /** TL;DR. Fast. */
  summary: process.env.VENICE_MODEL_SUMMARY ?? "qwen3-5-9b",
} as const;

/** Short label for the UI/trace (drop any provider prefix). */
export function modelLabel(model: string): string {
  return model.split("/").pop() ?? model;
}
