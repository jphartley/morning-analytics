export type ImageGenerationDiagnosticStatus = "info" | "success" | "warning" | "error";

export type ImageGenerationDiagnosticMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ImageGenerationDiagnosticEvent {
  at: string;
  stage: string;
  status: ImageGenerationDiagnosticStatus;
  message: string;
  metadata?: ImageGenerationDiagnosticMetadata;
}

export interface ImageGenerationDiagnostics {
  attemptId: string;
  provider: "midjourney" | "mock";
  startedAt: string;
  completedAt?: string;
  status: "running" | "success" | "warning" | "error";
  summary: string;
  events: ImageGenerationDiagnosticEvent[];
}

export interface ImageGenerationDiagnosticsRecorder {
  attemptId: string;
  provider: "midjourney" | "mock";
  startedAt: Date;
  add: (
    stage: string,
    status: ImageGenerationDiagnosticStatus,
    message: string,
    metadata?: ImageGenerationDiagnosticMetadata
  ) => void;
  complete: (status: ImageGenerationDiagnostics["status"], summary: string) => ImageGenerationDiagnostics;
  snapshot: (summary?: string) => ImageGenerationDiagnostics;
}

const MAX_METADATA_STRING_LENGTH = 140;

function sanitizeMetadataValue(
  value: string | number | boolean | null | undefined
): string | number | boolean | null | undefined {
  if (typeof value !== "string") {
    return value;
  }

  if (value.includes("discordapp.com") || value.includes("discord.com/api")) {
    return "[redacted-url]";
  }

  if (value.length > MAX_METADATA_STRING_LENGTH) {
    return `${value.slice(0, MAX_METADATA_STRING_LENGTH)}...`;
  }

  return value;
}

function sanitizeMetadata(
  metadata?: ImageGenerationDiagnosticMetadata
): ImageGenerationDiagnosticMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, sanitizeMetadataValue(value)])
  );
}

function simpleHash(value: string): string {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
}

export function redactId(value: string | undefined | null): string {
  if (!value) {
    return "unset";
  }

  if (value.length <= 6) {
    return "***";
  }

  return `***${value.slice(-6)}`;
}

export function describePrompt(prompt: string): ImageGenerationDiagnosticMetadata {
  const normalized = prompt.trim().replace(/\s+/g, " ");
  return {
    promptLength: normalized.length,
    promptHash: simpleHash(normalized),
    promptSnippet: normalized.length > 48 ? `${normalized.slice(0, 48)}...` : normalized,
  };
}

export function createImageGenerationDiagnosticsRecorder(
  attemptId: string,
  provider: "midjourney" | "mock"
): ImageGenerationDiagnosticsRecorder {
  const startedAt = new Date();
  const events: ImageGenerationDiagnosticEvent[] = [];
  let completedAt: string | undefined;
  let finalStatus: ImageGenerationDiagnostics["status"] = "running";
  let finalSummary = "Image generation is running.";

  const snapshot = (summary?: string): ImageGenerationDiagnostics => ({
    attemptId,
    provider,
    startedAt: startedAt.toISOString(),
    completedAt,
    status: finalStatus,
    summary: summary || finalSummary,
    events: [...events],
  });

  return {
    attemptId,
    provider,
    startedAt,
    add: (stage, status, message, metadata) => {
      events.push({
        at: new Date().toISOString(),
        stage,
        status,
        message,
        metadata: sanitizeMetadata(metadata),
      });
    },
    complete: (status, summary) => {
      finalStatus = status;
      finalSummary = summary;
      completedAt = new Date().toISOString();
      return snapshot(summary);
    },
    snapshot,
  };
}
