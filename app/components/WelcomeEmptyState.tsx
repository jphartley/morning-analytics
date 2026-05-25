const steps = [
  {
    title: "Write or paste",
    description: "Bring in your morning pages when you are ready to reflect.",
  },
  {
    title: "Receive analysis",
    description: "Get an AI-powered psychoanalytic reading of the themes in your writing.",
  },
  {
    title: "See images",
    description: "Receive four artistic images inspired by what you wrote.",
  },
];

export function WelcomeEmptyState() {
  return (
    <section
      aria-label="Welcome guide"
      className="rounded-lg border border-outline bg-surface px-4 py-4 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Welcome to Morning Analytics</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          Start with a few pages, then let the app turn your writing into reflection and imagery.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
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
