import { ImageGrid } from "./ImageGrid";
import type { ImageDisplayGroup } from "@/lib/image-generation-types";

interface ProviderImageGroupsProps {
  groups: ImageDisplayGroup[];
  onImageClick?: (index: number) => void;
}

export function ProviderImageGroups({ groups, onImageClick }: ProviderImageGroupsProps) {
  const offsets = groups.map((_, groupIndex) => groups
    .slice(0, groupIndex)
    .reduce((total, group) => total + group.imageUrls.length, 0));

  return (
    <div className="space-y-8">
      {groups.map((group, groupIndex) => (
          <section key={group.id} className="w-full animate-fade-in-up">
            {group.imageUrls.length > 0 && (
              <ImageGrid
                title={group.label}
                imageUrls={group.imageUrls}
                onImageClick={onImageClick
                  ? (index) => onImageClick(offsets[groupIndex] + index)
                  : undefined}
              />
            )}
            {group.status === "failed" && (
              <div className="rounded-lg border border-outline bg-surface p-4">
                {group.imageUrls.length === 0 && (
                  <h2 className="text-xl font-semibold text-ink mb-2">{group.label}</h2>
                )}
                <p className="text-sm text-ink-muted">
                  {group.error || `${group.label} image generation failed.`}
                </p>
              </div>
            )}
          </section>
      ))}
    </div>
  );
}
