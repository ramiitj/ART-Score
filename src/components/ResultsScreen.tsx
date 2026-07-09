import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, CheckCircle, RefreshCw, Layers, Zap, PenTool, Globe, TrendingUp, Twitter, Linkedin, Clock } from "lucide-react";
import { EvaluationResult, AttemptLog } from "../types";

interface ResultsProps {
  sessionId: string;
  userName: string;
  userEmail: string;
  domain: string;
  difficulty: string;
  task: string;
  baseline: string;
  revision: string;
  evaluation: EvaluationResult;
  onRestart: () => void;
  age: string;
  gender: string;
  education: string;
  workExperience: string;
  researchConsent: boolean;
  timeAllocated: number;
  timeTaken: number;
}

export default function ResultsScreen({
  sessionId,
  userName,
  userEmail,
  domain,
  difficulty,
  task,
  baseline,
  revision,
  evaluation,
  onRestart,
  age,
  gender,
  education,
  workExperience,
  researchConsent,
  timeAllocated,
  timeTaken,
}: ResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'leaderboard'>('overview');
  const [leaderboard, setLeaderboard] = useState<AttemptLog[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const payload = {
        sessionId,
        userName,
        userEmail,
        feedback,
        age,
        gender,
        education,
        workExperience,
        researchConsent,
        userSignals: {
          timeTaken,
          editCount: 0,
          retried: false
        }
      };

      const res = await fetch("/api/save-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setIsFeedbackSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setIsFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Helper to retrieve detailed user agent details, IP and location
  const getExtendedTelemetry = async () => {
    const sysDetails = {
      userAgent: navigator.userAgent,
      platform: (navigator as any).userAgentData?.platform || navigator.platform || "Unknown",
      language: navigator.language || "en",
      languages: navigator.languages ? navigator.languages.join(", ") : "Unknown",
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      onlineStatus: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled
    };

    let geoObj = null;
    let ipStr = "";

    try {
      const resp = await fetch("https://ipapi.co/json/");
      if (resp.ok) {
        const d = await resp.json();
        ipStr = d.ip || "";
        geoObj = {
          city: d.city || "",
          region: d.region || "",
          country: d.country_name || "",
          latitude: d.latitude || 0,
          longitude: d.longitude || 0,
          postal: d.postal || "",
          timezone: d.timezone || "",
          isp: d.org || ""
        };
      }
    } catch (e) {
      console.warn("Client geolocation fetch failed, using fallback:", e);
    }

    if (!ipStr) {
      try {
        const ipifyResp = await fetch("https://api.ipify.org?format=json");
        if (ipifyResp.ok) {
          const jd = await ipifyResp.json();
          ipStr = jd.ip || "";
        }
      } catch (_) {}
    }

    return { systemDetails: sysDetails, geolocation: geoObj, ipAddress: ipStr };
  };

  // Auto save entire attempt on component mount
  useEffect(() => {
    let active = true;
    async function saveAndFetch() {
      try {
        let telemetry = { systemDetails: {}, geolocation: null, ipAddress: "" };
        try {
          telemetry = await getExtendedTelemetry();
        } catch (e) {
          console.error("Telemetry collection failed:", e);
        }

        const payload = {
          sessionId,
          userName,
          userEmail,
          age,
          gender,
          education,
          workExperience,
          researchConsent,
          systemDetails: telemetry.systemDetails,
          geolocation: telemetry.geolocation,
          ipAddress: telemetry.ipAddress,
          userSignals: {
            timeTaken,
            editCount: 0,
            retried: false
          }
        };

        const res = await fetch("/api/save-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        
        if (active && data.id) {
          setSavedAttemptId(data.id);
        }

        // Fetch leaderboard instantly
        setLoadingLeaderboard(true);
        const lbRes = await fetch(`/api/leaderboard?domain=${encodeURIComponent(domain)}`);
        const lbData = await lbRes.json();
        if (active) {
          setLeaderboard(lbData);
          setLoadingLeaderboard(false);
        }
      } catch (e) {
        console.error("❌ Failed to commit score attempt metrics:", e);
        if (active) setLoadingLeaderboard(false);
      }
    }

    saveAndFetch();
    return () => {
      active = false;
    };
  }, [userName, userEmail, domain, difficulty, task, baseline, revision, evaluation, age, gender, education, workExperience, researchConsent, timeAllocated, timeTaken]);

  // Generate clean, salient score content for sharing
  const getShareText = () => {
    const scoreVal = evaluation.score > 0 ? `+${evaluation.score}%` : `${evaluation.score}%`;
    const verifyLink = savedAttemptId ? `${window.location.origin}/verify/${savedAttemptId}` : window.location.origin;
    const baseScore = evaluation.baselineQualityScore ?? 50;
    const rawDelta = evaluation.rawDeltaScore ?? 0;
    const revisedScore = baseScore + rawDelta;
    
    return `🏆 MY HUMAN VALUE-ADD: ${scoreVal}

On this test, the AI's first draft scored ${baseScore}/100, and I elevated it to ${revisedScore}/100 — capturing ${scoreVal} of the available improvement headroom!

Diagnostic Details:
💼 Specialty Domain: ${domain} (${difficulty} Tier)
🛡️ Experience: ${workExperience} Years
⏱️ Duration Constraint: ${timeAllocated}s (Completed in ${timeTaken}s)

The AI Reflection Test (ART) measures your ability to audit, elevate, and inject critical thinking into raw AI drafts. While AI sets the baseline, human reflection provides the defining professional edge.

Verify my score and take the test: ${verifyLink}

#AIReflectionTest #HumanValueAdd #CognitiveValueAdd #CriticalThinking #AIModelAudit`;
  };

  // Score categorization and styles
  const getScoreRating = (score: number) => {
    if (score >= 80) return { category: "Elite Human Contributor Only", color: "text-emerald-600 border-emerald-500 bg-emerald-50/20", badge: "bg-emerald-500 text-white" };
    if (score >= 40) return { category: "Standard Human Premium", color: "text-amber-600 border-amber-500 bg-amber-50/20", badge: "bg-amber-500 text-neutral-900" };
    if (score > 0) return { category: "Nominal Human Addition", color: "text-zinc-650 border-zinc-400 bg-zinc-50/20", badge: "bg-zinc-500 text-white" };
    return { category: "Baseline Failure - AI Output Prevails", color: "text-rose-600 border-rose-500 bg-rose-50/20", badge: "bg-rose-500 text-white" };
  };

  const rating = getScoreRating(evaluation.score);

  const formatTextAsPointers = (text: string) => {
    if (!text) return null;
    const lines = text.split(/(?:\n|\.\s+)/).filter(l => l.trim().length > 3);
    return (
      <ul className="space-y-2 mt-2">
        {lines.map((line, idx) => {
          let cleanLine = line.trim();
          if (!cleanLine.endsWith('.') && !cleanLine.endsWith('!') && !cleanLine.endsWith('?')) {
            cleanLine += '.';
          }
          return (
            <li key={idx} className="flex gap-2 text-xs leading-relaxed text-neutral-700">
              <CheckCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-2 px-4 space-y-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* --- LEFT COLUMN: Permanent Score & Stats --- */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${rating.color} shadow-sm text-center`}
          >
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase mb-3">
              Human Value Add
            </span>
            
            <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-current mb-4">
              <span className="text-4xl md:text-5xl font-sans font-black tracking-tighter">
                {evaluation.score > 0 ? `+${evaluation.score}%` : `${evaluation.score}%`}
              </span>
            </div>

            {(evaluation.baselineQualityScore !== undefined && evaluation.baselineQualityScore > 0) && (
              <div className="flex w-full items-center justify-between text-[11px] font-mono font-bold text-neutral-600 mb-3 px-2 border-t border-b border-black/5 py-2 bg-black/5">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="opacity-70 text-[9px] uppercase">Base (AI)</span>
                  <span className="text-neutral-900">{evaluation.baselineQualityScore}/100</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="opacity-70 text-[9px] uppercase">Revised Output</span>
                  <span className="text-neutral-900">{(evaluation.baselineQualityScore + (evaluation.rawDeltaScore || 0))}/100</span>
                </div>
              </div>
            )}

            <div className="mt-1 flex flex-col items-center w-full">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1 select-none">
                Final Judgment
              </span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded uppercase tracking-wide leading-snug break-words text-center w-full max-w-full block overflow-visible whitespace-normal ${rating.badge}`}>
                {rating.category}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-4 font-medium px-2 leading-relaxed">
              Measures your revision efficiency over the default flat AI output under standard constraints.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Target</span>
              <span className="text-base font-black text-neutral-800">{timeAllocated}s</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Taken</span>
              <span className="text-base font-black text-neutral-800">{timeTaken}s</span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="group w-full flex items-center justify-center gap-2 bg-neutral-900 text-white hover:bg-black active:bg-neutral-800 transition-colors rounded-xl px-4 py-3.5 text-xs font-bold shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-500 group-hover:rotate-180 transition-transform duration-500" />
            Benchmark New Scenario
          </button>
        </div>

        {/* --- RIGHT COLUMN: Tabbed Content --- */}
        <div className="md:col-span-2 flex flex-col min-h-[500px]">
          
          <div className="flex border-b border-neutral-200 mb-4 overflow-x-auto hide-scrollbar">
            <button 
              className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'border-amber-500 text-amber-600' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`} 
              onClick={() => setActiveTab('overview')}
            >
              Overview & Insight
            </button>
            <button 
              className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'diagnostics' ? 'border-amber-500 text-amber-600' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`} 
              onClick={() => setActiveTab('diagnostics')}
            >
              Diagnostics
            </button>
            <button 
              className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'leaderboard' ? 'border-amber-500 text-amber-600' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`} 
              onClick={() => setActiveTab('leaderboard')}
            >
              Global Benchmark
            </button>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col space-y-4"
          >
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-500/10 flex flex-col h-[250px]">
                      <h4 className="text-[10px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 shrink-0">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        Depth of Insight
                      </h4>
                      <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                        <div>
                          {formatTextAsPointers(evaluation.insight)}
                          {!formatTextAsPointers(evaluation.insight) && (
                            <p className="text-xs text-neutral-700 leading-normal font-semibold bg-white/50 p-2 rounded border border-white">
                              {evaluation.insight}
                            </p>
                          )}
                        </div>
                        
                        {(evaluation.diffInventory || evaluation.confidence) && (
                          <div className="pt-2 border-t border-amber-500/10">
                            {evaluation.diffInventory && (
                              <div className="mb-2">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Diff Inventory</span>
                                <div className="text-[11px] text-neutral-700 font-mono whitespace-pre-wrap leading-relaxed">{evaluation.diffInventory}</div>
                              </div>
                            )}
                            {evaluation.confidence && (
                              <div className="flex gap-2 items-center bg-white/60 p-1.5 rounded border border-white">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase">Confidence</span>
                                <span className="text-[11px] text-neutral-800 font-semibold">{evaluation.confidence}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/60 flex flex-col h-[250px]">
                      <h4 className="text-[10px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 shrink-0">
                        <PenTool className="w-3.5 h-3.5 text-neutral-500" />
                        Resulting Improved Output
                      </h4>
                      <div className="text-xs text-neutral-700 leading-relaxed font-mono bg-white p-3 rounded border border-neutral-100 overflow-y-auto flex-1 whitespace-pre-wrap">
                        {evaluation.clarity}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-3 font-sans mt-auto">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <PenTool className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                      Share Your Experience Feedback
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                    Your feedback is essential to maintaining strict standards for cognitive calibration. Please write a brief remark below to unlock the secure bench-marking social share tools.
                  </p>
                  
                  {isFeedbackSubmitted ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      Thank you! Your feedback has been logged securely and the social share utilities have been successfully unlocked below.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Excellent evaluation. The scenario was highly relevant and challenging, and the AI assessment metrics were very clear..."
                        className="w-full text-xs font-medium rounded-xl border border-neutral-200 p-3 text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 transition-colors placeholder-neutral-400"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSubmitFeedback}
                          disabled={isSubmittingFeedback || !feedback.trim()}
                          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-neutral-900 font-bold px-5 py-2.5 text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          {isSubmittingFeedback ? "Saving feedback..." : "Submit Feedback & Unlock Share"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Professional Social Share Panel */}
                {isFeedbackSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-5"
                  >
                    <div className="text-center md:text-left">
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-1">
                        🏆 Share Your Benchmarking Achievement
                      </span>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                        Instantly compose your salient score on X or LinkedIn to trigger your professional network circles.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 w-full md:w-auto font-sans justify-center md:justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          const verifyLink = savedAttemptId ? `${window.location.origin}/verify/${savedAttemptId}` : window.location.origin;
                          try {
                            await navigator.clipboard.writeText(verifyLink);
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2500);
                          } catch (err) {
                            console.error("Clipboard copy failed: ", err);
                          }
                        }}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs font-bold border border-neutral-700 cursor-pointer"
                      >
                        {linkCopied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-neutral-400" />
                            Copy Link
                          </>
                        )}
                      </button>

                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors text-xs font-bold border border-neutral-700 cursor-pointer"
                      >
                        <Twitter className="w-3.5 h-3.5 text-neutral-400 fill-current" />
                        X
                      </a>
                      
                      <a
                        href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(getShareText())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0077b5] hover:bg-[#0077b5]/90 text-white transition-colors text-xs font-bold shadow-sm cursor-pointer"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-white fill-current" />
                        LinkedIn
                      </a>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* DIAGNOSTICS TAB */}
            {activeTab === 'diagnostics' && (
              <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm flex-1 flex flex-col space-y-5">
                
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2 font-sans border-b border-neutral-100 pb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Dimension Metrics Breakdown
                </h3>

                {evaluation.dimensionScores && evaluation.dimensionScores.length > 0 ? (
                  <div className="space-y-4">
                    {evaluation.dimensionScores.map((dim, idx) => (
                      <div key={idx} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">{dim.dimension}</span>
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">{dim.score}/20</span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-medium pl-1">
                          {dim.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {evaluation.strengths && evaluation.strengths.map((str, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-neutral-700 font-medium leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-500" />
                    Global ART Benchmarking Log
                  </h3>
                  <div className="text-[10px] font-mono bg-white text-neutral-600 py-1 px-2 rounded-md border border-neutral-200 flex items-center gap-1.5 font-bold shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Live Feed
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  {loadingLeaderboard ? (
                    <div className="py-12 flex justify-center items-center gap-2 text-xs text-neutral-500 font-medium animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      Retrieving ranking matrix...
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-neutral-600 border-collapse">
                      <thead className="bg-white text-neutral-400 font-mono text-[10px] uppercase tracking-widest border-b border-neutral-100">
                        <tr>
                          <th className="py-3 px-5 font-bold">Domain</th>
                          <th className="py-3 px-5 font-bold text-center">Exp.</th>
                          <th className="py-3 px-5 font-bold text-center">Time</th>
                          <th className="py-3 px-5 font-bold">Score Add</th>
                          <th className="py-3 px-5 font-bold text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 leading-relaxed font-medium">
                        {leaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-sm text-neutral-400 font-medium bg-neutral-50/50">
                              No active logs recorded yet in database.
                            </td>
                          </tr>
                        ) : (
                          leaderboard.slice(0, 10).map((log, idx) => {
                            const pillColor = log.score >= 80 ? "text-emerald-700 bg-emerald-100 border-emerald-200" 
                                              : log.score >= 40 ? "text-amber-800 bg-amber-100 border-amber-200" 
                                              : "text-neutral-600 bg-neutral-100 border-neutral-200";
                            return (
                              <tr key={log.id || idx} className="hover:bg-neutral-50 transition-colors">
                                <td className="py-3.5 px-5 text-neutral-900 font-semibold">{log.domain}</td>
                                <td className="py-3.5 px-5 text-center font-mono text-[11px] font-bold bg-neutral-50/50">{log.workExperience || "—"}</td>
                                <td className="py-3.5 px-5 text-center text-[10px] font-mono tracking-wide">
                                  {log.timeAllocated ? `${log.timeAllocated}s` : "90s"}<br/>
                                  <span className="text-neutral-400">({log.timeTaken ? `${log.timeTaken}s taken` : "—"})</span>
                                </td>
                                <td className="py-3.5 px-5">
                                  <span className={`px-2 py-1 rounded border text-[10px] font-mono font-black tracking-wider ${pillColor}`}>
                                    {log.score > 0 ? `+${log.score}%` : `${log.score}%`}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-right text-[10px] text-neutral-400 font-mono tracking-wide">
                                  {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
          </motion.div>
        </div>

      </div>
    </div>
  );
}
