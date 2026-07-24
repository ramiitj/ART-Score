export enum TestStep {
  WELCOME = "WELCOME",
  CONFIGURE = "CONFIGURE",
  TOUR = "TOUR",
  ACTIVE_TEST = "ACTIVE_TEST",
  EVALUATING = "EVALUATING",
  EVALUATION_ERROR = "EVALUATION_ERROR",
  RESULTS = "RESULTS",
  ADMIN = "ADMIN",
  VERIFICATION = "VERIFICATION"
}

export interface DimensionScore {
  dimension: string;
  score: number;
  rationale: string;
}

export interface JudgeMetadata {
  modelVersion: string;
  promptHash: string;
  temperature: number;
}

export interface TriageFlags {
  guardrailFired: boolean;
  reason?: string;
  capApplied?: number;
}

export interface TextTelemetry {
  baselineLength: number;
  revisionLength: number;
}

export interface EvaluationResult {
  score: number;
  headroomEfficiencyScore?: number;
  rawDeltaScore?: number;
  baselineQualityScore?: number;
  strengths: string[];
  insight: string;
  clarity: string;
  diffInventory?: string;
  selfChecks?: string;
  confidence?: string;
  dimensionScores?: DimensionScore[];
  judgeMetadata?: JudgeMetadata;
  triageFlags?: TriageFlags;
  textTelemetry?: TextTelemetry;
}

// One completed item's summary within a multi-item run (docs/HEADROOM_MIGRATION_SPEC.md §11).
export interface RunItemSummary {
  sessionId: string;
  domain: string;
  difficulty: string;
  score: number;
}

export interface UserSignals {
  timeTaken: number;
  editCount: number;
  retried: boolean;
}

export interface AttemptLog {
  id?: string;
  sessionId?: string;
  anonymizedUserId?: string;
  userName: string;
  userEmail: string;
  domain: string;
  difficulty: string;
  task: string;
  baseline: string;
  baselinePrompt?: string;
  editedPrompt: string;
  score: number;
  evaluation: EvaluationResult;
  timestamp: string;
  timeAllocated?: number;
  timeTaken?: number;
  age?: string;
  gender?: string;
  education?: string;
  workExperience?: string;
  systemDetails?: any;
  geolocation?: any;
  ipAddress?: string;
  userSignals?: UserSignals;
}

// Scoped to symbolic/analytic knowledge work per the Headroom paper's validity
// boundary (docs/HEADROOM_MIGRATION_SPEC.md §12, §16.4) -- domains whose core
// work is relational, persuasive, or accountability-bearing (Marketing, Sales,
// Human Resources, Business Operations, Content & Communications, Customer
// Support) were pruned from the original 13.
export const DOMAINS = [
  "General Knowledge Work",
  "Software Engineering",
  "Product Management",
  "Data Analysis",
  "Finance",
  "Legal",
  "Consulting & Strategy"
];

export const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced"
];
