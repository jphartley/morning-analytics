"use client";

import { useState, useEffect } from "react";
import { GEMINI_MODELS, DEFAULT_MODEL_ID, GeminiModel } from "@/lib/models";

const STORAGE_KEY = "gemini-model";

interface ModelPickerProps {
  onModelChange: (modelId: string) => void;
}

function getStoredModel(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && GEMINI_MODELS.some((m) => m.id === stored)) {
        return stored;
      }
    }
  } catch {
    // localStorage unavailable (SSR, private browsing, etc.)
  }
  return DEFAULT_MODEL_ID;
}

function setStoredModel(modelId: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, modelId);
    }
  } catch {
    // localStorage unavailable
  }
}

export function ModelPicker({ onModelChange }: ModelPickerProps) {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredModel();
    setSelectedModel(stored);
    onModelChange(stored);
  }, [onModelChange]);

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setStoredModel(modelId);
    onModelChange(modelId);
    setIsOpen(false);
  };

  const currentModel = GEMINI_MODELS.find((m) => m.id === selectedModel) || GEMINI_MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-muted bg-surface border border-outline rounded-lg hover:bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
      >
        <span className="font-medium">{currentModel.displayName}</span>
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
            {GEMINI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`w-full px-4 py-3 text-left hover:bg-page first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  model.id === selectedModel ? "bg-accent-soft" : ""
                }`}
              >
                <div className="font-medium text-ink">{model.displayName}</div>
                <div className="text-sm text-ink-muted">{model.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
