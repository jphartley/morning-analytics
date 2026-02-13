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
        className="w-full h-64 p-4 text-lg bg-stone-50 border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Paste or write your morning pages here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button
        className="w-full py-3 px-6 text-lg font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={onAnalyze}
        disabled={disabled || !value.trim()}
      >
        Analyze
      </button>
    </div>
  );
}
