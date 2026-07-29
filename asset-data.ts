// Difficulty ground rules. These constrain how hard it is to ELEVATE a
// competent baseline, not how hard it is to spot an injected defect --
// the flaw-injection design these once described was retired in Phase 3
// (docs/HEADROOM_MIGRATION_SPEC.md §0). Wording here is fed verbatim into
// the generator prompt, so it must never ask for embedded failure modes:
// the baseline is meant to be genuinely competent, with the room for
// improvement emergent rather than planted.
export const DIFFICULTY_DEFINITIONS = {
  "Beginner": {
    cognitiveLoad: "The room to improve is apparent on careful reading. A working professional sees what a stronger response would add within seconds. The move is recognition, not inference.",
    improvementShape: "One dominant dimension of improvement. What excellence would add is clear once the gap is recognized.",
    scenarioComplexity: "Single stakeholder or audience. One decision or deliverable. 200–350 token baseline.",
    timeBudget: 90
  },
  "Intermediate": {
    cognitiveLoad: "The room to improve is visible only with domain framing. The professional actively examines what is missing rather than what is wrong. The move involves identifying absences and unstated assumptions.",
    improvementShape: "One dominant improvement dimension plus one secondary. Elevating the response requires introducing structure or constraints the baseline prompt never asked for.",
    scenarioComplexity: "Multiple stakeholders or competing considerations. A decision with non-obvious tradeoffs. 350–550 token baseline.",
    timeBudget: 120
  },
  "Advanced": {
    cognitiveLoad: "The baseline reads like competent senior-level work and is defensible as-is. What a stronger response adds is methodological, structural, or second-order.",
    improvementShape: "One subtle dominant dimension plus two minor ones that compound. Elevating the response requires reframing or surfacing assumptions, not just adding content.",
    scenarioComplexity: "Multiple stakeholders with conflicting interests. High stakes, ambiguous right answer. 550–800 token baseline.",
    timeBudget: 180
  }
};

// Cross-domain generation ground rules (docs/HEADROOM_MIGRATION_SPEC.md §6).
// Every generated item is a draw from the population of items admissible
// under these rules plus the domain's ROLE_PROFILES entry and the difficulty
// definition above -- this constrained-sampling design replaces the
// originally specced hand-curated item bank. Invariants that must hold for
// EVERY draw regardless of domain or difficulty live here.
export const GENERATION_GROUND_RULES = [
  "The baseline prompt must be one a real professional would plausibly type in one shot -- natural and underspecified, never deliberately sabotaged.",
  "The baseline prompt must not contain planted errors, contradictions, or hints about what is missing from it.",
  "The task must be resolvable through symbolic and analytic work alone -- no embodied, relational, or accountability-bearing judgment as the core of the task.",
  "No real named companies, real named people, live matters, or real financial figures.",
  "The task must have genuine stakes and a specific audience; no generic 'make this professional' framing.",
  "There must be real room to elevate the response, but the baseline must still be usable as-is in real work."
];

export const ROLE_PROFILES = {
  "General Knowledge Work": {
    persona: "Educated professional in any white-collar role, dealing with the kinds of communication, planning, and thinking tasks that cross all knowledge work. The persona is intentionally cross-functional — not specialized to any single discipline.",
    taskArchetypes: {
      "Beginner": ["Meeting summary", "status update", "simple project brief", "short decision memo", "email rewrite for a specific audience", "agenda for a recurring meeting"],
      "Intermediate": ["Cross-functional project plan", "stakeholder communication on a delay", "decision memo with multiple options", "post-event retrospective", "working document for an unfamiliar audience"],
      "Advanced": ["Executive briefing across functions", "sensitive cross-team communication", "strategic prioritization rationale", "organizational change announcement", "decision document with ambiguous tradeoffs and political stakes"]
    },
    requiredElements: ["A specific audience or stakeholder named with role context", "A specific decision, ask, or deliverable the artifact serves", "A specific situational context (deadline, constraint, prior history) that grounds the task", "At least one identifiable next step, owner, or success criterion implied by the task"],
    antiPatterns: ["Generic 'make this professional' framing without a real situation", "Tasks that are actually specialized role work mislabeled as General", "Personal life scenarios", "Tasks with no real stakes or audience"]
  },
  "Software Engineering": {
    persona: "Senior engineer or tech lead writing for engineering peers. The persona is technical, specific, and operates within real engineering constraints (performance, maintainability, observability, deployment).",
    taskArchetypes: {
      "Beginner": ["Code review of a small function", "debugging note on a specific behavior", "choice between two implementation approaches", "technical FAQ entry", "simple PR description"],
      "Intermediate": ["Technical design doc for a new endpoint or service component", "evaluation of an architectural tradeoff", "root-cause analysis for an incident", "refactor proposal", "dependency upgrade analysis"],
      "Advanced": ["System architecture review across services", "scalability analysis with capacity planning", "security review of a design", "migration strategy for a critical system", "technical strategy document"]
    },
    requiredElements: ["A specific language, framework, or technology named", "Either a code snippet (15–60 lines) or a specific architectural component", "A specific failure mode, performance metric, or non-functional requirement", "A specific stakeholder relationship"],
    antiPatterns: ["Tasks that are about writing about code rather than doing engineering work", "Vague 'best practices' framing", "Mixing too many unrelated technologies", "Tasks resolvable by pure pattern-matching without judgment", "Tasks requiring highly current knowledge of specific library versions"]
  },
  "Product Management": {
    persona: "Product manager at varying seniority writing for engineering, design, leadership, or cross-functional partners. The persona is user-focused, decision-oriented, and works within real product constraints.",
    taskArchetypes: {
      "Beginner": ["Feature prioritization rationale", "user feedback summary with recommendation", "simple PRD section", "sprint planning note", "user-facing release note"],
      "Intermediate": ["Full PRD for a feature", "product spec with user flows", "A/B test proposal", "quarterly planning input", "feature deprecation plan"],
      "Advanced": ["Product strategy doc", "market expansion analysis", "platform-vs-feature decision memo", "sunsetting recommendation", "multi-quarter roadmap rationale"]
    },
    requiredElements: ["A specific user segment or persona", "A specific product surface or feature area", "At least one success metric or KPI named", "A specific stakeholder"],
    antiPatterns: ["Tasks at companies that are actually named", "Tasks where the right answer is obvious", "Pure brainstorming tasks without a decision required", "Tasks about products that do not exist"]
  },
  "Data Analysis": {
    persona: "Data analyst or analytics partner writing for business stakeholders or technical peers. The persona is methodologically careful and values statistical rigor over narrative simplicity.",
    taskArchetypes: {
      "Beginner": ["Stakeholder summary of a finding", "simple metric interpretation", "basic trend analysis", "dashboard commentary"],
      "Intermediate": ["Methodology and findings report", "segment analysis", "root-cause investigation", "cohort comparison", "simple A/B test analysis"],
      "Advanced": ["Experimental design proposal", "causal inference write-up", "complex cohort analysis", "methodology critique of a prior analysis", "observational study design"]
    },
    requiredElements: ["Specific metrics with numerical values", "Time period or sample specification", "A specific business question being answered", "Methodological context"],
    antiPatterns: ["Tasks resolvable without engaging with the data", "Pure 'make a chart' or visualization tasks", "Tasks that require specific tool syntax", "Tasks where statistical rigor does not matter"]
  },
  "Finance": {
    persona: "Financial analyst, controller, FP&A partner, or finance business partner writing for finance peers or business stakeholders. The persona handles numbers carefully and never presents projections as certainties.",
    taskArchetypes: {
      "Beginner": ["Variance commentary", "budget vs actual explanation", "expense categorization rationale", "simple ROI calculation memo", "headcount cost summary"],
      "Intermediate": ["Investment memo for a project", "vendor cost-benefit analysis", "working capital analysis", "departmental budget proposal", "simple business case"],
      "Advanced": ["M&A analysis", "capital allocation framework", "financial restructuring proposal", "complex revenue recognition memo", "multi-year forecast methodology"]
    },
    requiredElements: ["Specific numerical values (revenue, costs, percentages, ratios)", "Time period specified", "A specific financial concept or methodology", "A specific stakeholder"],
    antiPatterns: ["Generic 'make this more professional' tasks", "Tasks without actual numbers in them", "Personal finance scenarios", "Tasks where mathematical correctness does not matter", "Tasks referencing specific real-company financials"]
  },
  "Legal": {
    persona: "Associate, counsel, or in-house attorney writing for a partner, client, or another attorney. The persona is jurisdiction-aware, risk-conscious, and distinguishes carefully between legal advice and legal information.",
    taskArchetypes: {
      "Beginner": ["Plain-language explanation of a clause", "summary of a regulation's basic obligations", "identification of standard contract provisions", "simple issue-flagging note"],
      "Intermediate": ["Issue spotting in a draft contract", "jurisdiction analysis for a transaction", "risk memo on a specific exposure", "compliance gap analysis"],
      "Advanced": ["Litigation strategy memo", "regulatory analysis for a novel situation", "multi-jurisdiction compliance analysis", "complex contract negotiation strategy"]
    },
    requiredElements: ["A specific legal area", "Either a referenced statute, regulation, or doctrine", "A specific jurisdiction or jurisdictional consideration", "A specific party or relationship at issue"],
    antiPatterns: ["Tasks asking for actual legal advice on real situations", "Fabrication of specific named cases", "Tasks resolvable without any legal framework", "Tasks involving real named people, companies, or active matters"]
  },
  "Consulting & Strategy": {
    persona: "Consultant or strategy professional at varying seniority writing for client teams or engagement leads. The persona uses structured analytical frameworks (often MECE) and values executive-level clarity.",
    taskArchetypes: {
      "Beginner": ["Issue tree", "hypothesis outline", "work plan section", "data collection plan", "simple framework application"],
      "Intermediate": ["Findings memo", "recommendation framing", "executive update", "working hypothesis document", "structured option analysis"],
      "Advanced": ["Full strategic recommendation", "board-level analysis", "transformation roadmap", "market entry strategy", "portfolio review for a diversified business"]
    },
    requiredElements: ["A structured analytical frame (often MECE)", "A specific business problem or strategic question", "An identifiable client context (industry, scale, situation)", "A decision being made or recommended"],
    antiPatterns: ["Framework name-dropping without application", "Tasks resolvable without structured thinking", "Tasks with obvious answers", "Pure research tasks without a recommendation", "Tasks at real named companies"]
  }
};

export const FALLBACK_TASKS: Record<string, Record<string, { task: string; baseline: string }>> = {
  "General Knowledge Work": {
    "Beginner": { task: "Draft an agenda for a recurring weekly team sync.", baseline: "Meeting Agenda: 1. Updates 2. Blockers 3. Next Steps. See you all there!" },
    "Intermediate": { task: "Explain how to resolve a minor customer service delay issue for a delayed shipping package containing high-value items.", baseline: "Contact the dispatcher, locate where the package is, and send an email to the client stating: 'Sorry for the delay. Your package is currently stuck in the sorting center. It should arrive in 3 to 5 business days. Please write back if you need any assistance.'" },
    "Advanced": { task: "Write an organizational change announcement for a team restructuring that reduces management layers without changing compensation.", baseline: "Hi Team, we are flattening the organization. Some of your managers will now act as individual contributors. Pay remains the same. Let HR know if you have questions." }
  },
  "Software Engineering": {
    "Beginner": { task: "Develop a feature to filter an array of product items based on user-selected tags.", baseline: "Write a for-loop that creates a blank result array, loops over all product items, check if a nested array contains the chosen tag, and push the active product into the list." },
    "Intermediate": { task: "Implement a client-side search input field that filters a lists of users from a remote database as the user types.", baseline: "Attach an onChange listener directly to the search input, trigger a full GET /api/users request on every single keypress, and re-render the list instantly with the data returned." },
    "Advanced": { task: "Design an automated job retrying mechanism that handles flaky third-party integrations gracefully without blocking the main event loops or flooding target endpoints.", baseline: "Store failed jobs in a database table. Run a cron job every minute that reads all failed jobs, sends them to a simple axios request, and updates the db record as finished or increment a retry counter up to 3." }
  },
  "Product Management": {
    "Beginner": { task: "Write a short user-facing release note for a new password reset flow.", baseline: "We updated the password reset flow. You can now reset your password faster by clicking the link in your email. It is better and more secure!" },
    "Intermediate": { task: "Draft a feature deprecation plan for an old reporting dashboard that is used by only 2% of power users.", baseline: "We are deprecating the old reporting dashboard next month. Please transition to the new dashboard. We know it doesn't have all the features yet, but we will add them eventually." },
    "Advanced": { task: "Write a platform-vs-feature decision memo regarding whether to build an in-house payment gateway or integrate Stripe.", baseline: "We should build an in-house payment gateway because it saves us the 2.9% transaction fee in the long run. The engineering effort will take 6 months, but it's worth it for our margins." }
  },
  "Data Analysis": {
    "Beginner": { task: "Provide a quick stakeholder summary of a finding showing that website traffic dropped by 10% on mobile devices this week.", baseline: "Mobile traffic went down 10% this week. This is probably due to the recent marketing budget cut. We should increase ad spend." },
    "Intermediate": { task: "Draft a simple A/B test analysis for a new checkout button color. Variant B (Red) had a 5% higher conversion rate than Variant A (Blue) over a 2-day period.", baseline: "Variant B outperformed Variant A by 5%. We should immediately switch all checkout buttons to Red to maximize our revenue." },
    "Advanced": { task: "Propose an observational study design to determine if a recent unannounced algorithm update impacted user retention.", baseline: "We can look at the retention rates of users who logged in before the update and compare them to those who logged in after. If the post-update group has lower retention, the algorithm caused it." }
  },
  "Finance": {
    "Beginner": { task: "Write a brief variance commentary explaining a 15% overspend in the Q2 travel budget.", baseline: "The travel budget was 15% over the target because the sales team took more trips than expected. We should tell them to fly cheaper next quarter." },
    "Intermediate": { task: "Draft a simple business case for purchasing a new CRM software tool that costs $50,000 annually.", baseline: "We should buy the new $50,000 CRM because our current one is slow. The sales team says it will make them 20% more efficient, which more than covers the cost." },
    "Advanced": { task: "Write a complex revenue recognition memo for a multi-year enterprise SaaS contract with upfront implementation fees.", baseline: "Since the client paid the implementation fee upfront, we should recognize that revenue immediately in Q1 to hit our quarterly targets. The subscription revenue can be recognized monthly over the 3 years." }
  },
  "Legal": {
    "Beginner": { task: "Write a plain-language explanation of a 'force majeure' clause for a sales representative.", baseline: "Force majeure means that if something bad happens like a storm or a war, we don't have to fulfill the contract and the client can't sue us." },
    "Intermediate": { task: "Draft a risk memo addressing potential compliance gaps in our new employee remote work policy spanning three US states (CA, NY, TX).", baseline: "Having employees in CA, NY, and TX means we have to follow their labor laws. We should just use a standard national employment contract to cover all bases and minimize drafting time." },
    "Advanced": { task: "Provide a multi-jurisdiction compliance analysis for a proposed cross-border data transfer from the EU to the US.", baseline: "Data transfers from the EU to the US must comply with GDPR. We can use Standard Contractual Clauses. Also, the US Privacy Shield 2.0 covers this, so liability is minimal." }
  },
  "Consulting & Strategy": {
    "Beginner": { task: "Draft a simple framework application (like SWOT) for a local coffee shop considering opening a second location.", baseline: "Strengths: Good coffee. Weaknesses: Only one store. Opportunities: Open a second store. Threats: Starbucks nearby. They should definitely open the second location." },
    "Intermediate": { task: "Write an executive update summarizing the initial findings of a 4-week supply chain optimization engagement.", baseline: "We looked at your supply chain. It's inefficient. You have too much inventory in the wrong warehouses. We recommend centralizing distribution immediately." },
    "Advanced": { task: "Draft a market entry strategy for a mid-sized US retail brand planning to expand into the Southeast Asian market.", baseline: "Southeast Asia is a growing market. You should partner with local distributors and launch a localized e-commerce site. The ROI will be positive within 12 months." }
  }
};
