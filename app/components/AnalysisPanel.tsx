import ReactMarkdown from "react-markdown";

interface AnalysisPanelProps {
  analysisText: string;
}

export function AnalysisPanel({ analysisText }: AnalysisPanelProps) {
  return (
    <div className="w-full p-6 bg-surface border border-outline rounded-lg">
      <h2 className="text-xl font-semibold text-ink mb-4">Analysis</h2>
      <div className="prose max-w-none">
        <ReactMarkdown
          allowedElements={["h1", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "p", "br"]}
          components={{
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-bold text-ink mt-4 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-bold text-ink mt-5 mb-3" {...props} />
            ),
            h1: ({ node, ...props }) => (
              <h1 className="text-xl font-bold text-ink mt-6 mb-4" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4 text-ink leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-4 text-ink" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-4 text-ink" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="mb-1" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-accent hover:text-accent-hover underline" {...props} />
            ),
          }}
        >
          {analysisText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
