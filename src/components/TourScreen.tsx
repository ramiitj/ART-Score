import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, ArrowRight, ShieldAlert, Sparkles, FileText, Lock, Layout,
  CheckCircle2, ChevronRight, AlertCircle, ArrowLeft, Send, Check
} from "lucide-react";

interface TourProps {
  userName: string;
  domain: string;
  difficulty: string;
  timeLimitSeconds: number;
  onBeginTest: () => void;
}

interface TourStepData {
  title: string;
  shortDesc: string;
  guidance: string;
  badge: string;
}

export default function TourScreen({
  userName,
  domain,
  difficulty,
  timeLimitSeconds,
  onBeginTest,
}: TourProps) {
  // We've got 5 key elements matching the actual layout structure
  const [activeStep, setActiveStep] = useState<number>(0);

  const stepsData: TourStepData[] = [
    {
      title: "1. Sandbox Header Console",
      shortDesc: "Displays session details and identity credentials securely.",
      guidance: "This header anchors your active session. It maintains focus on your profile and selected domain without constant timer distractions, keeping your cognitive focus entirely on the evaluation.",
      badge: "Session Identification",
    },
    {
      title: "2. Task Directions & Scenario",
      shortDesc: "The core challenge instruction depicting the task.",
      guidance: "Located at the top of your test booklet. This reads the real-world scenario you're working within — read it carefully, since it frames what a strong prompt edit needs to account for.",
      badge: "Assessor Input Scenario",
    },
    {
      title: "3. Standard AI Baseline Response",
      shortDesc: "The AI's response to the current, unedited prompt.",
      guidance: "This block is wrapped in an amber border. It shows what the AI produces right now, before your edit. Analyze its quality gaps, missing specifics, and weak structure — that's what your prompt edit needs to close.",
      badge: "Flawed Reference Draft",
    },
    {
      title: "4. Edit the Baseline Prompt",
      shortDesc: "Directly edit the prompt that produced the baseline.",
      guidance: "A secure, fullscreen editor pre-filled with the original baseline prompt. Edit it directly — the AI re-runs your edited prompt to produce your final output. To protect the psychometric integrity of the session, standard right-click actions, pasting, copy actions, and screenshot key triggers are securely blocked.",
      badge: "Active Interactive Editor",
    },
    {
      title: "5. Submission Control Desk",
      shortDesc: "Transmits your cognitive reflection for dynamic scoring.",
      guidance: "Located at the bottom right. Once satisfied, click to submit. Your submission is evaluated against 5 target focus categories including clarity, depth, domain-specific terminology, and alignment rules.",
      badge: "One-Shot Authentication",
    }
  ];

  const handleNext = () => {
    if (activeStep < stepsData.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      onBeginTest();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-1.5 px-4 h-full flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Dynamic Header Block */}
      <div className="text-center mb-2 flex-shrink-0">
        <span className="inline-block text-[10px] md:text-xs font-mono font-bold uppercase py-0.5 px-2.5 rounded bg-amber-500/10 text-amber-700 tracking-wider">
          Step 3: Interactive Interface Tour
        </span>
        <h2 className="text-lg md:text-xl font-extrabold text-neutral-800 mt-1 tracking-tight">
          Verify Test Sandbox Layout Elements
        </h2>
        <p className="text-xs text-neutral-600 mt-0.5 max-w-lg mx-auto font-medium">
          Step through each layout block below to understand the workspace before you begin.
        </p>
      </div>

      {/* Main content grid: Left Walkthrough Guidance, Right Actual Test Mock Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 flex-1 items-stretch mb-2">
        
        {/* Left Side: Walkthrough Instructions Card */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-neutral-900 text-white rounded-xl shadow-md border border-neutral-850 p-4 min-h-0">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Feature Guidance
              </span>
              <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300 font-bold font-mono">
                {activeStep + 1} / {stepsData.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <span className="inline-block text-[9px] font-mono font-extrabold uppercase py-0.5 px-2 bg-amber-500 text-neutral-950 rounded tracking-wider">
                  {stepsData[activeStep].badge}
                </span>
                
                <h3 className="text-sm font-bold text-neutral-100 tracking-tight leading-snug">
                  {stepsData[activeStep].title}
                </h3>
                
                <p className="text-xs text-neutral-300 font-semibold leading-relaxed">
                  {stepsData[activeStep].shortDesc}
                </p>

                <p className="text-[11px] text-neutral-450 leading-relaxed font-normal bg-neutral-950/40 p-3 rounded-lg border border-neutral-800">
                  {stepsData[activeStep].guidance}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper controls */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-2.5 mt-4">
            <button
              onClick={handlePrev}
              disabled={activeStep === 0}
              className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-white rounded border border-neutral-800 hover:bg-neutral-850 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Pagination Dots */}
            <div className="flex gap-1">
              {stepsData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeStep 
                    ? "bg-amber-500 w-4" 
                    : "bg-neutral-800 hover:bg-neutral-700"
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-black text-neutral-900 bg-amber-500 hover:bg-amber-600 rounded transition-all flex items-center gap-1 cursor-pointer hover:shadow-md"
            >
              {activeStep === stepsData.length - 1 ? "Start Test" : "Next"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Exact visual layout mock, generated box-by-box starting staggered */}
        <div className="lg:col-span-8 bg-neutral-100/50 rounded-xl border border-neutral-250/70 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <span className="text-[10px] font-mono font-black text-neutral-450 uppercase tracking-widest flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" />
              High-Fidelity Test Blueprint Mockup
            </span>
            <span className="text-[10px] text-neutral-500 italic font-semibold">
              * Click any element block below to highlight instructions
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0 bg-neutral-200/50 p-2.5 rounded-lg border border-neutral-300">
            
            {/* Box 1: Simulated Header Console */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setActiveStep(0)}
              className={`flex justify-between items-center bg-neutral-900 text-neutral-100 px-4 py-2.5 rounded border transition-all cursor-pointer ${
                activeStep === 0 
                ? "ring-2 ring-amber-500 ring-offset-1 border-amber-500 shadow-sm scale-[1.005]" 
                : "border-neutral-800 hover:border-neutral-600 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[8px] uppercase font-mono font-bold tracking-widest text-amber-500">
                  Step 1 Highlight: Live Diagnostic Sandbox Environment
                </span>
                <h4 className="text-[11px] font-bold text-white tracking-tight flex items-center gap-1">
                  <span>AI Reflection Test</span>
                  <span className="text-neutral-500 font-normal">|</span>
                  <span className="text-neutral-300">{userName || "Alex Chen"}</span>
                </h4>
              </div>
              <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 font-mono">
                SECURE RUNTIME ACTIVE
              </span>
            </motion.div>

            {/* Split Grid for left-side / right-side actual blueprint */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
              
              {/* Left Column: Test Passage/Instructions Booklet Mock */}
              <div className="flex flex-col gap-2 bg-neutral-100/70 rounded p-2.5 border border-neutral-250">
                <div className="border-b border-neutral-250 pb-1.5 flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Assessor Test Booklet (Read-Only)</span>
                </div>

                {/* Box 2: Task Directions Module */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setActiveStep(1)}
                  className={`bg-white rounded p-3 border transition-all cursor-pointer flex-1 flex flex-col justify-between ${
                    activeStep === 1 
                    ? "ring-2 ring-amber-500 ring-offset-1 border-amber-500 shadow-sm scale-[1.01]" 
                    : "border-neutral-200 hover:border-neutral-350 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center pb-1 border-b border-neutral-100">
                      <span className="text-[9px] font-bold text-neutral-700 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-neutral-500" />
                        1. Task Directions & Scenario
                      </span>
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-800 rounded text-[7px] font-bold uppercase font-mono">
                        Prompt Block
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-500 leading-normal line-clamp-3">
                      Identify and rewrite the logical flaws inside the system guideline. Pay close attention to professional edge cases and specific domain metrics.
                    </p>
                  </div>
                </motion.div>

                {/* Box 3: Standard AI Baseline Response Module */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setActiveStep(2)}
                  className={`bg-neutral-50 p-3 rounded border border-l-4 border-l-amber-500 transition-all cursor-pointer flex-1 flex flex-col justify-between ${
                    activeStep === 2 
                    ? "ring-2 ring-amber-500 ring-offset-1 border-amber-500 shadow-sm scale-[1.01]" 
                    : "border-neutral-200 hover:border-neutral-350 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center pb-1 border-b border-neutral-200/50">
                      <span className="text-[9px] font-bold text-amber-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-600" />
                        2. Standard AI Baseline Response
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-600 font-medium italic leading-normal line-clamp-3">
                      "This is the underwhelming generic response generated by the standard AI. Perfecting spelling pattern inaccuracies is recommended here..."
                    </p>
                  </div>
                  <span className="text-[7px] text-neutral-400 font-semibold uppercase font-mono block text-right">
                    * Flawed baseline
                  </span>
                </motion.div>

              </div>

              {/* Right Column: Prompt Editing Panel Mock */}
              <div className="flex flex-col gap-2 bg-neutral-100/70 rounded p-2.5 border border-neutral-250">
                <div className="border-b border-neutral-250 pb-1.5 flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Your Prompt Editing Sandbox</span>
                </div>

                {/* Box 4: Edit the Baseline Prompt Module */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setActiveStep(3)}
                  className={`bg-white rounded p-3 border transition-all cursor-pointer flex-1 flex flex-col justify-between min-h-0 ${
                    activeStep === 3
                    ? "ring-2 ring-amber-500 ring-offset-1 border-amber-500 shadow-sm scale-[1.01]"
                    : "border-neutral-200 hover:border-neutral-350 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="flex justify-between items-center pb-1 border-b border-neutral-100">
                      <span className="text-[9px] font-bold text-neutral-800 flex items-center gap-1">
                        <div className="w-1 h-3 bg-amber-500 rounded-xs"></div>
                        3. Edit the Baseline Prompt
                      </span>
                    </div>
                    <div className="flex-1 bg-neutral-50/50 rounded border border-neutral-200 border-dashed p-2 flex items-center justify-center text-center">
                      <span className="text-[8px] text-neutral-400 font-semibold italic">
                        Pre-Filled, Editable Prompt
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[7px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded border border-rose-100 mt-2">
                    <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                    Copy-Paste Protection Active
                  </div>
                </motion.div>

                {/* Box 5: Submission Controls Module */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setActiveStep(4)}
                  className={`bg-neutral-50 p-2.5 rounded border transition-all cursor-pointer ${
                    activeStep === 4 
                    ? "ring-2 ring-amber-500 ring-offset-1 border-amber-500 shadow-sm scale-[1.01]" 
                    : "border-neutral-250 hover:border-neutral-350 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[8px] text-neutral-500 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                      One-shot evaluation
                    </span>
                    <button className="bg-neutral-900 text-white rounded px-2.5 py-1 text-[8px] font-black uppercase tracking-wider pointer-events-none flex items-center gap-0.5">
                      Submit Reflection
                      <Send className="w-2 h-2 text-amber-400" />
                    </button>
                  </div>
                </motion.div>

              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Protocol Confirm Controls */}
      <div className="flex justify-center flex-shrink-0 bg-neutral-100 border border-neutral-200/80 p-3 rounded-xl gap-4 items-center flex-col sm:flex-row shadow-inner">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
          <Clock className="w-4.5 h-4.5 text-amber-600" />
          <span>Allotted Test Time: <strong className="text-amber-700 font-black">{timeLimitSeconds} SECONDS</strong></span>
        </div>
        <button
          onClick={onBeginTest}
          className="group inline-flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-950 px-6 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
        >
          Confirm Protocols & Start Live Test
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
