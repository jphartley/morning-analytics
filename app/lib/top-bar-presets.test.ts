import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import {
  ANALYST_PERSONA_STORAGE_KEY,
  DEFAULT_ANALYST_PERSONA,
  DEFAULT_VIEW_DENSITY_MODE,
  IMAGE_PROVIDER_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  VIEW_DENSITY_STORAGE_KEY,
  getStoredAnalystPersona,
  getStoredImageProvider,
  getStoredModel,
  getStoredTopBarPresets,
  getStoredViewDensityMode,
  getAvailableViewDensityModes,
  setStoredAnalystPersona,
  setStoredImageProvider,
  setStoredModel,
  setStoredViewDensityMode,
} from "@/lib/top-bar-presets";

function createLocalStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

function installLocalStorage(localStorage: Storage): void {
  vi.stubGlobal("window", { localStorage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("top bar preset storage", () => {
  it("uses safe defaults during SSR or when no preferences are saved", () => {
    expect(getStoredAnalystPersona()).toBe(DEFAULT_ANALYST_PERSONA);
    expect(getStoredModel()).toBe(DEFAULT_MODEL_ID);
    expect(getStoredImageProvider("midjourney", true, true)).toBe("midjourney");
    expect(getStoredViewDensityMode()).toBe(DEFAULT_VIEW_DENSITY_MODE);
  });

  it("stores and restores all four preferences independently", () => {
    const localStorage = createLocalStorage();
    installLocalStorage(localStorage);

    setStoredAnalystPersona("mel-robbins");
    setStoredModel("gemini-3.1-pro-preview");
    setStoredImageProvider("dual");
    setStoredViewDensityMode("test");

    expect(getStoredAnalystPersona()).toBe("mel-robbins");
    expect(getStoredModel()).toBe("gemini-3.1-pro-preview");
    expect(getStoredImageProvider("midjourney", true, true)).toBe("dual");
    expect(getStoredViewDensityMode()).toBe("test");
    expect(getStoredTopBarPresets("midjourney", true, true)).toEqual({
      analystPersona: "mel-robbins",
      modelId: "gemini-3.1-pro-preview",
      imageProvider: "dual",
      viewDensityMode: "test",
    });
  });

  it("falls back when saved values are stale or invalid", () => {
    installLocalStorage(createLocalStorage({
      [ANALYST_PERSONA_STORAGE_KEY]: "retired-persona",
      [MODEL_STORAGE_KEY]: "retired-model",
      [IMAGE_PROVIDER_STORAGE_KEY]: "unknown-provider",
      [VIEW_DENSITY_STORAGE_KEY]: "verbose",
    }));

    expect(getStoredAnalystPersona()).toBe(DEFAULT_ANALYST_PERSONA);
    expect(getStoredModel()).toBe(DEFAULT_MODEL_ID);
    expect(getStoredImageProvider("black-forest-labs", true, true)).toBe("black-forest-labs");
    expect(getStoredViewDensityMode()).toBe(DEFAULT_VIEW_DENSITY_MODE);
  });

  it("does not restore provider selections that current flags make unavailable", () => {
    installLocalStorage(createLocalStorage({
      [IMAGE_PROVIDER_STORAGE_KEY]: "dual",
    }));

    expect(getStoredImageProvider("midjourney", true, false)).toBe("midjourney");
    expect(getStoredImageProvider("midjourney", false, true)).toBe("midjourney");
  });

  it("keeps in-session choices usable when localStorage throws", () => {
    const localStorage = {
      getItem: vi.fn(() => {
        throw new Error("storage disabled");
      }),
      setItem: vi.fn(() => {
        throw new Error("storage disabled");
      }),
    } as unknown as Storage;
    installLocalStorage(localStorage);

    expect(getStoredAnalystPersona()).toBe(DEFAULT_ANALYST_PERSONA);
    expect(getStoredModel()).toBe(DEFAULT_MODEL_ID);
    expect(getStoredImageProvider("midjourney", true, true)).toBe("midjourney");
    expect(getStoredViewDensityMode()).toBe(DEFAULT_VIEW_DENSITY_MODE);
    expect(() => setStoredAnalystPersona("loving-parent")).not.toThrow();
    expect(() => setStoredModel("gemini-3.5-flash")).not.toThrow();
    expect(() => setStoredImageProvider("mock")).not.toThrow();
    expect(() => setStoredViewDensityMode("quiet")).not.toThrow();
  });

  it("hides Test view and falls back from a stored Test preference when disabled", () => {
    installLocalStorage(createLocalStorage({
      [VIEW_DENSITY_STORAGE_KEY]: "test",
    }));

    expect(getAvailableViewDensityModes(false)).toEqual(["quiet", "insight"]);
    expect(getStoredViewDensityMode(false)).toBe("insight");
    expect(getStoredTopBarPresets("midjourney", true, true, false).viewDensityMode)
      .toBe("insight");
  });

  it("keeps Test view available when enabled or omitted", () => {
    expect(getAvailableViewDensityModes(true)).toEqual(["quiet", "insight", "test"]);
    expect(getStoredViewDensityMode()).toBe("insight");
  });
});
