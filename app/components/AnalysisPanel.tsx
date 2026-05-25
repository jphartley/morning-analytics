import ReactMarkdown from "react-markdown";

interface AnalysisPanelProps {
  analysisText: string;
}

function getReadableAnalysisText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~`>#()[\]]/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAnalysisReadingMetadata(analysisText: string) {
  const readableText = getReadableAnalysisText(analysisText);
  const wordCount = readableText.split(/\s+/).filter(Boolean).length;

  if (wordCount === 0) {
    return null;
  }

  return {
    minutes: Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
  };
}

function omitMarkdownNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const propsWithoutNode = { ...props };
  delete propsWithoutNode.node;
  return propsWithoutNode;
}

export function AnalysisPanel({ analysisText }: AnalysisPanelProps) {
  const readingMetadata = getAnalysisReadingMetadata(analysisText);

  return (
    <div className="w-full p-6 bg-surface border border-outline rounded-lg animate-fade-in-up">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-xl font-semibold text-ink">Analysis</h2>
        {readingMetadata && (
          <p className="text-sm text-ink-muted tabular-nums">
            ~{readingMetadata.minutes} min read ({readingMetadata.wordCount}{" "}
            {readingMetadata.wordCount === 1 ? "word" : "words"})
          </p>
        )}
      </div>
      <div className="prose max-w-none">
        <ReactMarkdown
          allowedElements={["h1", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "p", "br"]}
          components={{
            h3: (props) => (
              <h3 className="text-base font-bold text-ink mt-4 mb-2" {...omitMarkdownNode(props)} />
            ),
            h2: (props) => (
              <h2 className="text-lg font-bold text-ink mt-5 mb-3" {...omitMarkdownNode(props)} />
            ),
            h1: (props) => (
              <h1 className="text-xl font-bold text-ink mt-6 mb-4" {...omitMarkdownNode(props)} />
            ),
            p: (props) => (
              <p className="mb-4 text-ink leading-relaxed" {...omitMarkdownNode(props)} />
            ),
            ul: (props) => (
              <ul className="list-disc list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />
            ),
            ol: (props) => (
              <ol className="list-decimal list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />
            ),
            li: (props) => (
              <li className="mb-1" {...omitMarkdownNode(props)} />
            ),
            a: (props) => (
              <a className="text-accent hover:text-accent-hover underline" {...omitMarkdownNode(props)} />
            ),
          }}
        >
          {analysisText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
