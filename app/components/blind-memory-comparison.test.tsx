import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  assignBlindOptions,
  BlindMemoryComparison,
  BlindMemoryComparisonView,
} from "./BlindMemoryComparison";
import type { BlindComparisonOption } from "@/app/actions";

const withMemory: BlindComparisonOption = {
  success: true,
  usesMemory: true,
  analysisText: "Memory analysis",
  memoryContext: [],
};
const withoutMemory: BlindComparisonOption = {
  success: true,
  usesMemory: false,
  analysisText: "Control analysis",
  memoryContext: [],
};

describe("blind memory comparison", () => {
  it("randomizes which condition appears as A", () => {
    expect(assignBlindOptions(withMemory, withoutMemory, 0.1).a.usesMemory).toBe(true);
    expect(assignBlindOptions(withMemory, withoutMemory, 0.9).a.usesMemory).toBe(false);
  });

  it("keeps condition labels hidden before preference selection", () => {
    const html = renderToStaticMarkup(
      <BlindMemoryComparison
        options={{ a: withMemory, b: withoutMemory }}
        onContinue={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toContain("Analysis A");
    expect(html).toContain("Analysis B");
    expect(html).not.toContain("Memory on");
    expect(html).not.toContain("Memory off");
    expect(html).not.toContain("Continue with A");
    expect(html).not.toContain("Continue with B");
    expect(html).not.toContain("Save neither");
  });

  it("stacks A above B at full width for long-form reading", () => {
    const html = renderToStaticMarkup(
      <BlindMemoryComparison
        options={{ a: withMemory, b: withoutMemory }}
        onContinue={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toMatch(/class="space-y-6"[^>]*data-testid="blind-comparison-results"/);
    expect(html).not.toContain("grid-cols-2");
    expect(html.match(/<section[^>]*class="w-full/g)).toHaveLength(2);
    expect(html.indexOf("Analysis A")).toBeLessThan(html.indexOf("Analysis B"));
  });

  it.each([
    ["a", "Continue with A", "Continue with B"],
    ["b", "Continue with B", "Continue with A"],
  ] as const)("offers only the explicitly preferred %s result", (preference, offered, omitted) => {
    const html = renderToStaticMarkup(
      <BlindMemoryComparisonView
        options={{ a: withMemory, b: withoutMemory }}
        preference={preference}
        onPreference={() => undefined}
        onContinue={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toContain(offered);
    expect(html).not.toContain(omitted);
    expect(html).not.toContain("Save neither");
  });

  it("requires an explicit A, B, or neither choice after a tie", () => {
    const html = renderToStaticMarkup(
      <BlindMemoryComparisonView
        options={{ a: withMemory, b: withoutMemory }}
        preference="tie"
        onPreference={() => undefined}
        onContinue={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toContain("Save A");
    expect(html).toContain("Save B");
    expect(html).toContain("Save neither");
  });
});
