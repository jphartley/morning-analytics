"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  countJournalWords,
  shouldAutoAnalyzePastedJournal,
} from "@/lib/journal-submission";
import { FIRST_USE_COPY } from "@/lib/first-use-copy";
import { createJournalClipboardController } from "@/lib/journal-clipboard";

type MarkdownStorage = {
  markdown: {
    getMarkdown: () => string;
    parser: { parse: (text: string, options: { inline: boolean }) => string };
  };
};

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  disabled: boolean;
  showWritingStats?: boolean;
  placeholder?: string;
  actionLabel?: string;
}

const editorProseStyles = [
  // Headings
  "[&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-ink [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-4",
  "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-ink [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-3",
  "[&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-ink [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2",
  // Paragraphs
  "[&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-relaxed",
  // Lists
  "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:list-inside [&_.ProseMirror_ul]:mb-4",
  "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:list-inside [&_.ProseMirror_ol]:mb-4",
  "[&_.ProseMirror_li]:mb-1",
].join(" ");

export function JournalInput({
  value,
  onChange,
  onAnalyze,
  disabled,
  showWritingStats = true,
  placeholder = FIRST_USE_COPY.editorPlaceholder,
  actionLabel = FIRST_USE_COPY.actionLabel,
}: JournalInputProps) {
  const isUpdatingFromProp = useRef(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [clipboard] = useState(() => createJournalClipboardController(setClipboardError));
  const pendingAutoAnalysis = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
        link: false,
        underline: false,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: false,
      }),
    ],
    editable: !disabled,
    content: value,
    onCreate: ({ editor }) => {
      clipboard.setMarkdownParser((text) =>
        (editor.storage as unknown as MarkdownStorage).markdown.parser.parse(text, { inline: true }));
    },
    onDestroy: () => { clipboard.setMarkdownParser(null); },
    onUpdate: ({ editor, transaction }) => {
      if (isUpdatingFromProp.current) return;
      const md = (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
      const wasPaste = transaction.getMeta("paste") === true && !clipboard.isExternalDrop();
      pendingAutoAnalysis.current = wasPaste && shouldAutoAnalyzePastedJournal(editor.getText(), disabled) ? md : null;
      onChange(md);
    },
    editorProps: {
      ...clipboard.editorProps,
      attributes: {
        class:
          "w-full min-h-[16rem] p-4 text-lg bg-surface text-ink outline-none",
      },
    },
  });

  // Trigger auto-analyze after React re-renders with updated value
  useEffect(() => {
    if (!disabled && pendingAutoAnalysis.current !== null && value === pendingAutoAnalysis.current) {
      pendingAutoAnalysis.current = null;
      onAnalyze();
    }
  }, [value, onAnalyze, disabled]);

  // Sync external value prop changes into editor
  useEffect(() => {
    if (!editor) return;
    const currentMd = (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
    if (value !== currentMd) {
      isUpdatingFromProp.current = true;
      editor.commands.setContent(value);
      isUpdatingFromProp.current = false;
    }
  }, [value, editor]);

  // Sync disabled prop
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled, false);
  }, [disabled, editor]);

  const wordCount = useMemo(
    () => countJournalWords(editor?.getText() ?? value),
    [editor, value]
  );

  const isThresholdMet = wordCount >= 300;

  return (
    <div className="w-full space-y-4">
      <div
        className={`relative w-full border border-outline rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${editorProseStyles}`}
      >
        {placeholder && !value.trim() && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 text-lg text-ink-muted"
          >
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
      {clipboardError && <p role="alert" className="text-sm text-ink">{clipboardError}</p>}
      {showWritingStats && (
        <div
          className={`text-sm text-right tabular-nums ${isThresholdMet ? "text-accent" : "text-ink-muted"}`}
        >
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {isThresholdMet && (
            <span className="ml-1">(auto-analyze ready)</span>
          )}
        </div>
      )}
      <button
        className="w-full py-3 px-6 text-lg font-medium text-white bg-accent rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={onAnalyze}
        disabled={disabled || !value.trim()}
      >
        {actionLabel}
      </button>
    </div>
  );
}
