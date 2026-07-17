"use client";

import { useState } from "react";
import { ANALYST_PERSONAS, type AnalystPersona } from "@/lib/top-bar-presets";

interface AnalystPickerProps {
  value: AnalystPersona;
  onChange: (persona: AnalystPersona) => void;
}

export function AnalystPicker({ value, onChange }: AnalystPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (persona: AnalystPersona) => {
    onChange(persona);
    setIsOpen(false);
  };

  const currentPersona = ANALYST_PERSONAS.find((persona) => persona.id === value) || ANALYST_PERSONAS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[42px] items-center gap-2 px-3 text-sm text-ink-muted bg-surface border border-outline rounded-lg hover:bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
      >
        <span className="font-medium">{currentPersona.displayName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-surface border border-outline rounded-lg shadow-lg z-20">
            {ANALYST_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleSelect(persona.id)}
                className={`w-full px-4 py-3 text-left hover:bg-page first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  persona.id === value ? "bg-accent-soft" : ""
                }`}
              >
                <div className="font-medium text-ink">{persona.displayName}</div>
                <div className="text-sm text-ink-muted">{persona.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
