interface RegenerateButtonProps {
  onClick: () => void;
  isRegenerating: boolean;
  imageCount: number;
  maxImages: number;
}

export function RegenerateButton({
  onClick,
  isRegenerating,
  imageCount,
  maxImages,
}: RegenerateButtonProps) {
  const capReached = imageCount >= maxImages;
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
          Maximum of {maxImages} images reached
        </p>
      )}
    </div>
  );
}
