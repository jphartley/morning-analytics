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
  getRoleAwareTopBarPresets,
  getAvailableViewDensityModes,
  setStoredAnalystPersona,
  setStoredImageProvider,
  setStoredModel,
  setStoredViewDensityMode,
} from "@/lib/top-bar-presets";
import { resolveRoleCapabilities } from "@/lib/role-capabilities";

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
    expect(getStoredImageProvider("midjourney", true, true, "black-forest-labs")).toBe("midjourney");
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", true)).viewDensityMode).toBe(DEFAULT_VIEW_DENSITY_MODE);
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
    expect(getStoredImageProvider("midjourney", true, true, "black-forest-labs")).toBe("dual");
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", true)).viewDensityMode).toBe("test");
    expect(getRoleAwareTopBarPresets("midjourney", true, true, resolveRoleCapabilities("admin", true), "black-forest-labs")).toEqual({
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
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", true)).viewDensityMode).toBe(DEFAULT_VIEW_DENSITY_MODE);
  });

  it("falls back from removed model IDs", () => {
    for (const modelId of ["gemini-3.1-flash-lite", "gemini-3.5-flash"]) {
      installLocalStorage(createLocalStorage({
        [MODEL_STORAGE_KEY]: modelId,
      }));

      expect(getStoredModel()).toBe(DEFAULT_MODEL_ID);
    }
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
    expect(getStoredImageProvider("midjourney", true, true, "black-forest-labs")).toBe("midjourney");
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", true)).viewDensityMode).toBe(DEFAULT_VIEW_DENSITY_MODE);
    expect(() => setStoredAnalystPersona("loving-parent")).not.toThrow();
    expect(() => setStoredModel("gemini-3.6-flash")).not.toThrow();
    expect(() => setStoredImageProvider("mock")).not.toThrow();
    expect(() => setStoredViewDensityMode("quiet")).not.toThrow();
  });

  it("hides Test view and falls back from a stored Test preference when disabled", () => {
    installLocalStorage(createLocalStorage({
      [VIEW_DENSITY_STORAGE_KEY]: "test",
    }));

    expect(getAvailableViewDensityModes(false)).toEqual(["quiet", "insight"]);
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", false)).viewDensityMode).toBe("insight");
    expect(getRoleAwareTopBarPresets("midjourney", true, true, resolveRoleCapabilities("admin", false)).viewDensityMode)
      .toBe("insight");
  });

  it("keeps Test view available when enabled or omitted", () => {
    expect(getAvailableViewDensityModes(true)).toEqual(["quiet", "insight", "test"]);
    expect(getRoleAwareTopBarPresets("midjourney", false, false, resolveRoleCapabilities("admin", true)).viewDensityMode).toBe("insight");
  });

  it("ignores stale experimental values for a normal user without deleting them", () => {
    installLocalStorage(createLocalStorage({
      [MODEL_STORAGE_KEY]: "gemini-3.6-flash",
      [IMAGE_PROVIDER_STORAGE_KEY]: "dual",
      [VIEW_DENSITY_STORAGE_KEY]: "test",
    }));

    expect(getRoleAwareTopBarPresets(
      "midjourney",
      true,
      true,
      resolveRoleCapabilities("user", true)
    )).toMatchObject({
      modelId: DEFAULT_MODEL_ID,
      imageProvider: "midjourney",
      viewDensityMode: "quiet",
    });
  });

  it("restores supported administrator selections in every available view", () => {
    installLocalStorage(createLocalStorage({
      [MODEL_STORAGE_KEY]: "gemini-3.6-flash",
      [IMAGE_PROVIDER_STORAGE_KEY]: "dual",
      [VIEW_DENSITY_STORAGE_KEY]: "quiet",
    }));

    expect(getRoleAwareTopBarPresets(
      "midjourney",
      true,
      true,
      resolveRoleCapabilities("admin", true),
      "black-forest-labs"
    )).toMatchObject({
      modelId: "gemini-3.6-flash",
      imageProvider: "dual",
      viewDensityMode: "quiet",
    });
  });
  it.each(["quiet", "insight", "test"])("ignores dormant BFL and Dual preferences in %s without deleting them", (view) => {
    for (const selection of ["black-forest-labs", "dual"]) {
      const localStorage = createLocalStorage({
        [IMAGE_PROVIDER_STORAGE_KEY]: selection,
        [VIEW_DENSITY_STORAGE_KEY]: view,
      });
      installLocalStorage(localStorage);
      expect(getRoleAwareTopBarPresets(
        "midjourney", true, true, resolveRoleCapabilities("admin", true)
      )).toMatchObject({ imageProvider: "midjourney", viewDensityMode: view });
      expect(localStorage.getItem(IMAGE_PROVIDER_STORAGE_KEY)).toBe(selection);
      expect(getStoredImageProvider("midjourney", true, true, "black-forest-labs")).toBe(selection);
      expect(getStoredImageProvider("midjourney", false, true, "black-forest-labs")).toBe("midjourney");
    }
  });

});
