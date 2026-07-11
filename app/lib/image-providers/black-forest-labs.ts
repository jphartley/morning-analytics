import { redactId } from "@/lib/image-generation-diagnostics";
import type {
  GenerateImageSetRequest,
  GeneratedImageSet,
  ImageProvider,
  ImageProviderErrorCode,
} from "./types";
import { ImageProviderError } from "./types";

type BflOutputFormat = "jpeg" | "png";
type BflUrlKind = "api" | "delivery";

interface BflConfig {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  width: number;
  height: number;
  outputFormat: BflOutputFormat;
  pollingIntervalMs: number;
  timeoutMs: number;
  maxRetries: number;
}

interface BflSubmission {
  id?: string;
  polling_url?: string;
  cost?: number;
  input_mp?: number;
  output_mp?: number;
}

interface BflPollResult {
  id?: string;
  status?: string;
  result?: {
    sample?: string;
  } | null;
  progress?: number | null;
}

interface BflSlotResult {
  slot: number;
  requestId: string;
  dataUrl: string;
}

const DOCUMENTED_API_HOSTS = new Set([
  "api.bfl.ai",
  "api.eu.bfl.ai",
  "api.us.bfl.ai",
]);

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ImageProviderError(
      "configuration",
      `${name} must be a positive integer.`
    );
  }

  return value;
}

function getBflConfig(): BflConfig {
  const apiKey = process.env.BLACK_FOREST_LABS_API_KEY;
  if (!apiKey || apiKey.startsWith("placeholder")) {
    throw new ImageProviderError(
      "configuration",
      "BLACK_FOREST_LABS_API_KEY is not configured."
    );
  }

  const apiBaseUrl = (process.env.BLACK_FOREST_LABS_API_BASE_URL || "https://api.eu.bfl.ai/v1")
    .replace(/\/$/, "");
  assertAllowedBflUrl(apiBaseUrl, "api");

  const outputFormat = process.env.BLACK_FOREST_LABS_OUTPUT_FORMAT || "jpeg";
  if (outputFormat !== "jpeg" && outputFormat !== "png") {
    throw new ImageProviderError(
      "configuration",
      "BLACK_FOREST_LABS_OUTPUT_FORMAT must be jpeg or png."
    );
  }

  return {
    apiKey,
    apiBaseUrl,
    model: process.env.BLACK_FOREST_LABS_MODEL || "flux-2-pro",
    width: readPositiveInteger("BLACK_FOREST_LABS_IMAGE_WIDTH", 1024),
    height: readPositiveInteger("BLACK_FOREST_LABS_IMAGE_HEIGHT", 1024),
    outputFormat,
    pollingIntervalMs: readPositiveInteger("BLACK_FOREST_LABS_POLL_INTERVAL_MS", 1000),
    timeoutMs: readPositiveInteger("BLACK_FOREST_LABS_TIMEOUT_MS", 90000),
    maxRetries: readPositiveInteger("BLACK_FOREST_LABS_MAX_RETRIES", 3),
  };
}

export function isAllowedBflUrl(value: string, kind: BflUrlKind): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) {
      return false;
    }

    if (kind === "api") {
      return DOCUMENTED_API_HOSTS.has(url.hostname)
        || /^api\.(?:eu|us)\d+\.bfl\.ai$/i.test(url.hostname);
    }

    return /^delivery(?:[.-][a-z0-9-]+)*\.bfl\.ai$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function assertAllowedBflUrl(value: string, kind: BflUrlKind): URL {
  if (!isAllowedBflUrl(value, kind)) {
    throw new ImageProviderError(
      "invalid-response",
      `Black Forest Labs returned an unexpected ${kind} URL.`
    );
  }

  return new URL(value);
}

function providerErrorFromStatus(status: number): ImageProviderError {
  if (status === 401 || status === 403) {
    return new ImageProviderError(
      "authentication",
      "Black Forest Labs credentials were rejected."
    );
  }
  if (status === 402) {
    return new ImageProviderError(
      "insufficient-credits",
      "Black Forest Labs credits are insufficient."
    );
  }
  if (status === 429) {
    return new ImageProviderError(
      "rate-limited",
      "Black Forest Labs rate limit was reached.",
      true
    );
  }
  if (status >= 500) {
    return new ImageProviderError(
      "unavailable",
      `Black Forest Labs is unavailable (HTTP ${status}).`,
      true
    );
  }

  return new ImageProviderError(
    "invalid-response",
    `Black Forest Labs rejected the request (HTTP ${status}).`
  );
}

function retryDelayMs(response: Response | null, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 10000);
    }
  }

  return Math.min(500 * 2 ** (attempt - 1), 5000);
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new ImageProviderError("timeout", "Black Forest Labs generation timed out."));
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchWithRetry(
  url: URL,
  init: RequestInit,
  config: BflConfig,
  errorContext: "provider" | "download",
  signal: AbortSignal,
  onRetry: (attempt: number, status?: number) => void
): Promise<Response> {
  let lastError: ImageProviderError | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    let response: Response | null = null;
    try {
      response = await fetch(url, { ...init, signal });
      if (response.ok) {
        return response;
      }

      lastError = errorContext === "download"
        ? new ImageProviderError(
          "download-failed",
          `Black Forest Labs image download failed with HTTP ${response.status}.`,
          response.status === 408 || response.status === 429 || response.status >= 500
        )
        : providerErrorFromStatus(response.status);
      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError;
      }
    } catch (error) {
      if (signal.aborted) {
        throw new ImageProviderError("timeout", "Black Forest Labs generation timed out.");
      }

      if (error instanceof ImageProviderError) {
        lastError = error;
        if (!error.retryable || attempt === config.maxRetries) {
          throw error;
        }
      } else {
        lastError = new ImageProviderError(
          errorContext === "download" ? "download-failed" : "unavailable",
          "Black Forest Labs request failed during transport.",
          true
        );
        if (attempt === config.maxRetries) {
          throw lastError;
        }
      }
    }

    onRetry(attempt, response?.status);
    await wait(retryDelayMs(response, attempt), signal);
  }

  throw lastError || new ImageProviderError("unavailable", "Black Forest Labs request failed.");
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    throw new ImageProviderError(
      "invalid-response",
      "Black Forest Labs returned invalid JSON."
    );
  }
}

function seedForSlot(attemptId: string, slot: number): number {
  let hash = 2166136261;
  const value = `${attemptId}:${slot}`;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function generateSlot(
  slot: number,
  request: GenerateImageSetRequest,
  config: BflConfig,
  signal: AbortSignal
): Promise<BflSlotResult> {
  const seed = seedForSlot(request.attemptId, slot);
  const submitUrl = assertAllowedBflUrl(`${config.apiBaseUrl}/${config.model}`, "api");

  request.diagnostics.add("provider-submit", "info", "Submitting Black Forest Labs image slot.", {
    slot,
    model: config.model,
    width: config.width,
    height: config.height,
    seed,
  });

  const submitResponse = await fetchWithRetry(
    submitUrl,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        width: config.width,
        height: config.height,
        seed,
        output_format: config.outputFormat,
        safety_tolerance: 2,
      }),
    },
    config,
    "provider",
    signal,
    (attempt, status) => request.diagnostics.add(
      "provider-submit",
      "warning",
      "Retrying Black Forest Labs submission.",
      { slot, attempt, status }
    )
  );

  const submission = await readJson<BflSubmission>(submitResponse);
  if (!submission.id || !submission.polling_url) {
    throw new ImageProviderError(
      "invalid-response",
      "Black Forest Labs submission did not include a request ID and polling URL."
    );
  }

  const pollingUrl = assertAllowedBflUrl(submission.polling_url, "api");
  request.diagnostics.add("provider-submit", "success", "Black Forest Labs accepted image slot.", {
    slot,
    requestId: redactId(submission.id),
    costCredits: submission.cost,
    outputMegapixels: submission.output_mp,
  });

  let lastStatus = "";
  let deliveryUrl: URL | null = null;

  while (!signal.aborted) {
    const pollResponse = await fetchWithRetry(
      pollingUrl,
      {
        headers: {
          accept: "application/json",
          "x-key": config.apiKey,
        },
      },
      config,
      "provider",
      signal,
      (attempt, status) => request.diagnostics.add(
        "provider-wait",
        "warning",
        "Retrying Black Forest Labs status check.",
        { slot, attempt, status, requestId: redactId(submission.id) }
      )
    );
    const pollResult = await readJson<BflPollResult>(pollResponse);
    const status = pollResult.status;
    if (!status) {
      throw new ImageProviderError(
        "invalid-response",
        "Black Forest Labs status response did not include a status."
      );
    }

    if (status !== lastStatus) {
      request.diagnostics.add("provider-wait", "info", "Black Forest Labs image slot status changed.", {
        slot,
        requestId: redactId(submission.id),
        providerStatus: status,
        progress: pollResult.progress,
      });
      lastStatus = status;
    }

    if (status === "Ready") {
      if (!pollResult.result?.sample) {
        throw new ImageProviderError(
          "invalid-response",
          "Black Forest Labs ready response did not include an image URL."
        );
      }
      deliveryUrl = assertAllowedBflUrl(pollResult.result.sample, "delivery");
      break;
    }

    if (status === "Request Moderated" || status === "Content Moderated") {
      throw new ImageProviderError(
        "moderated",
        "Black Forest Labs moderated the image request."
      );
    }

    if (status === "Error" || status === "Failed" || status === "Task not found") {
      throw new ImageProviderError(
        "unavailable",
        `Black Forest Labs generation ended with status: ${status}.`
      );
    }

    await wait(config.pollingIntervalMs, signal);
  }

  if (!deliveryUrl) {
    throw new ImageProviderError("timeout", "Black Forest Labs generation timed out.");
  }

  request.diagnostics.add("provider-download", "info", "Downloading Black Forest Labs image slot.", {
    slot,
    requestId: redactId(submission.id),
  });

  const downloadResponse = await fetchWithRetry(
    deliveryUrl,
    { headers: { accept: "image/jpeg,image/png" } },
    config,
    "download",
    signal,
    (attempt, status) => request.diagnostics.add(
      "provider-download",
      "warning",
      "Retrying Black Forest Labs image download.",
      { slot, attempt, status, requestId: redactId(submission.id) }
    )
  );

  const contentType = (downloadResponse.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== "image/jpeg" && contentType !== "image/png") {
    throw new ImageProviderError(
      "download-failed",
      `Black Forest Labs returned unsupported image content type: ${contentType || "missing"}.`
    );
  }

  const bytes = Buffer.from(await downloadResponse.arrayBuffer());
  if (bytes.length === 0) {
    throw new ImageProviderError(
      "download-failed",
      "Black Forest Labs returned an empty image."
    );
  }

  request.diagnostics.add("provider-download", "success", "Downloaded Black Forest Labs image slot.", {
    slot,
    requestId: redactId(submission.id),
    contentType,
    bytes: bytes.length,
  });

  return {
    slot,
    requestId: submission.id,
    dataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
  };
}

function errorCode(error: unknown): ImageProviderErrorCode {
  return error instanceof ImageProviderError ? error.code : "unavailable";
}

export const blackForestLabsImageProvider: ImageProvider = {
  id: "black-forest-labs",
  async generateImageSet(request): Promise<GeneratedImageSet> {
    if (request.count !== 4) {
      throw new ImageProviderError(
        "configuration",
        "Black Forest Labs generation requires exactly four output images."
      );
    }

    const config = getBflConfig();
    const timeoutSignal = AbortSignal.timeout(config.timeoutMs);
    const signal = request.signal
      ? AbortSignal.any([request.signal, timeoutSignal])
      : timeoutSignal;

    request.diagnostics.add("provider-submit", "info", "Starting Black Forest Labs image set.", {
      model: config.model,
      imageCount: request.count,
      width: config.width,
      height: config.height,
    });

    const settled = await Promise.allSettled(
      Array.from({ length: request.count }, (_, slot) => generateSlot(slot, request, config, signal))
    );
    const successes = settled
      .filter((result): result is PromiseFulfilledResult<BflSlotResult> => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((a, b) => a.slot - b.slot);
    const failures = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    const failureCounts = failures.reduce<Record<string, number>>((counts, result) => {
      const code = errorCode(result.reason);
      counts[code] = (counts[code] || 0) + 1;
      return counts;
    }, {});

    if (successes.length !== request.count) {
      request.diagnostics.add("provider-result", "error", "Black Forest Labs image set was incomplete.", {
        expectedCount: request.count,
        successfulCount: successes.length,
        failedCount: failures.length,
        moderatedCount: failureCounts.moderated || 0,
        timedOutCount: failureCounts.timeout || 0,
        rateLimitedCount: failureCounts["rate-limited"] || 0,
      });

      const providerFailures = failures
        .map((failure) => failure.reason)
        .filter((reason): reason is ImageProviderError => reason instanceof ImageProviderError);
      const failureCodes = new Set(providerFailures.map((failure) => failure.code));
      if (
        successes.length === 0
        && providerFailures.length === failures.length
        && failureCodes.size === 1
      ) {
        throw providerFailures[0];
      }
      throw new ImageProviderError(
        "incomplete-set",
        `Black Forest Labs generated ${successes.length} of ${request.count} required images.`
      );
    }

    request.diagnostics.add("provider-result", "success", "Black Forest Labs image set completed.", {
      imageCount: successes.length,
      model: config.model,
    });

    return {
      provider: "black-forest-labs",
      model: config.model,
      imageDataUrls: successes.map((result) => result.dataUrl),
      providerRequestIds: successes.map((result) => result.requestId),
    };
  },
};
