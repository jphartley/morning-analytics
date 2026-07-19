import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AnalysisMemoryModeControl,
} from "./AnalysisMemoryModeControl";

interface InputElementProps {
  children?: ReactNode;
  value?: string;
  onChange?: () => void;
}

function findInput(node: ReactNode, value: string): InputElementProps | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findInput(child, value);
      if (match) return match;
    }
    return null;
  }

  if (!isValidElement<InputElementProps>(node)) return null;
  if (node.type === "input" && node.props.value === value) return node.props;
  return findInput(node.props.children, value);
}

describe("AnalysisMemoryModeControl", () => {
  it("renders all outcomes, helper text, and Use memory as the default selection", () => {
    const html = renderToStaticMarkup(
      <AnalysisMemoryModeControl
        value="with-memory"
        onChange={() => undefined}
      />
    );

    expect(html).toContain("No memory");
    expect(html).toContain("One analysis without memory context.");
    expect(html).toContain("Use memory");
    expect(html).toContain("One analysis with relevant memory context.");
    expect(html).toContain("Blind comparison");
    expect(html).toContain("Two unlabeled analyses");
    expect(html).toContain("Saving still updates memory for future entries.");
    expect(html).toMatch(/type="radio"[^>]*checked=""[^>]*value="with-memory"/);
  });

  it("uses native radio semantics and reports selection changes", () => {
    const onChange = vi.fn();
    const tree = AnalysisMemoryModeControl({
      value: "with-memory",
      onChange,
    });
    const blindInput = findInput(tree, "blind-comparison");

    expect(blindInput).not.toBeNull();
    blindInput?.onChange?.();
    expect(onChange).toHaveBeenCalledWith("blind-comparison");
  });

  it("disables the fieldset and each radio while a run is pending", () => {
    const html = renderToStaticMarkup(
      <AnalysisMemoryModeControl
        value="without-memory"
        onChange={() => undefined}
        disabled
      />
    );

    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html.match(/disabled=""/g)).toHaveLength(4);
  });
});
