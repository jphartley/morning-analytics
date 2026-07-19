import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  assignBlindOptions,
  BlindMemoryComparison,
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
  });
});
