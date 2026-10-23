import { afterEach, expect, it, vi } from "vitest";
import { createImageGenerationDiagnosticsRecorder } from "@/lib/image-generation-diagnostics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("./black-forest-labs");
  vi.doUnmock("./midjourney");
  vi.resetModules();
});

it("loads BFL only when an authorized BFL adapter is invoked", async () => {
  vi.resetModules();
  const loadBfl = vi.fn();
  const generateBfl = vi.fn(async () => ({
    provider: "black-forest-labs" as const, imageDataUrls: [],
  }));
  const generateMidjourney = vi.fn(async () => ({
    provider: "midjourney" as const, imageDataUrls: [],
  }));
  vi.doMock("./black-forest-labs", () => {
    loadBfl();
    return { blackForestLabsImageProvider: { id: "black-forest-labs", generateImageSet: generateBfl } };
  });
  vi.doMock("./midjourney", () => ({
    midjourneyImageProvider: { id: "midjourney", generateImageSet: generateMidjourney },
  }));
  vi.stubEnv("IMAGE_GENERATION_PROVIDER", "midjourney");
  vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "");
  vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
  vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "true");

  const { resolveImageGenerationSelection } = await import("./registry");
  const request = {
    attemptId: "test", prompt: "synthetic", count: 4,
    diagnostics: createImageGenerationDiagnosticsRecorder("test", "midjourney"),
  };
  await resolveImageGenerationSelection().providers[0].provider.generateImageSet(request);
  expect(generateMidjourney).toHaveBeenCalledOnce();
  expect(() => resolveImageGenerationSelection({ override: "black-forest-labs" })).toThrow(/disabled/);
  expect(() => resolveImageGenerationSelection({ override: "dual" })).toThrow(/TRIAL_CANDIDATE/);
  expect(loadBfl).not.toHaveBeenCalled();

  vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "black-forest-labs");
  const candidate = resolveImageGenerationSelection({ override: "dual" }).providers[0];
  expect(loadBfl).not.toHaveBeenCalled();
  await candidate.provider.generateImageSet(request);
  expect(loadBfl).toHaveBeenCalledOnce();
  expect(generateBfl).toHaveBeenCalledWith(request);
});
