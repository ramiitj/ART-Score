import { motion } from "motion/react";
import { PenTool, BarChart3, Briefcase, Trophy, ArrowRight } from "lucide-react";

interface WelcomeProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeProps) {
  const steps = [
    {
      icon: <PenTool className="w-4 h-4 text-amber-500" />,
      title: "1. Three tasks, one sitting",
      desc: "You'll work through three realistic scenarios from your field, each on a timer. Expect about 10 minutes in total."
    },
    {
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      title: "2. Improve the prompt, not the answer",
      desc: "You see a task, a first-attempt prompt, and what the AI wrote from it. You edit the prompt — then the AI re-runs your version."
    },
    {
      icon: <Briefcase className="w-4 h-4 text-amber-500" />,
      title: "3. Judged against the AI's own best try",
      desc: "The AI also revises its own answer, unaided. Your version is compared against that, blind, so you're credited only for going beyond what it reaches alone."
    },
    {
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      title: "4. See where you stand",
      desc: "Get a score per task with how you compare to others in the same field and difficulty, plus a link you can share."
    }
  ];

  return (
    <div className="max-w-xl md:max-w-2xl mx-auto py-1 px-4">
      {/* Main Title Bracket */}
      <motion.div
        className="text-center mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 mb-1 font-sans">
          ART – AI Reflection Test
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 font-medium max-w-xl mx-auto">
          Measure how well you can think <em className="text-amber-600 not-italic font-semibold">with</em> and <em className="text-amber-600 not-italic font-semibold">beyond</em> AI.
        </p>
      </motion.div>

      {/* Editorial Content Text Card */}
      <motion.div
        className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-neutral-100 mb-3 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs md:text-sm text-neutral-650 leading-relaxed font-normal">
          AI will give you a competent first draft on almost anything. What it won't do is know what your situation actually requires. This test measures your <strong>headroom</strong> — how much better the result gets when you bring what the AI was missing, measured against the AI's own best unaided attempt.
        </p>
      </motion.div>

      {/* Steps Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto mb-4">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="flex gap-2.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm border border-neutral-200/50 flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-800 mb-0.5">{step.title}</h4>
              <p className="text-[11px] text-neutral-500 leading-normal font-normal">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Primary Action */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-2 bg-neutral-800 text-white hover:bg-neutral-950 transition-colors rounded-lg px-5 py-2.5 text-xs font-bold tracking-wide shadow-sm"
        >
          Begin Reflection Test
          <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
}
