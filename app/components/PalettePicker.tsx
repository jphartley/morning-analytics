"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "palette";

const PALETTES = [
  { id: "", label: "Reverie", color: "#7c3aed" },
  { id: "moss", label: "Moss Garden", color: "#059669" },
  { id: "inkwell", label: "Inkwell", color: "#6366f1" },
  { id: "dusk-rose", label: "Dusk Rose", color: "#be185d" },
  { id: "amber-den", label: "Amber Den", color: "#b45309" },
  { id: "sage", label: "Sage Whisper", color: "#4d7c0f" },
  { id: "plum", label: "Plum Depths", color: "#9333ea" },
  { id: "terracotta", label: "Terracotta", color: "#c2410c" },
  { id: "ocean", label: "Ocean", color: "#0891b2" },
  { id: "lavender", label: "Lavender Haze", color: "#8b5cf6" },
  { id: "sepia", label: "Sepia", color: "#a16207" },
  { id: "nordic", label: "Nordic", color: "#4b5563" },
  { id: "cherry", label: "Cherry Blossom", color: "#e11d48" },
  { id: "forest", label: "Forest", color: "#15803d" },
  { id: "copper", label: "Copper", color: "#b8621b" },
  { id: "twilight", label: "Twilight", color: "#5b4fc7" },
  { id: "matcha", label: "Matcha", color: "#65803d" },
  { id: "slate-coral", label: "Slate Coral", color: "#f43f5e" },
  { id: "midnight", label: "Midnight", color: "#a78bfa" },
  { id: "sandstorm", label: "Sandstorm", color: "#c07028" },
];

function getStoredPalette(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY) || "";
    }
  } catch {}
  return "";
}

function applyPalette(id: string) {
  if (id) {
    document.documentElement.dataset.palette = id;
  } else {
    delete document.documentElement.dataset.palette;
  }
}

export function PalettePicker() {
  const [current, setCurrent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredPalette();
    applyPalette(stored);
    setCurrent(stored);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [expanded]);

  const handleSwitch = (id: string) => {
    applyPalette(id);
    setCurrent(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  const currentLabel = PALETTES.find((p) => p.id === current)?.label || "Reverie";

  return (
    <div ref={containerRef} className="fixed bottom-4 left-4 z-50">
      {expanded && (
        <div className="mb-2 rounded-xl bg-black/85 p-3 shadow-xl backdrop-blur max-w-xs">
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-2 px-0.5">
            Choose your palette
          </p>
          <div className="grid grid-cols-5 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                title={p.label}
                className="group relative w-9 h-9 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: p.color,
                  boxShadow: current === p.id ? "0 0 0 2px white" : "none",
                }}
              >
                {current === p.id && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </span>
                )}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-full bg-black/80 px-3 py-2 shadow-lg backdrop-blur text-white text-xs font-medium hover:bg-black/90 transition"
      >
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: PALETTES.find((p) => p.id === current)?.color }}
        />
        {currentLabel}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
