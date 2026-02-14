import ReactMarkdown from "react-markdown";

interface AnalysisPanelProps {
  analysisText: string;
}

export function AnalysisPanel({ analysisText }: AnalysisPanelProps) {
  return (
    <div className="w-full p-6 bg-stone-50 border border-stone-200 rounded-lg">
      <h2 className="text-xl font-semibold text-stone-800 mb-4">Analysis</h2>
      <div className="prose prose-stone max-w-none">
        <ReactMarkdown
          allowedElements={["h1", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "p", "br"]}
          components={{
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-bold text-stone-800 mt-4 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-bold text-stone-800 mt-5 mb-3" {...props} />
            ),
            h1: ({ node, ...props }) => (
              <h1 className="text-xl font-bold text-stone-800 mt-6 mb-4" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4 text-stone-700 leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-4 text-stone-700" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-4 text-stone-700" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="mb-1" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
            ),
          }}
        >
          {analysisText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
