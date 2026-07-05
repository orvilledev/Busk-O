import { Minus, Plus } from "lucide-react";

/** A labelled −/+ stepper used for transpose and capo controls. */
export function Stepper({
  label,
  display,
  onDec,
  onInc,
}: {
  label: string;
  display: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted">{label}</span>
      <button
        type="button"
        onClick={onDec}
        aria-label={`${label} down`}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-surface-2"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center font-mono">{display}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label={`${label} up`}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-surface-2"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
