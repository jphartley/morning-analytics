import { FIRST_USE_COPY } from "@/lib/first-use-copy";

export function WelcomeEmptyState() {
  return (
    <section
      aria-label="Welcome guide"
      className="rounded-lg border border-outline bg-surface px-4 py-4 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{FIRST_USE_COPY.guide.title}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          <strong>{FIRST_USE_COPY.guide.intro}</strong>
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {FIRST_USE_COPY.guide.steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-md bg-accent-soft/60 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
