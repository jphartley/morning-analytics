export type ViewDensityMode = "quiet" | "insight" | "test";

export const VIEW_DENSITY_STORAGE_KEY = "morning-analytics-view-density";
export const DEFAULT_VIEW_DENSITY_MODE: ViewDensityMode = "insight";

export const VIEW_DENSITY_MODES: ViewDensityMode[] = ["quiet", "insight", "test"];

export function isViewDensityMode(value: string | null): value is ViewDensityMode {
  return value === "quiet" || value === "insight" || value === "test";
}

export function getStoredViewDensityMode(): ViewDensityMode {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(VIEW_DENSITY_STORAGE_KEY);
      if (isViewDensityMode(stored)) {
        return stored;
      }
    }
  } catch {
    // localStorage unavailable.
  }

  return DEFAULT_VIEW_DENSITY_MODE;
}

export function setStoredViewDensityMode(mode: ViewDensityMode): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(VIEW_DENSITY_STORAGE_KEY, mode);
    }
  } catch {
    // localStorage unavailable.
  }
}
