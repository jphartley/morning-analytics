"use client";

import { useState } from "react";

const ANALYST_PERSONAS = [
  {
    id: "jungian",
    displayName: "Jungian Analyst",
    description: "Psychoanalytic depth – symbolic insights, spiritual perspective",
  },
  {
    id: "mel-robbins",
    displayName: "Mel Robbins",
    description: "Action-oriented – bold moves, practical breakthrough",
  },
  {
    id: "loving-parent",
    displayName: "Loving Parent",
    description: "Compassionate – empathetic support, nurturing perspective",
  },
];

const DEFAULT_PERSONA = "jungian";

interface AnalystPickerProps {
  onPersonaChange: (persona: string) => void;
}

export function AnalystPicker({ onPersonaChange }: AnalystPickerProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>(DEFAULT_PERSONA);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (persona: string) => {
    setSelectedPersona(persona);
    onPersonaChange(persona);
    setIsOpen(false);
  };

  const currentPersona = ANALYST_PERSONAS.find((p) => p.id === selectedPersona) || ANALYST_PERSONAS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
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
          <div className="absolute right-0 mt-2 w-72 bg-white border border-stone-200 rounded-lg shadow-lg z-20">
            {ANALYST_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleSelect(persona.id)}
                className={`w-full px-4 py-3 text-left hover:bg-stone-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  persona.id === selectedPersona ? "bg-amber-50" : ""
                }`}
              >
                <div className="font-medium text-stone-800">{persona.displayName}</div>
                <div className="text-sm text-stone-500">{persona.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
