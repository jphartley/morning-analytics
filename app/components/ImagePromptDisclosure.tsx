"use client";

import { useId, useState } from "react";

interface ImagePromptDisclosureProps {
  imagePrompt: string;
}

type CopyState = "idle" | "copied" | "failed";

export function ImagePromptDisclosure({ imagePrompt }: ImagePromptDisclosureProps) {
  const promptId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleToggle = () => {
    setIsOpen((current) => !current);
    setCopyState("idle");
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(imagePrompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="w-full rounded-lg border border-outline bg-surface">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={promptId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors rounded-lg"
      >
        <span>{isOpen ? "Hide image prompt" : "Show image prompt"}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div id={promptId} className="border-t border-outline px-4 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-ink-muted">Image prompt</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-outline px-3 py-1.5 text-sm text-ink-muted hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
                />
              </svg>
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <blockquote className="whitespace-pre-wrap break-words rounded-lg bg-page border border-outline px-4 py-3 font-mono text-sm leading-relaxed text-ink">
            {imagePrompt}
          </blockquote>
          {copyState === "failed" && (
            <p className="mt-2 text-sm text-ink-muted">
              Copy failed. Select the prompt text to copy it manually.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
