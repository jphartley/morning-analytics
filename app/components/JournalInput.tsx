"use client";

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  disabled: boolean;
}

export function JournalInput({
  value,
  onChange,
  onAnalyze,
  disabled,
}: JournalInputProps) {
  return (
    <div className="w-full space-y-4">
      <textarea
        className="w-full h-64 p-4 text-lg bg-surface border border-outline rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-ink placeholder:text-ink-muted"
        placeholder="Paste or write your morning pages here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
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
