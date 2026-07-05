"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { analyzeText, generateImages, saveAnalysis, regenerateImages, TextAnalysisResponse } from "./actions";
import { getAnalysisById } from "@/lib/analytics-storage-client";
import { JournalInput } from "@/components/JournalInput";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ImageGrid } from "@/components/ImageGrid";
import { ImagePromptDisclosure } from "@/components/ImagePromptDisclosure";
import { RegenerateButton } from "@/components/RegenerateButton";
import { LoadingState, ANALYSIS_MESSAGES, IMAGE_MESSAGES } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Lightbox } from "@/components/Lightbox";
import { ImageGenerationDiagnosticsDisclosure } from "@/components/ImageGenerationDiagnosticsDisclosure";
import { getStoredModel, ModelPicker } from "@/components/ModelPicker";
import { AnalystPicker } from "@/components/AnalystPicker";
import { HistorySidebar } from "@/components/HistorySidebar";
import { AppHeader } from "@/components/AppHeader";
import { WelcomeEmptyState } from "@/components/WelcomeEmptyState";
import { ViewDensityControl } from "@/components/ViewDensityControl";
import { useAuth } from "@/lib/useAuth";
import { omitMarkdownNode } from "@/lib/markdown-props";
import { ImageGenerationDiagnostics } from "@/lib/image-generation-diagnostics";
import { getStoredViewDensityMode, setStoredViewDensityMode, ViewDensityMode } from "@/lib/view-density";

type AppState = "idle" | "analyzing" | "text-ready" | "complete" | "error" | "viewing-history";

interface HistoryViewData {
  id: string;
  inputText: string;
  analysisText: string;
  imageUrls: string[];
  imagePrompt?: string | null;
  analystPersona?: string | null;
}

const MAX_IMAGES = 20;
const isMockMode = process.env.NEXT_PUBLIC_IMAGE_PROVIDER === "mock";

export default function Home() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [journalText, setJournalText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<TextAnalysisResponse | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(getStoredModel);
  const [selectedPersona, setSelectedPersona] = useState<string>("jungian");
  const [viewMode, setViewMode] = useState<ViewDensityMode>(getStoredViewDensityMode);
  const [isPending, startTransition] = useTransition();

  // History state
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyViewData, setHistoryViewData] = useState<HistoryViewData | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [isHistoryEmpty, setIsHistoryEmpty] = useState<boolean | null>(null);

  // Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [imageGenerationStatus, setImageGenerationStatus] = useState<string | null>(null);
  const [imageGenerationDiagnostics, setImageGenerationDiagnostics] = useState<ImageGenerationDiagnostics | null>(null);
  const [imageGenerationStartedAt, setImageGenerationStartedAt] = useState<number | null>(null);
  const [imageGenerationElapsedSeconds, setImageGenerationElapsedSeconds] = useState<number | null>(null);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    if (state !== "text-ready" || !imageGenerationStartedAt) return;

    const timer = setInterval(() => {
      setImageGenerationElapsedSeconds(Math.max(0, Math.floor((Date.now() - imageGenerationStartedAt) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [imageGenerationStartedAt, state]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, []);

  const handlePersonaChange = useCallback((persona: string) => {
    setSelectedPersona(persona);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewDensityMode) => {
    setViewMode(mode);
    setStoredViewDensityMode(mode);
  }, []);

  const handleHistoryEmptyChange = useCallback((isEmpty: boolean) => {
    setIsHistoryEmpty(isEmpty);
  }, []);

  const handleAnalyze = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setState("analyzing");
    setError(null);
    setSaveError(null);
    setImageUrls([]);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics(null);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
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
      setCurrentImagePrompt(textResult.imagePrompt || null);
      setState("text-ready");

      // Phase 2: Generate images in background
      let imagePaths: string[] = [];
      let uploadErrorMessage: string | null = null;
      let imageGenerationErrorMessage: string | null = null;
      let analysisId: string | undefined;
      if (textResult.imagePrompt) {
        setImageGenerationStatus("Image generation request is still running.");
        setImageGenerationStartedAt(Date.now());
        setImageGenerationElapsedSeconds(0);
        const imageResult = await generateImages(textResult.imagePrompt, user!.id);
        setImageGenerationStartedAt(null);
        setImageGenerationElapsedSeconds(null);
        setImageGenerationDiagnostics(imageResult.diagnostics || null);

        if (imageResult.success && imageResult.imageUrls) {
          setImageUrls(imageResult.imageUrls);
          imagePaths = imageResult.imagePaths || [];
          analysisId = imageResult.analysisId;
          setImageGenerationStatus(imageResult.uploadError
            ? "Images generated, but storage upload needs attention."
            : "Images generated successfully.");
          if (imageResult.uploadError) {
            uploadErrorMessage = imageResult.uploadError;
          }
        } else if (!imageResult.success) {
          imageGenerationErrorMessage = imageResult.error || "Failed to generate images";
          analysisId = imageResult.analysisId;
          setImageGenerationStatus(imageGenerationErrorMessage);
        }
      } else {
        setImageGenerationStartedAt(null);
        setImageGenerationElapsedSeconds(null);
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
        setCurrentAnalysisId(saveResult.id);
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
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics(null);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
  };

  const handleNewAnalysis = () => {
    setState("idle");
    setJournalText("");
    setAnalysisResult(null);
    setImageUrls([]);
    setError(null);
    setSaveError(null);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics(null);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
    setSelectedHistoryId(null);
    setHistoryViewData(null);
    setCurrentAnalysisId(null);
    setCurrentImagePrompt(null);
  };

  const handleHistorySelect = async (id: string) => {
    setSelectedHistoryId(id);
    setState("viewing-history");
    setError(null);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics(null);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);

    const result = await getAnalysisById(id);

    if (result.success && result.data) {
      setHistoryViewData({
        id: result.data.id,
        inputText: result.data.input_text,
        analysisText: result.data.analysis_text,
        imageUrls: result.data.imageUrls,
        imagePrompt: result.data.image_prompt,
        analystPersona: result.data.analyst_persona,
      });
    } else {
      setError(result.error || "Failed to load analysis");
      setState("error");
    }
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handleRegenerate = async () => {
    // Determine which analysis to regenerate for
    const analysisId = state === "viewing-history" ? historyViewData?.id : currentAnalysisId;
    if (!analysisId || !user) return;

    setIsRegenerating(true);
    setSaveError(null);
    setImageGenerationStatus("Requesting four more Midjourney images.");
    setImageGenerationDiagnostics(null);
    setImageGenerationStartedAt(Date.now());
    setImageGenerationElapsedSeconds(0);

    const result = await regenerateImages(analysisId, user.id);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
    setImageGenerationDiagnostics(result.diagnostics || null);

    if (result.success && result.imageUrls) {
      if (state === "viewing-history" && historyViewData) {
        // Refresh the history view with appended images
        setHistoryViewData({
          ...historyViewData,
          imageUrls: [...historyViewData.imageUrls, ...result.imageUrls],
        });
      } else {
        // Append to current analysis images
        setImageUrls((prev) => [...prev, ...result.imageUrls!]);
      }
      if (result.uploadError) {
        setSaveError(result.uploadError);
        setImageGenerationStatus("Images regenerated, but storage update needs attention.");
      } else {
        setImageGenerationStatus("Images regenerated successfully.");
        setSuccessToast("4 new images added");
      }
    } else {
      const message = result.error || "Failed to regenerate images";
      setImageGenerationStatus(message);
      setSaveError(message);
    }

    setIsRegenerating(false);
  };

  const showWelcomeEmptyState = state === "idle" && isHistoryEmpty === true;
  const isQuietMode = viewMode === "quiet";
  const isInsightOrTestMode = viewMode === "insight" || viewMode === "test";
  const isTestMode = viewMode === "test";

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
        onHistoryEmptyChange={handleHistoryEmptyChange}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="max-w-3xl mx-auto px-4 py-12">
          {isMockMode && isTestMode && (
            <div className="mb-6 rounded-lg border border-outline bg-accent-soft px-4 py-2 text-center text-sm text-ink">
              Mock mode active — using local images for faster testing.
            </div>
          )}
          <header className={showWelcomeEmptyState ? "mb-6" : "mb-12"}>
            <div className="flex justify-between items-start mb-4">
              <div />
              <div className="flex flex-wrap justify-end gap-3">
                <AnalystPicker onPersonaChange={handlePersonaChange} />
                {!isQuietMode && (
                  <ModelPicker onModelChange={handleModelChange} />
                )}
                <ViewDensityControl value={viewMode} onChange={handleViewModeChange} />
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
            {showWelcomeEmptyState && (
              <div className="mt-6 text-left">
                <WelcomeEmptyState />
              </div>
            )}
          </header>

          {state === "idle" && (
            <JournalInput
              value={journalText}
              onChange={setJournalText}
              onAnalyze={handleAnalyze}
              disabled={isPending}
              showWritingStats={isInsightOrTestMode}
            />
          )}

          {state === "analyzing" && (
            <LoadingState
              messages={ANALYSIS_MESSAGES}
              durationHint="Usually takes ~15 seconds"
              showDurationHint={isInsightOrTestMode}
            />
          )}

          {state === "error" && error && (
            <ErrorState
              message={error}
              onRetry={handleRetry}
            />
          )}

          {(state === "text-ready" || state === "complete") && analysisResult && (
            <div className="space-y-8">
              <AnalysisPanel
                analysisText={analysisResult.analysisText || ""}
                showReadingMetadata={isInsightOrTestMode}
              />

              {state === "text-ready" && (
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-ink mb-4">Generated Images</h2>
                  <div className="bg-surface border border-outline rounded-lg">
                    <LoadingState
                      messages={IMAGE_MESSAGES}
                      durationHint="Usually takes about a minute"
                      showDurationHint={isInsightOrTestMode}
                    />
                  </div>
                  {isTestMode && (
                    <div className="mt-2">
                      <ImageGenerationDiagnosticsDisclosure
                        diagnostics={null}
                        statusMessage={imageGenerationStatus}
                        pendingStartedAt={imageGenerationStartedAt}
                        pendingElapsedSeconds={imageGenerationElapsedSeconds}
                      />
                    </div>
                  )}
                </div>
              )}

              {state === "complete" && (
                <>
                  <ImageGrid imageUrls={imageUrls} onImageClick={handleImageClick} />
                  {imageGenerationStatus && imageUrls.length === 0 && (
                    <div className="rounded-lg border border-outline bg-surface p-4">
                      <h2 className="text-xl font-semibold text-ink mb-2">Generated Images</h2>
                      <p className="text-sm text-ink-muted">{imageGenerationStatus}</p>
                    </div>
                  )}
                  {isTestMode && (
                    <ImageGenerationDiagnosticsDisclosure
                      diagnostics={imageGenerationDiagnostics}
                      statusMessage={imageGenerationStatus}
                      pendingStartedAt={imageGenerationStartedAt}
                      pendingElapsedSeconds={imageGenerationElapsedSeconds}
                    />
                  )}
                  {isInsightOrTestMode && currentImagePrompt && imageUrls.length > 0 && (
                    <ImagePromptDisclosure imagePrompt={currentImagePrompt} />
                  )}
                  {currentImagePrompt && currentAnalysisId && (
                    <RegenerateButton
                      onClick={handleRegenerate}
                      isRegenerating={isRegenerating}
                      imageCount={imageUrls.length}
                      maxImages={MAX_IMAGES}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Viewing historical analysis */}
          {state === "viewing-history" && historyViewData && (
            <div className="space-y-8">
              {isInsightOrTestMode && historyViewData.analystPersona && (
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
                <ReactMarkdown
                  allowedElements={["h1", "h2", "h3", "strong", "em", "ul", "ol", "li", "p", "br"]}
                  components={{
                    h1: (props) => (
                      <h1 className="text-xl font-bold text-ink mt-6 mb-4" {...omitMarkdownNode(props)} />
                    ),
                    h2: (props) => (
                      <h2 className="text-lg font-bold text-ink mt-5 mb-3" {...omitMarkdownNode(props)} />
                    ),
                    h3: (props) => (
                      <h3 className="text-base font-bold text-ink mt-4 mb-2" {...omitMarkdownNode(props)} />
                    ),
                    p: (props) => (
                      <p className="mb-4 text-ink leading-relaxed" {...omitMarkdownNode(props)} />
                    ),
                    ul: (props) => (
                      <ul className="list-disc list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />
                    ),
                    ol: (props) => (
                      <ol className="list-decimal list-inside mb-4 text-ink" {...omitMarkdownNode(props)} />
                    ),
                    li: (props) => (
                      <li className="mb-1" {...omitMarkdownNode(props)} />
                    ),
                  }}
                >
                  {historyViewData.inputText}
                </ReactMarkdown>
              </div>

              <AnalysisPanel
                analysisText={historyViewData.analysisText}
                showReadingMetadata={isInsightOrTestMode}
              />

              {historyViewData.imageUrls.length > 0 && (
                <>
                  <ImageGrid imageUrls={historyViewData.imageUrls} onImageClick={handleImageClick} />
                  {isInsightOrTestMode && historyViewData.imagePrompt && (
                    <ImagePromptDisclosure imagePrompt={historyViewData.imagePrompt} />
                  )}
                </>
              )}
              {historyViewData.imagePrompt && (
                <RegenerateButton
                  onClick={handleRegenerate}
                  isRegenerating={isRegenerating}
                  imageCount={historyViewData.imageUrls.length}
                  maxImages={MAX_IMAGES}
                />
              )}
              {isTestMode && (
                <ImageGenerationDiagnosticsDisclosure
                  diagnostics={imageGenerationDiagnostics}
                  statusMessage={imageGenerationStatus}
                  pendingStartedAt={imageGenerationStartedAt}
                  pendingElapsedSeconds={imageGenerationElapsedSeconds}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          imageUrls={state === "viewing-history" && historyViewData ? historyViewData.imageUrls : imageUrls}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
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

      {/* Success toast */}
      {successToast && (
        <div className="fixed bottom-4 right-4 bg-accent-soft border border-outline text-ink px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-sm">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-ink-muted hover:text-ink font-bold"
          >
            ×
          </button>
        </div>
      )}
      </div>
    </>
  );
}
