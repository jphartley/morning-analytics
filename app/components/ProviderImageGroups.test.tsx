import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProviderImageGroups } from "./ProviderImageGroups";
import type { ImageDisplayGroup } from "@/lib/image-generation-types";

const groups: ImageDisplayGroup[] = [{
  id: "midjourney-result",
  provider: "midjourney",
  label: "Midjourney",
  prompt: "an image prompt",
  status: "success",
  imageUrls: ["https://images.test/one.png"],
}];

describe("ProviderImageGroups", () => {
  it("renders image grids without provider headings when the picker is unavailable", () => {
    const html = renderToStaticMarkup(<ProviderImageGroups groups={groups} />);

    expect(html).toContain('src="https://images.test/one.png"');
    expect(html).not.toContain("Midjourney");
    expect(html).not.toContain("<h2");
  });

  it("renders provider headings when the picker is available", () => {
    const html = renderToStaticMarkup(
      <ProviderImageGroups groups={groups} showProviderHeadings />
    );

    expect(html).toContain("<h2");
    expect(html).toContain("Midjourney");
  });
});
