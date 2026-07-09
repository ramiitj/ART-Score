export const DIFFICULTY_DEFINITIONS = {
  "Beginner": {
    cognitiveLoad: "The flaw is visible on careful reading. A working professional spots it within seconds. The diagnostic move is recognition, not inference.",
    failureModeShape: "One primary failure mode, prominently embedded. The fix is clear once the flaw is recognized.",
    scenarioComplexity: "Single stakeholder or audience. One decision or deliverable. 200–350 token baseline.",
    timeBudget: 90
  },
  "Intermediate": {
    cognitiveLoad: "The flaw is visible only with domain framing. The professional actively examines for what is missing rather than what is wrong. The diagnostic move involves identifying absences and weak assumptions.",
    failureModeShape: "One primary failure mode plus one secondary issue. The fix requires the user to introduce structure or constraints the baseline lacks.",
    scenarioComplexity: "Multiple stakeholders or competing considerations. A decision with non-obvious tradeoffs. 350–550 token baseline.",
    timeBudget: 120
  },
  "Advanced": {
    cognitiveLoad: "The flaw is defensible-looking but substantively flawed. The baseline reads like competent senior-level work; the issue is methodological, structural, or involves second-order consequences.",
    failureModeShape: "One subtle primary failure mode plus two minor issues that compound. The fix requires reframing or surfacing assumptions, not just adding content.",
    scenarioComplexity: "Multiple stakeholders with conflicting interests. High stakes, ambiguous right answer. 550–800 token baseline.",
    timeBudget: 180
  }
};

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
  },
  "Marketing": {
    persona: "Marketing manager or strategist writing for marketing peers, creative partners, or leadership. The persona is audience-specific, channel-aware, and ties activity to measurable business objectives.",
    taskArchetypes: {
      "Beginner": ["Campaign brief", "email copy direction", "audience segment description", "simple positioning statement"],
      "Intermediate": ["Multi-channel campaign strategy", "full positioning document", "content calendar rationale", "launch plan for a feature"],
      "Advanced": ["Brand strategy doc", "market entry plan", "integrated campaign architecture", "segmentation framework revision"]
    },
    requiredElements: ["A specific audience segment", "A specific channel or media type", "A specific business objective or metric", "A specific product or category context"],
    antiPatterns: ["Pure copywriting tasks", "Tasks about real named brands", "Tasks with no measurable objective", "Generic 'make this engaging' framing", "Tasks that conflate marketing with sales"]
  },
  "Sales": {
    persona: "Account executive, sales manager, or sales leader writing for the sales team or for prospects. The persona is honest about deal realities and operates within real B2B sales motions.",
    taskArchetypes: {
      "Beginner": ["Discovery call summary", "follow-up email outline", "simple objection-handling note", "deal stage update"],
      "Intermediate": ["Account strategy note", "deal review prep", "multi-stakeholder navigation plan", "competitive positioning note"],
      "Advanced": ["Strategic account plan", "enterprise deal strategy", "sales process redesign", "complex deal review for a forecasted opportunity"]
    },
    requiredElements: ["A specific buyer persona or role", "A specific deal stage or sales motion", "Identifiable stakeholders", "A specific competitive or commercial context"],
    antiPatterns: ["Pure prospecting or cold outreach tasks", "Tasks at real named companies", "Tasks resolvable with generic 'sell harder' or 'be more confident' advice", "Manipulative or ethically dubious framings", "Tasks that conflate sales with marketing"]
  },
  "Human Resources": {
    persona: "HR business partner, recruiter, or people manager writing for managers, employees, or leadership. The persona is fairness-conscious, legally aware, and uses behavioral rather than trait-based language.",
    taskArchetypes: {
      "Beginner": ["Performance feedback note", "interview debrief", "policy explanation", "simple onboarding communication"],
      "Intermediate": ["Hiring rubric", "compensation rationale", "performance improvement framing", "exit interview summary"],
      "Advanced": ["Sensitive employee situation memo", "organizational design recommendation", "complex investigation summary", "executive coaching note"]
    },
    requiredElements: ["A specific role, team, or organizational context", "A specific people-related decision or situation", "Identifiable parties", "A specific HR concept"],
    antiPatterns: ["Tasks that require actual legal advice on real situations", "Tasks involving real named people", "Tasks with protected-class characteristics central to the scenario", "Tasks resolvable without HR framework", "Tasks that minimize procedural fairness for narrative convenience"]
  },
  "Business Operations": {
    persona: "Business operations manager, BizOps partner, or process owner writing for operational teams or leadership. The persona is systems-thinking, metrics-driven, and operates across functions.",
    taskArchetypes: {
      "Beginner": ["SOP draft", "process documentation", "simple capacity calculation", "vendor onboarding checklist"],
      "Intermediate": ["Incident review", "process improvement proposal", "vendor selection analysis", "cross-functional workflow design"],
      "Advanced": ["Capacity planning", "operational strategy doc", "complex process redesign", "organizational efficiency analysis"]
    },
    requiredElements: ["A specific process, service, or operational system", "Specific metrics", "A specific stakeholder or operational role", "A specific operational decision or change"],
    antiPatterns: ["Tasks that are actually engineering tasks", "Tasks at real named companies", "Pure 'improve efficiency' tasks without specific levers", "Tasks resolvable without operational framework", "Tasks that ignore stakeholder coordination realities"]
  },
  "Content & Communications": {
    persona: "Content strategist, editor, communications professional, or writer at varying seniority. The persona is audience-aware, voice-conscious, and ties craft to strategic purpose.",
    taskArchetypes: {
      "Beginner": ["Blog intro", "product description", "social post draft", "internal announcement", "simple FAQ entry"],
      "Intermediate": ["Long-form article outline", "content series strategy", "internal change communication", "editorial guidelines section"],
      "Advanced": ["Editorial strategy", "content pillar architecture", "voice and brand guidelines", "executive communications strategy"]
    },
    requiredElements: ["A specific audience and their context", "A specific content format and channel", "A specific business or editorial objective", "A specific voice or angle consideration"],
    antiPatterns: ["Pure marketing tasks", "Tasks without audience specificity", "Generic 'make it more engaging' framing", "Tasks resolvable without craft consideration", "Tasks involving real journalists, publications, or public figures"]
  },
  "Customer Support": {
    persona: "Support representative, support manager, or customer experience leader writing to customers, the support team, or leadership. The persona is solution-focused without being defensive, and balances individual resolution against systemic improvement.",
    taskArchetypes: {
      "Beginner": ["Customer response on a common issue", "FAQ entry", "escalation note", "simple incident communication"],
      "Intermediate": ["Escalation analysis", "recurring issue pattern report", "support playbook section", "root-cause communication to product"],
      "Advanced": ["Support strategy proposal", "automation and deflection analysis", "organizational redesign for support", "customer experience strategy"]
    },
    requiredElements: ["A specific customer context", "A specific support metric or quality consideration", "An identifiable interaction or pattern", "A specific support decision or process"],
    antiPatterns: ["Pure complaint-handling without analysis", "Tasks at real named companies", "Tasks that do not reflect support-specific judgment", "Generic 'be nicer to customers' framing", "Tasks that conflate support with sales"]
  }
};

export const FAILURE_MODES = {
  "General Knowledge Work": {
    "Beginner": ["Vague audience", "Missing ask or decision", "Buried lede", "Unactionable next steps", "Generic tone", "Missing context"],
    "Intermediate": ["Stakeholders not differentiated", "Decision presented without criteria", "Timeline without dependencies", "Risks implicit but unstated", "Wrong level of seniority in tone", "Status framed as progress when indicators fail"],
    "Advanced": ["Activity mistaken for outcome", "Political dimensions ignored", "Capacity assumptions do not hold", "Strategic framing unexecutable", "Tradeoffs not actually weighed", "Defensible but unviable recommendation"]
  },
  "Software Engineering": {
    "Beginner": ["Off-by-one error", "Missing null check", "Hardcoded values", "Inefficient pattern", "Missing input validation", "Misleading naming"],
    "Intermediate": ["Missing failure analysis", "Unhandled concurrency", "Missing observability", "No alternative architecture considered", "Unjustified dependency", "Backward compatibility ignored", "Wrong abstraction level"],
    "Advanced": ["Subtle data consistency issue", "Scaling assumption breaks", "Security consideration absent", "No rollback story", "Hidden coupling", "Premature optimization", "Hallucinated API"]
  },
  "Product Management": {
    "Beginner": ["'Everyone' audience", "Solution-jumping", "Missing success metric", "No tradeoff acknowledged", "Missing user value", "Effort estimate absent"],
    "Intermediate": ["Vague metrics", "Scope creep", "Missing edge cases", "No 'what we say no to'", "Stakeholders not differentiated", "Cross-team dependencies unstated", "Vanity metrics"],
    "Advanced": ["Strategy lacks competitive context", "Market assumption treated as fact", "Platform-vs-feature confusion", "Leading indicators absent", "Cannibalization risk missing", "Optimistic adoption curve", "Missing user research"]
  },
  "Data Analysis": {
    "Beginner": ["Causation from correlation", "Missing sample size", "No data caveats", "Misleading time period", "Confusing significance", "Wrong aggregation"],
    "Intermediate": ["Cherry-picked window", "Missing confidence intervals", "Confounders unaddressed", "Simpson's paradox setup", "Survivorship bias", "Overgeneralizing", "Inconsistent outlier handling"],
    "Advanced": ["Underpowered design", "Selection effects", "P-hacking susceptibility", "Wrong identification strategy", "Spurious precision", "External validity missing", "Threats to internal validity uncontrolled"]
  },
  "Finance": {
    "Beginner": ["Arithmetic error", "Wrong attribution", "Missing time period", "Conflating revenue/profit", "Mixing GAAP/non-GAAP", "Confusing % and pp change"],
    "Intermediate": ["Single-scenario projection", "Missing sensitivity analysis", "Ignored opportunity cost", "Inappropriate discount rate", "Missing working capital", "Unbasised synergy assumptions"],
    "Advanced": ["Inappropriate valuation methodology", "Optimistic synergies as base case", "Missing capital structure", "Tax treatment wrong", "Ignored covenants", "Hidden recourse", "Misapplied accounting"]
  },
  "Legal": {
    "Beginner": ["Missing jurisdiction", "Conflating advice with info", "Missing material carve-out", "Wrong obligated party", "Conflating contract terms with statutes", "Missing 'consult counsel' disclaimer"],
    "Intermediate": ["Jurisdiction-blind advice", "Missing procedural consideration", "No risk severity ranking", "Treating ambiguous as clear", "Missing ADR analysis", "Inadequate fact development"],
    "Advanced": ["Hallucinated citation", "Misapplied precedent", "Missing recent regulatory context", "Wrong legal theory", "Conflict of laws unaddressed", "Missing privilege analysis", "Strategic considerations subordinated incorrectly"]
  },
  "Consulting & Strategy": {
    "Beginner": ["Branches overlap (not MECE)", "Untestable hypothesis", "Framework name-dropped", "Too-abstract framing", "Missing data needs", "Logical sequence unclear"],
    "Intermediate": ["'So what' not surfaced", "Unprioritized recommendations", "Conclusions don't follow", "Unknowns unacknowledged", "Implementation absent", "Tradeoffs glossed over"],
    "Advanced": ["No real alternatives compared", "Soft on risks", "Boil the ocean implementation", "Recommendation untethered from capabilities", "Missing change management", "Decision criteria unstated"]
  },
  "Marketing": {
    "Beginner": ["'Everyone' audience", "Competing CTAs", "Generic value proposition", "No measurable objective", "Channel without rationale", "Buzzword density"],
    "Intermediate": ["Segments lack behavioral specificity", "Channel mix lacks funnel logic", "Inconsistent brand voice", "Missing competitive context", "Metrics lack targets", "Concept untethered from insight"],
    "Advanced": ["Positioning lacks differentiation", "Values without operational backing", "Missing defensibility analysis", "Brand promise lacks proof", "Expansion without segmentation", "Strategy misaligned with business model"]
  },
  "Sales": {
    "Beginner": ["Happy ears", "Missing decision maker", "Vague next step", "Generic value statement", "Missing budget/timing", "Single-thread relationship"],
    "Intermediate": ["No champion", "Competitive consideration absent", "Procurement path unaddressed", "Technical evaluator needs unmapped", "Decision criteria unmirrored", "Optimistic close date"],
    "Advanced": ["Missing economic buyer", "Stakeholder map oversimplified", "Procurement/legal path glossed", "Displacement unaddressed", "Renewal strategy absent", "Risk plan missing"]
  },
  "Human Resources": {
    "Beginner": ["Trait-based language", "Vague examples", "Sandwich feedback", "Comparison to others", "Missing growth framing", "Subjective criteria"],
    "Intermediate": ["Protected-class proxies", "Missing calibration anchor", "Criteria not job-relevant", "Compensation lacks market data", "PIP lacks specific behaviors", "Missing documentation discipline"],
    "Advanced": ["Conclusory characterization", "Missing accommodation analysis", "Jurisdiction-blind advice", "Investigation lacks procedural fairness", "Termination rationale has legal exposure", "Org design ignores people impact"]
  },
  "Business Operations": {
    "Beginner": ["Missing process owner", "No exception handling", "Ambiguous triggers", "Metrics absent", "Dependencies missing", "Frequency missing"],
    "Intermediate": ["Blame framing in incident", "Systemic factors missed", "Action items lack owners", "Recurrence prevention absent", "Vendor analysis lacks TCO", "Missing risk to dependencies"],
    "Advanced": ["Linear projection in non-linear context", "Seasonality ignored", "Single-solution framing", "Constraints ignored", "Change management absent", "Missing feedback loop"]
  },
  "Content & Communications": {
    "Beginner": ["'In today's fast-paced world'", "Generic intro", "Telling not showing", "Voice mismatched to audience", "No specific benefit", "Cliché framing"],
    "Intermediate": ["Listicle on thesis topic", "Disconnected hook", "Argument absent", "Missing audience anchors", "Tone inconsistent", "SEO prioritized over experience"],
    "Advanced": ["Generic thought leadership", "Voice indistinguishable", "No audience research", "Strategic positioning hollow", "Content pillar lacks differentiation", "Editorial vision unexecutable"]
  },
  "Customer Support": {
    "Beginner": ["Form-letter feel", "No acknowledgment of issue", "Resolution lacks steps", "Defensive tone", "Missing follow-up commitment", "Generic empathy"],
    "Intermediate": ["Symptom-fixing", "Blames customer", "No cross-functional escalation", "Missing incidence metrics", "Pattern identified but root cause shallow", "Action items without owner"],
    "Advanced": ["Headcount-only solutions", "Missing automation analysis", "Customer segmentation ignored", "Feedback loop to product absent", "Cost-of-quality unaddressed", "Experience metrics missing"]
  }
};

export const FAILURE_MODE_IDS: Record<string, string> = {
  // General Knowledge Work
  "Vague audience": "GEN-001",
  "Missing ask or decision": "GEN-002",
  "Buried lede": "GEN-003",
  "Unactionable next steps": "GEN-004",
  "Generic tone": "GEN-005",
  "Missing context": "GEN-006",
  "Stakeholders not differentiated": "GEN-007",
  "Decision presented without criteria": "GEN-008",
  "Timeline without dependencies": "GEN-009",
  "Risks implicit but unstated": "GEN-010",
  "Wrong level of seniority in tone": "GEN-011",
  "Status framed as progress when indicators fail": "GEN-012",
  "Activity mistaken for outcome": "GEN-013",
  "Political dimensions ignored": "GEN-014",
  "Capacity assumptions do not hold": "GEN-015",
  "Strategic framing unexecutable": "GEN-016",
  "Tradeoffs not actually weighed": "GEN-017",
  "Defensible but unviable recommendation": "GEN-018",

  // Software Engineering
  "Off-by-one error": "SWE-001",
  "Missing null check": "SWE-002",
  "Hardcoded values": "SWE-003",
  "Inefficient pattern": "SWE-004",
  "Missing input validation": "SWE-005",
  "Misleading naming": "SWE-006",
  "Missing failure analysis": "SWE-007",
  "Unhandled concurrency": "SWE-008",
  "Missing observability": "SWE-009",
  "No alternative architecture considered": "SWE-010",
  "Unjustified dependency": "SWE-011",
  "Backward compatibility ignored": "SWE-012",
  "Wrong abstraction level": "SWE-013",
  "Subtle data consistency issue": "SWE-014",
  "Scaling assumption breaks": "SWE-015",
  "Security consideration absent": "SWE-016",
  "No rollback story": "SWE-017",
  "Hidden coupling": "SWE-018",
  "Premature optimization": "SWE-019",
  "Hallucinated API": "SWE-020",

  // Product Management
  "'Everyone' audience": "PRD-001",
  "Solution-jumping": "PRD-002",
  "Missing success metric": "PRD-003",
  "No tradeoff acknowledged": "PRD-004",
  "Missing user value": "PRD-005",
  "Effort estimate absent": "PRD-006",
  "Vague metrics": "PRD-007",
  "Scope creep": "PRD-008",
  "Missing edge cases": "PRD-009",
  "No 'what we say no to'": "PRD-010",
  "Cross-team dependencies unstated": "PRD-011",
  "Vanity metrics": "PRD-012",
  "Strategy lacks competitive context": "PRD-013",
  "Market assumption treated as fact": "PRD-014",
  "Platform-vs-feature confusion": "PRD-015",
  "Leading indicators absent": "PRD-016",
  "Cannibalization risk missing": "PRD-017",
  "Optimistic adoption curve": "PRD-018",
  "Missing user research": "PRD-019",

  // Data Analysis
  "Causation from correlation": "DAT-001",
  "Missing sample size": "DAT-002",
  "No data caveats": "DAT-003",
  "Misleading time period": "DAT-004",
  "Confusing significance": "DAT-005",
  "Wrong aggregation": "DAT-006",
  "Cherry-picked window": "DAT-007",
  "Missing confidence intervals": "DAT-008",
  "Confounders unaddressed": "DAT-009",
  "Simpson's paradox setup": "DAT-010",
  "Survivorship bias": "DAT-011",
  "Overgeneralizing": "DAT-012",
  "Inconsistent outlier handling": "DAT-013",
  "Underpowered design": "DAT-014",
  "Selection effects": "DAT-015",
  "P-hacking susceptibility": "DAT-016",
  "Wrong identification strategy": "DAT-017",
  "Spurious precision": "DAT-018",
  "External validity missing": "DAT-019",
  "Threats to internal validity uncontrolled": "DAT-020",

  // Finance
  "Arithmetic error": "FIN-001",
  "Wrong attribution": "FIN-002",
  "Missing time period": "FIN-003",
  "Conflating revenue/profit": "FIN-004",
  "Mixing GAAP/non-GAAP": "FIN-005",
  "Confusing % and pp change": "FIN-006",
  "Single-scenario projection": "FIN-007",
  "Missing sensitivity analysis": "FIN-008",
  "Ignored opportunity cost": "FIN-009",
  "Inappropriate discount rate": "FIN-010",
  "Missing working capital": "FIN-011",
  "Unbasised synergy assumptions": "FIN-012",
  "Inappropriate valuation methodology": "FIN-013",
  "Optimistic synergies as base case": "FIN-014",
  "Missing capital structure": "FIN-015",
  "Tax treatment wrong": "FIN-016",
  "Ignored covenants": "FIN-017",
  "Hidden recourse": "FIN-018",
  "Misapplied accounting": "FIN-019",

  // Legal
  "Missing jurisdiction": "LEG-001",
  "Conflating advice with info": "LEG-002",
  "Missing material carve-out": "LEG-003",
  "Wrong obligated party": "LEG-004",
  "Conflating contract terms with statutes": "LEG-005",
  "Missing 'consult counsel' disclaimer": "LEG-006",
  "Jurisdiction-blind advice": "LEG-007",
  "Missing procedural consideration": "LEG-008",
  "No risk severity ranking": "LEG-009",
  "Treating ambiguous as clear": "LEG-010",
  "Missing ADR analysis": "LEG-011",
  "Inadequate fact development": "LEG-012",
  "Hallucinated citation": "LEG-013",
  "Misapplied precedent": "LEG-014",
  "Missing recent regulatory context": "LEG-015",
  "Wrong legal theory": "LEG-016",
  "Conflict of laws unaddressed": "LEG-017",
  "Missing privilege analysis": "LEG-018",
  "Strategic considerations subordinated incorrectly": "LEG-019",

  // Consulting & Strategy
  "Branches overlap (not MECE)": "CON-001",
  "Untestable hypothesis": "CON-002",
  "Framework name-dropped": "CON-003",
  "Too-abstract framing": "CON-004",
  "Missing data needs": "CON-005",
  "Logical sequence unclear": "CON-006",
  "'So what' not surfaced": "CON-007",
  "Unprioritized recommendations": "CON-008",
  "Conclusions don't follow": "CON-009",
  "Unknowns unacknowledged": "CON-010",
  "Implementation absent": "CON-011",
  "Tradeoffs glossed over": "CON-012",
  "No real alternatives compared": "CON-013",
  "Soft on risks": "CON-014",
  "Boil the ocean implementation": "CON-015",
  "Recommendation untethered from capabilities": "CON-016",
  "Missing change management": "CON-017",
  "Decision criteria unstated": "CON-018",

  // Marketing
  "Competing CTAs": "MKT-001",
  "Generic value proposition": "MKT-002",
  "No measurable objective": "MKT-003",
  "Channel without rationale": "MKT-004",
  "Buzzword density": "MKT-005",
  "Segments lack behavioral specificity": "MKT-006",
  "Channel mix lacks funnel logic": "MKT-007",
  "Inconsistent brand voice": "MKT-008",
  "Missing competitive context": "MKT-009",
  "Metrics lack targets": "MKT-010",
  "Concept untethered from insight": "MKT-011",
  "Positioning lacks differentiation": "MKT-012",
  "Values without operational backing": "MKT-013",
  "Missing defensibility analysis": "MKT-014",
  "Brand promise lacks proof": "MKT-015",
  "Expansion without segmentation": "MKT-016",
  "Strategy misaligned with business model": "MKT-017",

  // Sales
  "Happy ears": "SAL-001",
  "Missing decision maker": "SAL-002",
  "Vague next step": "SAL-003",
  "Generic value statement": "SAL-004",
  "Missing budget/timing": "SAL-005",
  "Single-thread relationship": "SAL-006",
  "No champion": "SAL-007",
  "Competitive consideration absent": "SAL-008",
  "Procurement path unaddressed": "SAL-009",
  "Technical evaluator needs unmapped": "SAL-010",
  "Decision criteria unmirrored": "SAL-011",
  "Optimistic close date": "SAL-012",
  "Missing economic buyer": "SAL-013",
  "Stakeholder map oversimplified": "SAL-014",
  "Procurement/legal path glossed": "SAL-015",
  "Displacement unaddressed": "SAL-016",
  "Renewal strategy absent": "SAL-017",
  "Risk plan missing": "SAL-018",

  // Human Resources
  "Trait-based language": "HRS-001",
  "Vague examples": "HRS-002",
  "Sandwich feedback": "HRS-003",
  "Comparison to others": "HRS-004",
  "Missing growth framing": "HRS-005",
  "Subjective criteria": "HRS-006",
  "Protected-class proxies": "HRS-007",
  "Missing calibration anchor": "HRS-008",
  "Criteria not job-relevant": "HRS-009",
  "Compensation lacks market data": "HRS-010",
  "PIP lacks specific behaviors": "HRS-011",
  "Missing documentation discipline": "HRS-012",
  "Conclusory characterization": "HRS-013",
  "Missing accommodation analysis": "HRS-014",
  "Investigation lacks procedural fairness": "HRS-015",
  "Termination rationale has legal exposure": "HRS-016",
  "Org design ignores people impact": "HRS-017",

  // Business Operations
  "Missing process owner": "OPS-001",
  "No exception handling": "OPS-002",
  "Ambiguous triggers": "OPS-003",
  "Metrics absent": "OPS-004",
  "Dependencies missing": "OPS-005",
  "Frequency missing": "OPS-006",
  "Blame framing in incident": "OPS-007",
  "Systemic factors missed": "OPS-008",
  "Action items lack owners": "OPS-009",
  "Recurrence prevention absent": "OPS-010",
  "Vendor analysis lacks TCO": "OPS-011",
  "Missing risk to dependencies": "OPS-012",
  "Linear projection in non-linear context": "OPS-013",
  "Seasonality ignored": "OPS-014",
  "Single-solution framing": "OPS-015",
  "Constraints ignored": "OPS-016",
  "Change management absent": "OPS-017",
  "Missing feedback loop": "OPS-018",

  // Content & Communications
  "'In today's fast-paced world'": "COM-001",
  "Generic intro": "COM-002",
  "Telling not showing": "COM-003",
  "Voice mismatched to audience": "COM-004",
  "No specific benefit": "COM-005",
  "Cliché framing": "COM-006",
  "Listicle on thesis topic": "COM-007",
  "Disconnected hook": "COM-008",
  "Argument absent": "COM-009",
  "Missing audience anchors": "COM-010",
  "Tone inconsistent": "COM-011",
  "SEO prioritized over experience": "COM-012",
  "Generic thought leadership": "COM-013",
  "Voice indistinguishable": "COM-014",
  "No audience research": "COM-015",
  "Strategic positioning hollow": "COM-016",
  "Content pillar lacks differentiation": "COM-017",
  "Editorial vision unexecutable": "COM-018",

  // Customer Support
  "Form-letter feel": "SUP-001",
  "No acknowledgment of issue": "SUP-002",
  "Resolution lacks steps": "SUP-003",
  "Defensive tone": "SUP-004",
  "Missing follow-up commitment": "SUP-005",
  "Generic empathy": "SUP-006",
  "Symptom-fixing": "SUP-007",
  "Blames customer": "SUP-008",
  "No cross-functional escalation": "SUP-009",
  "Missing incidence metrics": "SUP-010",
  "Pattern identified but root cause shallow": "SUP-011",
  "Action items without owner": "SUP-012",
  "Headcount-only solutions": "SUP-013",
  "Missing automation analysis": "SUP-014",
  "Customer segmentation ignored": "SUP-015",
  "Feedback loop to product absent": "SUP-016",
  "Cost-of-quality unaddressed": "SUP-017",
  "Experience metrics missing": "SUP-018"
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
  },
  "Marketing": {
    "Beginner": { task: "Write a social media announcement post celebrating the arrival of a new organic tea blend in a cozy boutique cafe.", baseline: "Come down to our cafe to try our new organic tea blend! We have different flavors available and it is super healthy for you. Doors open at 8 AM daily." },
    "Intermediate": { task: "Formulate an email campaign targeting inactive premium gym subscribers to sign up for an advanced 4-week nutritional consulting program.", baseline: "Subject: Important nutrition program. Hello, we see you haven't been visiting recently. We have an amazing 4-week health meal program launching next Monday for only $99. Please click here to join and improve your fitness journey today." },
    "Advanced": { task: "Develop a promotional outreach campaign strategy to launch a boutique eco-friendly desk planner to regional corporate buyers.", baseline: "Send bulk newsletters detailing planner benefits (recycled elements, soy inks) to generic contact lists harvested from local Chamber of Commerce business directories." }
  },
  "Sales": {
    "Beginner": { task: "Write a short follow-up email outline after a positive discovery call with a perspective client.", baseline: "Hi [Name], great speaking today. As discussed, our software can help you. Let me know when you want to sign the contract." },
    "Intermediate": { task: "Draft an account strategy note for a mid-sized enterprise deal where the technical evaluator is currently favoring a competitor.", baseline: "The technical buyer likes the competitor's UI better. We should offer them a 20% discount if they sign this week to overcome that objection." },
    "Advanced": { task: "Provide a complex deal review for a forecasted $500k opportunity that is stuck in the procurement phase due to security concerns.", baseline: "Procurement is asking for a SOC2 Type II report, which we don't have yet. We should assure them our system is secure and push the champion to bypass procurement so we hit our quarterly quota." }
  },
  "Human Resources": {
    "Beginner": { task: "Draft a simple onboarding communication welcoming a new hire to the engineering team.", baseline: "Welcome to the team! Your laptop is on your desk. Ask Jim if you need anything. We do standup at 10am." },
    "Intermediate": { task: "Write a performance improvement framing note for an employee who has been consistently missing deadlines.", baseline: "You have missed 3 deadlines this month. This is unacceptable. If you miss another deadline, we will have to let you go. Please try harder." },
    "Advanced": { task: "Provide an organizational design recommendation for merging two previously siloed customer success teams after an acquisition.", baseline: "We should fire the redundant managers from the acquired company and put all the remaining reps under our existing VP of CS to streamline operations." }
  },
  "Business Operations": {
    "Beginner": { task: "Draft a basic process documentation (SOP) for onboarding a new software vendor.", baseline: "1. Find a vendor. 2. Ask for pricing. 3. Sign the contract. 4. Give them a credit card for payment. 5. Start using the software." },
    "Intermediate": { task: "Write an incident review summary for a recent failure where a critical supplier missed a delivery window.", baseline: "The supplier was late because of a storm. We told them to be on time next week. We should also look for a backup supplier just in case." },
    "Advanced": { task: "Propose an operational strategy to reduce overall shipping costs by 15% in a national logistics network.", baseline: "To cut costs 15%, we should switch entirely to the cheapest ground shipping carrier available, even if transit times increase by 2 days, because customers care more about price than speed." }
  },
  "Content & Communications": {
    "Beginner": { task: "Write a blog intro for a post about top 5 remote work productivity tips.", baseline: "In today's fast-paced world, remote work is more popular than ever. Here are 5 tips to help you be more productive while working from home." },
    "Intermediate": { task: "Draft an internal change communication regarding a switch from Slack to Microsoft Teams.", baseline: "Hi everyone, we are switching from Slack to Teams on Friday to save money on licensing. Please download Teams and move your important files over before Slack is turned off." },
    "Advanced": { task: "Develop an executive communications strategy for a CEO announcing a disappointing quarterly earnings report.", baseline: "The CEO should emphasize that the market is tough right now and competitors are also struggling. Downplay the missed revenue targets and highlight the minor increase in active users to keep morale high." }
  },
  "Customer Support": {
    "Beginner": { task: "Write a FAQ entry explaining the company's 30-day return policy.", baseline: "You can return items within 30 days. You have to pay for shipping. We don't accept worn items. Contact support for a label." },
    "Intermediate": { task: "Draft a root-cause communication to the product team regarding a spike in tickets about confusing navigation.", baseline: "We got 50 tickets today saying the new menu is confusing. Users can't find the settings page. Please change the menu back to how it was yesterday." },
    "Advanced": { task: "Provide a support strategy proposal for handling a projected 200% increase in ticket volume during the upcoming holiday season.", baseline: "Since ticket volume will triple, we need to hire three times as many seasonal support reps immediately. Automation won't be fast enough to implement." }
  }
};
