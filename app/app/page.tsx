"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { analyzeText, generateImages, saveAnalysis, regenerateImages, TextAnalysisResponse } from "./actions";
import { getAnalysisById } from "@/lib/analytics-storage-client";
import { JournalInput } from "@/components/JournalInput";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ProviderImageGroups } from "@/components/ProviderImageGroups";
import { ImagePromptDisclosure } from "@/components/ImagePromptDisclosure";
import { OriginalEntryDisclosure } from "@/components/OriginalEntryDisclosure";
import { RegenerateButton } from "@/components/RegenerateButton";
import { LoadingState, ANALYSIS_MESSAGES, IMAGE_MESSAGES } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Lightbox } from "@/components/Lightbox";
import {
  ImageGenerationDiagnosticsDisclosure,
  ImageGenerationDiagnosticsList,
} from "@/components/ImageGenerationDiagnosticsDisclosure";
import { ModelPicker } from "@/components/ModelPicker";
import { AnalystPicker } from "@/components/AnalystPicker";
import { HistorySidebar } from "@/components/HistorySidebar";
import { AppHeader } from "@/components/AppHeader";
import { WelcomeEmptyState } from "@/components/WelcomeEmptyState";
import { ViewDensityControl } from "@/components/ViewDensityControl";
import { ImageProviderPicker } from "@/components/ImageProviderPicker";
import { useAuth } from "@/lib/useAuth";
import { ImageGenerationDiagnostics } from "@/lib/image-generation-diagnostics";
import {
  DEFAULT_ANALYST_PERSONA,
  DEFAULT_VIEW_DENSITY_MODE,
  getStoredTopBarPresets,
  setStoredAnalystPersona,
  setStoredImageProvider,
  setStoredModel,
  setStoredViewDensityMode,
  type AnalystPersona,
  type ViewDensityMode,
} from "@/lib/top-bar-presets";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { IMAGE_PROVIDER_IDS } from "@/lib/image-providers/types";
import type { ImageProviderId } from "@/lib/image-providers/types";
import {
  ImageDisplayGroup,
  ImageGenerationBatch,
  ImageGenerationSelection,
  flattenDisplayGroupUrls,
  providerResultGroupToDisplayGroup,
  requiredImageCapacity,
} from "@/lib/image-generation-types";

type AppState = "idle" | "analyzing" | "text-ready" | "complete" | "error" | "viewing-history";

interface HistoryViewData {
  id: string;
  inputText: string;
  analysisText: string;
  imageGroups: ImageDisplayGroup[];
  imagePrompt?: string | null;
  analystPersona?: string | null;
  createdAt?: string | null;
}

const MAX_IMAGES = 20;
const providerOverrideEnabled = process.env.NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED === "true";
const dualModeEnabled = process.env.NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED === "true";
const configuredProvider = process.env.NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER;
const defaultImageProvider: ImageProviderId = IMAGE_PROVIDER_IDS.includes(
  configuredProvider as ImageProviderId
)
  ? configuredProvider as ImageProviderId
  : "midjourney";

export default function Home() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [journalText, setJournalText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<TextAnalysisResponse | null>(null);
  const [imageGroups, setImageGroups] = useState<ImageDisplayGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedPersona, setSelectedPersona] = useState<AnalystPersona>(DEFAULT_ANALYST_PERSONA);
  const [viewMode, setViewMode] = useState<ViewDensityMode>(DEFAULT_VIEW_DENSITY_MODE);
  const [selectedImageProvider, setSelectedImageProvider] = useState<ImageGenerationSelection>(defaultImageProvider);
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
  const [imageGenerationDiagnostics, setImageGenerationDiagnostics] = useState<ImageGenerationDiagnostics[]>([]);
  const [imageGenerationStartedAt, setImageGenerationStartedAt] = useState<number | null>(null);
  const [imageGenerationElapsedSeconds, setImageGenerationElapsedSeconds] = useState<number | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedPresets = getStoredTopBarPresets(
        defaultImageProvider,
        providerOverrideEnabled,
        dualModeEnabled
      );

      setSelectedModel(storedPresets.modelId);
      setSelectedPersona(storedPresets.analystPersona);
      setViewMode(storedPresets.viewDensityMode);
      setSelectedImageProvider(storedPresets.imageProvider);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

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
    setStoredModel(modelId);
  }, []);

  const handlePersonaChange = useCallback((persona: AnalystPersona) => {
    setSelectedPersona(persona);
    setStoredAnalystPersona(persona);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewDensityMode) => {
    setViewMode(mode);
    setStoredViewDensityMode(mode);
  }, []);

  const handleImageProviderChange = useCallback((provider: ImageGenerationSelection) => {
    setSelectedImageProvider(provider);
    setStoredImageProvider(provider);
  }, []);

  const handleHistoryEmptyChange = useCallback((isEmpty: boolean) => {
    setIsHistoryEmpty(isEmpty);
  }, []);

  const handleAnalyze = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setState("analyzing");
    setError(null);
    setSaveError(null);
    setImageGroups([]);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics([]);
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
      let imageGenerationBatches: ImageGenerationBatch[] = [];
      let uploadErrorMessage: string | null = null;
      let imageGenerationErrorMessage: string | null = null;
      let analysisId: string | undefined;
      if (textResult.imagePrompt) {
        setImageGenerationStatus("Image generation request is still running.");
        setImageGenerationStartedAt(Date.now());
        setImageGenerationElapsedSeconds(0);
        const imageResult = await generateImages(
          textResult.imagePrompt,
          user!.id,
          viewMode === "test" && selectedImageProvider !== defaultImageProvider
            ? selectedImageProvider
            : null,
          viewMode === "test"
        );
        setImageGenerationStartedAt(null);
        setImageGenerationElapsedSeconds(null);
        setImageGenerationDiagnostics(imageResult.diagnostics || []);
        if (imageResult.groups) {
          setImageGroups(imageResult.groups.map(providerResultGroupToDisplayGroup));
        }

        if (imageResult.success && imageResult.imageUrls) {
          imagePaths = imageResult.imagePaths || [];
          imageGenerationBatches = imageResult.batches || [];
          analysisId = imageResult.analysisId;
          setImageGenerationStatus(imageResult.partial
            ? "One provider succeeded and one provider failed."
            : imageResult.uploadError
              ? "Images generated, but storage upload needs attention."
              : "Images generated successfully.");
          if (imageResult.uploadError) {
            uploadErrorMessage = imageResult.uploadError;
          }
        } else if (!imageResult.success) {
          imageGenerationErrorMessage = imageResult.error || "Failed to generate images";
          imageGenerationBatches = imageResult.batches || [];
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
        selectedPersona,
        imageGenerationBatches
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
    setImageGroups([]);
    setError(null);
    setSaveError(null);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics([]);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
  };

  const handleNewAnalysis = () => {
    setState("idle");
    setJournalText("");
    setAnalysisResult(null);
    setImageGroups([]);
    setError(null);
    setSaveError(null);
    setImageGenerationStatus(null);
    setImageGenerationDiagnostics([]);
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
    setImageGenerationDiagnostics([]);
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);

    const result = await getAnalysisById(id);

    if (result.success && result.data) {
      setHistoryViewData({
        id: result.data.id,
        inputText: result.data.input_text,
        analysisText: result.data.analysis_text,
        imageGroups: result.data.imageGroups,
        imagePrompt: result.data.image_prompt,
        analystPersona: result.data.analyst_persona,
        createdAt: result.data.created_at,
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
    const roundCapacity = requiredImageCapacity(selectedImageProvider);
    setImageGenerationStatus(`Requesting ${roundCapacity} more images.`);
    setImageGenerationDiagnostics([]);
    setImageGenerationStartedAt(Date.now());
    setImageGenerationElapsedSeconds(0);

    const result = await regenerateImages(
      analysisId,
      user.id,
      viewMode === "test" && selectedImageProvider !== defaultImageProvider
        ? selectedImageProvider
        : null,
      viewMode === "test"
    );
    setImageGenerationStartedAt(null);
    setImageGenerationElapsedSeconds(null);
    setImageGenerationDiagnostics(result.diagnostics || []);

    const newGroups = (result.groups || []).map(providerResultGroupToDisplayGroup);
    if (newGroups.length > 0) {
      if (state === "viewing-history" && historyViewData) {
        setHistoryViewData({
          ...historyViewData,
          imageGroups: [...historyViewData.imageGroups, ...newGroups],
        });
      } else {
        setImageGroups((previous) => [...previous, ...newGroups]);
      }
    }

    if (result.success) {
      if (result.uploadError) {
        setSaveError(result.uploadError);
        setImageGenerationStatus("Images regenerated, but storage update needs attention.");
      } else {
        setImageGenerationStatus(result.partial
          ? "One provider succeeded and one provider failed."
          : "Images regenerated successfully.");
        setSuccessToast(`${result.imageUrls?.length || 0} new images added`);
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
  const isMockProviderActive = selectedImageProvider === "mock";
  const currentImageUrls = flattenDisplayGroupUrls(imageGroups);
  const historyImageUrls = historyViewData
    ? flattenDisplayGroupUrls(historyViewData.imageGroups)
    : [];
  const regenerationCapacity = requiredImageCapacity(selectedImageProvider);

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
          {isMockProviderActive && isTestMode && (
            <div className="mb-6 rounded-lg border border-outline bg-accent-soft px-4 py-2 text-center text-sm text-ink">
              Mock mode active — using local images for faster testing.
            </div>
          )}
          <header className={showWelcomeEmptyState ? "mb-6" : "mb-12"}>
            <div className="flex items-center justify-between mb-4">
              <div />
              <div className="flex flex-wrap items-center justify-end gap-3">
                <AnalystPicker value={selectedPersona} onChange={handlePersonaChange} />
                {!isQuietMode && (
                  <ModelPicker value={selectedModel} onChange={handleModelChange} />
                )}
                {isTestMode && providerOverrideEnabled && (
                  <ImageProviderPicker
                    value={selectedImageProvider}
                    defaultProvider={defaultImageProvider}
                    dualModeEnabled={dualModeEnabled}
                    onChange={handleImageProviderChange}
                  />
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
                  <ProviderImageGroups groups={imageGroups} onImageClick={handleImageClick} />
                  {imageGenerationStatus && imageGroups.length === 0 && (
                    <div className="rounded-lg border border-outline bg-surface p-4">
                      <h2 className="text-xl font-semibold text-ink mb-2">Generated Images</h2>
                      <p className="text-sm text-ink-muted">{imageGenerationStatus}</p>
                    </div>
                  )}
                  {isTestMode && (
                    <ImageGenerationDiagnosticsList
                      diagnostics={imageGenerationDiagnostics}
                      statusMessage={imageGenerationStatus}
                    />
                  )}
                  {isInsightOrTestMode && currentImagePrompt && currentImageUrls.length > 0 && (
                    <ImagePromptDisclosure imagePrompt={currentImagePrompt} />
                  )}
                  {currentImagePrompt && currentAnalysisId && (
                    <RegenerateButton
                      onClick={handleRegenerate}
                      isRegenerating={isRegenerating}
                      imageCount={currentImageUrls.length}
                      maxImages={MAX_IMAGES}
                      requiredCapacity={regenerationCapacity}
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
              <OriginalEntryDisclosure
                key={historyViewData.id}
                inputText={historyViewData.inputText}
                createdAt={historyViewData.createdAt}
              />

              <AnalysisPanel
                analysisText={historyViewData.analysisText}
                showReadingMetadata={isInsightOrTestMode}
              />

              {historyViewData.imageGroups.length > 0 && (
                <>
                  <ProviderImageGroups
                    groups={historyViewData.imageGroups}
                    onImageClick={handleImageClick}
                  />
                  {isInsightOrTestMode && historyViewData.imagePrompt && (
                    <ImagePromptDisclosure imagePrompt={historyViewData.imagePrompt} />
                  )}
                </>
              )}
              {historyViewData.imagePrompt && (
                <RegenerateButton
                  onClick={handleRegenerate}
                  isRegenerating={isRegenerating}
                  imageCount={historyImageUrls.length}
                  maxImages={MAX_IMAGES}
                  requiredCapacity={regenerationCapacity}
                />
              )}
              {isTestMode && (
                <ImageGenerationDiagnosticsList
                  diagnostics={imageGenerationDiagnostics}
                  statusMessage={imageGenerationStatus}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          imageUrls={state === "viewing-history" && historyViewData ? historyImageUrls : currentImageUrls}
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
