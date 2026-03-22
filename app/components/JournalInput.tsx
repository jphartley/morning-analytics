"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  disabled: boolean;
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
}: JournalInputProps) {
  const isUpdatingFromProp = useRef(false);
  const pasteDetected = useRef(false);
  const shouldAutoAnalyze = useRef(false);

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
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editable: !disabled,
    content: value,
    onUpdate: ({ editor }) => {
      if (isUpdatingFromProp.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown() as string;
      onChange(md);

      const wasPaste = pasteDetected.current;
      pasteDetected.current = false;
      if (wasPaste && !disabled) {
        const wordCount = md.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 300) {
          shouldAutoAnalyze.current = true;
        }
      }
    },
    editorProps: {
      attributes: {
        class:
          "w-full min-h-[16rem] p-4 text-lg bg-surface text-ink outline-none",
      },
      handlePaste: () => {
        pasteDetected.current = true;
        return false;
      },
    },
  });

  // Trigger auto-analyze after React re-renders with updated value
  useEffect(() => {
    if (shouldAutoAnalyze.current) {
      shouldAutoAnalyze.current = false;
      onAnalyze();
    }
  }, [value, onAnalyze]);

  // Sync external value prop changes into editor
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMd = (editor.storage as any).markdown.getMarkdown() as string;
    if (value !== currentMd) {
      isUpdatingFromProp.current = true;
      editor.commands.setContent(value);
      isUpdatingFromProp.current = false;
    }
  }, [value, editor]);

  // Sync disabled prop
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div className="w-full space-y-4">
      <div
        className={`w-full border border-outline rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent ${disabled ? "opacity-50 cursor-not-allowed" : ""} [&_.ProseMirror]:placeholder:text-ink-muted ${editorProseStyles}`}
      >
        <EditorContent editor={editor} />
      </div>
      <button
        className="w-full py-3 px-6 text-lg font-medium text-white bg-accent rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={onAnalyze}
        disabled={disabled || !value.trim()}
      >
        Analyze
      </button>
    </div>
  );
}
