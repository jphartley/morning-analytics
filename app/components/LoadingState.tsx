interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Analyzing your morning pages..." }: LoadingStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 border-4 border-accent-soft border-t-accent rounded-full animate-spin" />
      <p className="text-lg text-ink-muted">{message}</p>
    </div>
  );
}
