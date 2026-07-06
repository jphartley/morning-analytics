"use client";

import { useMemo, useState } from "react";
import { ImageGenerationDiagnostics } from "@/lib/image-generation-diagnostics";

interface ImageGenerationDiagnosticsDisclosureProps {
  diagnostics: ImageGenerationDiagnostics | null;
  statusMessage?: string | null;
  pendingStartedAt?: number | null;
  pendingElapsedSeconds?: number | null;
}

type DiagnosticEvent = ImageGenerationDiagnostics["events"][number];
type CopyState = "idle" | "copied" | "failed";

function formatMetadata(metadata: NonNullable<ImageGenerationDiagnostics["events"][number]["metadata"]>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

function statusSummary(status: ImageGenerationDiagnostics["status"]): {
  icon: string;
  label: string;
  summaryLabel: string;
} {
  switch (status) {
    case "success":
      return { icon: "✅", label: "completed", summaryLabel: "Image generation completed" };
    case "warning":
      return { icon: "⚠️", label: "needs attention", summaryLabel: "Image generation needs attention" };
    case "error":
      return { icon: "🛑", label: "failed", summaryLabel: "Image generation failed" };
    default:
      return { icon: "⏳", label: "running", summaryLabel: "Image generation is running" };
  }
}

function describeEvent(event: DiagnosticEvent): string {
  const reason = event.metadata?.reason;

  if (event.stage === "trigger" && event.status === "info") {
    return "The app is sending the image prompt to Discord as a Midjourney /imagine request.";
  }

  if (event.stage === "trigger" && event.status === "success") {
    return "Discord accepted the prompt, so Midjourney should now start generating.";
  }

  if (event.stage === "trigger" && event.status === "error") {
    return "Discord did not accept the prompt, so Midjourney never received this request.";
  }

  if (event.stage === "listener" && event.message.includes("Connecting Discord bot")) {
    return "The app is connecting its Discord bot so it can watch for the Midjourney result.";
  }

  if (event.stage === "listener" && event.message.includes("Discord bot connected")) {
    return "The Discord bot connected successfully and can see events from Discord.";
  }

  if (event.stage === "listener" && event.message.includes("Listening for Midjourney completion")) {
    return "The app is watching the configured Discord channel for the final Midjourney image grid.";
  }

  if (event.stage === "listener" && event.message.includes("Rejected Discord message candidate")) {
    if (reason === "midjourney-still-progressing" || reason === "not-completed-grid-shape") {
      return "Midjourney sent a progress update, but it did not look like the final four-image grid yet, so the app ignored it.";
    }

    return "The app saw a Discord message but decided it was not the completed Midjourney grid for this request.";
  }

  if (event.stage === "listener" && event.message.includes("Captured completed Midjourney grid")) {
    return "The app found the completed Midjourney grid in Discord and is ready to download it.";
  }

  if (event.stage === "recovery" && event.message.includes("Running bounded recovery")) {
    return "The app is doing a backup check in recent Discord history in case the live event was missed.";
  }

  if (event.stage === "recovery" && event.message.includes("Inspecting recent Discord messages")) {
    return "The backup check is scanning recent messages in the generation channel.";
  }

  if (event.stage === "recovery" && event.message.includes("Inspecting tracked Midjourney progress messages")) {
    return "The backup check is refetching the exact Midjourney progress message in case it was edited into the final grid.";
  }

  if (event.stage === "recovery" && event.message.includes("Tracked Midjourney progress messages are not completed")) {
    return "The tracked Midjourney message still looks like a progress update, so the app is continuing to wait.";
  }

  if (event.stage === "recovery" && event.message.includes("Using tracked Midjourney grid")) {
    return "The backup check found the completed grid by refetching the earlier progress message.";
  }

  if (event.stage === "recovery" && event.message.includes("No matching completed Midjourney grid")) {
    return "The backup check did not find the completed grid yet. The live listener can still catch it if it arrives.";
  }

  if (event.stage === "recovery" && event.message.includes("Using recovered Midjourney grid")) {
    return "The backup check found a completed grid in recent Discord history and used that result.";
  }

  if (event.stage === "image-fetch" && event.status === "info") {
    return "The app is downloading the completed grid image from Discord.";
  }

  if (event.stage === "image-fetch" && event.status === "success") {
    return "The grid image downloaded successfully.";
  }

  if (event.stage === "image-split" && event.message.includes("Read Midjourney grid dimensions")) {
    return "The app read the grid size so it knows how to cut it into four images.";
  }

  if (event.stage === "image-split" && event.status === "success") {
    return "The app split the Midjourney grid into four separate images.";
  }

  if (event.stage === "upload" && event.status === "info") {
    return "The app is uploading the generated images to Supabase Storage.";
  }

  if (event.stage === "upload" && event.message.includes("Uploaded image")) {
    return "One generated image was uploaded successfully.";
  }

  if (event.stage === "upload" && event.message.includes("All split images uploaded")) {
    return "All generated images were uploaded and are ready for the app to show.";
  }

  if (event.status === "error") {
    return "This step failed. The technical details below may explain where it got stuck.";
  }

  if (event.status === "warning") {
    return "This step did not fail, but it found something worth checking.";
  }

  return event.message;
}

function formatDiagnosticCopyText(diagnostics: ImageGenerationDiagnostics): string {
  const lines = [
    "Image generation diagnostics",
    "",
    `Attempt: ${diagnostics.attemptId}`,
    `Provider: ${diagnostics.provider}`,
    `Status: ${statusSummary(diagnostics.status).label}`,
    `Summary: ${diagnostics.summary}`,
    `Started: ${new Date(diagnostics.startedAt).toLocaleString()}`,
  ];

  if (diagnostics.completedAt) {
    lines.push(`Completed: ${new Date(diagnostics.completedAt).toLocaleString()}`);
  }

  lines.push("", "Timeline:");

  diagnostics.events.forEach((event, index) => {
    lines.push(
      `${index + 1}. ${new Date(event.at).toLocaleTimeString()} - ${event.stage} / ${event.status}`,
      `   Meaning: ${describeEvent(event)}`,
      `   Raw event: ${event.message}`
    );

    if (event.metadata && Object.keys(event.metadata).length > 0) {
      lines.push(`   Details: ${formatMetadata(event.metadata)}`);
    }
  });

  return lines.join("\n");
}

export function ImageGenerationDiagnosticsDisclosure({
  diagnostics,
  statusMessage,
  pendingStartedAt,
  pendingElapsedSeconds,
}: ImageGenerationDiagnosticsDisclosureProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyText = useMemo(
    () => (diagnostics ? formatDiagnosticCopyText(diagnostics) : ""),
    [diagnostics]
  );

  if (!diagnostics && !statusMessage && !pendingStartedAt) {
    return null;
  }

  if (!diagnostics) {
    return (
      <details className="w-fit text-xs text-ink-muted">
        <summary
          aria-label="Show image generation diagnostics"
          className="inline-flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          title="Image generation is running"
        >
          <span aria-hidden="true">⏳</span>
        </summary>
        <div className="mt-2 min-w-72 max-w-xl rounded-lg border border-outline bg-surface p-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">Image generation is running</p>
          {pendingElapsedSeconds !== null && pendingElapsedSeconds !== undefined && (
            <p className="mt-1">Waiting for {pendingElapsedSeconds} seconds so far.</p>
          )}
          <p className="mt-1">{statusMessage || "The prompt has been sent and the app is waiting for a completed Midjourney grid."}</p>
          <p className="mt-1">
            Detailed server events will appear here after the request succeeds, fails, or times out.
          </p>
        </div>
      </details>
    );
  }

  const showSummary = diagnostics.status !== "success" && (statusMessage || diagnostics.summary);
  const currentStatus = statusSummary(diagnostics.status);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(copyText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <details className="w-fit text-xs text-ink-muted" onToggle={() => setCopyState("idle")}>
      <summary
        aria-label={`Show image generation diagnostics: ${currentStatus.label}`}
        className="inline-flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full text-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        title={currentStatus.summaryLabel}
      >
        <span aria-hidden="true">{currentStatus.icon}</span>
      </summary>

      <div className="mt-2 min-w-72 max-w-3xl rounded-lg border border-outline bg-surface p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-ink">{currentStatus.summaryLabel}</p>
            <p className="mt-1 text-xs text-ink-muted">
              The timeline below explains what the app saw and why each step mattered.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-outline px-2.5 py-1.5 text-xs text-ink-muted hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
              />
            </svg>
            {copyState === "copied" ? "Copied" : "Copy"}
          </button>
        </div>
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
        {copyState === "failed" && (
          <p className="mb-3 text-xs text-ink-muted">
            Copy failed. Select the diagnostic details to copy them manually.
          </p>
        )}
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
              <p className="mt-1 text-sm text-ink">{describeEvent(event)}</p>
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
