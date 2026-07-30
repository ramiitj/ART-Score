export interface DiffInventoryItem {
  changeDescription: string;
  classification: string;
}

export interface JudgePassResult {
  clarityScore: number;
  clarityRationale: string;
  depthScore: number;
  depthRationale: string;
  structureScore: number;
  structureRationale: string;
  actionabilityScore: number;
  actionabilityRationale: string;
  domainScore: number;
  domainRationale: string;
  strengths: string[];
  insight: string;
  diffInventory?: DiffInventoryItem[];
  selfChecks: string;
  confidence: string;
  integrityViolation: boolean;
}

export interface DimensionSpreads {
  clarity: number;
  depth: number;
  structure: number;
  actionability: number;
  domain: number;
}

export interface AggregatedScore {
  medians: {
    clarity: number;
    depth: number;
    structure: number;
    actionability: number;
    domain: number;
  };
  total: number;
  spread: number;
  passes: JudgePassResult[];
  dimensionSpreads: DimensionSpreads;
}

// --- Judge v2: blind paired comparison ---------------------------------

// A single pass's raw judge output, plus the position assignment used for
// that pass so the result can be un-randomized back to {ceiling, steered}.
export interface PairedPassRaw {
  steeredIsA: boolean; // true if the steered output was randomized into slot A this pass
  winner: "A" | "B";
  margin: number;
  rationale: string;
}

export interface PairedPassOutcome {
  steeredWon: boolean;
  margin: number;
  rationale: string;
}

export interface PairedComparisonResult {
  steeredWins: number;
  passCount: number;
  pSteered: number;
  btLogOdds: number; // regularized Bradley-Terry log-odds, ln((wins+0.5)/(losses+0.5))
  disagreement: boolean; // true if passes split rather than unanimously agreeing
  validityGatePassed: boolean;
  passes: PairedPassOutcome[];
}

// --- Judge v2: blind manifest resolution --------------------------------

// A gap identified by the Generator before the person acts; never sent to the client.
export interface GapItem {
  id: string;
  dimension: string;
  description: string;
}

export interface ManifestPassItemRaw {
  id: string;
  resolvedInX: boolean;
  resolvedInY: boolean;
  rationale: string;
}

export interface ManifestPassRaw {
  steeredIsX: boolean; // true if the steered output was randomized into slot X this pass
  items: ManifestPassItemRaw[];
}

export interface ManifestItemResult {
  id: string;
  dimension: string;
  resolvedInCeiling: boolean;
  resolvedInSteered: boolean;
}

export interface ManifestResolutionResult {
  items: ManifestItemResult[];
  closableCount: number; // gaps not already resolved by the self-revised ceiling
  resolvedCount: number; // of those, gaps the steered output resolves
  resolution: number; // resolvedCount / closableCount, or 0 if nothing was closable
}
