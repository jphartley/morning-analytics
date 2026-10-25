import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks=vi.hoisted(()=>({claims:vi.fn(),create:vi.fn()}));
vi.mock("@supabase/ssr",()=>({createServerClient:mocks.create}));
import { updateSession } from "./session-proxy";

afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs()});
describe("session refresh responses",()=>{
  it("retains every cookie update and private headers when redirecting",async()=>{
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY","test-public-key");
    mocks.create.mockImplementation((_url,_key,{cookies})=>({auth:{getClaims:async()=>{
      cookies.setAll([{name:"session.0",value:"first",options:{path:"/"}}]);
      cookies.setAll([{name:"session.1",value:"second",options:{path:"/"}}]);
      return {data:{claims:{sub:"verified"}},error:null};
    }}}));
    const response=await updateSession(new NextRequest("http://localhost:3000/signin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(response.cookies.get("session.0")?.value).toBe("first");
    expect(response.cookies.get("session.1")?.value).toBe("second");
    expect(response.headers.get("cache-control")).toContain("private, no-store");
  });
  it("allows a POST to reach independent action authorization",async()=>{
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY","test-public-key");
    mocks.create.mockReturnValue({auth:{getClaims:async()=>({data:null,error:{}})}});
    const response=await updateSession(new NextRequest("http://localhost:3000/",{method:"POST"}));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
