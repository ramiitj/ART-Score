import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, AlertCircle, FileText, CheckCircle2, ChevronRight, RefreshCw, ShieldAlert, RotateCcw } from "lucide-react";

interface ActiveTestProps {
  userName: string;
  domain: string;
  difficulty: string;
  task: string;
  baseline: string;
  baselinePrompt: string;
  timeLimitSeconds: number;
  itemIndex: number;
  itemsTotal: number;
  onSubmit: (editedPrompt: string, timeTaken: number) => void;
}

export default function ActiveTestScreen({
  userName,
  domain,
  difficulty,
  task,
  baseline,
  baselinePrompt,
  timeLimitSeconds,
  itemIndex,
  itemsTotal,
  onSubmit,
}: ActiveTestProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [editedPrompt, setEditedPrompt] = useState(baselinePrompt);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotating guidance tutorial tooltips
  const tips = [
    "Tip: Edit the prompt itself — the AI re-runs your version to produce the final answer.",
    "Tip: Add the specifics the original prompt leaves out: audience, constraints, edge cases.",
    "Tip: Submitting the prompt unchanged scores 0 — the point is to steer the AI, not accept it.",
    "Tip: A short, precise edit can beat a long rewrite.",
    "Tip: Please type your edits — pasting is turned off on this box."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 6000);
    return () => clearInterval(tipInterval);
  }, []);

  // Helper to remove markdown asterisks for clean human reading
  const cleanFormat = (text: string) => {
    if (!text) return "";
    return text.replace(/\*/g, "").trim();
  };

  const formattedTask = cleanFormat(task);
  const formattedBaseline = cleanFormat(baseline);

  const handleResetPrompt = () => {
    setEditedPrompt(baselinePrompt);
    triggerWarning("Prompt reset to the original baseline.");
  };

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    const timeout = setTimeout(() => {
      setWarningMessage("");
    }, 3550);
    return () => clearTimeout(timeout);
  };

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Integrity note: this screen used to block copy, cut, right-click, Ctrl+P
  // and PrintScreen, and made the whole page unselectable. All of it was
  // trivially bypassable (devtools, a phone camera, a second device), so it
  // deterred nobody while genuinely hurting people who need to select and
  // re-read the brief, use a screen reader, or draft in their own editor --
  // and the "screenshot logged" warning was untrue, since nothing was logged.
  // Only the paste block on the answer box remains (see handlePastePrevent),
  // which is the one measure aimed at the actual assessment input.

  // Handle auto-submit on time up
  useEffect(() => {
    if (isTimeUp) {
      setTimeout(() => {
        onSubmit(editedPrompt || "[Empty Submission - Time Ran Out]", timeLimitSeconds);
      }, 1500);
    }
  }, [isTimeUp, onSubmit, editedPrompt, timeLimitSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = timeLimitSeconds - timeLeft;
    onSubmit(editedPrompt || "[Empty Submission]", timeTaken);
  };

  const handlePastePrevent = (e: React.ClipboardEvent) => {
    e.preventDefault();
    triggerWarning("Pasting is turned off here — please type your edits, so we're measuring your thinking.");
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-3 h-full min-h-0 overflow-hidden">

      {/* Header: who you are, where you are in the run, and time left */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-neutral-900 text-neutral-100 px-5 py-3 rounded-t-lg border border-neutral-800 shadow-sm font-sans flex-shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {/* Progress through the run -- dots plus an explicit count, so it
                is never a surprise that more tasks are coming. */}
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: itemsTotal }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < itemIndex ? "w-4 bg-amber-500"
                    : i === itemIndex ? "w-6 bg-amber-400"
                    : "w-4 bg-neutral-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
              Task {itemIndex + 1} of {itemsTotal}
            </span>
          </div>
          <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-1 text-white">
            <span>{domain}</span>
            <span className="text-neutral-500 font-normal">·</span>
            <span className="text-neutral-300 font-semibold">{difficulty}</span>
          </h2>
        </div>

        {/* Display timer count visually on the top right */}
        <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-750 font-mono text-xs">
          <Clock className={`w-4 h-4 flex-shrink-0 ${timeLeft <= 20 ? "text-rose-400 animate-pulse" : "text-amber-500"}`} />
          <span className="text-neutral-300">Time left</span>
          <span className="text-white font-black tracking-wider text-sm">{timeLeft}s</span>
        </div>
      </div>

      {/* Decreasing line indicator in custom amber theme matching the platform's layout */}
      <div className="w-full bg-neutral-900 h-1.5 overflow-hidden flex-shrink-0 rounded-b-lg border-x border-b border-neutral-800">
        <motion.div
          className={`h-full transition-all duration-1000 ${
            timeLeft > 20 ? "bg-amber-500" : "bg-rose-500 animate-pulse"
          }`}
          style={{ width: `${(timeLeft / timeLimitSeconds) * 100}%` }}
        />
      </div>

      {/* Side-by-Side Diagnostic Flex Workspace */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 items-stretch">
        
        {/* LEFT COLUMN: Test Passage/Instructions Booklet (Single Scroll Container) */}
        <div className="flex flex-col bg-white rounded-lg p-4 border border-neutral-200 shadow-sm h-full min-h-0 overflow-y-auto bg-neutral-50/10 gap-4 lg:p-5">
          
          <div className="border-b border-neutral-200 pb-3 flex items-center">
            <span className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-wider">
              Your brief
            </span>
          </div>

          {/* Task Scenario Box (context only — the editable prompt lives in the right column) */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-2 text-neutral-800">
                <FileText className="w-4.5 h-4.5 text-neutral-600 flex-shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-neutral-800">
                  1. The task
                </h3>
              </div>
            </div>
            <div className="text-neutral-700 text-xs leading-relaxed font-sans whitespace-pre-line font-medium bg-white p-4 border border-neutral-200 rounded-md">
              {formattedTask}
            </div>
          </div>

          {/* AI Baseline Reference Box: shows what the CURRENT prompt produces, read-only */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-2 text-neutral-800">
                <CheckCircle2 className="w-4.5 h-4.5 text-neutral-600 flex-shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-neutral-800">
                  2. What the AI wrote from the prompt below
                </h3>
              </div>
            </div>
            <div className="text-neutral-700 italic text-xs leading-relaxed whitespace-pre-line pl-3 border-l-4 border-amber-500 font-sans font-medium bg-neutral-50 p-4 border border-neutral-200 rounded-md">
              "{formattedBaseline}"
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Prompt Editing Panel */}
        <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm flex flex-col h-full min-h-0 gap-3 lg:p-5">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-sm"></div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 font-sans">
                  3. Improve the prompt
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetPrompt}
                disabled={timeLeft === 0}
                className="inline-flex items-center gap-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                title="Resets your edits back to the original baseline prompt."
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Original
              </button>
            </div>

            {/* Warning Message Bar */}
            <AnimatePresence>
              {warningMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-700 rounded-md px-3 py-2 text-[11px] font-semibold mb-2.5 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{warningMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              onPaste={handlePastePrevent}
              placeholder="Edit this prompt directly — add the missing constraints, specifics, or structure that would make the AI's response excellent..."
              disabled={timeLeft === 0}
              className="w-full flex-1 min-h-[220px] lg:min-h-0 rounded-md border border-neutral-300 p-4 text-xs text-neutral-850 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all font-sans font-medium resize-none bg-neutral-50/10 leading-relaxed placeholder:text-neutral-400"
              required
            />
          </div>

          <div className="pt-3.5 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              You get one submission for this task.
            </span>
            <button
              type="submit"
              disabled={timeLeft === 0 || !editedPrompt.trim()}
              className="inline-flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-950 active:bg-black text-white text-xs font-bold py-2.5 px-6 rounded-md shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {itemIndex + 1 < itemsTotal ? "Submit and continue" : "Submit and see results"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </form>

      {/* Auto-submission Closed Overlay */}
      <AnimatePresence>
        {isTimeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl max-w-sm p-6 text-center shadow-2xl border border-neutral-200"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-full border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-800 mb-1.5 font-sans">
                Evaluation Window Closed
              </h3>
              <p className="text-xs text-neutral-500 leading-normal mb-4 font-semibold font-sans">
                Time has elapsed. Transmitting diagnostic draft securely to psychometric scorers...
              </p>
              <div className="flex justify-center items-center gap-2 text-xs font-bold text-amber-600 font-sans">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ANALYZING COGNITIVE METRICS
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
