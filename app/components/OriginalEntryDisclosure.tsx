"use client";

import { useId, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { omitMarkdownNode } from "@/lib/markdown-props";

interface OriginalEntryDisclosureProps {
  inputText: string;
  createdAt?: string | null;
}

export const COLLAPSE_WORD_THRESHOLD = 60;

export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => token.length > 0).length;
}

export function shouldCollapseEntry(text: string, threshold: number = COLLAPSE_WORD_THRESHOLD): boolean {
  return countWords(text) > threshold;
}

export function getEntryPreview(text: string, maxLines = 3, maxChars = 240): string {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const selectedLines = lines.slice(0, maxLines);
  let preview = selectedLines.join(" ").trim();

  const wasTruncatedByLines = lines.length > maxLines;

  if (preview.length > maxChars) {
    preview = `${preview.slice(0, maxChars).trimEnd()}...`;
  } else if (wasTruncatedByLines) {
    preview = `${preview}...`;
  }

  return preview;
}

export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="text-xl font-bold text-ink mt-6 mb-4" {...omitMarkdownNode(props)} />,
  h2: (props) => <h2 className="text-lg font-bold text-ink mt-5 mb-3" {...omitMarkdownNode(props)} />,
  h3: (props) => <h3 className="text-base font-bold text-ink mt-4 mb-2" {...omitMarkdownNode(props)} />,
  p: (props) => <p className="mb-4 text-ink leading-relaxed" {...omitMarkdownNode(props)} />,
  ul: (props) => <ul className="list-disc list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />,
  ol: (props) => <ol className="list-decimal list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />,
  li: (props) => <li className="mb-1" {...omitMarkdownNode(props)} />,
};

function OriginalEntryMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      allowedElements={["h1", "h2", "h3", "strong", "em", "ul", "ol", "li", "p", "br"]}
      components={markdownComponents}
    >
      {text}
    </ReactMarkdown>
  );
}

export function OriginalEntryDisclosure({ inputText, createdAt }: OriginalEntryDisclosureProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);

  if (!shouldCollapseEntry(inputText)) {
    return (
      <div className="bg-surface border border-outline rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-ink-muted mb-2">Original Input</h3>
        <OriginalEntryMarkdown text={inputText} />
      </div>
    );
  }

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  const wordCount = countWords(inputText);
  const preview = getEntryPreview(inputText);

  return (
    <div className="w-full rounded-lg border border-outline bg-surface mb-4">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors rounded-lg"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-xs text-ink-muted mb-1">
            {createdAt ? `${formatEntryDate(createdAt)} · ` : ""}
            {wordCount} words
          </span>
          <span className="block truncate text-ink-muted font-normal">{preview}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {isOpen ? "Hide entry" : "Show full entry"}
          <svg
            className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className="border-t border-outline px-4 py-4">
          <h3 className="text-sm font-medium text-ink-muted mb-2">Original Input</h3>
          <OriginalEntryMarkdown text={inputText} />
        </div>
      )}
    </div>
  );
}
