/* eslint-disable @next/next/no-img-element */

interface ImageGridProps {
  imageUrls: string[];
  onImageClick?: (imageUrl: string) => void;
}

export function ImageGrid({ imageUrls, onImageClick }: ImageGridProps) {
  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-ink mb-4">Generated Images</h2>
      <div className="grid grid-cols-2 gap-6">
        {imageUrls.map((url, index) => (
          <button
            key={index}
            onClick={() => onImageClick?.(url)}
            className="aspect-square rounded-lg overflow-hidden bg-surface hover:ring-4 hover:ring-accent focus:outline-none focus:ring-4 focus:ring-accent transition-all cursor-pointer"
          >
            <img
              src={url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      {onImageClick && (
        <p className="text-sm text-ink-muted text-center mt-3">
          Click an image to view larger
        </p>
      )}
    </div>
  );
}
