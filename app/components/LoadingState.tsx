interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Analyzing your morning pages..." }: LoadingStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      <p className="text-lg text-stone-600">{message}</p>
    </div>
  );
}
