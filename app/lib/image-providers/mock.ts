import path from "path";
import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import type { ImageProvider } from "./types";
import { ImageProviderError } from "./types";

const MOCK_DELAY_MS = 1000;

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

async function loadMockImages(count: number): Promise<string[]> {
  const directBaseDir = path.join(process.cwd(), "public", "mock-images");
  const nestedBaseDir = path.join(process.cwd(), "app", "public", "mock-images");
  const baseDir = existsSync(directBaseDir) ? directBaseDir : nestedBaseDir;
  const entries = await readdir(baseDir);
  const imageFiles = entries
    .filter((entry) => getContentTypeFromExtension(path.extname(entry)) !== null)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, count)
    .map((entry) => path.join(baseDir, entry));

  if (imageFiles.length !== count) {
    throw new ImageProviderError(
      "configuration",
      `Expected ${count} mock images in ${baseDir}`
    );
  }

  return Promise.all(
    imageFiles.map(async (filePath) => {
      const buffer = await readFile(filePath);
      const contentType = getContentTypeFromExtension(path.extname(filePath)) || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    })
  );
}

export const mockImageProvider: ImageProvider = {
  id: "mock",
  async generateImageSet(request) {
    request.diagnostics.add("provider-submit", "info", "Loading mock image fixtures.", {
      imageCount: request.count,
    });
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    const imageDataUrls = await loadMockImages(request.count);
    request.diagnostics.add("provider-result", "success", "Mock image fixtures loaded.", {
      imageCount: imageDataUrls.length,
    });
    return {
      provider: "mock",
      imageDataUrls,
    };
  },
};

