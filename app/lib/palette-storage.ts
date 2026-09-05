/**
 * Single source of truth for palette persistence and applying data-palette on <html>.
 * Keep PALETTE_BOOTSTRAP_SCRIPT in sync with getStoredPaletteId + applyPaletteToDocument.
 */

export const PALETTE_STORAGE_KEY = "palette";

export const DEFAULT_PALETTE_ID = "inkwell";

export const VALID_PALETTE_IDS = [
  "", "moss", "inkwell", "dusk-rose", "amber-den", "sage", "plum",
  "terracotta", "ocean", "lavender", "sepia", "nordic", "cherry",
  "forest", "copper", "twilight", "matcha", "slate-coral", "midnight",
  "sandstorm",
] as const;

/** Persisted when the UI palette id is "" (Reverie); distinguishes from "key missing" → default Inkwell. */
export const REVERIE_STORAGE_VALUE = "reverie";

export function getStoredPaletteId(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
      if (raw === null) {
        return DEFAULT_PALETTE_ID;
      }
      if (raw === REVERIE_STORAGE_VALUE) {
        return "";
      }
      return raw !== "" && VALID_PALETTE_IDS.includes(raw as (typeof VALID_PALETTE_IDS)[number])
        ? raw
        : DEFAULT_PALETTE_ID;
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_PALETTE_ID;
}

/** Persists the palette; empty string (Reverie) uses REVERIE_STORAGE_VALUE so reload can restore it. */
export function writeStoredPaletteId(paletteIdForDom: string): void {
  if (paletteIdForDom === "") {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, REVERIE_STORAGE_VALUE);
  } else {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, paletteIdForDom);
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
  ";var p=",
  JSON.stringify(VALID_PALETTE_IDS),
  ";if(raw===null)v=d;else if(raw===r)v=\"\";else v=raw!==\"\"&&p.indexOf(raw)>=0?raw:d;",
  "var el=document.documentElement;",
  "if(v){el.dataset.palette=v}else{delete el.dataset.palette}",
  "}catch(e){}})();",
].join("");
