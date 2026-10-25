import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";

const request = new AsyncLocalStorage<Map<string,string>>();
const providers=vi.hoisted(()=>({text:vi.fn(),images:vi.fn()}));
vi.mock("next/headers",()=>({cookies:async()=>({
  getAll:()=>[...(request.getStore() || new Map()).entries()].map(([name,value])=>({name,value})),
  set:(name:string,value:string)=>request.getStore()?.set(name,value),
})}));
vi.mock("./gemini",()=>({analyzeWithGemini:providers.text}));
vi.mock("./memory-ai",()=>({selectRelevantMemoryIds:vi.fn(async()=>[]),inferMemoryUpdates:vi.fn(async()=>[])}));
vi.mock("./image-providers/midjourney",()=>({midjourneyImageProvider:{id:"midjourney",generateImageSet:providers.images}}));
import * as actions from "@/app/actions";

const fixturePath=process.env.AUTH_TEST_CONFIG;
const configured=fixturePath ? Object.fromEntries(readFileSync(fixturePath,"utf8").trim().split("\n").map(line=>{
  const i=line.indexOf("=");return [line.slice(0,i),line.slice(i+1).replace(/^["']|["']$/g,"")];
})) : {};
if(fixturePath && !["127.0.0.1","localhost","::1"].includes(new URL(configured.API_URL).hostname)) {
  throw new Error("Integration tests require an isolated loopback Supabase project.");
}
type Account={id:string;label:string;email:string;password:string;session:{access_token:string;refresh_token:string}};
let accounts:Account[]=[];
let admin:SupabaseClient;
let owner:SupabaseClient;
let other:SupabaseClient;
let ownerCookies:Map<string,string>;
let otherCookies:Map<string,string>;
let savedId:string;
const invoke=<T>(cookies:Map<string,string>,fn:()=>Promise<T>)=>request.run(new Map(cookies),fn);

describe.runIf(!!fixturePath)("isolated Supabase authorization",()=>{
  beforeAll(async()=>{
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL",configured.API_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY",configured.ANON_KEY);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY",configured.SERVICE_ROLE_KEY);
    vi.stubEnv("IMAGE_GENERATION_PROVIDER","midjourney");
    vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE","");
    vi.stubEnv("NEXT_PUBLIC_TEST_VIEW_ENABLED","true");
    accounts=JSON.parse(readFileSync(new URL("accounts.json",`file://${fixturePath}`),"utf8"));
    admin=createClient(configured.API_URL,configured.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    for(const account of accounts){
      const loginClient=createClient(configured.API_URL,configured.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
      const login=await loginClient.auth.signInWithPassword({email:account.email,password:account.password});
      if(login.error || !login.data.session)throw Error("Synthetic fixture sign-in failed");
      account.session=login.data.session;
    }
    const authenticated=(token:string)=>createClient(configured.API_URL,configured.ANON_KEY,{
      global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false},
    });
    owner=authenticated(accounts[0].session.access_token);other=authenticated(accounts[1].session.access_token);
    const cookiesFor=async(account:Account)=>{
      const values=new Map<string,string>();
      const c=createServerClient(configured.API_URL,configured.ANON_KEY,{cookies:{
        getAll:()=>[...values].map(([name,value])=>({name,value})),
        setAll:items=>items.forEach(({name,value})=>values.set(name,value)),
      }});
      const {error}=await c.auth.setSession(account.session);if(error)throw Error("Synthetic session setup failed");
      return values;
    };
    [ownerCookies,otherCookies]=await Promise.all(accounts.map(cookiesFor));
    const role=await admin.from("profiles").update({role:"admin"}).eq("id",accounts[0].id);
    if(role.error)throw Error("Synthetic admin setup failed");
  },30000);
  beforeEach(()=>{
    providers.text.mockReset().mockResolvedValue({analysisText:"Synthetic analysis",imagePrompt:"Synthetic image"});
    providers.images.mockReset().mockResolvedValue({provider:"midjourney",imageDataUrls:Array(4).fill("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1kAAAAASUVORK5CYII=")});
  });
  afterAll(()=>vi.unstubAllEnvs());

  const calls: [string,()=>Promise<{success:boolean;errorCode?:string}>][]=[
    ["analyzeText",()=>actions.analyzeText({journalText:"Synthetic entry"})],
    ["compareTextAnalyses",()=>actions.compareTextAnalyses({journalText:"Synthetic entry"})],
    ["generateImages",()=>actions.generateImages({imagePrompt:"Synthetic image"})],
    ["saveAnalysis",()=>actions.saveAnalysis({inputText:"Entry",analysisText:"Analysis",imagePrompt:null})],
    ["updateMemory",()=>actions.updateMemory({analysisId:randomUUID()})],
    ["getMemoryStore",()=>actions.getMemoryStore()],
    ["resetMemory",()=>actions.resetMemory()],
    ["prepareMemoryRebuild",()=>actions.prepareMemoryRebuild({count:1})],
    ["rebuildMemoryEntry",()=>actions.rebuildMemoryEntry({analysisId:randomUUID()})],
    ["rebuildMemory",()=>actions.rebuildMemory({count:1})],
    ["regenerateImages",()=>actions.regenerateImages({analysisId:randomUUID()})],
    ["deleteAnalysis",()=>actions.deleteAnalysis({analysisId:randomUUID()})],
  ];
  it.each(calls)("%s rejects a missing real session",async(_name,call)=>{
    expect(await invoke(new Map(),call)).toMatchObject({success:false,errorCode:"unauthenticated"});
    expect(providers.text).not.toHaveBeenCalled();expect(providers.images).not.toHaveBeenCalled();
  });
  it("saves an owned analysis and keeps browser history isolated",async()=>{
    const saved=await invoke(ownerCookies,()=>actions.saveAnalysis({inputText:"Synthetic original",analysisText:"Synthetic analysis",imagePrompt:"Synthetic image"}));
    expect(saved.success).toBe(true);savedId=saved.id!;
    expect((await owner.from("analyses").select("id").eq("id",savedId)).data).toHaveLength(1);
    expect((await other.from("analyses").select("id").eq("id",savedId)).data).toEqual([]);
    expect((await other.from("analyses").update({analysis_text:"forged"}).eq("id",savedId).select("id")).data).toEqual([]);
  });
  it("denies foreign analysis actions before provider work",async()=>{
    for(const call of [()=>actions.regenerateImages({analysisId:savedId}),()=>actions.deleteAnalysis({analysisId:savedId})]){
      expect(await invoke(otherCookies,call)).toMatchObject({success:false,errorCode:"resource-unavailable"});
    }
    expect(providers.images).not.toHaveBeenCalled();
    expect((await owner.from("analyses").select("id").eq("id",savedId)).data).toHaveLength(1);
  });
  it("denies privileged memory actions for ordinary accounts",async()=>{
    for(const [name,call] of calls.filter(([name])=>["compareTextAnalyses","updateMemory","getMemoryStore","resetMemory","prepareMemoryRebuild","rebuildMemoryEntry","rebuildMemory"].includes(name))){
      expect(await invoke(otherCookies,call),name).toMatchObject({success:false,errorCode:"forbidden"});
    }
    expect(providers.text).not.toHaveBeenCalled();expect(providers.images).not.toHaveBeenCalled();
  });
  it("prevents browser role escalation and unallocated/foreign resource claims",async()=>{
    const update=await other.from("profiles").update({role:"admin"}).eq("id",accounts[1].id);
    expect(update.error).not.toBeNull();
    const unallocated=await other.from("analyses").insert({id:randomUUID(),user_id:accounts[1].id,input_text:"Entry",analysis_text:"Analysis",model_id:"gemini-3.1-pro-preview"});
    expect(unallocated.error).not.toBeNull();
    const reservation=await admin.from("analysis_resources").select("id").eq("id",savedId).single();
    expect(reservation.error).toBeNull();
    const mutation=await other.from("analysis_resources").update({user_id:accounts[1].id}).eq("id",savedId);
    expect(mutation.error).not.toBeNull();
    const rename=await owner.from("analyses").update({id:randomUUID()}).eq("id",savedId);
    expect(rename.error).not.toBeNull();
  });
  it("binds pending generated images and permits only owner save and cleanup",async()=>{
    const generated=await invoke(ownerCookies,()=>actions.generateImages({imagePrompt:"Synthetic image"}));
    expect(generated.success).toBe(true);
    const payload={inputText:"Synthetic original",analysisText:"Synthetic analysis",imagePrompt:"Synthetic image",analysisId:generated.analysisId!,imagePaths:generated.imagePaths,imageGenerationBatches:generated.batches};
    expect(await invoke(otherCookies,()=>actions.saveAnalysis(payload))).toMatchObject({success:false,errorCode:"resource-unavailable"});
    const stolen=await other.from("analyses").insert({id:generated.analysisId,user_id:accounts[1].id,input_text:"Entry",analysis_text:"Analysis",model_id:"gemini-3.1-pro-preview"});
    expect(stolen.error).not.toBeNull();
    const overwrite=await other.storage.from("analysis-images").upload(generated.imagePaths![0],Buffer.from("forged"),{upsert:true,contentType:"image/png"});
    expect(overwrite.error).not.toBeNull();
    const saved=await invoke(ownerCookies,()=>actions.saveAnalysis(payload));expect(saved.success).toBe(true);
    expect(await invoke(ownerCookies,()=>actions.regenerateImages({analysisId:saved.id!}))).toMatchObject({success:true});
    expect(await invoke(ownerCookies,()=>actions.deleteAnalysis({analysisId:saved.id!}))).toMatchObject({success:true});
    expect((await owner.from("analysis_resources").select("id").eq("id",saved.id!)).data).toHaveLength(1);
  });
  it("applies current database role to live memory and preserves dormant records",async()=>{
    const memoryId=randomUUID();
    const inserted=await admin.from("memories").insert({id:memoryId,user_id:accounts[0].id,title:"Synthetic context",summary:"Synthetic summary",confidence:0.5,significance:0.5,temporal_status:"active",first_observed_at:new Date().toISOString(),last_observed_at:new Date().toISOString()});
    expect(inserted.error).toBeNull();
    expect((await owner.from("memories").select("id").eq("id",memoryId)).data).toHaveLength(1);
    expect((await other.from("memories").select("id")).data).toEqual([]);
    await admin.from("profiles").update({role:"user"}).eq("id",accounts[0].id);
    expect(await invoke(ownerCookies,()=>actions.getMemoryStore())).toMatchObject({success:false,errorCode:"forbidden"});
    expect((await owner.from("memories").select("id").eq("id",memoryId)).data).toEqual([]);
    expect((await owner.from("memories").delete().eq("id",memoryId).select("id")).data).toEqual([]);
    expect((await admin.from("memories").select("id").eq("id",memoryId)).data).toHaveLength(1);
    await admin.from("profiles").update({role:"admin"}).eq("id",accounts[0].id);
  });
  it("keeps simultaneous action identities separate",async()=>{
    const payload={inputText:"Concurrency fixture",analysisText:"Synthetic analysis",imagePrompt:null};
    const [a,b]=await Promise.all([invoke(ownerCookies,()=>actions.saveAnalysis(payload)),invoke(otherCookies,()=>actions.saveAnalysis(payload))]);
    expect(a.success && b.success).toBe(true);
    const {data}=await admin.from("analyses").select("id,user_id").in("id",[a.id,b.id]);
    expect(data?.find(r=>r.id===a.id)?.user_id).toBe(accounts[0].id);
    expect(data?.find(r=>r.id===b.id)?.user_id).toBe(accounts[1].id);
  });
  it("keeps a second administrator isolated and rejects foreign evidence parents",async()=>{
    const foreignMemory=randomUUID();
    await admin.from("memories").insert({id:foreignMemory,user_id:accounts[1].id,title:"Foreign context",summary:"Synthetic summary",confidence:0.5,significance:0.5,temporal_status:"active",first_observed_at:new Date().toISOString(),last_observed_at:new Date().toISOString()});
    await admin.from("profiles").update({role:"admin"}).eq("id",accounts[1].id);
    try {
      expect((await other.from("analyses").select("id").eq("id",savedId)).data).toEqual([]);
      expect(await invoke(otherCookies,()=>actions.updateMemory({analysisId:savedId}))).toMatchObject({success:false,errorCode:"resource-unavailable"});
      expect(await invoke(otherCookies,()=>actions.regenerateImages({analysisId:savedId}))).toMatchObject({success:false,errorCode:"resource-unavailable"});
      expect(providers.images).not.toHaveBeenCalled();
      expect((await owner.from("memories").select("id").eq("id",foreignMemory)).data).toEqual([]);
      const evidence=await owner.from("memory_evidence").insert({memory_id:foreignMemory,user_id:accounts[0].id,source_analysis_id:savedId,source_entry_at:new Date().toISOString(),excerpt:"Synthetic excerpt",effect:"supports"});
      expect(evidence.error).not.toBeNull();
      const ownedMemory=randomUUID();
      await admin.from("memories").insert({id:ownedMemory,user_id:accounts[0].id,title:"Owned context",summary:"Synthetic summary",confidence:0.5,significance:0.5,temporal_status:"active",first_observed_at:new Date().toISOString(),last_observed_at:new Date().toISOString()});
      const foreignEntry=await invoke(otherCookies,()=>actions.saveAnalysis({inputText:"Foreign original",analysisText:"Synthetic analysis",imagePrompt:null}));
      const foreignSource=await owner.from("memory_evidence").insert({memory_id:ownedMemory,user_id:accounts[0].id,source_analysis_id:foreignEntry.id,source_entry_at:new Date().toISOString(),excerpt:"Synthetic excerpt",effect:"supports"});
      expect(foreignSource.error).not.toBeNull();
    } finally {
      await admin.from("profiles").update({role:"user"}).eq("id",accounts[1].id);
    }
  });
  it("rejects a tampered session cookie without provider work",async()=>{
    const forged=new Map(ownerCookies);
    const key=[...forged.keys()].find(name=>name.includes("auth-token"));
    expect(key).toBeDefined();
    forged.set(key!,"base64-"+Buffer.from(JSON.stringify({access_token:"forged",refresh_token:"forged",expires_at:9999999999})).toString("base64url"));
    expect(await invoke(forged,()=>actions.generateImages({imagePrompt:"Synthetic image"}))).toMatchObject({success:false,errorCode:"unauthenticated"});
    expect(providers.images).not.toHaveBeenCalled();
  });
});
