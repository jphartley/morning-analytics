## 1. Setup

- [ ] 1.1 Create Supabase project and obtain credentials
- [ ] 1.2 Install @supabase/supabase-js dependency
- [ ] 1.3 Add environment variables to .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] 1.4 Update .env.example with new Supabase variables

## 2. Database & Storage Setup

- [ ] 2.1 Create `analyses` table in Supabase with schema (id, created_at, input_text, analysis_text, image_prompt, model_id, image_paths)
- [ ] 2.2 Create `analysis-images` storage bucket in Supabase
- [ ] 2.3 Configure storage bucket policies for read/write access

## 3. Supabase Client

- [ ] 3.1 Create lib/supabase.ts with server and client Supabase instances
- [ ] 3.2 Add environment variable validation with clear error messages
- [ ] 3.3 Export typed client for use in server actions and components

## 4. Storage Functions

- [ ] 4.1 Implement saveAnalysis() function to insert record and upload images
- [ ] 4.2 Implement uploadImages() helper to convert base64 to blob and upload to storage
- [ ] 4.3 Implement getAnalysisById() function with signed URL generation for images
- [ ] 4.4 Implement listAnalyses() function returning id, created_at, input preview (100 chars)
- [ ] 4.5 Add retry logic for image upload failures

## 5. Save Integration

- [ ] 5.1 Create saveAnalysis server action in actions.ts
- [ ] 5.2 Call saveAnalysis after generateImages completes in page.tsx
- [ ] 5.3 Add error notification (toast) for save failures

## 6. History Sidebar Component

- [ ] 6.1 Create HistorySidebar component with entry list
- [ ] 6.2 Implement HistoryEntry component showing date/time formatted (e.g., "Feb 13, 10:42 AM")
- [ ] 6.3 Add empty state message when no history exists
- [ ] 6.4 Add visual highlight for selected entry
- [ ] 6.5 Fetch history list on component mount

## 7. Page Layout Update

- [ ] 7.1 Refactor page.tsx to two-column layout (sidebar left, content right)
- [ ] 7.2 Add state for selected history entry
- [ ] 7.3 Implement click handler to load historical analysis
- [ ] 7.4 Display loaded analysis (input text, analysis text, images) in main area
- [ ] 7.5 Add "New Analysis" button to return to input mode from history view

## 8. History Updates

- [ ] 8.1 Refresh history sidebar after new analysis is saved
- [ ] 8.2 Auto-select and highlight newly created entry
- [ ] 8.3 Ensure new entry appears at top of list

## 9. Polish & Error Handling

- [ ] 9.1 Add loading state while fetching history
- [ ] 9.2 Handle fetch errors gracefully in sidebar
- [ ] 9.3 Add responsive behavior (collapse sidebar on mobile)
- [ ] 9.4 Test full flow: create analysis → appears in history → click to reload
