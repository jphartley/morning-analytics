interface RegenerateButtonProps {
  onClick: () => void;
  isRegenerating: boolean;
  imageCount: number;
  maxImages: number;
  requiredCapacity?: number;
}

export function canRegenerateImages(
  imageCount: number,
  maxImages: number,
  requiredCapacity: number
): boolean {
  return imageCount + requiredCapacity <= maxImages;
}

export function RegenerateButton({
  onClick,
  isRegenerating,
  imageCount,
  maxImages,
  requiredCapacity = 4,
}: RegenerateButtonProps) {
  const capReached = !canRegenerateImages(imageCount, maxImages, requiredCapacity);
  const disabled = isRegenerating || capReached;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 rounded-lg border border-outline bg-surface text-ink hover:bg-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isRegenerating ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-ink-muted border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "Regenerate Images"
        )}
      </button>
      {capReached && (
        <p className="text-sm text-ink-muted">
          {requiredCapacity === 8
            ? `Dual mode needs 8 available image slots (maximum ${maxImages}).`
            : `Not enough room for 4 more images (maximum ${maxImages}).`}
        </p>
      )}
    </div>
  );
}
