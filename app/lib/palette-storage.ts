/**
 * Single source of truth for palette persistence and applying data-palette on <html>.
 * Keep PALETTE_BOOTSTRAP_SCRIPT in sync with getStoredPaletteId + applyPaletteToDocument.
 */

export const PALETTE_STORAGE_KEY = "palette";

export const DEFAULT_PALETTE_ID = "inkwell";

/** Persisted when the UI palette id is "" (Reverie); distinguishes from "key missing" → default Inkwell. */
export const REVERIE_STORAGE_VALUE = "reverie";

export function getStoredPaletteId(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (raw === null) {
        return DEFAULT_PALETTE_ID;
      }
      if (raw === REVERIE_STORAGE_VALUE) {
        return "";
      }
      return raw;
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_PALETTE_ID;
}

/** Persists the palette; empty string (Reverie) uses REVERIE_STORAGE_VALUE so reload can restore it. */
export function writeStoredPaletteId(paletteIdForDom: string): void {
  if (paletteIdForDom === "") {
    localStorage.setItem(PALETTE_STORAGE_KEY, REVERIE_STORAGE_VALUE);
  } else {
    localStorage.setItem(PALETTE_STORAGE_KEY, paletteIdForDom);
  }
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

/** Minified IIFE for root layout (beforeInteractive); logic mirrors getStoredPaletteId + applyPaletteToDocument. */
export const PALETTE_BOOTSTRAP_SCRIPT = [
  "(function(){try{",
  "var k=",
  JSON.stringify(PALETTE_STORAGE_KEY),
  ";var d=",
  JSON.stringify(DEFAULT_PALETTE_ID),
  ";var r=",
  JSON.stringify(REVERIE_STORAGE_VALUE),
  ";var raw=localStorage.getItem(k);var v;",
  "if(raw===null)v=d;else if(raw===r)v=\"\";else v=raw;",
  "var el=document.documentElement;",
  "if(v){el.dataset.palette=v}else{delete el.dataset.palette}",
  "}catch(e){}})();",
].join("");
