# Image Upload to Supabase - Troubleshooting Log

## Problem

After generating images via Midjourney (split into 4 base64 JPEG quadrants), we need to save them to Supabase Storage. This has failed across multiple attempts.

## What We've Tried

### Attempt 1: Client → Server Action with base64 data

**Approach:** Pass base64 image data URLs from the client to a `saveAnalysis` server action, which uploads to Supabase Storage.

**Error:** `Body exceeded 1 MB limit` — Next.js server actions have a 1MB body size limit by default. 4 base64 images easily exceed this.

### Attempt 2: Increase body size limit

**Approach:** Added `serverActions.bodySizeLimit: "10mb"` to `next.config.ts`.

**Error:** `Unrecognized key(s) in object: 'serverActions'` — Next.js 16.1.6 doesn't recognize this as a top-level config key.

### Attempt 3: Move to experimental config

**Approach:** Moved config to `experimental.serverActions.bodySizeLimit`.

**Error:** `Maximum array nesting exceeded. Large nested arrays can be dangerous.` — Even with the size limit raised, React/Next.js serialization rejects the large base64 string array.

### Attempt 4: Upload during generateImages (server-side)

**Approach:** Refactored to upload images to Supabase Storage inside the `generateImages` server action (where images already exist server-side), returning only small storage path strings to the client. `saveAnalysis` then receives paths instead of base64 data.

**Status:** Code refactored but not yet verified working. The upload uses `base64ToBlob()` conversion and `supabase.storage.upload()`. This approach avoids the client→server transfer problem entirely.

## Current Architecture

```
generateImages()         [server action]
  → splitGridImage()     [returns base64 data URLs]
  → uploadImagesToStorage()  [converts to Blob, uploads to Supabase Storage]
  → returns { imageUrls: base64[], imagePaths: string[] }

Client displays imageUrls (base64), passes imagePaths to saveAnalysis

saveAnalysis()           [server action]
  → inserts DB record with imagePaths (small strings)
```

## Possible Issues to Investigate

1. **Blob API in Node.js** — `base64ToBlob()` uses browser `Blob` and `atob()`. These exist in Node 18+ but may behave differently. May need to use `Buffer` instead.

2. **Supabase Storage bucket policies** — Upload may fail silently if policies aren't configured. Need to verify bucket exists and has INSERT policy.

3. **Upload payload format** — Supabase JS client may expect `Buffer` or `Uint8Array` rather than `Blob` when running server-side in Node.js.

## Recommended Next Steps

1. **Add logging** — Add console.log in `uploadImagesToStorage` to see if it's being called and what errors (if any) come back from Supabase.

2. **Test with Buffer instead of Blob** — Replace the `base64ToBlob` function with a Node.js `Buffer`-based approach:
   ```ts
   function base64ToBuffer(base64DataUrl: string): Buffer {
     const data = base64DataUrl.split(",")[1];
     return Buffer.from(data, "base64");
   }
   ```

3. **Test upload in isolation** — Create a small test script that uploads a single image to the Supabase bucket to verify credentials, bucket name, and policies work.

4. **Verify Supabase dashboard** — Check that the `analysis-images` bucket exists and has the correct policies (INSERT and SELECT for anon role).
