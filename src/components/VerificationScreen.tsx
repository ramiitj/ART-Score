import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ArrowRight, Activity, ShieldCheck, Mail, BookOpen, Clock, Award, Zap, TrendingUp, UserCheck } from "lucide-react";
import { AttemptLog } from "../types";
import ScopeBanner from "./ScopeBanner";

interface VerificationScreenProps {
  attemptId: string;
}

export default function VerificationScreen({ attemptId }: VerificationScreenProps) {
  const [attempt, setAttempt] = useState<AttemptLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await fetch(`/api/attempt/${attemptId}`);
        if (!res.ok) {
          throw new Error("This result could not be found.");
        }
        const data = await res.json();
        setAttempt(data);
      } catch (e: any) {
        setError(e.message || "We couldn't load this result.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="w-10 h-10 text-neutral-400 mb-4 animate-spin hidden" />
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-500 font-medium">Looking up this result...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 bg-white rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-16 h-16 text-rose-500 mb-6" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Result not found</h2>
        <p className="text-neutral-500 mb-8 text-center">We couldn't find a result matching this ID.</p>
        <button
          onClick={() => window.location.href = "/"}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold px-6 py-3 rounded-xl flex items-center gap-2"
        >
          Take the test
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Never invent numbers on a shareable record: the breakdown below renders
  // only when the real stored values exist. This previously defaulted the
  // baseline to 50 and back-computed the delta from the score, which
  // displayed a fabricated breakdown whenever those fields were missing.
  const baseScore = attempt.evaluation?.baselineQualityScore;
  const rawDelta = attempt.evaluation?.rawDeltaScore;
  const hasBreakdown = typeof baseScore === "number" && typeof rawDelta === "number";
  const revisedScore = hasBreakdown ? baseScore + rawDelta : null;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-10 bg-white rounded-3xl border border-neutral-200 shadow-sm">
      <div className="mb-6">
        <ScopeBanner />
      </div>
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
          <ShieldCheck className="w-10 h-10 text-emerald-600 animate-pulse" />
        </div>
        <span className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 border border-emerald-200/60 bg-emerald-50/50 px-2.5 py-1 rounded-full mb-3">
          VERIFIED RESULT
        </span>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">AI Reflection Test result</h1>
        <p className="text-neutral-500 max-w-md text-sm">
          This is the stored record for this attempt, looked up by its result ID. It shows the score exactly as it was calculated at the time.
        </p>
      </div>

      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 md:p-8 mb-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Initials</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">
              {attempt.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "AN"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Field</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">{attempt.domain}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Difficulty</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">{attempt.difficulty}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Score</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-extrabold ${
                attempt.score >= 80 ? "text-emerald-600" :
                attempt.score >= 40 ? "text-amber-500" : "text-neutral-600"
              }`}>
                {attempt.score >= 0 ? `+${attempt.score}` : attempt.score}%
              </span>
            </div>
          </div>
        </div>

        {/* Score breakdown -- only when the real stored values exist */}
        {hasBreakdown && (
        <div className="border-t border-neutral-200/60 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            How this score was reached
          </h4>

          <div className="bg-neutral-100/70 rounded-xl p-5 border border-neutral-200/80 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:border-r border-neutral-200/80 md:pr-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-neutral-400 block mb-1">
                  AI's first answer
                </span>
                <span className="text-2xl font-black text-neutral-700">
                  {baseScore}/100
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                How the AI's own first answer scored, before any human edit.
              </p>
            </div>

            <div className="md:border-r border-neutral-200/80 md:px-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-neutral-400 block mb-1">
                  After the edit
                </span>
                <span className="text-2xl font-black text-neutral-800">
                  {revisedScore}/100
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                How the answer scored once the improved prompt was run.
              </p>
            </div>

            <div className="md:pl-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-amber-600 block mb-1">
                  Gap closed
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {attempt.score >= 0 ? `+${attempt.score}` : attempt.score}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Share of the {100 - (baseScore as number)} points still available that the edit actually closed.
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Cognitive & Pacing Details */}
        <div className="border-t border-neutral-200/60 pt-6 text-xs text-neutral-600">
          <div className="bg-white rounded-xl p-4 border border-neutral-150">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-2">
              <Clock className="w-4 h-4" />
              <h5 className="font-bold uppercase tracking-wider text-[9px]">Time taken</h5>
            </div>
            <p className="font-medium text-neutral-800">
              Completed in <strong className="text-neutral-900">{attempt.timeTaken || 0}s</strong> of the {attempt.timeAllocated || 180}s allowed.
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
              Each task is timed, so this is the time used for this one.
            </p>
          </div>
        </div>

        {/* Assessor Insight Narrative if available */}
        {attempt.evaluation?.insight && (
          <div className="border-t border-neutral-200/60 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              What the evaluation said
            </h4>
            <div className="bg-emerald-50/20 rounded-xl p-4 border border-emerald-100/50">
              <p className="text-xs text-neutral-750 leading-relaxed font-normal whitespace-pre-line">
                {attempt.evaluation.insight}
              </p>
              
              {attempt.evaluation.strengths && attempt.evaluation.strengths.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-100/30">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-emerald-700 block mb-2">
                    Dimension scores
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attempt.evaluation.strengths.map((str, idx) => (
                      <span key={idx} className="text-[10px] font-bold bg-emerald-50 border border-emerald-200/40 text-emerald-700 px-2.5 py-0.5 rounded-md">
                        ✓ {str}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="col-span-1 md:col-span-2 text-xs text-neutral-400 pt-2 border-t border-neutral-200 mt-2">
          Result ID: {attemptId} <br />
          Recorded on: {new Date(attempt.timestamp).toLocaleDateString()} {new Date(attempt.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-50 border border-amber-200 p-6 rounded-2xl">
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Curious how you'd do?</h3>
          <p className="text-amber-800/80 text-sm">Three short tasks in your field. Takes about 10 minutes.</p>
        </div>
        <button
          onClick={() => window.location.href = "/"}
          className="bg-amber-600 text-white hover:bg-amber-700 font-bold px-6 py-3 rounded-xl flex items-center gap-2 flex-shrink-0"
        >
          Start the test
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
