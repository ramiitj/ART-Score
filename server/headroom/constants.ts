// Master System Prompt (default system behavior version v1.0.0)
export const MASTER_SYSTEM_PROMPT = `You are the official backend generator and psychometric scorer for the ART (AI Reflection Test). Your role is to generate high-quality tasks and produce rigorous, consistent, and defensible ART Scores that measure a person's ability to meaningfully improve AI output in one shot.
Core Principles (Strictly Follow)

The baseline output must be competent but imperfect — good enough to be used in real work, but clearly having identifiable weaknesses in depth, structure, precision, or domain quality that a skilled person can improve.
All generation output MUST be plain-text compliant. Do NOT include any markdown styling elements such as backticks, asterisks, bold characters, or hashes. For sections, lists, or headers, use simple plain-text capitalization or clear spacing.
The ART Score must be psychometrically rigorous. It should reflect real, observable improvement in thinking quality, not length, formatting, or superficial polish. Marginal or cosmetic improvements must receive low-to-moderate scores.
Scoring must be domain-sensitive and follow explicit criteria.
You must always follow the structured reasoning process defined below before giving any score.`;

// The single Gemini model used for every AI call in this system -- task
// generation, baseline/self-revision/steered execution, and judging alike.
// One model, called via GEMINI_API_KEY, with no model-tier fallback: if a
// call to it fails (including rate limits), the caller surfaces an honest
// error rather than silently retrying against a different, weaker model.
export const GEMINI_MODEL = "gemini-3.1-pro-preview";

// Executor: one pinned model at one fixed temperature, used for every run that
// must be comparable to another (baseline execution, self-revision, and the
// human-steered execution). Pinning this means the only difference between
// runs is the prompt, never sampling variance.
export const EXECUTOR_MODEL = GEMINI_MODEL;
export const EXECUTOR_TEMPERATURE = 0;

// Judge: one pinned model at temperature 0, applied identically regardless of
// which side of a blind comparison it is scoring. Its biases (position,
// verbosity, self-preference) are neutralized structurally via blinding and
// randomization, not by instruction.
export const JUDGE_MODEL = GEMINI_MODEL;
export const JUDGE_TEMPERATURE = 0;

// Independent judge passes per comparison; position is randomized
// independently on each pass so no consistent order or identity signal survives.
export const JUDGE_PASS_COUNT = 3;

// The steered output must win at least this fraction of blind paired-comparison
// passes for Headroom to be non-zero. Below this, there is no reliable
// elevation beyond the model's own self-revision to measure.
export const VALIDITY_GATE_THRESHOLD = 2 / 3;

// Items generated per test run (docs/HEADROOM_MIGRATION_SPEC.md §11, §16.3).
// A single item cannot separate a person's capacity from item difficulty --
// serving multiple items per person is what makes the person x item variance
// decomposition (scripts/variance-decomposition.ts) possible.
export const ITEMS_PER_RUN = 3;
