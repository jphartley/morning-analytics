"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";

interface ConfirmDeleteDialogProps {
  dateLabel: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  fallbackFocusRef: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmDeleteDialog({
  dateLabel,
  isDeleting,
  error,
  onConfirm,
  onCancel,
  fallbackFocusRef,
}: ConfirmDeleteDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Capture the element that opened the dialog and move focus into it (Cancel is the
  // safe default focus target for a destructive confirmation).
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
  }, []);

  // Restore focus on close (cancel OR successful delete). useLayoutEffect's cleanup
  // runs synchronously after DOM mutations in the same commit, which is what makes the
  // document.contains check deterministic: an optimistic removal of the deleted row
  // (and its opener kebab) happens in the same commit that unmounts this dialog, so by
  // the time this cleanup runs, `document.contains(opener)` is reliably false for a
  // successful delete and reliably true for a cancel.
  useLayoutEffect(() => {
    return () => {
      const opener = openerRef.current;
      if (opener && document.contains(opener)) {
        opener.focus();
        return;
      }
      // Read fallbackFocusRef.current at close time (not captured earlier): the
      // opener check above only fails on a successful delete, which is exactly when
      // we need the *current* fallback target (the sidebar's "New Analysis" button).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fallbackFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      if (!isDeleting) {
        onCancel();
      }
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-sm rounded-lg border border-outline bg-surface p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink mb-2">
          Delete this analysis?
        </h2>
        <p id={bodyId} className="text-sm text-ink mb-4">
          The analysis from {dateLabel} and its generated images will be permanently
          deleted. This cannot be undone.
        </p>

        {error && (
          <p role="alert" className="mb-4 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-outline bg-surface text-ink hover:bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger-hover focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <span
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
            )}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
