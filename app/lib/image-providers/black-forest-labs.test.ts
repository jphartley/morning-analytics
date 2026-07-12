import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createImageGenerationDiagnosticsRecorder } from "@/lib/image-generation-diagnostics";
import { blackForestLabsImageProvider, isAllowedBflUrl } from "./black-forest-labs";
import { ImageProviderError } from "./types";

function jsonResponse(body: unknown, status: number = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function imageResponse(bytes: number[] = [1, 2, 3]): Response {
  return new Response(Uint8Array.from(bytes), {
    status: 200,
    headers: { "content-type": "image/jpeg" },
  });
}

function request(attemptId: string = "attempt-123") {
  return {
    attemptId,
    prompt: "A blue lotus surrounded by precise golden geometry",
    count: 4,
    diagnostics: createImageGenerationDiagnosticsRecorder(attemptId, "black-forest-labs"),
  } as const;
}

function recordedSeeds(input: ReturnType<typeof request>): number[] {
  return input.diagnostics.snapshot().events
    .filter((event) => event.message === "Submitting Black Forest Labs image slot.")
    .map((event) => Number(event.metadata?.seed));
}

function readyFetch(options: { moderatedSlot?: number; invalidDelivery?: boolean } = {}) {
  let submission = 0;
  const pollCounts = new Map<string, number>();

  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (init?.method === "POST") {
      const slot = submission++;
      return jsonResponse({
        id: `request-${slot}`,
        polling_url: `https://api.eu.bfl.ai/v1/get_result?id=request-${slot}`,
        cost: 3,
      });
    }

    if (url.hostname === "api.eu.bfl.ai") {
      const id = url.searchParams.get("id") || "request-0";
      const slot = Number(id.split("-")[1]);
      if (slot === options.moderatedSlot) {
        return jsonResponse({ id, status: "Request Moderated" });
      }
      const polls = (pollCounts.get(id) || 0) + 1;
      pollCounts.set(id, polls);
      return polls === 1
        ? jsonResponse({ id, status: "Pending", progress: 0.5 })
        : jsonResponse({
          id,
          status: "Ready",
          result: {
            sample: options.invalidDelivery
              ? "https://example.com/stolen.jpg?token=secret"
              : `https://delivery.bfl.ai/${id}.jpg?token=secret`,
          },
        });
    }

    if (url.hostname === "delivery.bfl.ai") {
      return imageResponse();
    }

    throw new Error(`Unexpected request host: ${url.hostname}`);
  });
}

async function expectProviderCode(promise: Promise<unknown>, code: string): Promise<void> {
  try {
    await promise;
    throw new Error("Expected provider request to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ImageProviderError);
    expect((error as ImageProviderError).code).toBe(code);
  }
}

beforeEach(() => {
  vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "test-key");
  vi.stubEnv("BLACK_FOREST_LABS_API_BASE_URL", "https://api.eu.bfl.ai/v1");
  vi.stubEnv("BLACK_FOREST_LABS_MODEL", "flux-2-pro");
  vi.stubEnv("BLACK_FOREST_LABS_POLL_INTERVAL_MS", "1");
  vi.stubEnv("BLACK_FOREST_LABS_TIMEOUT_MS", "1000");
  vi.stubEnv("BLACK_FOREST_LABS_MAX_RETRIES", "2");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Black Forest Labs provider", () => {
  it("strictly allowlists API and delivery URLs", () => {
    expect(isAllowedBflUrl("https://api.eu.bfl.ai/v1/get_result?id=1", "api")).toBe(true);
    expect(isAllowedBflUrl("https://api.eu2.bfl.ai/v1/get_result?id=1", "api")).toBe(true);
    expect(isAllowedBflUrl("https://delivery.bfl.ai/image.jpg?token=secret", "delivery")).toBe(true);
    expect(isAllowedBflUrl("http://api.eu.bfl.ai/v1", "api")).toBe(false);
    expect(isAllowedBflUrl("https://api.eu.bfl.ai.evil.example/v1", "api")).toBe(false);
    expect(isAllowedBflUrl("https://api.eu2.bfl.ai.evil.example/v1", "api")).toBe(false);
    expect(isAllowedBflUrl("https://example.com/image.jpg", "delivery")).toBe(false);
  });

  it("polls pending requests to Ready, downloads four images, and preserves slot order", async () => {
    const fetchMock = readyFetch();
    vi.stubGlobal("fetch", fetchMock);
    const input = request();

    const result = await blackForestLabsImageProvider.generateImageSet(input);

    expect(result.imageDataUrls).toHaveLength(4);
    expect(result.imageDataUrls.every((value) => value === "data:image/jpeg;base64,AQID")).toBe(true);
    expect(result.providerRequestIds).toEqual(["request-0", "request-1", "request-2", "request-3"]);
    const serializedDiagnostics = JSON.stringify(input.diagnostics.snapshot());
    expect(serializedDiagnostics).not.toContain("token=secret");
    const seeds = recordedSeeds(input);
    expect(new Set(seeds).size).toBe(4);
  });

  it("derives a different four-seed set for each attempt", async () => {
    vi.stubGlobal("fetch", readyFetch());
    const first = request("attempt-one");
    const second = request("attempt-two");

    await blackForestLabsImageProvider.generateImageSet(first);
    await blackForestLabsImageProvider.generateImageSet(second);

    const firstSeeds = recordedSeeds(first);
    const secondSeeds = recordedSeeds(second);
    expect(firstSeeds).toHaveLength(4);
    expect(secondSeeds).toHaveLength(4);
    expect(new Set([...firstSeeds, ...secondSeeds]).size).toBe(8);
  });

  it("retries a rate-limited submission and then succeeds", async () => {
    const successfulFetch = readyFetch();
    let rateLimited = false;
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (init?.method === "POST" && !rateLimited) {
        rateLimited = true;
        return jsonResponse({}, 429, { "retry-after": "0" });
      }
      return successfulFetch(input, init);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await blackForestLabsImageProvider.generateImageSet(request());
    expect(result.imageDataUrls).toHaveLength(4);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true);
  });

  it("reports a partial moderated set as incomplete without falling back", async () => {
    const fetchMock = readyFetch({ moderatedSlot: 0 });
    vi.stubGlobal("fetch", fetchMock);

    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "incomplete-set");
  });

  it("reports provider-wide moderation clearly", async () => {
    let submission = 0;
    vi.stubGlobal("fetch", vi.fn(async (_input: string | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        const id = `request-${submission++}`;
        return jsonResponse({ id, polling_url: `https://api.eu.bfl.ai/v1/get_result?id=${id}` });
      }
      return jsonResponse({ status: "Request Moderated" });
    }));

    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "moderated");
  });

  it("rejects an unexpected signed delivery host", async () => {
    vi.stubGlobal("fetch", readyFetch({ invalidDelivery: true }));
    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "invalid-response");
  });

  it("reports malformed submission responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: "missing-polling-url" })));
    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "invalid-response");
  });

  it("reports insufficient credits without fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 402)));
    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "insufficient-credits");
  });

  it("reports rejected credentials without fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 401)));
    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "authentication");
  });

  it("reports download failures", async () => {
    const fetchMock = readyFetch();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.hostname === "delivery.bfl.ai") {
        return new Response("not an image", { headers: { "content-type": "text/plain" } });
      }
      return fetchMock(input, init);
    }));
    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "download-failed");
  });

  it("times out bounded polling", async () => {
    vi.stubEnv("BLACK_FOREST_LABS_TIMEOUT_MS", "15");
    let submission = 0;
    vi.stubGlobal("fetch", vi.fn(async (_input: string | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        const id = `request-${submission++}`;
        return jsonResponse({ id, polling_url: `https://api.eu.bfl.ai/v1/get_result?id=${id}` });
      }
      return jsonResponse({ status: "Pending" });
    }));

    await expectProviderCode(blackForestLabsImageProvider.generateImageSet(request()), "timeout");
  });
});
