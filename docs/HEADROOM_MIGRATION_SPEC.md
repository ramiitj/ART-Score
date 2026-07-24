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

> **Preferred:** generate + SME-review + pilot items **offline** into a calibrated bank and serve from it (removes generation latency/cost from the request path and lets us calibrate item difficulty). Live generation stays as a labeled `comparable=false` fallback.

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

`K_EFFICIENCY` and the edit-distance normalization are **calibration constants** — set them empirically on the pilot sample, not by intuition (this is the replacement for the magic caps 25/20/74). Report `headroomScore` with `headroomSE`; never a bare number.

---

## 8. Reliability & comparability

- **`comparable = false`** if any of: served from live fallback (not calibrated bank), `judgeUnstable` (paired disagreement + resolution disagreement), injection/blank/identical, time budget exceeded, or executor/judge model not the pinned version. (Same spirit as the current `comparable` flag, minus the flaw-band logic.)
- **Self-revised ceiling stability:** run `Bsr` twice; if the two ceilings' paired comparison is a coin-flip, ceiling is stable; if one dominates, take the stronger (the ceiling must be the model's *best* self-revision) and record `selfRevisedSpread`.
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

---

## 10. What to delete

- `scoreOutputThreePass()` absolute-scoring path and its 5-dim 0–20 schema.
- Guardrails **C2–C5** in `computeFinalEvaluation()` (formatting fallacy, cosmetic-only, premium threshold, negative diff). Manifest keying subsumes them.
- `headroom = 100 - selectedScore` and the `headroomEfficiencyScore`/`rawDelta` composite.
- `FAILURE_MODES`, `FAILURE_MODE_IDS`, `flawsInjected`, `mitigationAssessment`, and the 48–52 baseline band regeneration loop.
- **`App.tsx` client fallback that fabricates score `45`** — on failure show an honest "couldn't score, retry" and mark `scoring_pending`; never surface invented numbers.

---

## 11. Multi-item sessions + person-vs-task validation

The single-item design cannot separate a person's capacity from item difficulty. The paper makes this the **first validation and a falsification condition** (p.15): *"A measure separating tasks but not persons would reveal an instrument capturing item difficulty rather than a human capacity."*

- Serve **3–5 calibrated items per session**; aggregate Headroom across items (mean of item Headrooms, with SE).
- Instrument a **variance decomposition**: log enough to fit `Headroom ~ person + task + person:task`. Ship a `scripts/variance_decomposition.*` job that reports the person-variance component. **Gate the "valid instrument" claim on person variance being materially > 0.**

---

## 12. Reporting

- Report **distributional** standing (within-domain, within-difficulty percentiles), never a single cross-domain mean — models beat the human *average* while the best humans beat models; the tail is the point (paper §"Implications", p.13). Preserve the upper tail in any leaderboard.
- Show `HeadroomScore ± SE`, the validity-gate result, and `comparable`.
- **Scope banner:** results are valid for symbolic/analytic work only; the instrument is silent on embodied, relational, and accountability-bearing work (paper §"Implications", p.14). Prune/scope domains accordingly (relationship-heavy cores of Sales/Customer Support fall partly outside scope).

---

## 13. Standing validity monitors

Bake the paper's falsifiability conditions in as live checks, not one-off studies:

- **Elevation monitor:** ongoing rate at which steered beats self-revised in blind paired comparison across people/domains. If this drops to chance, the construct is empty — surface it.
- **Obsolescence monitor:** track mean Headroom over model generations; if a model upgrade collapses Headroom toward zero, the instrument should *record its own obsolescence* (continual learning solved) rather than hide it.
- **Validation battery hooks:** optional post-test measures to establish convergent/discriminant validity — positive-but-imperfect correlation with evaluative expertise (Amabile CAT), relation to domain knowledge, and near-independence from Need for Cognition.

---

## 14. Migration phases

**Phase 0 — Scaffolding (no behavior change).** Extract scoring into a pure, unit-tested `headroom/` module. Add golden-file regression tests around current outputs so later diffs are visible. Add `firebase-admin`; make DB required in prod.

**Phase 1 — Executor pinning + self-revision (shadow).** Add `Bsr` self-revision and record `selfRevisedOutput`/`selfRevisedSpread` on every session. No scoring change yet.

**Phase 2 — Judge v2 (shadow).** Implement `judgePairedComparison()` + `judgeManifestResolution()`. For each real attempt, compute the new Headroom **alongside** the old score; log both; surface only the old score. Compare distributions.

**Phase 3 — Generator v2 + direct edit.** Switch UI from "revision instructions" to **editing the baseline prompt**; Generator emits `gapManifest`; retire flaw injection. Still shadow the score if desired.

**Phase 4 — Cutover.** Make Headroom the surfaced score. Delete §10 items. Ship item-bank calibration + variance decomposition. Flip reporting to distributional + SE + scope banner.

**Phase 5 — Hardening.** Auth + rate limits + spend cap on generate/evaluate; admin key rotation + audit log; downgrade `INJECTION_REGEXES` to advisory paired with the model-side integrity signal.

---

## 15. Test plan

- **Unit:** BT aggregation (0/1/2/3 wins → probabilities, regularized log-odds), `R` with `closableN=0`, `E` at `changeFrac=0`, validity-gate on/off, PII/manifest stripping from client payloads.
- **Structural (Table 2):** property tests asserting the judge payload contains no identity/order/preference signal and that pass order is randomized.
- **Golden:** fixed (task, manifest, ceiling, steered) fixtures → stable `R`, `E`, gate.
- **Regression harness:** replay a sample of historical attempts through old vs new scorer; publish the score-shift report before Phase 4.

---

## 16. Open decisions (need product/research sign-off)

1. **Frontier anchor:** manifest-complete as frontier (recommended) vs a scaffolded strong-model exemplar. Spec assumes manifest-complete.
2. **`K_EFFICIENCY`** and edit-distance normalization: pin after pilot calibration.
3. **Items per session** (3 vs 5): reliability vs completion-time tradeoff.
4. **Domain pruning:** which of the 13 domains stay in scope under the symbolic/analytic boundary.
5. **Judge model pinning + re-equating** policy across model upgrades (anchor-item design).
