/**
 * Single source of truth for palette persistence and applying data-palette on <html>.
 * Keep PALETTE_BOOTSTRAP_SCRIPT in sync with getStoredPaletteId + applyPaletteToDocument.
 */

export const PALETTE_STORAGE_KEY = "palette";

export const DEFAULT_PALETTE_ID = "inkwell";

export function getStoredPaletteId(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(PALETTE_STORAGE_KEY) || DEFAULT_PALETTE_ID;
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_PALETTE_ID;
}

export function applyPaletteToDocument(id: string): void {
  if (typeof document === "undefined") {
    return;
  }
  if (id) {
    document.documentElement.dataset.palette = id;
  } else {
    delete document.documentElement.dataset.palette;
  }
}

/** Minified IIFE for root layout (beforeInteractive); logic mirrors the functions above. */
export const PALETTE_BOOTSTRAP_SCRIPT = [
  "(function(){try{",
  "var k=",
  JSON.stringify(PALETTE_STORAGE_KEY),
  ";var d=",
  JSON.stringify(DEFAULT_PALETTE_ID),
  ";var v=localStorage.getItem(k)||d;var el=document.documentElement;",
  "if(v){el.dataset.palette=v}else{delete el.dataset.palette}",
  "}catch(e){}})();",
].join("");
