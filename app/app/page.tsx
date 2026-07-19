"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { analyzeText, compareTextAnalyses, generateImages, saveAnalysis, regenerateImages, deleteAnalysis, updateMemory, TextAnalysisResponse, type BlindComparisonOption } from "./actions";
import { getAnalysisById } from "@/lib/analytics-storage-client";
import { selectNeighborId } from "@/lib/history-neighbor";
import { JournalInput } from "@/components/JournalInput";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ProviderImageGroups } from "@/components/ProviderImageGroups";
import { ImagePromptDisclosure } from "@/components/ImagePromptDisclosure";
import { OriginalEntryDisclosure } from "@/components/OriginalEntryDisclosure";
import { RegenerateButton } from "@/components/RegenerateButton";
import { LoadingState, ANALYSIS_MESSAGES, IMAGE_MESSAGES } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Lightbox } from "@/components/Lightbox";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import {
  ImageGenerationDiagnosticsDisclosure,
  ImageGenerationDiagnosticsList,
} from "@/components/ImageGenerationDiagnosticsDisclosure";
import { ModelPicker } from "@/components/ModelPicker";
import { AnalystPicker } from "@/components/AnalystPicker";
import { HistorySidebar, HistoryEntry, formatDateTime } from "@/components/HistorySidebar";
import { AppHeader } from "@/components/AppHeader";
import { WelcomeEmptyState } from "@/components/WelcomeEmptyState";
import { MemoryDiagnosticsDrawer } from "@/components/MemoryDiagnosticsDrawer";
import { assignBlindOptions, BlindMemoryComparison, type AssignedBlindOptions } from "@/components/BlindMemoryComparison";
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
import type { MemoryContextItem } from "@/lib/memory-types";
import {
  ImageDisplayGroup,
  ImageGenerationBatch,
  ImageGenerationSelection,
  flattenDisplayGroupUrls,
  providerResultGroupToDisplayGroup,
  requiredImageCapacity,
} from "@/lib/image-generation-types";

type AppState = "idle" | "analyzing" | "comparison-ready" | "text-ready" | "complete" | "error" | "viewing-history";

interface HistoryViewData {
  id: string;
  inputText: string;
  analysisText: string;
  imageGroups: ImageDisplayGroup[];
  imagePrompt?: string | null;
  analystPersona?: string | null;
  createdAt?: string | null;
  memoryContext: MemoryContextItem[];
}

const MAX_IMAGES = 20;
const providerOverrideEnabled = process.env.NEXT_PUBLIC_IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED === "true";
const dualModeEnabled = process.env.NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED === "true";
const testViewEnabled = process.env.NEXT_PUBLIC_TEST_VIEW_ENABLED !== "false";
// NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER is built in next.config.ts from the same
// IMAGE_GENERATION_PROVIDER || NEXT_PUBLIC_IMAGE_PROVIDER || "midjourney" chain the
// server uses (getDeploymentImageProviderId), so the client default mirrors the
// server default. The override guard below relies on this agreement.
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
  const [blindOptions, setBlindOptions] = useState<AssignedBlindOptions | null>(null);
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

  // Delete-analysis state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; dateLabel: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingRemovedId, setPendingRemovedId] = useState<string | null>(null);
  const [historyEntryIds, setHistoryEntryIds] = useState<string[]>([]);
  const newAnalysisButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedPresets = getStoredTopBarPresets(
        defaultImageProvider,
        providerOverrideEnabled,
        dualModeEnabled,
        testViewEnabled
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

  const handleHistoryEntriesChange = useCallback((entries: HistoryEntry[]) => {
    setHistoryEntryIds(entries.map((entry) => entry.id));
    setPendingRemovedId((current) =>
      current && !entries.some((entry) => entry.id === current) ? null : current
    );
  }, []);

  const handleRequestDelete = useCallback(
    (entry: { id: string; dateLabel: string }) => {
      setPendingRemovedId(null);
      setDeleteError(null);
      setPendingDelete(entry);
    },
    []
  );

  const prepareAnalysisRun = () => {
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
    setBlindOptions(null);
  };

  const completeChosenAnalysis = async (textResult: TextAnalysisResponse) => {
    setAnalysisResult(textResult);
    if (textResult.memoryWarning) {
      setSaveError(textResult.memoryWarning);
    }
    setCurrentImagePrompt(textResult.imagePrompt || null);
    setState("text-ready");

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
        selectedImageProvider !== defaultImageProvider ? selectedImageProvider : null
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
        if (imageResult.uploadError) uploadErrorMessage = imageResult.uploadError;
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
    const saveResult = await saveAnalysis(
      journalText,
      textResult.analysisText || "",
      textResult.imagePrompt || null,
      selectedModel,
      imagePaths,
      user!.id,
      analysisId,
      selectedPersona,
      imageGenerationBatches,
      textResult.memoryContext || []
    );

    const nonBlockingErrorMessage = imageGenerationErrorMessage || uploadErrorMessage;
    if (saveResult.success && saveResult.id) {
      setHistoryRefreshTrigger((prev) => prev + 1);
      setSelectedHistoryId(saveResult.id);
      setCurrentAnalysisId(saveResult.id);
      const memoryResult = await updateMemory(saveResult.id, user!.id, selectedModel);
      if (!memoryResult.success) {
        setSaveError(memoryResult.error || "Analysis saved, but contextual memory could not be updated.");
      }
      if (nonBlockingErrorMessage) setSaveError(nonBlockingErrorMessage);
    } else if (!saveResult.success) {
      setSaveError(saveResult.error || "Failed to save analysis");
    }
  };

  const handleAnalyze = () => {
    prepareAnalysisRun();

    startTransition(async () => {
      const textResult = await analyzeText(journalText, user!.id, selectedModel, selectedPersona);
      if (!textResult.success) {
        setError(textResult.error || "Failed to analyze text.");
        setState("error");
        return;
      }
      await completeChosenAnalysis(textResult);
    });
  };

  const handleBlindCompare = () => {
    prepareAnalysisRun();
    startTransition(async () => {
      const result = await compareTextAnalyses(journalText, user!.id, selectedModel, selectedPersona);
      if (!result.success || !result.withMemory || !result.withoutMemory) {
        setError(result.error || "Failed to compare analyses.");
        setState("error");
        return;
      }
      setBlindOptions(assignBlindOptions(result.withMemory, result.withoutMemory));
      setState("comparison-ready");
    });
  };

  const handleComparisonContinue = (option: BlindComparisonOption) => {
    setBlindOptions(null);
    startTransition(async () => {
      await completeChosenAnalysis(option);
    });
  };

  const handleComparisonCancel = () => {
    setBlindOptions(null);
    setState("idle");
  };

  const handleRetry = () => {
    setState("idle");
    setAnalysisResult(null);
    setBlindOptions(null);
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
    setBlindOptions(null);
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
        memoryContext: result.data.memory_context || [],
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
      selectedImageProvider !== defaultImageProvider ? selectedImageProvider : null
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

  const handleOpenDeleteForCurrent = () => {
    if (!historyViewData) return;
    setPendingRemovedId(null);
    setDeleteError(null);
    setPendingDelete({
      id: historyViewData.id,
      dateLabel: historyViewData.createdAt ? formatDateTime(historyViewData.createdAt) : "this analysis",
    });
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !user) return;

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteAnalysis(pendingDelete.id, user.id);

    if (!result.success) {
      setDeleteError(result.error || "Failed to delete analysis.");
      setIsDeleting(false);
      return;
    }

    const deletedId = pendingDelete.id;
    setPendingRemovedId(deletedId); // sidebar hides row synchronously -> opener leaves DOM
    setPendingDelete(null); // unmount dialog -> focus-restore effect -> fallback
    setIsDeleting(false);

    if (deletedId === selectedHistoryId) {
      // Deleted the entry that is currently open -> navigate to a sensible next view.
      const neighbor = selectNeighborId(historyEntryIds, deletedId);
      if (neighbor) {
        handleHistorySelect(neighbor);
      } else {
        handleNewAnalysis();
      }
    }
    // Else: deleted a non-selected entry -> leave selectedHistoryId/historyViewData untouched.

    setHistoryRefreshTrigger((prev) => prev + 1);
    setSuccessToast("Analysis deleted.");
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
        onRequestDelete={handleRequestDelete}
        onEntriesChange={handleHistoryEntriesChange}
        pendingRemovedId={pendingRemovedId}
        newAnalysisButtonRef={newAnalysisButtonRef}
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
                {providerOverrideEnabled && (
                  <ImageProviderPicker
                    value={selectedImageProvider}
                    defaultProvider={defaultImageProvider}
                    dualModeEnabled={dualModeEnabled}
                    onChange={handleImageProviderChange}
                  />
                )}
                <ViewDensityControl value={viewMode} onChange={handleViewModeChange} testViewEnabled={testViewEnabled} />
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
            <div>
              <JournalInput
                value={journalText}
                onChange={setJournalText}
                onAnalyze={handleAnalyze}
                disabled={isPending}
                showWritingStats={isInsightOrTestMode}
              />
              {isTestMode && testViewEnabled && (
                <button
                  type="button"
                  onClick={handleBlindCompare}
                  disabled={isPending || !journalText.trim()}
                  className="mt-3 w-full rounded-lg border border-outline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Run blind memory comparison
                </button>
              )}
            </div>
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

          {state === "comparison-ready" && blindOptions && (
            <BlindMemoryComparison
              options={blindOptions}
              onContinue={handleComparisonContinue}
              onCancel={handleComparisonCancel}
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleOpenDeleteForCurrent}
                  className="text-sm text-ink-muted hover:text-danger focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded transition-colors"
                >
                  Delete analysis
                </button>
              </div>
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

      {isTestMode && testViewEnabled && user && (
        <MemoryDiagnosticsDrawer
          userId={user.id}
          modelId={selectedModel}
          usedMemoryContext={state === "viewing-history"
            ? historyViewData?.memoryContext || []
            : analysisResult?.memoryContext || []}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteDialog
          dateLabel={pendingDelete.dateLabel}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          fallbackFocusRef={newAnalysisButtonRef}
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

      {/* Success toast (also serves as the accessible deletion-confirmation announcement) */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 bg-accent-soft border border-outline text-ink px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
        >
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
