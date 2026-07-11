"use client";

import type { ImageProviderId } from "@/lib/image-providers/types";

interface ImageProviderPickerProps {
  value: ImageProviderId;
  defaultProvider: ImageProviderId;
  onChange: (provider: ImageProviderId) => void;
}

const PROVIDER_OPTIONS: Array<{ id: ImageProviderId; label: string }> = [
  { id: "mock", label: "Mock" },
  { id: "midjourney", label: "Midjourney / Discord" },
  { id: "black-forest-labs", label: "Black Forest Labs" },
];

export function ImageProviderPicker({ value, defaultProvider, onChange }: ImageProviderPickerProps) {
  return (
    <select
      aria-label="Image provider"
      className="h-[42px] rounded-lg border border-outline bg-surface px-3 text-sm font-medium text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      value={value}
      onChange={(event) => onChange(event.target.value as ImageProviderId)}
    >
      {PROVIDER_OPTIONS.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.label}{provider.id === defaultProvider ? " ✓ default" : ""}
        </option>
      ))}
    </select>
  );
}
