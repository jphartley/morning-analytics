"use client";

import { useEffect, useState } from "react";
import { listAnalyses } from "@/lib/analytics-storage-client";

export interface HistoryEntry {
  id: string;
  created_at: string;
  input_preview: string;
}

interface DeleteRequest {
  id: string;
  dateLabel: string;
}

interface HistorySidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  refreshTrigger?: number;
  onHistoryEmptyChange?: (isEmpty: boolean) => void;
  onRequestDelete?: (entry: DeleteRequest) => void;
  onEntriesChange?: (entries: HistoryEntry[]) => void;
  pendingRemovedId?: string | null;
  newAnalysisButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function HistorySidebar({
  selectedId,
  onSelect,
  onNewAnalysis,
  refreshTrigger = 0,
  onHistoryEmptyChange,
  onRequestDelete,
  onEntriesChange,
  pendingRemovedId = null,
  newAnalysisButtonRef,
}: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);

      const result = await listAnalyses();

      if (result.success && result.data) {
        setEntries(result.data);
        onHistoryEmptyChange?.(result.data.length === 0);
        onEntriesChange?.(result.data);
      } else {
        setError(result.error || "Failed to load history");
        onHistoryEmptyChange?.(false);
      }

      setIsLoading(false);
    }

    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, onHistoryEmptyChange]);

  // Dismiss an open kebab menu on outside click or Escape.
  useEffect(() => {
    if (!openMenuId) return;

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(`[data-entry-menu="${openMenuId}"]`)) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  const visibleEntries = entries.filter((entry) => entry.id !== pendingRemovedId);

  return (
    <aside className="hidden md:flex w-64 bg-surface border-r border-outline flex-col h-full">
      <div className="p-4 border-b border-outline">
        <button
          ref={newAnalysisButtonRef}
          onClick={onNewAnalysis}
          className="w-full py-2 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
        >
          + New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-center text-ink-muted">
            <div className="w-6 h-6 border-2 border-outline border-t-ink-muted rounded-full animate-spin mx-auto mb-2" />
            Loading history...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && visibleEntries.length === 0 && (
          <div className="p-4 text-center text-ink-muted text-sm">
            No analyses yet. Create your first one!
          </div>
        )}

        {!isLoading && !error && visibleEntries.length > 0 && (
          <ul className="divide-y divide-outline">
            {visibleEntries.map((entry) => (
              <li key={entry.id} className="relative">
                <button
                  onClick={() => onSelect(entry.id)}
                  className={`w-full text-left p-3 pr-10 hover:bg-page transition-colors ${
                    selectedId === entry.id
                      ? "bg-accent-soft border-l-2 border-accent"
                      : ""
                  }`}
                >
                  <div className="text-xs text-ink-muted mb-1">
                    {formatDateTime(entry.created_at)}
                  </div>
                  <div className="text-sm text-ink line-clamp-2">
                    {entry.input_preview}...
                  </div>
                </button>

                {onRequestDelete && (
                  <div
                    data-entry-menu={entry.id}
                    className="absolute top-2 right-1"
                  >
                    <button
                      type="button"
                      aria-label="Analysis options"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === entry.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((current) => (current === entry.id ? null : entry.id));
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:bg-page hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    >
                      <span aria-hidden="true">&#8942;</span>
                    </button>

                    {openMenuId === entry.id && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-1 w-32 rounded-lg border border-outline bg-surface shadow-lg z-10 py-1"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onRequestDelete({
                              id: entry.id,
                              dateLabel: formatDateTime(entry.created_at),
                            });
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-page transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
