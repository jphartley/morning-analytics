import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import {
  parseApplicationRole,
  resolveImageProviderOverride,
  resolveRoleCapabilities,
} from "@/lib/role-capabilities";

describe("application role capabilities", () => {
  it("parses only admin as privileged and fails invalid profile values closed", () => {
    expect(parseApplicationRole("admin")).toBe("admin");
    expect(parseApplicationRole("user")).toBe("user");
    expect(parseApplicationRole("owner")).toBe("user");
    expect(parseApplicationRole(null)).toBe("user");
  });

  it("gives normal users the safe defaults and no experimental capabilities", () => {
    const capabilities = resolveRoleCapabilities("user", true);

    expect(capabilities.availableViewModes).toEqual(["quiet", "insight"]);
    expect(capabilities.defaultViewMode).toBe("quiet");
    expect(capabilities.modelId).toBe(DEFAULT_MODEL_ID);
    expect(capabilities.contextualMemoryEnabled).toBe(false);
    expect(capabilities.canSelectModel).toBe(false);
    expect(capabilities.canUseProviderOverrides).toBe(false);
  });

  it("retains administrator options while honoring the Test-view flag", () => {
    expect(resolveRoleCapabilities("admin", true).availableViewModes)
      .toEqual(["quiet", "insight", "test"]);
    expect(resolveRoleCapabilities("admin", false).availableViewModes)
      .toEqual(["quiet", "insight"]);
    expect(resolveRoleCapabilities("admin", false).contextualMemoryEnabled).toBe(true);
  });

  it("never sends a normal-user provider override", () => {
    expect(resolveImageProviderOverride(
      resolveRoleCapabilities("user", true),
      "dual",
      "midjourney",
      true
    )).toBeNull();

    expect(resolveImageProviderOverride(
      resolveRoleCapabilities("admin", true),
      "dual",
      "midjourney",
      true
    )).toBe("dual");
  });
});
