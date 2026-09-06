import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FIRST_USE_COPY } from "@/lib/first-use-copy";
import { getEmptyHistoryMessage, HistorySidebar } from "./HistorySidebar";
import { JournalInput } from "./JournalInput";
import { WelcomeEmptyState } from "./WelcomeEmptyState";

describe("first-use experience", () => {
  it("renders the locked guide copy, order, punctuation, and full-sentence emphasis", () => {
    const html = renderToStaticMarkup(<WelcomeEmptyState />).replaceAll("&#x27;", "'");

    expect(html).toContain("How it works");
    expect(html).toContain(
      `<strong>${FIRST_USE_COPY.guide.intro}</strong>`
    );

    const titles = FIRST_USE_COPY.guide.steps.map((step) => step.title);
    const titleIndexes = titles.map((title) => html.indexOf(title));
    expect(titleIndexes.every((index) => index >= 0)).toBe(true);
    expect(titleIndexes).toEqual([...titleIndexes].sort((a, b) => a - b));

    for (const step of FIRST_USE_COPY.guide.steps) {
      expect(html).toContain(step.description);
    }
  });

  it("uses the locked empty-history message only during first use", () => {
    expect(getEmptyHistoryMessage(true)).toBe("Your reflections will appear here.");
    expect(getEmptyHistoryMessage(false)).toBe("No analyses yet. Create your first one!");
  });

  it("hides the redundant new-analysis action only during first use", () => {
    const firstUseHtml = renderToStaticMarkup(
      <HistorySidebar
        selectedId={null}
        onSelect={() => undefined}
        onNewAnalysis={() => undefined}
        isFirstUse
      />
    );
    const establishedHtml = renderToStaticMarkup(
      <HistorySidebar
        selectedId={null}
        onSelect={() => undefined}
        onNewAnalysis={() => undefined}
      />
    );

    expect(firstUseHtml).not.toContain("+ New Analysis");
    expect(establishedHtml).toContain("+ New Analysis");
  });

  it("uses the locked editor invitation and action label for every new analysis", () => {
    const html = renderToStaticMarkup(
      <JournalInput
        value=""
        onChange={() => undefined}
        onAnalyze={() => undefined}
        disabled={false}
      />
    );

    expect(html).toContain(FIRST_USE_COPY.editorPlaceholder);
    expect(html).toContain(`>${FIRST_USE_COPY.actionLabel}</button>`);
  });
});
