import { ShieldAlert, RefreshCw, RotateCcw } from "lucide-react";

interface EvaluationErrorScreenProps {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
}

export default function EvaluationErrorScreen({ message, onRetry, onRestart }: EvaluationErrorScreenProps) {
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 bg-rose-50 rounded-full border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-500">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-extrabold text-neutral-800 mb-2">Evaluation Could Not Be Completed</h2>
      <p className="text-sm text-neutral-500 leading-relaxed mb-1">
        {message}
      </p>
      <p className="text-xs text-neutral-400 leading-relaxed mb-6">
        Your submission was not lost. You can retry the evaluation, or start a new session.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-950 text-white text-xs font-bold py-2.5 px-6 rounded-md shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Evaluation
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs font-bold py-2.5 px-6 rounded-md transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Session
        </button>
      </div>
    </div>
  );
}
