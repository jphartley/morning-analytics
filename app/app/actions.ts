"use server";

import { analyzeWithGemini } from "@/lib/gemini";
import { triggerImagine } from "@/lib/discord/trigger";
import { waitForImages } from "@/lib/discord/listener";
import { splitGridImage } from "@/lib/image-splitter";

// Response types
export interface TextAnalysisResponse {
  success: boolean;
  analysisText?: string;
  imagePrompt?: string;
  error?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrls?: string[];
  error?: string;
}

// Legacy type for backwards compatibility
export interface AnalysisResponse {
  success: boolean;
  analysisText?: string;
  imageUrls?: string[];
  error?: string;
}

/**
 * Phase 1: Analyze text with Gemini
 * Returns analysis text and image prompt for Phase 2
 */
export async function analyzeText(
  journalText: string,
  modelId?: string
): Promise<TextAnalysisResponse> {
  try {
    if (!journalText || journalText.trim().length === 0) {
      return {
        success: false,
        error: "Please enter some text to analyze.",
      };
    }

    const geminiResult = await analyzeWithGemini(journalText, modelId);

    return {
      success: true,
      analysisText: geminiResult.analysisText,
      imagePrompt: geminiResult.imagePrompt || undefined,
    };
  } catch (error) {
    console.error("Text analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze text.",
    };
  }
}

/**
 * Phase 2: Generate images with Midjourney
 * Takes image prompt from Phase 1, returns 4 split images
 */
export async function generateImages(
  imagePrompt: string
): Promise<ImageGenerationResponse> {
  try {
    if (!imagePrompt || imagePrompt.trim().length === 0) {
      return {
        success: false,
        error: "No image prompt provided.",
      };
    }

    // Trigger Midjourney
    const triggerResult = await triggerImagine(imagePrompt);
    if (!triggerResult.success) {
      return {
        success: false,
        error: triggerResult.error || "Failed to trigger image generation.",
      };
    }

    // Wait for Midjourney response
    const listenerResult = await waitForImages(triggerResult.nonce);
    if (!listenerResult.success) {
      return {
        success: false,
        error: listenerResult.error || "Failed to receive generated images.",
      };
    }

    // Split the grid image into 4 separate images
    const gridImageUrl = listenerResult.imageUrls[0];
    if (!gridImageUrl) {
      return {
        success: false,
        error: "No image URL received from Midjourney.",
      };
    }

    const splitImages = await splitGridImage(gridImageUrl);

    return {
      success: true,
      imageUrls: splitImages,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate images.",
    };
  }
}

/**
 * @deprecated Use analyzeText() and generateImages() separately for progressive loading
 */
export async function analyzeJournal(
  journalText: string
): Promise<AnalysisResponse> {
  const textResult = await analyzeText(journalText);
  if (!textResult.success) {
    return {
      success: false,
      error: textResult.error,
    };
  }

  let imageUrls: string[] = [];
  if (textResult.imagePrompt) {
    const imageResult = await generateImages(textResult.imagePrompt);
    if (imageResult.success && imageResult.imageUrls) {
      imageUrls = imageResult.imageUrls;
    }
  }

  return {
    success: true,
    analysisText: textResult.analysisText,
    imageUrls,
  };
}
