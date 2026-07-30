import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Radio, ShieldAlert, Cpu } from "lucide-react";

interface EvaluatingProps {
  itemIndex?: number;
  itemsTotal?: number;
}

export default function EvaluatingScreen({ itemIndex = 0, itemsTotal = 1 }: EvaluatingProps) {
  const [promptIdx, setPromptIdx] = useState(0);

  // These name the steps that actually run server-side. The previous list
  // ("Measuring semantic distance...", "Calibrating value density index
  // metrics...") described stages that do not exist anywhere in the pipeline.
  const analysisPrompts = [
    "Running your edited prompt through the AI...",
    "Asking the AI to improve its own first answer...",
    "Comparing the two answers blind, without knowing which is yours...",
    "Checking which specific gaps your version closed...",
    "Working out your score..."
  ];

  const isLastItem = itemIndex + 1 >= itemsTotal;

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIdx((prev) => (prev + 1) % analysisPrompts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [analysisPrompts.length]);

  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <motion.div
        className="relative flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto mb-8"
        animate={{ scale: [1, 1.05, 1], rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      >
        <Cpu className="w-10 h-10 text-amber-500" />
        <span className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping"></span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={promptIdx}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <p className="text-sm font-mono tracking-widest text-amber-600 uppercase font-semibold">
          {itemsTotal > 1 ? `Scoring task ${itemIndex + 1} of ${itemsTotal}` : "Scoring your answer"}
        </p>
        <h3 className="text-lg font-bold text-neutral-800 flex items-center justify-center gap-2">
          <Radio className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          {analysisPrompts[promptIdx]}
        </h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
          This takes up to a minute. Please don't refresh or leave this page.
          {!isLastItem && " We'll go straight to the next task when it's done."}
        </p>
      </motion.div>

      {/* Aesthetic loading bar */}
      <div className="mt-8 bg-neutral-100 rounded-full h-1 overflow-hidden max-w-xs mx-auto">
        <motion.div
          className="bg-amber-500 h-full rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ width: "60%" }}
        />
      </div>
    </div>
  );
}
