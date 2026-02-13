import sharp from "sharp";

/**
 * Splits a Midjourney 2x2 grid image into 4 separate images
 * Returns base64 data URLs for each quadrant
 */
export async function splitGridImage(imageUrl: string): Promise<string[]> {
  // Fetch the image from Discord CDN
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width === 0 || height === 0) {
    throw new Error("Could not determine image dimensions");
  }

  // Calculate quadrant dimensions
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);

  // Define the 4 quadrant regions
  const quadrants = [
    { left: 0, top: 0, width: halfWidth, height: halfHeight }, // top-left
    { left: halfWidth, top: 0, width: halfWidth, height: halfHeight }, // top-right
    { left: 0, top: halfHeight, width: halfWidth, height: halfHeight }, // bottom-left
    { left: halfWidth, top: halfHeight, width: halfWidth, height: halfHeight }, // bottom-right
  ];

  // Extract each quadrant and convert to base64
  const splitImages = await Promise.all(
    quadrants.map(async (region) => {
      const quadrantBuffer = await sharp(imageBuffer)
        .extract(region)
        .jpeg({ quality: 90 })
        .toBuffer();

      const base64 = quadrantBuffer.toString("base64");
      return `data:image/jpeg;base64,${base64}`;
    })
  );

  return splitImages;
}
