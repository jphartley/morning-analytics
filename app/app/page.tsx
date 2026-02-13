"use client";

import { useState, useTransition, useCallback } from "react";
import { analyzeText, generateImages, TextAnalysisResponse } from "./actions";
import { JournalInput } from "@/components/JournalInput";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ImageGrid } from "@/components/ImageGrid";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Lightbox } from "@/components/Lightbox";
import { ModelPicker } from "@/components/ModelPicker";
import { DEFAULT_MODEL_ID } from "@/lib/models";

type AppState = "idle" | "analyzing" | "text-ready" | "complete" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [journalText, setJournalText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<TextAnalysisResponse | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [isPending, startTransition] = useTransition();

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  const handleAnalyze = () => {
    setState("analyzing");
    setError(null);

    startTransition(async () => {
      // Phase 1: Get text analysis
      const textResult = await analyzeText(journalText, selectedModel);

      if (!textResult.success) {
        setError(textResult.error || "Failed to analyze text.");
        setState("error");
        return;
      }

      // Show text immediately
      setAnalysisResult(textResult);
      setState("text-ready");

      // Phase 2: Generate images in background
      if (textResult.imagePrompt) {
        const imageResult = await generateImages(textResult.imagePrompt);

        if (imageResult.success && imageResult.imageUrls) {
          setImageUrls(imageResult.imageUrls);
        }
        // Note: We don't fail the whole flow if images fail
        // User still has their analysis
      }

      setState("complete");
    });
  };

  const handleRetry = () => {
    setState("idle");
    setAnalysisResult(null);
    setImageUrls([]);
    setError(null);
  };

  const handleReset = () => {
    setState("idle");
    setJournalText("");
    setAnalysisResult(null);
    setImageUrls([]);
    setError(null);
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="flex justify-between items-start mb-4">
            <div />
            <ModelPicker onModelChange={handleModelChange} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-stone-800 mb-2">
              Morning Analytics
            </h1>
            <p className="text-lg text-stone-600">
              AI-powered insights from your morning pages
            </p>
          </div>
        </header>

        {state === "idle" && (
          <JournalInput
            value={journalText}
            onChange={setJournalText}
            onAnalyze={handleAnalyze}
            disabled={isPending}
          />
        )}

        {state === "analyzing" && <LoadingState message="Analyzing your morning pages..." />}

        {state === "error" && error && (
          <ErrorState
            message={error}
            onRetry={handleRetry}
          />
        )}

        {(state === "text-ready" || state === "complete") && analysisResult && (
          <div className="space-y-8">
            <AnalysisPanel analysisText={analysisResult.analysisText || ""} />

            {state === "text-ready" && (
              <div className="w-full">
                <h2 className="text-xl font-semibold text-stone-800 mb-4">Generated Images</h2>
                <div className="flex items-center justify-center py-12 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-stone-600">Generating images...</p>
                  </div>
                </div>
              </div>
            )}

            {state === "complete" && (
              <ImageGrid imageUrls={imageUrls} onImageClick={handleImageClick} />
            )}

            <div className="text-center">
              <button
                className="py-2 px-6 text-base font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                onClick={handleReset}
              >
                Analyze New Entry
              </button>
            </div>
          </div>
        )}
      </main>

      {lightboxImage && (
        <Lightbox imageUrl={lightboxImage} onClose={handleCloseLightbox} />
      )}
    </div>
  );
}
