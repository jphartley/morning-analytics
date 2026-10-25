import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ actor: vi.fn(), data: vi.fn(), provider: vi.fn(), images: vi.fn(), allocate: vi.fn() }));
vi.mock("@/lib/server-authorization", async original => ({
  ...await original<typeof import("@/lib/server-authorization")>(), requireActor: mocks.actor,
}));
vi.mock("@/lib/gemini", () => ({ analyzeWithGemini: mocks.provider }));
vi.mock("@/lib/image-generation-orchestrator", () => ({ executeImageGeneration: mocks.images }));
vi.mock("@/lib/authorized-image-storage", async original => ({
  ...await original<typeof import("@/lib/authorized-image-storage")>(), allocateAnalysisResource: mocks.allocate,
}));
vi.mock("@/lib/memory-service", () => ({ selectMemoryContext: mocks.data, updateMemoryForSavedAnalysis: mocks.data }));
vi.mock("@/lib/memory-storage", () => ({ getNewestEntriesForReplay: mocks.data, listMemoriesWithEvidence: mocks.data, resetMemoryStore: mocks.data }));
vi.mock("@/lib/memory-rebuild", async original => ({
  ...await original<typeof import("@/lib/memory-rebuild")>(), rebuildMemoryStore: mocks.data,
}));
import * as actions from "./actions";
import { ActionError } from "@/lib/action-errors";
import { testActor } from "@/test/actor";

const id = "00000000-0000-4000-8000-000000000001";
const cases: [string, () => Promise<{success:boolean;errorCode?:string}>][] = [
  ["analyzeText",()=>actions.analyzeText({journalText:"Synthetic entry"})],
  ["compareTextAnalyses",()=>actions.compareTextAnalyses({journalText:"Synthetic entry"})],
  ["generateImages",()=>actions.generateImages({imagePrompt:"Synthetic image"})],
  ["saveAnalysis",()=>actions.saveAnalysis({inputText:"Entry",analysisText:"Analysis",imagePrompt:null})],
  ["updateMemory",()=>actions.updateMemory({analysisId:id})],
  ["getMemoryStore",()=>actions.getMemoryStore()],
  ["resetMemory",()=>actions.resetMemory()],
  ["prepareMemoryRebuild",()=>actions.prepareMemoryRebuild({count:2})],
  ["rebuildMemoryEntry",()=>actions.rebuildMemoryEntry({analysisId:id})],
  ["rebuildMemory",()=>actions.rebuildMemory({count:2})],
  ["regenerateImages",()=>actions.regenerateImages({analysisId:id})],
  ["deleteAnalysis",()=>actions.deleteAnalysis({analysisId:id})],
];
beforeEach(()=>vi.resetAllMocks());

describe("action authorization before side effects",()=>{
  it.each(cases)("%s rejects an unverified caller before data, storage or provider work",async (_name,call)=>{
    mocks.actor.mockRejectedValue(new ActionError("unauthenticated","Please sign in again."));
    expect(await call()).toMatchObject({success:false,errorCode:"unauthenticated"});
    for(const observer of [mocks.data,mocks.provider,mocks.images,mocks.allocate]) expect(observer).not.toHaveBeenCalled();
  });
  it.each(cases)("%s fails closed on unavailable account settings",async (_name,call)=>{
    mocks.actor.mockRejectedValue(new ActionError("account-settings-unavailable","Please retry."));
    expect(await call()).toMatchObject({success:false,errorCode:"account-settings-unavailable"});
    for(const observer of [mocks.data,mocks.provider,mocks.images,mocks.allocate]) expect(observer).not.toHaveBeenCalled();
  });
  const adminOnly=cases.filter(([name])=>["compareTextAnalyses","updateMemory","getMemoryStore","resetMemory","prepareMemoryRebuild","rebuildMemoryEntry","rebuildMemory"].includes(name));
  it.each(adminOnly)("%s rejects ordinary users before protected work",async (_name,call)=>{
    const from=vi.fn();mocks.actor.mockResolvedValue(testActor({from},"user","user"));
    expect(await call()).toMatchObject({success:false,errorCode:"forbidden"});
    for(const observer of [from,mocks.data,mocks.provider,mocks.images,mocks.allocate]) expect(observer).not.toHaveBeenCalled();
  });
  it("derives normal-user defaults without reading memory",async()=>{
    mocks.actor.mockResolvedValue(testActor({},"user","user"));
    mocks.provider.mockResolvedValue({analysisText:"Safe result",imagePrompt:null});
    expect(await actions.analyzeText({journalText:"Synthetic entry"})).toMatchObject({success:true,memoryContext:[]});
    expect(mocks.data).not.toHaveBeenCalled();
    expect(mocks.provider).toHaveBeenCalledWith("Synthetic entry","gemini-3.1-pro-preview","jungian",[]);
  });
  it.each(["with-memory","invalid"])("rejects restricted memory selection %s",async value=>{
    mocks.actor.mockResolvedValue(testActor({},"user","user"));
    expect((await actions.analyzeText({journalText:"Entry",memoryMode:value as "with-memory"})).success).toBe(false);
    expect(mocks.provider).not.toHaveBeenCalled();expect(mocks.data).not.toHaveBeenCalled();
  });
  it("rejects legacy identity payloads",async()=>{
    mocks.actor.mockResolvedValue(testActor({},"user","user"));
    const input={journalText:"Entry",userId:"someone-else"};
    expect(await actions.analyzeText(input)).toMatchObject({success:false,errorCode:"invalid-input"});
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("does not let administrators bypass the Test gate",async()=>{
    vi.stubEnv("NEXT_PUBLIC_TEST_VIEW_ENABLED","false");
    mocks.actor.mockResolvedValue(testActor());
    expect(await actions.resetMemory()).toMatchObject({success:false,errorCode:"forbidden"});
    expect(mocks.data).not.toHaveBeenCalled();vi.unstubAllEnvs();
  });
  it("does not disclose raw failures",async()=>{
    mocks.actor.mockRejectedValue(new Error("credential and private journal text"));
    const result=await actions.getMemoryStore();
    expect(JSON.stringify(result)).not.toMatch(/credential|private journal/);
  });
});
