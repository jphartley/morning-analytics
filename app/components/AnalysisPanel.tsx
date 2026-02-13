interface AnalysisPanelProps {
  analysisText: string;
}

export function AnalysisPanel({ analysisText }: AnalysisPanelProps) {
  return (
    <div className="w-full p-6 bg-stone-50 border border-stone-200 rounded-lg">
      <h2 className="text-xl font-semibold text-stone-800 mb-4">Analysis</h2>
      <div className="prose prose-stone max-w-none">
        {analysisText.split("\n\n").map((paragraph, index) => (
          <p key={index} className="mb-4 text-stone-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
