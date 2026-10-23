import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDeploymentImageProviderId,
  resolveImageGenerationSelection,
  resolveImageProvider,
} from "./registry";

afterEach(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "");
  vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "false");
});

describe("image provider resolution", () => {
  it("ignores the retired public default with and without a canonical setting", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "midjourney");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_PROVIDER", "mock");

    expect(getDeploymentImageProviderId()).toBe("midjourney");
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "");
    expect(getDeploymentImageProviderId()).toBe("midjourney");
  });

  it("rejects unknown providers", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "unknown-provider");

    expect(() => resolveImageProvider()).toThrow(/Unsupported image provider/);
  });

  it("authorizes an override by the server gate alone, in any view mode", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "midjourney");
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "false");
    expect(() => resolveImageProvider({ override: "mock" })).toThrow(/disabled/);

    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
    expect(resolveImageProvider({ override: "mock" }).id).toBe("mock");
  });

  it("does not validate configuration belonging to an unselected provider", () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "mock");
    vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "");

    expect(resolveImageProvider().id).toBe("mock");
  });

  it("keeps dual outside the provider registry and requires every server gate", () => {
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
    vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "false");

    expect(() => resolveImageProvider({ override: "dual" })).toThrow(/Unsupported/);
    expect(() => resolveImageGenerationSelection({ override: "dual" })).toThrow(/disabled/);

    vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "true");
    vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "black-forest-labs");

    const resolved = resolveImageGenerationSelection({ override: "dual" });
    expect(resolved.selection).toBe("dual");
    expect(resolved.providers.map((provider) => provider.id)).toEqual([
      "black-forest-labs",
      "midjourney",
    ]);
  });

  it("still rejects an override when the server gate is off", () => {
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "false");
    expect(() => resolveImageGenerationSelection({ override: "black-forest-labs" })).toThrow(
      /disabled/
    );
  });

  it.each([undefined, "", "unknown", "mock", "midjourney"])(
    "keeps BFL and Dual dormant with candidate %s even when old flags are on",
    (candidate) => {
      vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", candidate);
      vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
      vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "true");
      vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "");
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      expect(() => resolveImageGenerationSelection({ override: "black-forest-labs" })).toThrow(/disabled/);
      expect(() => resolveImageGenerationSelection({ override: "dual" })).toThrow(/TRIAL_CANDIDATE/);
      vi.stubEnv("IMAGE_GENERATION_PROVIDER", "black-forest-labs");
      expect(() => resolveImageGenerationSelection()).toThrow(/disabled/);
      for (const id of ["midjourney", "mock"]) {
        vi.stubEnv("IMAGE_GENERATION_PROVIDER", id);
        expect(resolveImageProvider().id).toBe(id);
      }
      expect(fetch).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    }
  );

  it("enables BFL only when explicitly configured and authorized, without reading its key", () => {
    vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "black-forest-labs");
    vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "");
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "black-forest-labs");
    expect(() => resolveImageProvider()).toThrow(/disabled/);
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
    expect(resolveImageProvider().id).toBe("black-forest-labs");
    expect(resolveImageProvider({ override: "black-forest-labs" }).id).toBe("black-forest-labs");
  });
});
