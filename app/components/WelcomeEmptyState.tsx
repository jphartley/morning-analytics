"use client";

const steps = [
  {
    label: "1",
    title: "Write or paste",
    description: "Add your morning pages when you are ready.",
  },
  {
    label: "2",
    title: "Receive analysis",
    description: "Get an AI-powered psychoanalytic reading of the themes in your writing.",
  },
  {
    label: "3",
    title: "See images",
    description: "Receive 4 artistic images inspired by the entry.",
  },
];

export function WelcomeEmptyState() {
  return (
    <section
      className="rounded-lg border border-outline bg-surface px-4 py-4 text-ink shadow-sm"
      aria-label="Welcome guide"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-ink">Welcome to Morning Analytics</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          A short flow turns your morning pages into insight and imagery.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {step.label}
            </span>
            <div>
              <h3 className="text-sm font-medium text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
