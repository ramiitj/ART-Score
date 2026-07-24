export interface DiffInventoryItem {
  changeDescription: string;
  classification: string;
}

export interface MitigationAssessmentItem {
  failureModeId: string;
  mitigated: boolean;
  rationale: string;
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
  mitigationAssessment?: MitigationAssessmentItem[];
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
