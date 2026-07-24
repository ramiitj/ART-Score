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
