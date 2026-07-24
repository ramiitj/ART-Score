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
          throw new Error("Verification record not found.");
        }
        const data = await res.json();
        setAttempt(data);
      } catch (e: any) {
        setError(e.message || "Failed to load verification record.");
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
        <p className="text-neutral-500 font-medium">Verifying Credentials...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 bg-white rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-16 h-16 text-rose-500 mb-6" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Verification Failed</h2>
        <p className="text-neutral-500 mb-8 text-center">We couldn't find a valid credential record matching this ID.</p>
        <button
          onClick={() => window.location.href = "/"}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold px-6 py-3 rounded-xl flex items-center gap-2"
        >
          Take the Test
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Gracefully calculate/recompute actual dynamic metrics with safe fallbacks
  const baseScore = attempt.evaluation?.baselineQualityScore ?? 50;
  const rawDelta = attempt.evaluation?.rawDeltaScore ?? Math.round(((attempt.score || 0) / 100) * (100 - baseScore));
  const revisedScore = baseScore + rawDelta;

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
          SECURE CERTIFIED RECORD
        </span>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Verified Professional Credential</h1>
        <p className="text-neutral-500 max-w-md text-sm">
          Cognitive benchmarking and AI reflection audit authenticated directly through the secure cryptographically referenced ledger.
        </p>
      </div>

      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 md:p-8 mb-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Candidate Initials</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">
              {attempt.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "AN"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Applied Specialty Domain</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">{attempt.domain}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Scenario Complexity</h3>
            </div>
            <p className="text-lg font-bold text-neutral-800">{attempt.difficulty} Level Tier</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider">Human Value-Add Score</h3>
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

        {/* Dynamic Credentials Certificate Breakdown */}
        <div className="border-t border-neutral-200/60 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Performance & Mathematical Breakdown
          </h4>

          <div className="bg-neutral-100/70 rounded-xl p-5 border border-neutral-200/80 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:border-r border-neutral-200/80 md:pr-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-neutral-400 block mb-1">
                  AI Baseline Quality
                </span>
                <span className="text-2xl font-black text-neutral-700">
                  {baseScore}/100
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Pre-scored capability rating corresponding to the model's unrefined, out-of-the-box response.
              </p>
            </div>

            <div className="md:border-r border-neutral-200/80 md:px-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-neutral-400 block mb-1">
                  Revision Quality
                </span>
                <span className="text-2xl font-black text-neutral-800">
                  {revisedScore}/100
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Absolute quality score achieved after candidate injected domain logic and critical corrections.
              </p>
            </div>

            <div className="md:pl-4 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-[9px] uppercase tracking-wide text-amber-600 block mb-1">
                  Value-Add Closed
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {attempt.score >= 0 ? `+${attempt.score}` : attempt.score}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Percentage of available improvement headroom (+{100 - baseScore} points available) closed by human intervention.
              </p>
            </div>
          </div>
        </div>

        {/* Cognitive & Pacing Details */}
        <div className="border-t border-neutral-200/60 pt-6 text-xs text-neutral-600">
          <div className="bg-white rounded-xl p-4 border border-neutral-150">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-2">
              <Clock className="w-4 h-4" />
              <h5 className="font-bold uppercase tracking-wider text-[9px]">Pacing & Pacing Efficiency</h5>
            </div>
            <p className="font-medium text-neutral-800">
              Completed in <strong className="text-neutral-900">{attempt.timeTaken || 0}s</strong> under pressure constraint of {attempt.timeAllocated || 180}s.
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
              Represents quick-fire critical evaluation capability under a dynamic countdown window.
            </p>
          </div>
        </div>

        {/* Assessor Insight Narrative if available */}
        {attempt.evaluation?.insight && (
          <div className="border-t border-neutral-200/60 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Secured Evaluation Narrative & Strengths
            </h4>
            <div className="bg-emerald-50/20 rounded-xl p-4 border border-emerald-100/50">
              <p className="text-xs text-neutral-750 leading-relaxed font-normal whitespace-pre-line">
                {attempt.evaluation.insight}
              </p>
              
              {attempt.evaluation.strengths && attempt.evaluation.strengths.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-100/30">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-emerald-700 block mb-2">
                    Verified Execution Drivers
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
          Verification ID: {attemptId} <br />
          Certified on: {new Date(attempt.timestamp).toLocaleDateString()} {new Date(attempt.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-50 border border-amber-200 p-6 rounded-2xl">
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Find out how you compare</h3>
          <p className="text-amber-800/80 text-sm">Take the anonymous challenge and test your AI reflection capabilities.</p>
        </div>
        <button
          onClick={() => window.location.href = "/"}
          className="bg-amber-600 text-white hover:bg-amber-700 font-bold px-6 py-3 rounded-xl flex items-center gap-2 flex-shrink-0"
        >
          Start Evaluation
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
