"use client";

import type { ImageProviderId } from "@/lib/image-providers/types";
import type { ImageGenerationSelection } from "@/lib/image-generation-types";
import { imageProviderLabel } from "@/lib/image-generation-types";

interface ImageProviderPickerProps {
  value: ImageGenerationSelection;
  defaultProvider: ImageProviderId;
  dualModeEnabled: boolean;
  trialCandidate: ImageProviderId;
  onChange: (provider: ImageGenerationSelection) => void;
}

const PROVIDER_OPTIONS: Array<{ id: ImageProviderId; label: string }> = [
  { id: "mock", label: "Mock" },
  { id: "midjourney", label: "Midjourney / Discord" },
];

export function getImageProviderOptions(dualModeEnabled: boolean, trialCandidate: ImageProviderId | null = null): Array<{
  id: ImageGenerationSelection;
  label: string;
}> {
  if (!trialCandidate) return [];
  const providers = [...PROVIDER_OPTIONS, { id: trialCandidate, label: imageProviderLabel(trialCandidate) }];
  return dualModeEnabled ? [...providers, { id: "dual", label: "Dual mode" }] : providers;
}

export function ImageProviderPicker({
  value,
  defaultProvider,
  dualModeEnabled,
  trialCandidate,
  onChange,
}: ImageProviderPickerProps) {
  const options = getImageProviderOptions(dualModeEnabled, trialCandidate);

  return (
    <select
      aria-label="Image provider"
      className="h-[42px] rounded-lg border border-outline bg-surface px-3 text-sm font-medium text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      value={value}
      onChange={(event) => onChange(event.target.value as ImageGenerationSelection)}
    >
      {options.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.label}{provider.id === defaultProvider ? " ✓ default" : ""}
        </option>
      ))}
    </select>
  );
}
