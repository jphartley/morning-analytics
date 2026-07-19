import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({
  getMemoryStore: vi.fn(),
  prepareMemoryRebuild: vi.fn(),
  rebuildMemoryEntry: vi.fn(),
  resetMemory: vi.fn(),
}));

import { renderToStaticMarkup } from "react-dom/server";
import {
  isMemoryUsed,
  MemoryDiagnosticsDrawer,
  MemoryEvidenceDisclosure,
  MemoryRebuildBugReport,
} from "./MemoryDiagnosticsDrawer";

const context = [{
  id: "00000000-0000-4000-8000-000000000001",
  version: 2,
  title: "India holiday",
  summary: "Upcoming travel to India.",
}];

describe("MemoryDiagnosticsDrawer", () => {
  it("matches memory usage by both identifier and version", () => {
    expect(isMemoryUsed(context[0].id, 2, context)).toBe(true);
    expect(isMemoryUsed(context[0].id, 1, context)).toBe(false);
  });

  it("renders a lightweight closed diagnostic trigger", () => {
    const html = renderToStaticMarkup(
      <MemoryDiagnosticsDrawer userId="user-1" modelId="model" usedMemoryContext={context} />
    );
    expect(html).toContain("Memory diagnostics");
    expect(html).toContain("bottom-16");
    expect(html).not.toContain("Reset all");
  });

  it("shows only the evidence date until its source excerpt is expanded", () => {
    const html = renderToStaticMarkup(<MemoryEvidenceDisclosure evidence={{
      id: "evidence-1",
      memory_id: context[0].id,
      user_id: "user-1",
      source_analysis_id: "analysis-1",
      source_entry_at: "2026-07-19T08:00:00.000Z",
      excerpt: "We finally go to Wigwam tomorrow.",
      effect: "supports",
      created_at: "2026-07-19T08:00:00.000Z",
    }} />);

    expect(html).toContain("<summary");
    expect(html).toContain("7/19/2026</summary>");
    expect(html).toContain("<blockquote");
    expect(html).not.toContain("open=\"\"");
  });

  it("renders an actionable rebuild report without journal text", () => {
    const html = renderToStaticMarkup(<MemoryRebuildBugReport
      modelId="gemini-test"
      failures={[{
        analysisId: "analysis-123",
        createdAt: "2026-07-19T08:00:00.000Z",
        code: "invalid_ai_output",
        message: "Gemini returned invalid memory data.",
      }]}
    />);

    expect(html).toContain("Rebuild bug report · 1 skipped");
    expect(html).toContain("gemini-test");
    expect(html).toContain("invalid_ai_output");
    expect(html).toContain("analysis-123");
    expect(html).not.toContain("journal entry contents");
  });
});
