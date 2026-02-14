## 1. Setup

- [x] 1.1 Create Supabase project and obtain credentials
- [x] 1.2 Install @supabase/supabase-js dependency
- [x] 1.3 Add environment variables to .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [x] 1.4 Update .env.example with new Supabase variables

## 2. Database & Storage Setup

- [x] 2.1 Create `analyses` table in Supabase with schema (id, created_at, input_text, analysis_text, image_prompt, model_id, image_paths)
- [x] 2.2 Create `analysis-images` storage bucket in Supabase
- [x] 2.3 Configure storage bucket policies for read/write access

## 3. Supabase Client

- [x] 3.1 Create lib/supabase.ts with server and client Supabase instances
- [x] 3.2 Add environment variable validation with clear error messages
- [x] 3.3 Export typed client for use in server actions and components

## 4. Storage Functions

- [x] 4.1 Implement saveAnalysis() function to insert record and upload images
- [x] 4.2 Implement uploadImages() helper to convert base64 to blob and upload to storage
- [x] 4.3 Implement getAnalysisById() function with signed URL generation for images
- [x] 4.4 Implement listAnalyses() function returning id, created_at, input preview (100 chars)
- [x] 4.5 Add retry logic for image upload failures

## 5. Save Integration

- [x] 5.1 Create saveAnalysis server action in actions.ts
- [x] 5.2 Call saveAnalysis after generateImages completes in page.tsx
- [x] 5.3 Add error notification (toast) for save failures

## 6. History Sidebar Component

- [x] 6.1 Create HistorySidebar component with entry list
- [x] 6.2 Implement HistoryEntry component showing date/time formatted (e.g., "Feb 13, 10:42 AM")
- [x] 6.3 Add empty state message when no history exists
- [x] 6.4 Add visual highlight for selected entry
- [x] 6.5 Fetch history list on component mount

## 7. Page Layout Update

- [x] 7.1 Refactor page.tsx to two-column layout (sidebar left, content right)
- [x] 7.2 Add state for selected history entry
- [x] 7.3 Implement click handler to load historical analysis
- [x] 7.4 Display loaded analysis (input text, analysis text, images) in main area
- [x] 7.5 Add "New Analysis" button to return to input mode from history view

## 8. History Updates

- [x] 8.1 Refresh history sidebar after new analysis is saved
- [x] 8.2 Auto-select and highlight newly created entry
- [x] 8.3 Ensure new entry appears at top of list

## 9. Polish & Error Handling

- [x] 9.1 Add loading state while fetching history
- [x] 9.2 Handle fetch errors gracefully in sidebar
- [x] 9.3 Add responsive behavior (collapse sidebar on mobile)
- [x] 9.4 Test full flow: create analysis → appears in history → click to reload

## 10. Mock Image Provider (Dev)

- [x] 10.1 Add NEXT_PUBLIC_IMAGE_PROVIDER env flag (mock/midjourney) and document in .env.example
- [x] 10.2 Add static mock images under public/mock-images (four jpg/png files)
- [x] 10.3 Return mock images with ~1s delay when NEXT_PUBLIC_IMAGE_PROVIDER=mock
- [x] 10.4 Ensure mock mode still uploads images to Supabase storage
- [x] 10.5 (Optional) Display UI indicator when mock mode is active
