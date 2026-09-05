import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PALETTE_ID,
  PALETTE_STORAGE_KEY,
  REVERIE_STORAGE_VALUE,
  getStoredPaletteId,
} from "@/lib/palette-storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("palette storage", () => {
  it("uses Inkwell when no stored palette exists", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null } });
    expect(getStoredPaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("uses Inkwell when browser storage contains an invalid palette", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "unknown" } });
    expect(getStoredPaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("uses Inkwell when browser storage contains an empty value", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => "" } });
    expect(getStoredPaletteId()).toBe(DEFAULT_PALETTE_ID);
  });

  it("keeps Reverie distinguishable from an absent preference", () => {
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => key === PALETTE_STORAGE_KEY ? REVERIE_STORAGE_VALUE : null },
    });
    expect(getStoredPaletteId()).toBe("");
  });
});
