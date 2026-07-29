import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TestStep, EvaluationResult, RunItemSummary } from "./types";
import WelcomeScreen from "./components/WelcomeScreen";
import ConfigureScreen from "./components/ConfigureScreen";
import TourScreen from "./components/TourScreen";
import ActiveTestScreen from "./components/ActiveTestScreen";
import EvaluatingScreen from "./components/EvaluatingScreen";
import EvaluationErrorScreen from "./components/EvaluationErrorScreen";
import ResultsScreen from "./components/ResultsScreen";
import AdminScreen from "./components/AdminScreen";
import VerificationScreen from "./components/VerificationScreen";
import { ShieldAlert } from "lucide-react";

export default function App() {
  const [step, setStep] = useState<TestStep>(TestStep.WELCOME);
  
  // Test Details States
  const [sessionId, setSessionId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [task, setTask] = useState("");
  const [baseline, setBaseline] = useState("");
  const [baselinePrompt, setBaselinePrompt] = useState("");
  const [baselineQualityScore, setBaselineQualityScore] = useState(50);
  const [headroom, setHeadroom] = useState(50);
  const [failureModeTags, setFailureModeTags] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");

  // Multi-item run state (docs/HEADROOM_MIGRATION_SPEC.md §11): a session is
  // now a run of several items served under one runId, so a person's
  // capacity can be separated from any single item's difficulty.
  const [runId, setRunId] = useState("");
  const [itemIndex, setItemIndex] = useState(0);
  const [itemsTotal, setItemsTotal] = useState(1);
  const [runItems, setRunItems] = useState<RunItemSummary[]>([]);
  const [pendingRetry, setPendingRetry] = useState<"evaluate" | "advance">("evaluate");

  // Dynamic timer details
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(90);
  const [timeTaken, setTimeTaken] = useState(0);

  // Demographics parameters (Moved from ResultsScreen)
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [researchConsent, setResearchConsent] = useState(false);
  
  // Service loading states
  const [loadingTask, setLoadingTask] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluationErrorMessage, setEvaluationErrorMessage] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Parse URL on load to check for admin path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/admin" || path === "/admin/") {
      setStep(TestStep.ADMIN);
    } else if (path.startsWith("/verify/")) {
      const id = path.replace("/verify/", "");
      if (id) {
        setVerificationId(id);
        setStep(TestStep.VERIFICATION);
      }
    }
  }, []);

  // 1. Kickstart generation from profile params
  const handleGenerateTask = async (config: {
    userName: string;
    userEmail: string;
    domain: string;
    difficulty: string;
    age: string;
    gender: string;
    education: string;
    workExperience: string;
    researchConsent: boolean;
  }) => {
    setLoadingTask(true);
    setErrorPrompt("");
    try {
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: config.domain,
          difficulty: config.difficulty,
        }),
      });
      const data = await res.json();

      // No fallback: a non-OK response, or a response missing the fields a
      // real generated task always has, means generation genuinely failed
      // (rate limit, transient outage, etc). Route to an honest error
      // instead of silently substituting placeholder task/baseline text --
      // there is no server-side fallback content to fall back to either.
      if (!res.ok || !data.sessionId || !data.task || !data.baselinePrompt) {
        throw new Error(data?.error || `Task generator responded with status ${res.status}.`);
      }

      setUserName(config.userName);
      setUserEmail(config.userEmail);
      setDomain(config.domain);
      setDifficulty(config.difficulty);
      setAge(config.age);
      setGender(config.gender);
      setEducation(config.education);
      setWorkExperience(config.workExperience);
      setResearchConsent(config.researchConsent);

      setSessionId(data.sessionId);
      setTask(data.task);
      setBaseline(data.baseline || "");
      setBaselinePrompt(data.baselinePrompt);
      setBaselineQualityScore(0);
      setHeadroom(0);
      setFailureModeTags("");
      setTimeLimitSeconds(data.timeLimitSeconds || 90);
      setRunId(data.runId || "");
      setItemIndex(data.itemIndex ?? 0);
      setItemsTotal(data.itemsTotal || 1);
      setRunItems([]);

      // Advance stage to Guided Tour screen
      setStep(TestStep.TOUR);
    } catch (e: any) {
      console.error(e);
      // A raw fetch()-level TypeError (e.g. "Failed to fetch") is a genuine
      // network failure; anything else was thrown deliberately above with a
      // real message (a server error string, or an explicit status/field
      // failure).
      const message = e instanceof TypeError
        ? "We couldn't reach the task generator — check your connection and retry."
        : (e?.message || "The task generator could not be reached.");
      setErrorPrompt(message);
    } finally {
      setLoadingTask(false);
    }
  };

  // Fetches the next item under the same run, or -- once itemsTotal items
  // are done -- shows the final Results screen. Split out from
  // handleSubmitRevision so a failure here can be retried on its own,
  // without re-submitting the edit that already scored successfully.
  const advanceToNextItem = async () => {
    const nextIndex = itemIndex + 1;
    if (nextIndex >= itemsTotal) {
      setStep(TestStep.RESULTS);
      return;
    }

    try {
      const res = await fetch("/api/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, difficulty, runId }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) {
        throw new Error(data?.error || `Task generator responded with status ${res.status}.`);
      }

      setSessionId(data.sessionId);
      setTask(data.task || "");
      setBaseline(data.baseline || "");
      setBaselinePrompt(data.baselinePrompt || "");
      setEditedPrompt("");
      setTimeTaken(0);
      setTimeLimitSeconds(data.timeLimitSeconds || 90);
      setItemIndex(data.itemIndex ?? nextIndex);
      // Subsequent items skip the guided tour -- the person has already seen it.
      setStep(TestStep.ACTIVE_TEST);
    } catch (e: any) {
      console.error(e);
      setPendingRetry("advance");
      setEvaluationErrorMessage(e?.message || "Failed to generate the next item in this session.");
      setStep(TestStep.EVALUATION_ERROR);
    }
  };

  // 2. Submission of the user's edited prompt -> Start rating processing
  const handleSubmitRevision = async (submittedEditedPrompt: string, elapsedSeconds: number) => {
    setEditedPrompt(submittedEditedPrompt);
    setTimeTaken(elapsedSeconds);
    setPendingRetry("evaluate");
    setStep(TestStep.EVALUATING);

    try {
      const res = await fetch("/api/evaluate-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          editedPrompt: submittedEditedPrompt,
        }),
      });
      const evalData = await res.json();

      // Never fabricate a score: a non-OK response or a missing/non-numeric
      // score means the evaluation genuinely didn't complete, so route to an
      // honest error state instead of inventing a result (a legitimate
      // "scoring_pending" response always includes a real numeric score, so
      // this only trips on a genuine failure).
      if (!res.ok || typeof evalData.score !== "number") {
        throw new Error(evalData?.error || `Evaluation service responded with status ${res.status}.`);
      }

      setEvaluation({
        score: evalData.score,
        headroomEfficiencyScore: evalData.headroomEfficiencyScore,
        rawDeltaScore: evalData.rawDeltaScore,
        baselineQualityScore: evalData.baselineQualityScore,
        strengths: evalData.strengths ?? [],
        insight: evalData.insight ?? "",
        clarity: evalData.clarity ?? "",
        dimensionScores: evalData.dimensionScores,
        judgeMetadata: evalData.judgeMetadata,
        triageFlags: evalData.triageFlags,
        textTelemetry: evalData.textTelemetry,
      });

      setRunItems(prev => [...prev, { sessionId, domain, difficulty, score: evalData.score }]);

      // The final item's own ResultsScreen mount effect does the full
      // save-attempt (with telemetry/geo/leaderboard/percentile). Earlier
      // items in the run need their own headless save now -- each is a
      // distinct sessionId/attempt record, and every item needs the
      // person's identity attached for the person x item variance
      // decomposition (scripts/variance-decomposition.ts) to work.
      const isLastItem = itemIndex + 1 >= itemsTotal;
      if (!isLastItem) {
        fetch("/api/save-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userName,
            userEmail,
            age,
            gender,
            education,
            workExperience,
            researchConsent,
            timeTaken: elapsedSeconds,
            userSignals: { timeTaken: elapsedSeconds, editCount: 0, retried: false },
          }),
        }).catch(err => console.error("Failed to save intermediate item attempt:", err));
      }

      await advanceToNextItem();
    } catch (e: any) {
      console.error(e);
      // A raw fetch()-level TypeError (e.g. "Failed to fetch") is a genuine
      // network failure, not something with a useful message for end users;
      // anything else here was thrown deliberately above with a real message
      // (a server error string, or an explicit status/validity failure).
      const message = e instanceof TypeError
        ? "We couldn't reach the evaluation service — check your connection and retry."
        : (e?.message || "The evaluation service could not be reached.");
      setEvaluationErrorMessage(message);
      setStep(TestStep.EVALUATION_ERROR);
    }
  };

  const handleRetryEvaluation = () => {
    setEvaluationErrorMessage("");
    if (pendingRetry === "advance") {
      setStep(TestStep.EVALUATING);
      advanceToNextItem();
    } else {
      handleSubmitRevision(editedPrompt, timeTaken);
    }
  };

  const handleRestart = () => {
    setStep(TestStep.WELCOME);
    setSessionId("");
    setUserName("");
    setUserEmail("");
    setDomain("");
    setDifficulty("");
    setTask("");
    setBaseline("");
    setBaselinePrompt("");
    setEditedPrompt("");
    setTimeLimitSeconds(90);
    setTimeTaken(0);
    setEvaluation(null);
    setEvaluationErrorMessage("");
    setRunId("");
    setItemIndex(0);
    setItemsTotal(1);
    setRunItems([]);
    setPendingRetry("evaluate");
    window.history.pushState({}, '', '/');
  };

  // Retake flow: resets task-specific state but preserves identity and
  // demographics, since a repeat attempt by the same person is exactly the
  // data the person x item variance decomposition needs real data for (see
  // docs/HEADROOM_MIGRATION_SPEC.md §11 and §15). Used from Results
  // ("Benchmark New Scenario") and the evaluation error screen ("Start New
  // Session") -- neither is a reason to make someone re-enter who they are.
  const handleRetakeChallenge = () => {
    setStep(TestStep.CONFIGURE);
    setSessionId("");
    setTask("");
    setBaseline("");
    setBaselinePrompt("");
    setEditedPrompt("");
    setTimeLimitSeconds(90);
    setTimeTaken(0);
    setEvaluation(null);
    setEvaluationErrorMessage("");
    setRunId("");
    setItemIndex(0);
    setItemsTotal(1);
    setRunItems([]);
    setPendingRetry("evaluate");
    window.history.pushState({}, '', '/');
  };

  return (
    <div className={`min-h-screen bg-neutral-50/20 text-neutral-800 flex flex-col justify-between font-sans selection:bg-amber-100 ${[TestStep.ACTIVE_TEST, TestStep.CONFIGURE, TestStep.TOUR].includes(step) ? "lg:h-screen lg:overflow-hidden" : ""}`}>
      
      {/* Top ambient brand indicator */}
      <header className="px-6 py-2.5 bg-white border-b border-neutral-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div 
            onClick={handleRestart}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="font-extrabold text-xs md:text-sm tracking-wider text-neutral-800 font-mono uppercase">
              ART - AI Reflection Test
            </span>
          </div>
          {/* Admin Panel button removed from UI, access via /admin URL instead */}
        </div>
      </header>

      {/* Main active workshop container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 flex flex-col justify-start md:justify-center ${[TestStep.ACTIVE_TEST, TestStep.CONFIGURE, TestStep.TOUR].includes(step) ? "lg:h-full lg:min-h-0 lg:overflow-hidden py-1.5" : (step === TestStep.WELCOME ? "py-2 md:py-4" : "py-6")}`}>
        
        {errorPrompt && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">Service Link Failure</p>
              <p className="font-medium text-red-500/90 mt-0.5">{errorPrompt}</p>
            </div>
          </div>
        )}

        {/* Slide/Fade state content transitions with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`w-full ${[TestStep.ACTIVE_TEST, TestStep.CONFIGURE, TestStep.TOUR].includes(step) ? "lg:h-full lg:flex lg:flex-col lg:min-h-0 gf-active-container" : ""}`}
          >
            {step === TestStep.WELCOME && (
              <WelcomeScreen onStart={() => setStep(TestStep.CONFIGURE)} />
            )}

            {step === TestStep.CONFIGURE && (
              <ConfigureScreen
                onBack={handleRestart}
                onGenerate={handleGenerateTask}
                isLoading={loadingTask}
                initialUserName={userName}
                initialUserEmail={userEmail}
                initialAge={age}
                initialGender={gender}
                initialEducation={education}
                initialWorkExperience={workExperience}
                initialResearchConsent={researchConsent}
              />
            )}

            {step === TestStep.TOUR && (
              <TourScreen
                userName={userName}
                domain={domain}
                difficulty={difficulty}
                timeLimitSeconds={timeLimitSeconds}
                itemsTotal={itemsTotal}
                onBeginTest={() => setStep(TestStep.ACTIVE_TEST)}
              />
            )}

            {step === TestStep.ACTIVE_TEST && (
              <ActiveTestScreen
                userName={userName}
                domain={domain}
                difficulty={difficulty}
                task={task}
                baseline={baseline}
                baselinePrompt={baselinePrompt}
                timeLimitSeconds={timeLimitSeconds}
                itemIndex={itemIndex}
                itemsTotal={itemsTotal}
                onSubmit={handleSubmitRevision}
              />
            )}

            {step === TestStep.EVALUATING && (
              <EvaluatingScreen itemIndex={itemIndex} itemsTotal={itemsTotal} />
            )}

            {step === TestStep.EVALUATION_ERROR && (
              <EvaluationErrorScreen
                message={evaluationErrorMessage}
                onRetry={handleRetryEvaluation}
                onRetakeChallenge={handleRetakeChallenge}
              />
            )}

            {step === TestStep.RESULTS && evaluation && (
              <ResultsScreen
                sessionId={sessionId}
                userName={userName}
                userEmail={userEmail}
                domain={domain}
                difficulty={difficulty}
                task={task}
                baseline={baseline}
                editedPrompt={editedPrompt}
                evaluation={evaluation}
                runItems={runItems}
                onRetakeChallenge={handleRetakeChallenge}
                age={age}
                gender={gender}
                education={education}
                workExperience={workExperience}
                researchConsent={researchConsent}
                timeAllocated={timeLimitSeconds}
                timeTaken={timeTaken}
              />
            )}

            {step === TestStep.ADMIN && (
              <AdminScreen onBack={handleRestart} />
            )}

            {step === TestStep.VERIFICATION && verificationId && (
              <VerificationScreen attemptId={verificationId} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Minimalistic human design footer only on the landing page */}
      {step === TestStep.WELCOME && (
        <footer className="px-6 py-2.5 border-t border-neutral-100 text-center bg-white/45">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 text-neutral-400 text-[10px] sm:text-[11px] font-medium leading-relaxed">
            <div className="text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200/55 flex items-center gap-1.5 shadow-xs">
              <span>💻 Best rendered on desktop or laptop environment</span>
            </div>
            <p>
              © 2026 Designed and owned by{" "}
              <a 
                href="https://www.linkedin.com/in/ganuthula/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 underline font-semibold transition-colors inline-flex items-center gap-0.5"
              >
                Venkat Ram Reddy Ganuthula
              </a>{" "}
              (<a 
                href="mailto:ram@iitj.ac.in" 
                className="text-amber-600 hover:text-amber-700 underline font-semibold transition-colors"
              >
                ram@iitj.ac.in
              </a>)
              . Any commercial reuse without prior permission of the creator is liable for legal action.
            </p>
          </div>
        </footer>
      )}

    </div>
  );
}
