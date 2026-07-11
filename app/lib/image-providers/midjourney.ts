import { triggerImagine } from "@/lib/discord/trigger";
import { waitForImages } from "@/lib/discord/listener";
import { splitGridImage } from "@/lib/image-splitter";
import type { ImageProvider } from "./types";
import { ImageProviderError } from "./types";

export const midjourneyImageProvider: ImageProvider = {
  id: "midjourney",
  async generateImageSet(request) {
    if (request.count !== 4) {
      throw new ImageProviderError(
        "configuration",
        "Midjourney generation requires exactly four output images."
      );
    }

    const triggerResult = await triggerImagine(request.prompt, request.diagnostics);
    if (!triggerResult.success) {
      throw new ImageProviderError(
        "unavailable",
        triggerResult.error || "Failed to trigger Midjourney image generation."
      );
    }

    const listenerResult = await waitForImages({
      nonce: triggerResult.nonce,
      startedAt: request.diagnostics.startedAt,
      prompt: request.prompt,
      diagnostics: request.diagnostics,
    });
    if (!listenerResult.success) {
      throw new ImageProviderError(
        listenerResult.error?.toLowerCase().includes("timeout") ? "timeout" : "unavailable",
        listenerResult.error || "Failed to receive generated Midjourney images."
      );
    }

    const gridImageUrl = listenerResult.imageUrls[0];
    if (!gridImageUrl) {
      throw new ImageProviderError(
        "invalid-response",
        "Midjourney response did not include a grid image."
      );
    }

    const imageDataUrls = await splitGridImage(gridImageUrl, request.diagnostics);
    if (imageDataUrls.length !== request.count) {
      throw new ImageProviderError(
        "incomplete-set",
        `Midjourney returned ${imageDataUrls.length} images instead of ${request.count}.`
      );
    }

    return {
      provider: "midjourney",
      imageDataUrls,
    };
  },
};

