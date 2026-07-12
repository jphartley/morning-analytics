import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDeploymentImageProviderId,
  resolveImageGenerationSelection,
  resolveImageProvider,
} from "./registry";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("image provider resolution", () => {
  it("prefers the canonical server setting over the legacy setting", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "black-forest-labs");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_PROVIDER", "mock");

    expect(getDeploymentImageProviderId()).toBe("black-forest-labs");
  });

  it("rejects unknown providers", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "unknown-provider");

    expect(() => resolveImageProvider()).toThrow(/Unsupported image provider/);
  });

  it("requires both test mode and the server gate for an override", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "midjourney");
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "false");
    expect(() => resolveImageProvider({ override: "mock", testMode: true })).toThrow(/disabled/);

    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
    expect(() => resolveImageProvider({ override: "mock", testMode: false })).toThrow(/test mode/);
    expect(resolveImageProvider({ override: "mock", testMode: true }).id).toBe("mock");
  });

  it("does not validate configuration belonging to an unselected provider", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "mock");
    vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "");

    expect(resolveImageProvider().id).toBe("mock");
  });

  it("keeps dual outside the provider registry and requires every server gate", () => {
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
    vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "false");

    expect(() => resolveImageProvider({ override: "dual", testMode: true })).toThrow(/Unsupported/);
    expect(() => resolveImageGenerationSelection({ override: "dual", testMode: true })).toThrow(/disabled/);

    vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "true");
    expect(() => resolveImageGenerationSelection({ override: "dual", testMode: false })).toThrow(/test mode/);

    const resolved = resolveImageGenerationSelection({ override: "dual", testMode: true });
    expect(resolved.selection).toBe("dual");
    expect(resolved.providers.map((provider) => provider.id)).toEqual([
      "black-forest-labs",
      "midjourney",
    ]);
  });
});
