import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { AuthorizedActor } from "./authorization-types";
import { ActionError, requireResourceId, unavailable } from "./action-errors";
import type { ImageGenerationBatch } from "./image-generation-types";
import type { ImageGenerationDiagnosticsRecorder } from "./image-generation-diagnostics";

const BUCKET = "analysis-images";

// This client is deliberately private to this adapter.
function privilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Storage configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isOwnedImagePath(id: string, path: unknown): path is string {
  return typeof path === "string" && path.startsWith(`${id}/`)
    && /^[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/.test(path.slice(id.length + 1));
}

export function assertImagePaths(id: string, paths: unknown): asserts paths is string[] {
  requireResourceId(id);
  if (!Array.isArray(paths) || !paths.every((path) => isOwnedImagePath(id, path))) unavailable();
}

export async function ownedImageResource(actor: AuthorizedActor, id: string) {
  requireResourceId(id);
  const { data, error } = await actor.supabase.from("analysis_resources")
    .select("id, user_id, state, image_paths, image_generation_batches")
    .eq("id", id).eq("user_id", actor.userId).maybeSingle();
  if (error || !data || data.user_id !== actor.userId) unavailable();
  assertImagePaths(id, data.image_paths);
  return data;
}

export async function allocateAnalysisResource(actor: AuthorizedActor): Promise<string> {
  const id = randomUUID();
  const { error } = await privilegedClient().from("analysis_resources").insert({ id, user_id: actor.userId });
  if (error) throw new Error("Resource allocation failed.");
  return id;
}

export async function recordGeneratedImages(
  actor: AuthorizedActor, id: string, imagePaths: string[], batches: ImageGenerationBatch[], success: boolean
) {
  await ownedImageResource(actor, id);
  assertImagePaths(id, imagePaths);
  batches.forEach((batch) => assertImagePaths(id, batch.imagePaths));
  const { error } = await privilegedClient().from("analysis_resources").update({
    state: success ? "complete" : "failed", image_paths: imagePaths, image_generation_batches: batches,
  }).eq("id", id).eq("user_id", actor.userId);
  if (error) throw new Error("Image manifest could not be recorded.");
}

export async function uploadAuthorizedImages(
  actor: AuthorizedActor, id: string, dataUrls: string[], startIndex = 0,
  diagnostics?: ImageGenerationDiagnosticsRecorder
): Promise<{ paths: string[]; error?: string }> {
  await ownedImageResource(actor, id);
  if (!Number.isSafeInteger(startIndex) || startIndex < 0) unavailable();
  const storage = privilegedClient().storage.from(BUCKET);
  const paths: string[] = [];
  for (let index = 0; index < dataUrls.length; index += 1) {
    const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrls[index]);
    if (!match) throw new ActionError("invalid-input", "The generated image could not be stored.");
    const path = `${id}/${startIndex + index}.${match[1] === "image/png" ? "png" : "jpg"}`;
    const buffer = Buffer.from(match[2], "base64");
    let uploaded = false;
    for (let attempt = 0; attempt < 2 && !uploaded; attempt += 1) {
      const { error } = await storage.upload(path, buffer, { contentType: match[1], upsert: true });
      uploaded = !error;
    }
    if (!uploaded) return { paths: [], error: "Image upload failed; analysis will be saved without images." };
    paths.push(path);
    diagnostics?.add("upload", "success", "Generated image stored.", { index: startIndex + index });
  }
  return { paths };
}

export async function removeAuthorizedImages(actor: AuthorizedActor, id: string, recordedPaths: string[]) {
  await ownedImageResource(actor, id);
  assertImagePaths(id, recordedPaths);
  const storage = privilegedClient().storage.from(BUCKET);
  const { data, error } = await storage.list(id);
  const paths = new Set(recordedPaths);
  if (!error) {
    for (const object of data || []) {
      const path = `${id}/${object.name}`;
      if (isOwnedImagePath(id, path)) paths.add(path);
    }
  }
  if (paths.size) {
    const { error: removalError } = await storage.remove([...paths]);
    if (removalError) throw new Error("Image removal failed.");
  }
}
