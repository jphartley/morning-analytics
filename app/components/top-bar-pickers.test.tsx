import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalystPicker } from "@/components/AnalystPicker";
import { ImageProviderPicker } from "@/components/ImageProviderPicker";
import { ModelPicker } from "@/components/ModelPicker";
import { ViewDensityControl } from "@/components/ViewDensityControl";

describe("controlled top bar pickers", () => {
  it("renders the analyst persona supplied by page state", () => {
    const html = renderToStaticMarkup(
      <AnalystPicker value="mel-robbins" onChange={() => undefined} />
    );

    expect(html).toContain("Mel Robbins");
  });

  it("renders the Gemini model supplied by page state", () => {
    const html = renderToStaticMarkup(
      <ModelPicker value="gemini-3.1-pro-preview" onChange={() => undefined} />
    );

    expect(html).toContain("Gemini 3.1 Pro");
  });

  it("renders an available saved provider as the selected option", () => {
    const html = renderToStaticMarkup(
      <ImageProviderPicker
        value="dual"
        defaultProvider="midjourney"
        dualModeEnabled
        onChange={() => undefined}
      />
    );

    expect(html).toMatch(/<option[^>]*value="dual"[^>]*selected=""[^>]*>Dual mode<\/option>/);
  });

  it("renders the view-density mode supplied by page state", () => {
    const html = renderToStaticMarkup(
      <ViewDensityControl value="test" onChange={() => undefined} />
    );

    expect(html).toMatch(/aria-checked="true"[^>]*aria-label="Test view"/);
  });
});
