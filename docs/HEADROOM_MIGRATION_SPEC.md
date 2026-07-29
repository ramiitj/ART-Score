# ART → Headroom: Engineering Migration Spec

**Status:** Draft for review
**Owner:** ART platform
**Source of truth for the construct:** *Headroom: Measuring the Human Contribution That Remains Above a Frontier Model Baseline* (the "Perspective paper")
**Scope:** Migrate the current flaw-injection ART scorer to the three-role Headroom architecture the paper specifies.

---

## 0. Why this migration exists

The current implementation (`server.ts` + `asset-data.ts`) is the design the Perspective paper explicitly **retires** (paper §"Threats to Validity", p.12):

> *An earlier version of this instrument seeded the baseline with an engineered flaw and scored whether the person caught it… it measured flaw-spotting, a different attribute from elevation… The three-role redesign was adopted precisely to close that mismatch.*

Concretely, the current design is construct-invalid on four axes the paper corrects:

| Current design (retired) | Paper-specified design (target) |
|---|---|
| Injects 1–2 `FAILURE_MODES`, scores mitigation (`flawsInjected`, `mitigationAssessment`) | **Gap manifest**: a hidden a-priori criterion of what excellence would add; score gaps *closed* |
| Human writes **revision instructions**, model executes them | Human makes a **direct edit of the baseline prompt**; Executor runs it |
| **Absolute** 5-dim scoring (0–20 each), then `improved − baseline` subtraction | **Blind, randomized paired comparison** (Thurstone / Bradley–Terry) |
| Denominator = raw first draft: `headroom = 100 − baselineQualityScore` | Denominator = the model's **self-revised ceiling** → achievable frontier |
| `0.6·headroomEff + 0.4·rawDelta` composite (≈ one variable) + post-hoc guardrails C2–C5 | **Efficiency + Resolution**, equal weight, keyed to the manifest |

This spec is the incremental path from the left column to the right. It is designed to run the new pipeline in **shadow mode** alongside the old one so we can compare scores on real traffic before cutover.

---

## 1. Target architecture: three roles

```
                          ┌──────────────────────────────────────────────┐
                          │                 GENERATOR                     │
                          │  task prompt  +  hidden gap manifest (key)     │
                          └───────────────┬──────────────────────────────┘
                                          │ manifest never sent to client
                          ┌───────────────▼──────────────────────────────┐
     user edits the       │                 EXECUTOR                      │
     baseline PROMPT  ───▶ │  pinned model + fixed temp, runs 3 prompts:    │
                          │   B0 = baseline prompt        → baseline out    │
                          │   Bsr = self-revise(B0)       → self-rev ceiling│
                          │   Bh = user-edited prompt     → steered out     │
                          └───────────────┬──────────────────────────────┘
                          ┌───────────────▼──────────────────────────────┐
                          │                  JUDGE                         │
                          │  (a) blind randomized paired comparison        │
                          │      steered vs self-revised (3 passes)        │
                          │  (b) per-manifest-gap resolution, blind        │
                          └───────────────┬──────────────────────────────┘
                                          ▼
                     Efficiency + Resolution  →  Headroom score + SE
```

**Role separation is the validity mechanism.** The Executor pins model+temperature so the *only* difference between the baseline run and the steered run is the human edit. The Judge never learns which output is the human's, and pair order is randomized across passes, which removes sycophancy/position/verbosity bias **structurally** rather than by instruction (paper §"Threats to Validity", Table 2).

---

## 2. Construct → measurement definitions (authoritative)

Let quality live on a latent scale `θ` recovered from paired comparison.

- `θ_B0` — baseline (model's first draft)
- `θ_sr` — **self-revised ceiling**: model revises its own first draft with no human input
- `θ_h` — human-steered output
- `θ_F` — achievable frontier, operationalized as **all closable manifest gaps resolved**

**Headroom (definition):**
```
Headroom = (θ_h − θ_sr) / (θ_F − θ_sr)
```
Anchoring the denominator at `θ_sr` (not `θ_B0`) is deliberate: the person is credited only for improvement **beyond what the model reaches unaided**. The model's own revision capacity is never misattributed to the human (paper §"Art as a Measurement Instrument", p.7).

Because `θ_F` is hard to instantiate directly, we operationalize the frontier-relative quantity through the **manifest** (§6) and report two equally weighted components:

- **Resolution `R`** — fraction of *closable* manifest gaps the steered output resolves (criterion-referenced; this is the direct estimator of the Headroom fraction).
- **Efficiency `E`** — gap closed relative to how much the person changed (guards against brute-force rewrites that cover the manifest without economical steering).

```
HeadroomScore = 0.5 · R + 0.5 · E      (gated: see §7)
```

Equal weighting guards two failure modes at once: `R` alone rewards brute-force rewriting; `E` alone rewards minimal edits that leave gaps open (paper §"Art as a Measurement Instrument", p.9).

---

## 3. Current → target function map

| Current symbol (`server.ts`) | Fate | Replacement |
|---|---|---|
| `scoreOutputThreePass()` | **Replace** | `judgePairedComparison()` (§5.1) + `judgeManifestResolution()` (§5.2) |
| `computeFinalEvaluation()` | **Rewrite** | `computeHeadroom()` (§7) — Efficiency + Resolution, ceiling-anchored |
| `getDomainSpecificExcellenceCriteria()` | **Keep, repurpose** | Feed manifest generation, not absolute rubric |
| `medianOfThree()` | Keep | Reused for pass aggregation |
| guardrails C2–C5 (formatting/cosmetic/premium/negative caps) | **Delete** | Manifest keying makes them redundant (§10) |
| `INJECTION_REGEXES` + integrity checks | **Keep** | Still valid input hygiene; downgrade to advisory (§9) |
| `generate-task` flaw injection (`primaryFailureMode`, `secondaryFailureMode`, `flawsInjected`) | **Delete** | Generator emits gap manifest instead (§4, §6) |
| `mitigationAssessment` in judge schema | **Delete** | Manifest resolution replaces it |
| 48–52 baseline pre-scoring band loop | **Replace** | Item bank calibration (offline) + self-revision spread check (§8) |
| `headroom = 100 - selectedScore` (`:829`) | **Delete** | `θ_F − θ_sr` via manifest (§7) |
| Executor exec prompt (revision-instructions, `:973`) | **Rewrite** | Direct-prompt-edit execution (§5, §11 step 2) |
| App.tsx client fallback score `45` (`App.tsx:149`) | **Delete** | Never surface fabricated scores; show retry (§12) |
| `FAILURE_MODES`, `FAILURE_MODE_IDS` (`asset-data.ts`) | **Delete after cutover** | `GAP_DIMENSION_LIBRARY` (§6) |
| `ROLE_PROFILES`, `DIFFICULTY_DEFINITIONS` | Keep | Still drive realistic task generation |

---

## 4. Data model changes

### 4.1 `sessions/{sessionId}` (server-side, never fully sent to client)

```ts
interface HeadroomSession {
  sessionId: string;
  domain: string;
  difficulty: string;

  // Generator outputs
  baselinePrompt: string;        // the editable prompt shown to the user
  baselineOutput: string;        // B0 executed output (may be shown)
  gapManifest: GapItem[];        // HIDDEN answer key — never leaves the server
  manifestModel: string;         // model+version that produced the manifest
  itemId?: string;               // set when served from the calibrated bank

  // Executor pinning (frozen at session creation)
  executorModel: string;         // e.g. pinned flash id
  executorTemperature: 0;
  selfRevisedOutput: string;     // Bsr executed output (self-revised ceiling)
  selfRevisedSpread?: number;    // stability of ceiling estimate

  // Provenance / reproducibility
  judgeModel: string;            // pinned judge id
  rubricVersionId: string;
  promptHash: string;
  createdAt: string;
  status: "active" | "completed";
}

interface GapItem {
  id: string;                    // stable, e.g. "GAP-01"
  dimension: string;             // which quality axis (see §6)
  description: string;           // what an excellent output would add/fix
  closableFloor: boolean;        // false if already resolved by self-revised ceiling
}
```

### 4.2 `attempts/{sessionId}`

```ts
interface HeadroomAttempt {
  sessionId: string;
  domain: string; difficulty: string;
  baselinePrompt: string;
  editedPrompt: string;          // the human's DIRECT EDIT (replaces `revision`)
  steeredOutput: string;         // Bh executed output

  // Judge outputs
  pairedComparison: PairedResult;      // §5.1
  manifestResolution: ResolutionResult; // §5.2

  // Scores
  resolution: number;            // R ∈ [0,1]
  efficiency: number;            // E ∈ [0,1]
  headroomScore: number;         // ∈ [0,1] (or ×100 for display)
  headroomSE: number;            // standard error from pass disagreement
  comparable: boolean;
  validityGatePassed: boolean;   // steered beats self-revised, blind

  // Provenance
  editDistance: number;
  timeTakenServerSeconds: number;
  judgeModel: string; executorModel: string; rubricVersionId: string;
  timestamp: string;
  status: "completed" | "scoring_pending" | "rejected";
  rejectionReason?: string;      // injection / blank / identical
}
```

---

## 5. Role 3: the Judge

Two blind judge calls. Both take **only outputs**, never the prompts or any "which one is the human" signal.

### 5.1 Blind randomized paired comparison — `judgePairedComparison()`

Establishes, on a common latent scale, that the steered output reliably beats the self-revised ceiling.

- Inputs per pass: `{ optionA, optionB }` where the mapping of `{selfRevised, steered}` → `{A,B}` is **randomized independently each pass**.
- 3 passes, pinned judge model, temperature 0.
- Judge returns a preference + margin, blind to identity and order.

```ts
const PAIRED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    winner: { type: Type.STRING, description: "Exactly 'A' or 'B'." },
    margin: { type: Type.INTEGER, description: "1=slight, 2=clear, 3=decisive." },
    rationale: { type: Type.STRING }
  },
  required: ["winner", "margin", "rationale"]
};

const PAIRED_PROMPT = (task, A, B) => `
You are comparing two candidate outputs for the same task. You do not know how
either was produced. Judge only which is higher quality for the task.

Task:
${task}

OUTPUT A:
"${A}"

OUTPUT B:
"${B}"

Decide which output is better overall and how decisively. Do not reward length
or formatting for their own sake — reward substantive quality for the task.`;
```

**Aggregation → Bradley–Terry win probability.** Un-randomize each pass back to `{selfRevised, steered}`, then:

```ts
// steeredWins across 3 passes, position already averaged out by randomization
const p_steered = steeredWins / 3;                 // 0, 1/3, 2/3, 1
const disagreement = (steeredWins !== 0 && steeredWins !== 3); // item information
// Bradley–Terry latent gap (regularized so 3-0 isn't ±∞):
const bt_gap = Math.log((steeredWins + 0.5) / (3 - steeredWins + 0.5));
```

- **Validity gate:** `validityGatePassed = p_steered >= 2/3` (steered beats ceiling in ≥2/3 blind passes). If false, Headroom is 0 for this attempt (the person did not elevate beyond the model's own revision).
- **Judge instability:** treat `disagreement === true` **plus** wide manifest-resolution disagreement as `judgeUnstable → comparable = false`. Disagreement is *information about the item*, not noise to hide (paper p.9).

### 5.2 Blind manifest resolution — `judgeManifestResolution()`

For each `GapItem`, the judge decides whether the ceiling and the steered output resolve it. Blind to which output is the human's; outputs labeled neutrally.

```ts
const RESOLUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          resolvedInX: { type: Type.BOOLEAN },   // ceiling
          resolvedInY: { type: Type.BOOLEAN },   // steered
          rationale: { type: Type.STRING }
        },
        required: ["id", "resolvedInX", "resolvedInY", "rationale"]
      }
    }
  },
  required: ["items"]
};
```

`X`/`Y` assignment to `{ceiling, steered}` is randomized per pass; un-randomize before aggregating. Run 3 passes; take majority vote per `(item, output)` cell.

---

## 6. Role 1: the Generator — task + gap manifest

Replaces flaw injection. The Generator produces a realistic task, a genuine model baseline, **and** the hidden manifest of what an excellent output would add. Reuse `ROLE_PROFILES` (persona, required elements, anti-patterns) and `DIFFICULTY_DEFINITIONS` (cognitive load) for realism.

New library in `asset-data.ts` replacing `FAILURE_MODES`:

```ts
// Quality dimensions an output can be improved ON (not errors injected INTO it)
export const GAP_DIMENSION_LIBRARY = {
  "Depth of reasoning": "Adds a non-obvious insight, mechanism, or second-order consequence.",
  "Specificity": "Replaces generic claims with concrete, situation-grounded specifics.",
  "Structure": "Reorganizes so the logic is followable and decision-relevant.",
  "Actionability": "Turns description into a decision, owner, or next step.",
  "Domain rigor": "Meets the domain's correctness/precision bar (see role criteria).",
  "Audience fit": "Reframes for the named stakeholder's needs and constraints.",
  // ...extend per domain
};
```

Generator schema (server-side only):

```ts
const GENERATOR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    task: { type: Type.STRING },
    baselinePrompt: { type: Type.STRING, description: "The prompt the user will edit." },
    baselineOutput: { type: Type.STRING, description: "Genuine competent-but-improvable model output." },
    gapManifest: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          dimension: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["id", "dimension", "description"]
      }
    }
  },
  required: ["task", "baselinePrompt", "baselineOutput", "gapManifest"]
};
```

**Critical:** the manifest is generated **before the person acts** and is **never sent to the client** — it is the a-priori criterion that fixes what counts as improvement independently of the judge's momentary impression (paper p.9). Strip it from every client-facing response and from the public `/api/attempt/:id` whitelist.

> **DECISION (supersedes the calibrated item bank): constrained generation from explicit ground rules.**
>
> The originally specced hand-curated item bank (generate → SME-review → pilot → serve from a fixed set) is **not being built**. Instead, every item is a **draw from a defined population** of admissible items, constrained by three layers of ground rules:
> 1. `ROLE_PROFILES[domain]` — persona, task archetypes (per difficulty), required elements, anti-patterns.
> 2. `DIFFICULTY_DEFINITIONS[difficulty]` — cognitive load, improvement shape, scenario complexity.
> 3. `GENERATION_GROUND_RULES` — cross-domain invariants that hold for every draw (no planted flaws, no real named entities, symbolic/analytic scope, genuine stakes, competent-but-improvable baseline).
>
> This is domain-sampling: items are exchangeable draws from a universe of admissible observations, so what gets calibrated is the *generator's distribution* rather than each individual item. **Honest tradeoff:** you cannot calibrate or reuse a specific item's difficulty the way a fixed bank lets you, and per-item difficulty variance stays higher. What holds the distribution in range instead is the 48–52 baseline pre-scoring band loop — which makes that loop load-bearing calibration machinery, not the legacy artifact §14 once treated it as. The upside is no curation bottleneck, no stale bank, and an effectively unbounded item pool.
>
> **Sampling without replacement within a run** (`selectTaskArchetype()`): the 3 items in one sitting draw distinct archetypes where the pool allows, and the run record tracks `usedArchetypes`. Three near-duplicate items would inflate within-person consistency for reasons unrelated to the person, corrupting the person × item variance decomposition (§11).
>
> **Note on `comparable`:** because there is no bank, the §8 "served from live fallback (not calibrated bank) ⇒ `comparable = false`" rule does not apply — live generation *is* the intended path, not a degraded one. The static `FALLBACK_TASKS` path (used only when generation fails outright) remains `comparable = false`.

---

## 7. Role 2 wiring + scoring — `computeHeadroom()`

Executor runs three prompts under one pinned model + temp 0:
- `B0` = `baselinePrompt` → `baselineOutput`
- `Bsr` = self-revision of `B0` (fixed self-critique prompt, no human input) → `selfRevisedOutput`
- `Bh` = `editedPrompt` (the human's direct edit) → `steeredOutput`

Self-revision prompt (fixed, versioned):

```ts
const SELF_REVISE_PROMPT = (task, out) => `
Task:
${task}

Your previous answer:
"${out}"

Critically revise your own answer to make it as excellent as you can for the
task. Improve substance, not just wording. Output only the revised answer.`;
```

Scoring:

```ts
function computeHeadroom(session, paired, resolution): HeadroomScore {
  // Closable gaps = manifest items NOT already resolved by the self-revised ceiling
  const closable = resolution.items.filter(it => !it.resolvedInCeiling);
  const closableN = closable.length;

  // Resolution R: fraction of closable gaps the steered output resolves
  const closed = closable.filter(it => it.resolvedInSteered).length;
  const R = closableN === 0 ? 0 : closed / closableN;   // frontier-relative, ceiling-anchored

  // Efficiency E: gaps closed per unit of change, normalized to [0,1]
  // editDistance normalized against baseline length; K tuned on the pilot set
  const changeFrac = clamp01(session.editDistanceNorm);        // 0..1
  const E = changeFrac === 0 ? 0 : clamp01(R / (changeFrac * K_EFFICIENCY));

  // Validity gate: no elevation beyond the model's own revision ⇒ Headroom 0
  if (!paired.validityGatePassed) {
    return { headroomScore: 0, R, E, headroomSE: paired.se, gate: false };
  }

  const headroomScore = 0.5 * R + 0.5 * E;                      // ∈ [0,1]
  return { headroomScore, R, E, headroomSE: paired.se, gate: true };
}
```

> **DECISION (supersedes the `0.5·R + 0.5·E` formula above): the shipped score is `R`, gated.**
> ```
> HeadroomScore = R    if the validity gate passes
>               = 0    otherwise
> ```
> `E` is **not** part of the score. Rationale: `R` and the validity gate already carry essentially all of the construct validity — criterion-referenced closure of gaps fixed before the person acted, gated on genuinely beating the model's own self-revision. `E` added a second, noisier dimension on top: change magnitude is gameable (surface edits vs. real conceptual ones), and `E` has no natural unit, so "0.65" is uninterpretable without knowing `K_EFFICIENCY`. `R` reads plainly as "closed 5 of the 8 gaps the model could not close itself" with no calibration constant at all.
>
> Two consequences worth stating explicitly:
> 1. **Cutover is no longer blocked on `K_EFFICIENCY`.** That constant was the single hard blocker on Phase 4; a gate-then-`R` score needs no calibration constant, so cutover now depends only on the regression harness and elevation monitor checking out against real data.
> 2. **Edit distance becomes a validity check, not a scoring input** (§13, verbosity-leakage monitor). A longer rewrite gives the manifest-resolution judge more surface area to find something that plausibly addresses each gap — that would be verbosity bias re-entering through the resolution check, which the a-priori manifest exists to prevent. If edit magnitude predicts `R`, that is a *judge calibration defect* to investigate, not something a scoring constant should silently cancel out. Tuning `K_EFFICIENCY` to absorb it would fix the symptom at the wrong layer.
>
> `E` may be reintroduced later — as a displayed diagnostic ("surgical vs. brute-force"), or into the score itself — but only if real data shows edit magnitude carries signal that `R` and the gate miss.

The `K_EFFICIENCY` note below is retained for context, and applies only if `E` is ever reintroduced:

`K_EFFICIENCY` and the edit-distance normalization are **calibration constants** — set them empirically on the pilot sample, not by intuition (this is the replacement for the magic caps 25/20/74). Report `headroomScore` with `headroomSE`; never a bare number.

**Edit-distance signal: implemented.** `computeEditDistance()` (`server/headroom/editDistance.ts`) computes `editDistance`/`editDistanceNorm` (word-level Levenshtein between `baselinePrompt` and the person's `editedPrompt`, clamped to [0,1]) and logs it on every attempt. This was blocked at Phase 2 because the interaction model was still free-form revision instructions with no natural edit to measure; Phase 3's direct prompt editing resolved that, but nothing had picked the signal back up until now. `headroomShadow` still only computes the Resolution-only proxy (`E` itself is not computed) — `K_EFFICIENCY` is still an open calibration decision (§16.2) — but the raw signal needed to fit it is now being collected rather than needing a second migration once real data exists.

---

## 8. Reliability & comparability

- **`comparable = false`** if any of: served from live fallback (not calibrated bank), `judgeUnstable` (paired disagreement + resolution disagreement), injection/blank/identical, time budget exceeded, or executor/judge model not the pinned version. (Same spirit as the current `comparable` flag, minus the flaw-band logic.) **Implemented:** `computeFinalEvaluation()` now includes `executorModelMismatch` (session's `executorModel` vs the currently pinned `EXECUTOR_MODEL`) in the `comparable` gate.
- **Self-revised ceiling stability — implemented but DISABLED at temperature 0.** `assessCeilingStability()` (`server/headroom/ceilingStability.ts`) and its tests are kept, but `server.ts` no longer calls it. Reason: with `EXECUTOR_TEMPERATURE = 0`, both self-revisions are generated from an identical prompt, so the check spent 4 extra model calls per item (a second self-revision plus a 3-pass blind comparison) comparing a text against a near-copy of itself. It measures real signal only if the Executor ever runs at a non-zero temperature — re-enable it then, not before.
- **Absolute-scorer pass count — one, not three** (`ABSOLUTE_JUDGE_PASS_COUNT`). The legacy 0–100 scorer sent an *identical* prompt three times at `temperature: 0, topP: 1`; the passes did not vary, so the median smoothed nothing and `spread` was ~0 by construction, meaning the `judgeUnstable = spread > 4` comparability gate was already close to inert. This is the opposite of the blind comparisons in §5.1/§5.2, where position is randomized per pass, the passes are genuinely different inputs, and disagreement is real information — those correctly remain at `JUDGE_PASS_COUNT = 3`. **The rule: repeat a model call only when something varies between the repeats.** Post-cutover the new judge's `disagreement` flag replaces `judgeUnstable` as the instability signal.
- **Evaluation claim/lock.** A session is scored exactly once, but a *failed* evaluation stays retryable. `decideEvaluationClaim()` (`server/headroom/sessionLock.ts`) implements `active → scoring → completed`, with the claim released back to `active` on any failure and reclaimable after `STALE_SCORING_CLAIM_MS` if a request dies mid-flight. The previous two-state design flipped to `completed` *before* scoring, so any judge failure permanently locked the session — the error screen's Retry button returned 409 and its "your submission was not lost" message was untrue.
- **Standard error:** derive `headroomSE` from pass disagreement in §5.1/§5.2.

---

## 9. Threat → structural response (acceptance criteria)

From the paper's Table 2. Each must be satisfied by **architecture**, not by a prompt caution ("caution does not scale", p.12). Encode as automated tests.

| Threat | Structural response (must be verifiable in code) |
|---|---|
| **Sycophancy** | Judge blind to which output is the human's; no "user liked it" signal anywhere in scoring |
| **Position bias** | Pair order randomized independently per pass; ≥3 passes; un-randomize before aggregating |
| **Verbosity / length bias** | Score keyed to manifest resolution; length credited only when it resolves a gap |
| **Self-preference** | Single pinned judge, applied identically to both outputs; magnitude comes from *difference*, not absolute |
| **Confounded conditions** | Executor pins model + temperature; only the human edit differs between runs |
| **Criterion contamination** | No satisfaction/preference term in the score at all |
| **Construct-irrelevant variance (flaw-spotting)** | No injected flaws; manifest measures elevation, not error detection |

> **Judge design note (reconciles the earlier review):** the paper argues *for* a **single pinned model judge** over a human/heterogeneous panel — a fixed model's biases can be neutralized by blinding + randomization, whereas human aversion/appreciation biases are moving targets no instruction corrects (p.11). Keep the single pinned judge as the scoring instrument; use multi-model runs only as an **offline robustness check**, not the primary reliability mechanism.

> **DECISION: one Gemini model, everywhere, no model-tier fallback.** `GEMINI_MODEL` (`server/headroom/constants.ts`, currently `gemini-3.1-pro-preview`) backs `EXECUTOR_MODEL` and `JUDGE_MODEL` alike, and the Generator's task-generation call uses it too — a single constant, not three independently-set ones that happen to agree. The previous `MODEL_WATERFALL` (tiered retry across three different models on failure) is removed. If the pinned model call fails for any reason — rate limit, transient outage, invalid key — the failure propagates as an honest error telling the person to retry later; it is never masked by silently falling back to a weaker model or to fabricated static content. This directly serves the "never surface fabricated scores" principle already in §10/§12, and it also simplifies the executor/judge re-equating design (§16.5): with one model everywhere, there is nothing to compare against a "different tier" — a mismatch only ever means an actual model version upgrade.
>
> Consequence: the legacy `comparable` check that verified generation used the *cheapest* waterfall tier (`generationModelUsed !== "gemini-3.1-flash-lite"`) no longer means anything now that there is no tier structure — removed from both `computeFinalEvaluation.ts` and the `save-attempt` handler. The static task fallback (`FALLBACK_TASKS`, `usedModel === "static-fallback"`) is deleted outright for the same reason: if 4 generation attempts produce no usable candidate, the honest response is a "try again" error, not pre-written content an AI never touched.

---

## 10. What to delete

- `scoreOutputThreePass()` absolute-scoring path and its 5-dim 0–20 schema.
- Guardrails **C2–C5** in `computeFinalEvaluation()` (formatting fallacy, cosmetic-only, premium threshold, negative diff). Manifest keying subsumes them.
- `headroom = 100 - selectedScore` and the `headroomEfficiencyScore`/`rawDelta` composite.
- `FAILURE_MODES`, `FAILURE_MODE_IDS`, `flawsInjected`, `mitigationAssessment`, and the 48–52 baseline band regeneration loop.
- **`App.tsx` client fallback that fabricates score `45`** — on failure show an honest "couldn't score, retry" and mark `scoring_pending`; never surface invented numbers.

---

## 11. Multi-item sessions + person-vs-task validation

**Status: implemented (Phase 4b).** Items per session decided at 3 (§16.3).

The single-item design cannot separate a person's capacity from item difficulty. The paper makes this the **first validation and a falsification condition** (p.15): *"A measure separating tasks but not persons would reveal an instrument capturing item difficulty rather than a human capacity."*

- Serve **3 items per session** (`ITEMS_PER_RUN`, `server/headroom/constants.ts`): `/api/generate-task` accepts an optional `runId`, groups items under a `testRuns/{runId}` record, and `GET /api/run/:runId` reports per-item status plus the cross-item mean ± SE (`aggregateRunResults()`, `server/headroom/aggregateRun.ts`). The client (`src/App.tsx`) loops the person through all 3 items in one sitting, skipping the tour screen after the first, and shows a session summary alongside the final item's full results.
- Items are **not yet drawn from a calibrated item bank** (§6) — each is still live-generated per the existing single-item pipeline, just grouped under a shared run. The item bank remains a separate, not-yet-built piece.
- Every non-final item now gets its own headless `save-attempt` call so its person identity (`userEmail`) is attached immediately, rather than only the last item in a run getting a real person key — this is what makes the run's 3 items usable as genuine repeated measures.
- Variance decomposition: `scripts/variance-decomposition.ts` reports the person-variance component from real attempts, keyed by `sessionId` (item) and `userEmail` (person). **The "valid instrument" claim is still gated on person variance being materially > 0** — multi-item sessions now produce the repeated-measures data this needs, but the gate itself can only be evaluated once real usage accumulates.

---

## 12. Reporting

- Report **distributional** standing (within-domain, within-difficulty percentiles), never a single cross-domain mean — models beat the human *average* while the best humans beat models; the tail is the point (paper §"Implications", p.13). Preserve the upper tail in any leaderboard.
- Show `HeadroomScore ± SE`, the validity-gate result, and `comparable`.
- **Scope banner:** results are valid for symbolic/analytic work only; the instrument is silent on embodied, relational, and accountability-bearing work (paper §"Implications", p.14). **Domain pruning resolved (§16.4):** the domain list is now scoped to 7 of the original 13 (`src/types.ts` `DOMAINS`), removing Sales, Customer Support, Human Resources, Marketing, Business Operations, and Content & Communications.
- **Research consent gates aggregate statistics, and is optional.** The ConfigureScreen consent checkbox ("I consent to using my anonymized evaluation details for research and aggregated cognitive benchmarking statistics") is not required to take the assessment — a non-consenting person still gets their own `HeadroomScore` and their own percentile standing. What consent actually gates is contributing to *other* people's statistics: the leaderboard, `/api/percentile`'s reference pool, variance decomposition, the regression harness, and all three standing validity monitors now require `researchConsent === true` in addition to `comparable === true`. This closes a latent gap — the checkbox was previously mandatory, so every existing attempt satisfied it by construction and no code path actually checked it; making it optional means the check needed to become real.

---

## 13. Standing validity monitors

Bake the paper's falsifiability conditions in as live checks, not one-off studies:

- **Elevation monitor — implemented, reachable two ways.** `computeElevationMonitor()` (`server/headroom/validityMonitors.ts`) reports the mean `pSteered` (rate at which steered beats self-revised in blind paired comparison) across comparable attempts, flagging `atOrNearChance` once sample size is sufficient (`MIN_SAMPLE_SIZE_FOR_ELEVATION_MONITOR = 20`) and the mean sits at or below 0.55. Reachable via `npx tsx scripts/validity-monitors.ts <attempts-export.json>` (`npm run analyze:validity`) against an export, or live via `GET /api/admin/validity-report` (admin-key gated) against the current attempts collection directly — no manual export step needed. Still not a scheduled/alerting check — that needs a notification channel, which doesn't exist yet.
- **Obsolescence monitor — implemented, reachable the same two ways.** `computeObsolescenceMonitor()` groups attempts by `executorModel`, computes each era's mean `headroomScoreShadow`, and flags `possibleObsolescence` when the most recent sufficiently-sampled era (`MIN_SAMPLE_SIZE_PER_ERA = 20`) collapses toward zero (≤0.1) after an earlier era showed meaningful Headroom (≥0.2). No real model transition has occurred yet in this system's data to actually trigger this.
- **Verbosity-leakage monitor — implemented** (`computeVerbosityLeakageMonitor()`, same module and both surfaces). Correlates `editDistanceNorm` against `R` across comparable attempts and flags `possibleLeakage` at r ≥ 0.5 with n ≥ 20. Resolution is *supposed* to be independent of how much text the person wrote; if bigger edits systematically raise `R`, the manifest-resolution judge is likely rewarding volume rather than genuine gap closure. **The correct response is to fix the judge, not to add a compensating term to the score** — this is precisely why edit magnitude is a validity check here rather than the Efficiency scoring input it was originally specced as (§7, §16.2). Some positive correlation is expected and legitimate (closing more gaps usually does take more words), so the flag means "investigate", never "proven biased".
- **Validation battery hooks:** optional post-test measures to establish convergent/discriminant validity — positive-but-imperfect correlation with evaluative expertise (Amabile CAT), relation to domain knowledge, and near-independence from Need for Cognition. Not started — this needs a product decision on what post-test instrument to administer and to whom.

---

## 14. Migration phases

**Status legend:** ✅ done · ⚠️ partial/held · ⛔ not started.

**Phase 0 — Scaffolding (no behavior change). ✅** Extracted scoring into a pure, unit-tested `headroom/` module. Golden-file regression tests around current outputs. `firebase-admin` added and actually wired up (server.ts now uses Admin SDK credentials, not the client SDK, for Firestore).

**Phase 1 — Executor pinning + self-revision (shadow). ✅** `Bsr` self-revision recorded (`selfRevisedOutput`/`selfRevisedSpread`) on every session. No scoring change.

**Phase 2 — Judge v2 (shadow). ✅** `judgePairedComparison()` + `judgeManifestResolution()` implemented. Every real attempt computes `headroomShadow` alongside the old score; only the old score is surfaced.

**Phase 3 — Generator v2 + direct edit. ✅** UI edits the baseline prompt directly; Generator emits `gapManifest`; flaw injection (`FAILURE_MODES`, `flawsInjected`, `primaryFailureMode`) fully retired.

**Phase 4 — Cutover. ⚠️ Partial, held — but no longer blocked on calibration.** Percentile/distributional reporting, scope banner, and variance decomposition (`scripts/variance-decomposition.ts`) shipped. The score cutover has **not** happened yet, but the blocker changed: dropping the Efficiency term (§7, §16.2) removed the `K_EFFICIENCY` calibration dependency entirely, and the shipped shadow score `headroomShadow.headroomScoreShadow` **already computes exactly the decided shape** (gate-then-`R`) — it was never an interim approximation. What remains before flipping is evidence, not code: run the regression harness and elevation monitor against real attempts and confirm the instrument behaves (real elevation above chance, sane score-shift distribution, non-trivial person variance). §10's deletions (C2–C5 guardrails, `headroomEfficiencyScore`/`rawDelta` composite) follow the flip — deleting them before it would break live scoring.

**Phase 4b — Multi-item sessions + person-vs-task validation (§11). ✅** `ITEMS_PER_RUN = 3`; `testRuns` collection; `GET /api/run/:runId`; App.tsx runs a real 3-item loop per session (headless `save-attempt` for non-final items so every item's attempt carries the person's identity). `scripts/variance-decomposition.ts`'s `sessionId`-keyed item identity (fixed pre-existing bug) now receives genuine repeated-measures data from real multi-item runs.

**Phase 5 — Hardening. ✅** Admin key auth (constant-time comparison) + rate limits + daily spend cap; admin audit log; `INJECTION_REGEXES` downgraded to advisory alongside the model-side `integrityViolation` signal; CI (typecheck/test/build) added. Judge/executor re-equating mechanism added (§16.5) — the policy and code path exist, but no real model transition has occurred yet to equate across.

---

## 15. Test plan

- **Unit:** BT aggregation (0/1/2/3 wins → probabilities, regularized log-odds), `R` with `closableN=0`, `E` at `changeFrac=0`, validity-gate on/off, PII/manifest stripping from client payloads.
- **Structural (Table 2):** property tests asserting the judge payload contains no identity/order/preference signal and that pass order is randomized.
- **Golden:** fixed (task, manifest, ceiling, steered) fixtures → stable `R`, `E`, gate.
- **Regression harness — implemented, reachable two ways.** `computeScoreShiftReport()` (`server/headroom/scoreShiftReport.ts`) compares the legacy score against `headroomShadow` (already computed on every real attempt) across a historical attempts export: mean of each, mean shift, Pearson correlation, and the validity-gate pass/fail split. Reachable via `npx tsx scripts/regression-harness.ts <attempts-export.json>` (`npm run analyze:regression`) against an export, or live via `GET /api/admin/validity-report` (also bundles variance decomposition + the elevation/obsolescence monitors in one call). This report should be run and reviewed before the Phase 4 cutover proceeds — it has not yet been run against real data, since no real attempts exist in this sandbox.

---

## 16. Open decisions

1. **Frontier anchor — RESOLVED: manifest-complete.** `aggregateManifestResolution()` (`server/headroom/manifestMath.ts`) already implements this: `closable` = manifest gaps the self-revised ceiling does not already resolve, and `resolution = resolvedCount / closableCount` over exactly that closable set. No scaffolded strong-model exemplar path exists or is planned.
2. **`K_EFFICIENCY` — RESOLVED: not needed.** The Efficiency term was dropped from the score (§7): `HeadroomScore = R`, gated. `R` and the validity gate carry the construct validity; `E` added a gameable, unitless second dimension whose interpretation depended entirely on a constant nobody could calibrate yet. **This unblocks the Phase 4 cutover** — it was previously the one hard blocker. Edit distance is still logged, but now feeds the verbosity-leakage validity monitor (§13) rather than the score. Reintroducing `E` remains open, contingent on real data showing it carries signal `R` and the gate miss.
3. **Items per session — RESOLVED: 3.** Implemented via `ITEMS_PER_RUN` (`server/headroom/constants.ts`), the `testRuns` collection, `GET /api/run/:runId`, and the App.tsx run loop (§11).
4. **Domain pruning — RESOLVED: 7 of the original 13.** Kept: General Knowledge Work, Software Engineering, Product Management, Data Analysis, Finance, Legal, Consulting & Strategy. Pruned: Marketing, Sales, Human Resources, Business Operations, Content & Communications, Customer Support — either explicitly flagged by the paper as relationship-heavy (Sales, Customer Support) or leaning interpersonal/persuasive/generic rather than analytic-correctness-bearing (Human Resources, Marketing, Business Operations, Content & Communications). See `src/types.ts` `DOMAINS`.
5. **Judge model pinning + re-equating policy — RESOLVED (mechanism), pending real transition.** `computeFinalEvaluation()` now excludes an attempt from `comparable` whenever `sessionData.executorModel` no longer matches the currently pinned `EXECUTOR_MODEL` (`executorModelMismatch`), and every attempt records both `executorModel` and `judgeModel` at scoring time. `server/headroom/reequating.ts` + `scripts/judge-reequate.ts` compute the anchor-item equating offset (mean new-model-score minus old-model-score across a shared item set) once such a set exists — per the paper's anchor-item design, producing that set is a deliberate offline calibration exercise (re-run a shared item bank subset through both model eras), not something that happens automatically in the attempts stream today.
