"use client";

import { useState, useTransition, useCallback } from "react";
import { analyzeText, generateImages, saveAnalysis, TextAnalysisResponse } from "./actions";
import { getAnalysisById } from "@/lib/analytics-storage-client";
import { JournalInput } from "@/components/JournalInput";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ImageGrid } from "@/components/ImageGrid";
import { LoadingState, ANALYSIS_MESSAGES, IMAGE_MESSAGES } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Lightbox } from "@/components/Lightbox";
import { ModelPicker } from "@/components/ModelPicker";
import { AnalystPicker } from "@/components/AnalystPicker";
import { HistorySidebar } from "@/components/HistorySidebar";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/useAuth";
import { DEFAULT_MODEL_ID } from "@/lib/models";

type AppState = "idle" | "analyzing" | "text-ready" | "complete" | "error" | "viewing-history";

interface HistoryViewData {
  id: string;
  inputText: string;
  analysisText: string;
  imageUrls: string[];
  analystPersona?: string | null;
}

const isMockMode = process.env.NEXT_PUBLIC_IMAGE_PROVIDER === "mock";

export default function Home() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [journalText, setJournalText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<TextAnalysisResponse | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedPersona, setSelectedPersona] = useState<string>("jungian");
  const [isPending, startTransition] = useTransition();

  // History state
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyViewData, setHistoryViewData] = useState<HistoryViewData | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  const handlePersonaChange = useCallback((persona: string) => {
    setSelectedPersona(persona);
  }, []);

  const handleAnalyze = () => {
    setState("analyzing");
    setError(null);
    setSaveError(null);
    setSelectedHistoryId(null);
    setHistoryViewData(null);

    startTransition(async () => {
      // Phase 1: Get text analysis
      const textResult = await analyzeText(journalText, user!.id, selectedModel, selectedPersona);

      if (!textResult.success) {
        setError(textResult.error || "Failed to analyze text.");
        setState("error");
        return;
      }

      // Show text immediately
      setAnalysisResult(textResult);
      setState("text-ready");

      // Phase 2: Generate images in background
      let imagePaths: string[] = [];
      let uploadErrorMessage: string | null = null;
      let imageGenerationErrorMessage: string | null = null;
      let analysisId: string | undefined;
      if (textResult.imagePrompt) {
        const imageResult = await generateImages(textResult.imagePrompt, user!.id);

        if (imageResult.success && imageResult.imageUrls) {
          setImageUrls(imageResult.imageUrls);
          imagePaths = imageResult.imagePaths || [];
          analysisId = imageResult.analysisId;
          if (imageResult.uploadError) {
            uploadErrorMessage = imageResult.uploadError;
          }
        } else if (!imageResult.success) {
          imageGenerationErrorMessage = imageResult.error || "Failed to generate images";
          analysisId = imageResult.analysisId;
        }
      }

      setState("complete");

      // Phase 3: Save to history (uses storage paths, not base64)
      const saveResult = await saveAnalysis(
        journalText,
        textResult.analysisText || "",
        textResult.imagePrompt || null,
        selectedModel,
        imagePaths,
        user!.id,
        analysisId,
        selectedPersona
      );

      const nonBlockingErrorMessage = imageGenerationErrorMessage || uploadErrorMessage;

      if (saveResult.success && saveResult.id) {
        // Refresh history and select the new entry
        setHistoryRefreshTrigger((prev) => prev + 1);
        setSelectedHistoryId(saveResult.id);
        if (nonBlockingErrorMessage) {
          setSaveError(nonBlockingErrorMessage);
        }
      } else if (!saveResult.success) {
        setSaveError(saveResult.error || "Failed to save analysis");
      }
    });
  };

  const handleRetry = () => {
    setState("idle");
    setAnalysisResult(null);
    setImageUrls([]);
    setError(null);
    setSaveError(null);
  };

  const handleNewAnalysis = () => {
    setState("idle");
    setJournalText("");
    setAnalysisResult(null);
    setImageUrls([]);
    setError(null);
    setSaveError(null);
    setSelectedHistoryId(null);
    setHistoryViewData(null);
  };

  const handleHistorySelect = async (id: string) => {
    setSelectedHistoryId(id);
    setState("viewing-history");
    setError(null);

    const result = await getAnalysisById(id);

    if (result.success && result.data) {
      setHistoryViewData({
        id: result.data.id,
        inputText: result.data.input_text,
        analysisText: result.data.analysis_text,
        imageUrls: result.data.imageUrls,
        analystPersona: result.data.analyst_persona,
      });
    } else {
      setError(result.error || "Failed to load analysis");
      setState("error");
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-page flex">
      {/* History Sidebar */}
      <HistorySidebar
        selectedId={selectedHistoryId}
        onSelect={handleHistorySelect}
        onNewAnalysis={handleNewAnalysis}
        refreshTrigger={historyRefreshTrigger}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="max-w-3xl mx-auto px-4 py-12">
          {isMockMode && (
            <div className="mb-6 rounded-lg border border-outline bg-accent-soft px-4 py-2 text-center text-sm text-ink">
              Mock mode active — using local images for faster testing.
            </div>
          )}
          <header className="mb-12">
            <div className="flex justify-between items-start mb-4">
              <div />
              <div className="flex gap-3">
                <AnalystPicker onPersonaChange={handlePersonaChange} />
                <ModelPicker onModelChange={handleModelChange} />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-ink mb-2">
                Morning Analytics
              </h1>
              <p className="text-lg text-ink-muted">
                Insights From Your Morning Pages
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

          {state === "analyzing" && <LoadingState messages={ANALYSIS_MESSAGES} durationHint="Usually takes ~15 seconds" />}

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
                  <h2 className="text-xl font-semibold text-ink mb-4">Generated Images</h2>
                  <div className="bg-surface border border-outline rounded-lg">
                    <LoadingState messages={IMAGE_MESSAGES} durationHint="Usually takes about a minute" />
                  </div>
                </div>
              )}

              {state === "complete" && (
                <ImageGrid imageUrls={imageUrls} onImageClick={handleImageClick} />
              )}
            </div>
          )}

          {/* Viewing historical analysis */}
          {state === "viewing-history" && historyViewData && (
            <div className="space-y-8">
              {historyViewData.analystPersona && (
                <div className="bg-accent-soft border border-outline rounded-lg p-3 mb-4">
                  <p className="text-sm text-ink">
                    <span className="font-medium">Analyzed by:</span>{" "}
                    {historyViewData.analystPersona === "jungian"
                      ? "Jungian Analyst"
                      : historyViewData.analystPersona === "mel-robbins"
                        ? "Mel Robbins"
                        : historyViewData.analystPersona === "loving-parent"
                          ? "Loving Parent"
                          : historyViewData.analystPersona}
                  </p>
                </div>
              )}
              <div className="bg-surface border border-outline rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-ink-muted mb-2">Original Input</h3>
                <p className="text-ink whitespace-pre-wrap">{historyViewData.inputText}</p>
              </div>

              <AnalysisPanel analysisText={historyViewData.analysisText} />

              {historyViewData.imageUrls.length > 0 && (
                <ImageGrid imageUrls={historyViewData.imageUrls} onImageClick={handleImageClick} />
              )}
            </div>
          )}
        </main>
      </div>

      {lightboxImage && (
        <Lightbox imageUrl={lightboxImage} onClose={handleCloseLightbox} />
      )}

      {/* Save error toast */}
      {saveError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-sm">{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ×
          </button>
        </div>
      )}
      </div>
    </>
  );
}
