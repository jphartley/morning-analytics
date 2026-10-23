import { afterEach, expect, it, vi } from "vitest";
import sharp from "sharp";
import { splitGridImage } from "./image-splitter";

afterEach(() => vi.unstubAllGlobals());

it("decodes a downloaded grid into four correctly ordered JPEG quadrants using the native image library", async () => {
  const colours = [
    [220, 20, 20],
    [20, 220, 20],
    [20, 20, 220],
    [220, 220, 20],
  ];
  const pixels = Buffer.alloc(128 * 128 * 3);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const colour = colours[(y >= 64 ? 2 : 0) + (x >= 64 ? 1 : 0)];
      pixels.set(colour, (y * 128 + x) * 3);
    }
  }
  const grid = await sharp(pixels, { raw: { width: 128, height: 128, channels: 3 } }).png().toBuffer();
  const fetchImage = vi.fn().mockResolvedValue(new Response(new Uint8Array(grid)));
  vi.stubGlobal("fetch", fetchImage);

  const images = await splitGridImage("https://cdn.example.test/grid.png");

  expect(fetchImage).toHaveBeenCalledWith("https://cdn.example.test/grid.png");
  expect(images).toHaveLength(4);
  for (const [index, image] of images.entries()) {
    expect(image).toMatch(/^data:image\/jpeg;base64,/);
    const jpeg = Buffer.from(image.split(",")[1], "base64");
    expect(await sharp(jpeg).metadata()).toMatchObject({ format: "jpeg", width: 64, height: 64 });
    const centre = await sharp(jpeg).extract({ left: 32, top: 32, width: 1, height: 1 }).raw().toBuffer();
    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(centre[channel] - colours[index][channel])).toBeLessThan(15);
    }
  }
});
