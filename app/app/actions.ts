"use server";

import path from "path";
import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { analyzeWithGemini } from "@/lib/gemini";
import { assertServerSupabaseEnv } from "@/lib/supabase";
import { triggerImagine } from "@/lib/discord/trigger";
import { waitForImages } from "@/lib/discord/listener";
import { splitGridImage } from "@/lib/image-splitter";
import { saveAnalysis as saveToStorage, uploadImagesToStorage } from "@/lib/analytics-storage";

assertServerSupabaseEnv();

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
  imagePaths?: string[]; // Storage paths for saving
  analysisId?: string;
  uploadError?: string;
  error?: string;
}

export interface SaveAnalysisResponse {
  success: boolean;
  id?: string;
  error?: string;
}


const MOCK_IMAGE_COUNT = 4;
const MOCK_IMAGE_DELAY_MS = 1000;

function getImageProvider(): "midjourney" | "mock" {
  if (process.env.NEXT_PUBLIC_IMAGE_PROVIDER === "mock") {
    return "mock";
  }

  return "midjourney";
}

function getContentTypeFromExtension(extension: string): string | null {
  switch (extension.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return null;
  }
}

async function loadMockImages(): Promise<string[]> {
  const directBaseDir = path.join(process.cwd(), "public", "mock-images");
  const nestedBaseDir = path.join(process.cwd(), "app", "public", "mock-images");
  const baseDir = existsSync(directBaseDir) ? directBaseDir : nestedBaseDir;
  const entries = await readdir(baseDir);
  const imageFiles = entries
    .filter((entry) => getContentTypeFromExtension(path.extname(entry)) !== null)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, MOCK_IMAGE_COUNT)
    .map((entry) => path.join(baseDir, entry));

  if (imageFiles.length < MOCK_IMAGE_COUNT) {
    throw new Error(`Expected ${MOCK_IMAGE_COUNT} mock images in ${baseDir}`);
  }

  return Promise.all(
    imageFiles.map(async (filePath) => {
      const buffer = await readFile(filePath);
      const contentType = getContentTypeFromExtension(path.extname(filePath)) || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    })
  );
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Phase 1: Analyze text with Gemini
 * Returns analysis text and image prompt for Phase 2
 * Requires authenticated user - userId passed from client session
 */
export async function analyzeText(
  journalText: string,
  userId: string,
  modelId?: string,
  persona: string = "jungian"
): Promise<TextAnalysisResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User must be authenticated to analyze text.",
      };
    }

    if (!journalText || journalText.trim().length === 0) {
      return {
        success: false,
        error: "Please enter some text to analyze.",
      };
    }

    const geminiResult = await analyzeWithGemini(journalText, modelId, persona);

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
 * Also uploads to Supabase storage and returns paths
 * Requires authenticated user - userId passed from client session
 */
export async function generateImages(
  imagePrompt: string,
  userId: string
): Promise<ImageGenerationResponse> {
  const analysisId = uuidv4();

  try {
    if (!userId) {
      return {
        success: false,
        analysisId,
        error: "User must be authenticated to generate images.",
      };
    }

    const imageProvider = getImageProvider();

    if (imageProvider === "mock") {
      await delay(MOCK_IMAGE_DELAY_MS);
      const mockImages = await loadMockImages();
      const uploadResult = await uploadImagesToStorage(analysisId, mockImages, userId);

      return {
        success: true,
        imageUrls: mockImages,
        imagePaths: uploadResult.paths,
        analysisId,
        uploadError: uploadResult.error,
      };
    }

    if (!imagePrompt || imagePrompt.trim().length === 0) {
      return {
        success: false,
        analysisId,
        error: "No image prompt provided.",
      };
    }

    // Trigger Midjourney
    const triggerResult = await triggerImagine(imagePrompt);
    if (!triggerResult.success) {
      return {
        success: false,
        analysisId,
        error: triggerResult.error || "Failed to trigger image generation.",
      };
    }

    // Wait for Midjourney response
    const listenerResult = await waitForImages(triggerResult.nonce);
    if (!listenerResult.success) {
      return {
        success: false,
        analysisId,
        error: listenerResult.error || "Failed to receive generated images.",
      };
    }

    // Split the grid image into 4 separate images
    const gridImageUrl = listenerResult.imageUrls[0];
    if (!gridImageUrl) {
      return {
        success: false,
        analysisId,
        error: "No image URL received from Midjourney.",
      };
    }

    const splitImages = await splitGridImage(gridImageUrl);

    // Upload images to Supabase storage (server-side, no client round-trip)
    const uploadResult = await uploadImagesToStorage(analysisId, splitImages, userId);

    return {
      success: true,
      imageUrls: splitImages,
      imagePaths: uploadResult.paths,
      analysisId,
      uploadError: uploadResult.error,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    return {
      success: false,
      analysisId,
      error: error instanceof Error ? error.message : "Failed to generate images.",
    };
  }
}

/**
 * Save an analysis to persistent storage
 * imagePaths should be storage paths from generateImages, not base64 data
 * Requires authenticated user - userId passed from client session
 */
export async function saveAnalysis(
  inputText: string,
  analysisText: string,
  imagePrompt: string | null,
  modelId: string,
  imagePaths: string[],
  userId: string,
  analysisId?: string,
  analystPersona: string = "jungian"
): Promise<SaveAnalysisResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User must be authenticated to save analysis.",
      };
    }

    const result = await saveToStorage(
      inputText,
      analysisText,
      imagePrompt,
      modelId,
      imagePaths,
      analysisId,
      analystPersona,
      userId
    );
    return result;
  } catch (error) {
    console.error("Save analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save analysis.",
    };
  }
}
