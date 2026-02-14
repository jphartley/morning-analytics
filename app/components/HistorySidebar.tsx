"use client";

import { useEffect, useState } from "react";
import { getHistoryList } from "@/app/actions";

interface HistoryEntry {
  id: string;
  created_at: string;
  input_preview: string;
}

interface HistorySidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  refreshTrigger?: number;
}

function formatDateTime(isoString: string): string {
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
}: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);

      const result = await getHistoryList();

      if (result.success && result.data) {
        setEntries(result.data);
      } else {
        setError(result.error || "Failed to load history");
      }

      setIsLoading(false);
    }

    fetchHistory();
  }, [refreshTrigger]);

  return (
    <aside className="hidden md:flex w-64 bg-stone-50 border-r border-stone-200 flex-col h-full">
      <div className="p-4 border-b border-stone-200">
        <button
          onClick={onNewAnalysis}
          className="w-full py-2 px-4 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
        >
          + New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-center text-stone-500">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-2" />
            Loading history...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="p-4 text-center text-stone-500 text-sm">
            No analyses yet. Create your first one!
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <ul className="divide-y divide-stone-200">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => onSelect(entry.id)}
                  className={`w-full text-left p-3 hover:bg-stone-100 transition-colors ${
                    selectedId === entry.id
                      ? "bg-amber-50 border-l-2 border-amber-600"
                      : ""
                  }`}
                >
                  <div className="text-xs text-stone-500 mb-1">
                    {formatDateTime(entry.created_at)}
                  </div>
                  <div className="text-sm text-stone-700 line-clamp-2">
                    {entry.input_preview}...
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
