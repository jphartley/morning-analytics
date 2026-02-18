"use client";

import { useState, useEffect } from "react";

export const ANALYSIS_MESSAGES = [
  "Reading between the lines...",
  "Exploring the unconscious...",
  "Decoding your symbols...",
  "Tracing emotional currents...",
  "Sifting through the layers...",
  "Listening to what's unspoken...",
  "Connecting the threads...",
  "Searching for hidden patterns...",
  "Mapping the inner landscape...",
  "Reflecting on your words...",
];

export const IMAGE_MESSAGES = [
  "Painting your insights...",
  "Mixing the watercolors...",
  "Composing the imagery...",
  "Sketching the symbols...",
  "Layering light and shadow...",
  "Rendering the dreamscape...",
  "Bringing visions to life...",
  "Blending color and meaning...",
  "Illustrating the unconscious...",
  "Crafting your visual story...",
];

interface LoadingStateProps {
  messages: string[];
  durationHint: string;
  intervalMs?: number;
}

export function LoadingState({
  messages,
  durationHint,
  intervalMs = 7000,
}: LoadingStateProps) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setFading(false);
      }, 300);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages.length, intervalMs]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 border-4 border-accent-soft border-t-accent rounded-full animate-spin" />
      <p
        className={`text-lg text-ink-muted transition-opacity duration-300 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {messages[index]}
      </p>
      <p className="text-sm text-ink-muted">{durationHint}</p>
    </div>
  );
}
