import { afterEach, describe, expect, it, vi } from "vitest";
import { getImageTrialCandidate, isImageProviderAvailable } from "./availability";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("trial availability and public configuration", () => {
  it.each([undefined, null, "", "unknown", "midjourney", "mock"])(
    "does not authorize candidate %s", (candidate) => {
      expect(getImageTrialCandidate(candidate, true)).toBeNull();
      expect(isImageProviderAvailable("black-forest-labs", null)).toBe(false);
    }
  );

  it("requires the server gate as well as a valid candidate", () => {
    expect(getImageTrialCandidate("black-forest-labs", false)).toBeNull();
    expect(getImageTrialCandidate(" black-forest-labs ", true)).toBe("black-forest-labs");
    expect(isImageProviderAvailable("mock", null)).toBe(true);
    expect(isImageProviderAvailable("midjourney", null)).toBe(true);
  });

  it.each([
    ["", "true", ""],
    ["unknown", "true", ""],
    ["black-forest-labs", "false", ""],
    ["black-forest-labs", "true", "black-forest-labs"],
  ])("derives browser metadata from server candidate %s and gate %s", async (candidate, gate, expected) => {
    vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", candidate);
    vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", gate);
    vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", gate);
    vi.stubEnv("NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", gate === "true" ? "false" : "true");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED", gate === "true" ? "false" : "true");
    const { default: config } = await import("../../next.config");
    expect(config.env?.NEXT_PUBLIC_CONFIGURED_IMAGE_TRIAL_CANDIDATE).toBe(expected);
    expect(config.env?.NEXT_PUBLIC_CONFIGURED_IMAGE_DUAL_MODE_ENABLED).toBe(gate);
  });

  it("ignores the retired public default in browser metadata", async () => {
    vi.stubEnv("IMAGE_GENERATION_PROVIDER", "");
    vi.stubEnv("NEXT_PUBLIC_IMAGE_PROVIDER", "black-forest-labs");
    const { default: config } = await import("../../next.config");
    expect(config.env?.NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER).toBe("midjourney");
  });
});
