"use client";

import {
  type AnalysisMemoryMode,
} from "@/lib/analysis-memory-mode";

export const ANALYSIS_MEMORY_MODE_OPTIONS: Array<{
  id: AnalysisMemoryMode;
  label: string;
  description: string;
}> = [
  {
    id: "without-memory",
    label: "No memory",
    description: "One analysis without memory context.",
  },
  {
    id: "with-memory",
    label: "Use memory",
    description: "One analysis with relevant memory context.",
  },
  {
    id: "blind-comparison",
    label: "Blind comparison",
    description: "Two unlabeled analyses: one with memory and one without.",
  },
];

interface AnalysisMemoryModeControlProps {
  value: AnalysisMemoryMode;
  onChange: (mode: AnalysisMemoryMode) => void;
  disabled?: boolean;
}

export function AnalysisMemoryModeControl({
  value,
  onChange,
  disabled = false,
}: AnalysisMemoryModeControlProps) {
  return (
    <fieldset
      disabled={disabled}
      className="rounded-lg border border-outline bg-surface p-4"
    >
      <legend className="px-1 text-sm font-semibold text-ink">
        Analysis memory
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {ANALYSIS_MEMORY_MODE_OPTIONS.map((option) => {
          const selected = value === option.id;

          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-md border p-3 transition-colors ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-outline bg-page hover:bg-accent-soft"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="analysis-memory-mode"
                value={option.id}
                checked={selected}
                disabled={disabled}
                aria-describedby="analysis-memory-mode-help"
                onChange={() => onChange(option.id)}
                className="mr-2 accent-accent"
              />
              <span className="text-sm font-medium text-ink">{option.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                {option.description}
              </span>
            </label>
          );
        })}
      </div>
      <p id="analysis-memory-mode-help" className="mt-3 text-xs text-ink-muted">
        This choice affects the current analysis only. Saving still updates memory for future entries.
      </p>
    </fieldset>
  );
}
