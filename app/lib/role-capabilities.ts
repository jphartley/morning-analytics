import { DEFAULT_MODEL_ID } from "@/lib/models";
import type { ImageGenerationSelection } from "@/lib/image-generation-types";
import type { ImageProviderId } from "@/lib/image-providers/types";
import type { ViewDensityMode } from "@/lib/top-bar-presets";

export const APPLICATION_ROLES = ["user", "admin"] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

export interface RoleCapabilities {
  role: ApplicationRole;
  availableViewModes: ViewDensityMode[];
  defaultViewMode: ViewDensityMode;
  modelId: string;
  contextualMemoryEnabled: boolean;
  canUseMemoryExperiments: boolean;
  canSelectModel: boolean;
  canUseProviderOverrides: boolean;
}

export function parseApplicationRole(value: unknown): ApplicationRole {
  return value === "admin" ? "admin" : "user";
}

export function resolveRoleCapabilities(
  role: ApplicationRole,
  testViewEnabled: boolean
): RoleCapabilities {
  if (role === "admin") {
    return {
      role,
      availableViewModes: testViewEnabled ? ["quiet", "insight", "test"] : ["quiet", "insight"],
      defaultViewMode: "insight",
      modelId: DEFAULT_MODEL_ID,
      contextualMemoryEnabled: true,
      canUseMemoryExperiments: testViewEnabled,
      canSelectModel: true,
      canUseProviderOverrides: true,
    };
  }

  return {
    role,
    availableViewModes: ["quiet", "insight"],
    defaultViewMode: "quiet",
    modelId: DEFAULT_MODEL_ID,
    contextualMemoryEnabled: false,
    canUseMemoryExperiments: false,
    canSelectModel: false,
    canUseProviderOverrides: false,
  };
}

export function resolveImageProviderOverride(
  capabilities: RoleCapabilities,
  selectedProvider: ImageGenerationSelection,
  defaultProvider: ImageProviderId,
  providerOverrideEnabled: boolean
): string | null {
  if (
    !capabilities.canUseProviderOverrides ||
    !providerOverrideEnabled ||
    selectedProvider === defaultProvider
  ) {
    return null;
  }

  return selectedProvider;
}
