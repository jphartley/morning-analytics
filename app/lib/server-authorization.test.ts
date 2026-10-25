import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./supabase-server", () => ({ createRequestSupabase: mocks.create }));
import { requireActor, authorizedModel, authorizedMemoryMode, requireAdministrator } from "./server-authorization";
import { testActor } from "@/test/actor";

function client(id: string | null, role: unknown = "admin", profileError = false) {
  const maybeSingle = vi.fn(async () => ({ data: role === null ? null : { role }, error: profileError ? {} : null }));
  const eq = vi.fn(() => ({ maybeSingle }));
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: id ? { id } : null }, error: null })) },
    from: vi.fn(() => ({ select: () => ({ eq }) })), eq,
  };
}

beforeEach(() => vi.resetAllMocks());

describe("verified request identity", () => {
  it("loads the profile using the Auth-verified ID", async () => {
    const c = client("verified"); mocks.create.mockResolvedValue(c);
    expect(await requireActor()).toMatchObject({ userId: "verified", role: "admin", supabase: c });
    expect(c.eq).toHaveBeenCalledWith("id", "verified");
  });
  it("does not query application data without a verified user", async () => {
    const c = client(null); mocks.create.mockResolvedValue(c);
    await expect(requireActor()).rejects.toMatchObject({ code: "unauthenticated" });
    expect(c.from).not.toHaveBeenCalled();
  });
  it("fails closed when Auth verification throws", async () => {
    const c = client("verified"); c.auth.getUser.mockRejectedValue(new Error("secret credential details"));
    mocks.create.mockResolvedValue(c);
    await expect(requireActor()).rejects.toMatchObject({ code: "unauthenticated" });
    expect(c.from).not.toHaveBeenCalled();
  });
  it.each([null, "owner", { role: "admin" }])("rejects missing/invalid profile role %s", async role => {
    mocks.create.mockResolvedValue(client("verified", role));
    await expect(requireActor()).rejects.toMatchObject({ code: "account-settings-unavailable" });
  });
  it("rejects profile lookup failures", async () => {
    mocks.create.mockResolvedValue(client("verified", "admin", true));
    await expect(requireActor()).rejects.toMatchObject({ code: "account-settings-unavailable" });
  });
  it("does not reuse clients or roles across requests", async () => {
    mocks.create.mockResolvedValueOnce(client("A", "admin")).mockResolvedValueOnce(client("B", "user"));
    const [a,b] = await Promise.all([requireActor(),requireActor()]);
    expect([a.userId,a.role,b.userId,b.role]).toEqual(["A","admin","B","user"]);
    expect(a.supabase).not.toBe(b.supabase);
  });
  it("uses memory-free ordinary defaults and denies restricted options", () => {
    const actor = testActor({}, "user", "user");
    expect(authorizedMemoryMode(actor)).toBe("without-memory");
    expect(authorizedModel(actor)).toBe("gemini-3.1-pro-preview");
    expect(() => authorizedMemoryMode(actor,"with-memory")).toThrow();
    expect(() => authorizedModel(actor,"gemini-3.6-flash")).toThrow();
    expect(() => requireAdministrator(actor)).toThrow();
  });
});
