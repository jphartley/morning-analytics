"use client";

import { ImageGenerationDiagnostics } from "@/lib/image-generation-diagnostics";

interface ImageGenerationDiagnosticsDisclosureProps {
  diagnostics: ImageGenerationDiagnostics | null;
  statusMessage?: string | null;
  pendingStartedAt?: number | null;
  pendingElapsedSeconds?: number | null;
}

function formatMetadata(metadata: NonNullable<ImageGenerationDiagnostics["events"][number]["metadata"]>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

function statusLabel(status: ImageGenerationDiagnostics["status"]): string {
  switch (status) {
    case "success":
      return "completed";
    case "warning":
      return "needs attention";
    case "error":
      return "failed";
    default:
      return "running";
  }
}

export function ImageGenerationDiagnosticsDisclosure({
  diagnostics,
  statusMessage,
  pendingStartedAt,
  pendingElapsedSeconds,
}: ImageGenerationDiagnosticsDisclosureProps) {
  if (!diagnostics && !statusMessage && !pendingStartedAt) {
    return null;
  }

  if (!diagnostics) {
    return (
      <details className="w-full text-xs text-ink-muted">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm px-1 py-0.5 text-xs text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent">
          <span>Diagnostics</span>
          <span aria-hidden="true">·</span>
          <span>running</span>
          {pendingElapsedSeconds !== null && pendingElapsedSeconds !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{pendingElapsedSeconds}s</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="underline underline-offset-2">show details</span>
        </summary>
        <div className="mt-2 rounded-lg border border-outline bg-surface p-3 text-xs text-ink-muted">
          <p>{statusMessage || "Image generation request is still running."}</p>
          <p className="mt-1">
            Detailed server events will appear here after the request succeeds, fails, or times out.
          </p>
        </div>
      </details>
    );
  }

  const showSummary = diagnostics.status !== "success" && (statusMessage || diagnostics.summary);

  return (
    <details className="w-full text-xs text-ink-muted">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm px-1 py-0.5 text-xs text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent">
        <span>Diagnostics</span>
        <span aria-hidden="true">·</span>
        <span>{statusLabel(diagnostics.status)}</span>
        <span aria-hidden="true">·</span>
        <span className="underline underline-offset-2">show details</span>
      </summary>

      <div className="mt-2 rounded-lg border border-outline bg-surface p-3">
        {showSummary && (
          <p className="mb-3 text-sm text-ink-muted">
            {statusMessage || diagnostics.summary}
          </p>
        )}
        <div className="grid gap-1 text-xs text-ink-muted sm:grid-cols-2">
          <p>Attempt: {diagnostics.attemptId}</p>
          <p>Provider: {diagnostics.provider}</p>
          <p>Started: {new Date(diagnostics.startedAt).toLocaleTimeString()}</p>
          {diagnostics.completedAt && (
            <p>Completed: {new Date(diagnostics.completedAt).toLocaleTimeString()}</p>
          )}
        </div>
        <ol className="mt-3 space-y-2">
          {diagnostics.events.map((event, index) => (
            <li key={`${event.at}-${index}`} className="rounded-md border border-outline bg-page p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-ink">{event.stage}</span>
                <span className="text-xs uppercase text-ink-muted">{event.status}</span>
                <span className="text-xs text-ink-muted">
                  {new Date(event.at).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-ink-muted">{event.message}</p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <p className="mt-2 break-words font-mono text-xs text-ink-muted">
                  {formatMetadata(event.metadata)}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
