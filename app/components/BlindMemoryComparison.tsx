"use client";

import { useState } from "react";
import { AnalysisPanel } from "./AnalysisPanel";
import type { BlindComparisonOption } from "@/app/actions";

export interface AssignedBlindOptions {
  a: BlindComparisonOption;
  b: BlindComparisonOption;
}

export function assignBlindOptions(
  withMemory: BlindComparisonOption,
  withoutMemory: BlindComparisonOption,
  randomValue: number = Math.random()
): AssignedBlindOptions {
  return randomValue < 0.5
    ? { a: withMemory, b: withoutMemory }
    : { a: withoutMemory, b: withMemory };
}

interface BlindMemoryComparisonProps {
  options: AssignedBlindOptions;
  onContinue: (option: BlindComparisonOption) => void;
  onCancel: () => void;
}

export type BlindComparisonPreference = "a" | "b" | "tie" | null;

interface BlindMemoryComparisonViewProps extends BlindMemoryComparisonProps {
  preference: BlindComparisonPreference;
  onPreference: (preference: Exclude<BlindComparisonPreference, null>) => void;
}

function ConditionLabel({ option }: { option: BlindComparisonOption }) {
  return (
    <div className="mt-3 rounded-md border border-outline bg-accent-soft p-3 text-sm text-ink">
      <span className="font-semibold">{option.usesMemory ? "Memory on" : "Memory off"}</span>
      {option.usesMemory && (
        <div className="mt-2 space-y-1 text-xs text-ink-muted">
          {(option.memoryContext || []).length === 0
            ? <p>No memory was relevant.</p>
            : option.memoryContext?.map((memory) => (
              <p key={`${memory.id}-${memory.version}`}>{memory.title}: {memory.summary}</p>
            ))}
        </div>
      )}
    </div>
  );
}

export function BlindMemoryComparisonView({
  options,
  onContinue,
  onCancel,
  preference,
  onPreference,
}: BlindMemoryComparisonViewProps) {
  const revealed = preference !== null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline bg-surface p-4">
        <h2 className="text-xl font-semibold text-ink">Blind memory comparison</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Read both analyses, then choose the one you prefer. Conditions remain hidden until selection.
        </p>
      </div>

      <div className="space-y-6" data-testid="blind-comparison-results">
        {(["a", "b"] as const).map((key) => (
          <section key={key} className="w-full rounded-lg border border-outline bg-page p-4">
            <h3 className="mb-3 text-lg font-semibold text-ink">Analysis {key.toUpperCase()}</h3>
            <AnalysisPanel analysisText={options[key].analysisText || ""} showReadingMetadata={false} />
            {revealed && <ConditionLabel option={options[key]} />}
          </section>
        ))}
      </div>

      {!revealed ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => onPreference("a")} className="rounded-md bg-accent px-4 py-2 font-medium text-white">A is better</button>
          <button type="button" onClick={() => onPreference("b")} className="rounded-md bg-accent px-4 py-2 font-medium text-white">B is better</button>
          <button type="button" onClick={() => onPreference("tie")} className="rounded-md border border-outline bg-surface px-4 py-2 text-ink">No meaningful difference</button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {preference === "a" && <button type="button" onClick={() => onContinue(options.a)} className="rounded-md bg-accent px-4 py-2 font-medium text-white">Continue with A</button>}
          {preference === "b" && <button type="button" onClick={() => onContinue(options.b)} className="rounded-md bg-accent px-4 py-2 font-medium text-white">Continue with B</button>}
          {preference === "tie" && (
            <>
              <button type="button" onClick={() => onContinue(options.a)} className="rounded-md bg-accent px-4 py-2 font-medium text-white">Save A</button>
              <button type="button" onClick={() => onContinue(options.b)} className="rounded-md bg-accent px-4 py-2 font-medium text-white">Save B</button>
              <button type="button" onClick={onCancel} className="rounded-md border border-outline bg-surface px-4 py-2 text-ink">Save neither</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function BlindMemoryComparison(props: BlindMemoryComparisonProps) {
  const [preference, setPreference] = useState<BlindComparisonPreference>(null);

  return (
    <BlindMemoryComparisonView
      {...props}
      preference={preference}
      onPreference={setPreference}
    />
  );
}
