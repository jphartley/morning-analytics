"use client";

import { ViewDensityMode, getAvailableViewDensityModes } from "@/lib/view-density";

interface ViewDensityControlProps {
  value: ViewDensityMode;
  onChange: (mode: ViewDensityMode) => void;
  testViewEnabled?: boolean;
}

const MODE_LABELS: Record<ViewDensityMode, string> = {
  quiet: "Quiet",
  insight: "Insight",
  test: "Test",
};

function ModeIcon({ mode }: { mode: ViewDensityMode }) {
  if (mode === "quiet") {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21H5a2 2 0 0 1-2-2v-2" />
      </svg>
    );
  }

  if (mode === "test") {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-9" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.12 3.88 16 2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21a4 4 0 0 0-3.81-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 5a4 4 0 0 1-3.55 3.97" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 13h-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21a4 4 0 0 1 3.81-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a4 4 0 0 0 3.55 3.97" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 13H2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 2 1.88 1.88" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7.13V6a3 3 0 1 1 6 0v1.13" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 2v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}

export function ViewDensityControl({
  value,
  onChange,
  testViewEnabled = true,
}: ViewDensityControlProps) {
  const availableModes = getAvailableViewDensityModes(testViewEnabled);
  return (
    <div
      className="inline-flex rounded-lg border border-outline bg-surface p-1 shadow-sm"
      role="radiogroup"
      aria-label="View density"
    >
      {availableModes.map((mode) => {
        const active = mode === value;
        const label = MODE_LABELS[mode];

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} view`}
            title={`${label} view`}
            onClick={() => onChange(mode)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-page hover:text-ink"
            }`}
          >
            <ModeIcon mode={mode} />
          </button>
        );
      })}
    </div>
  );
}
