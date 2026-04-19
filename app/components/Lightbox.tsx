"use client";

import { useEffect, useCallback, useState, useRef } from "react";

interface LightboxProps {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ imageUrls, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFading, setIsFading] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  const navigateTo = useCallback(
    (index: number) => {
      if (index === currentIndex || isFading) return;
      setIsFading(true);
      pendingIndex.current = index;
    },
    [currentIndex, isFading]
  );

  const goNext = useCallback(() => {
    navigateTo((currentIndex + 1) % imageUrls.length);
  }, [currentIndex, imageUrls.length, navigateTo]);

  const goPrev = useCallback(() => {
    navigateTo((currentIndex - 1 + imageUrls.length) % imageUrls.length);
  }, [currentIndex, imageUrls.length, navigateTo]);

  // When fade-out completes, swap the image and fade back in
  const handleTransitionEnd = useCallback(() => {
    if (isFading && pendingIndex.current !== null) {
      setCurrentIndex(pendingIndex.current);
      pendingIndex.current = null;
      setIsFading(false);
    }
  }, [isFading]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      }
    },
    [onClose, goNext, goPrev]
  );

  // Handle click outside (on backdrop)
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove event listeners and body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-surface text-ink hover:bg-page shadow-lg transition-colors z-10"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main image area with arrow buttons */}
      <div className="flex items-center gap-4 max-h-[90vh] max-w-[90vw]">
        {/* Previous arrow */}
        <button
          onClick={goPrev}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrls[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${imageUrls.length}`}
          className="max-h-[90vh] max-w-[80vw] object-contain rounded-lg transition-opacity duration-150"
          style={{ opacity: isFading ? 0 : 1 }}
          onTransitionEnd={handleTransitionEnd}
        />

        {/* Next arrow */}
        <button
          onClick={goNext}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Position indicator */}
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
        {currentIndex + 1} of {imageUrls.length}
      </span>
    </div>
  );
}
