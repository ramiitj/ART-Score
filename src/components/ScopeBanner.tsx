import { Info } from "lucide-react";

// Honest scope disclosure: this instrument measures symbolic/analytic
// knowledge-work output. It is silent on embodied, relational, and
// accountability-bearing dimensions of professional work (see
// docs/HEADROOM_MIGRATION_SPEC.md §12).
export default function ScopeBanner() {
  return (
    <div className="flex items-start gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-[11px] text-neutral-500 leading-relaxed">
      <Info className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
      <span>
        <strong className="text-neutral-600 font-bold">Scope: </strong>
        This score reflects symbolic, analytic knowledge-work output (writing, analysis, planning). It does not measure the embodied, relational, or accountability-bearing dimensions of professional work.
      </span>
    </div>
  );
}
