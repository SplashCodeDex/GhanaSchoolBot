# Implementation Plan: Local Resource Mapping (PDF Linker)

## Phase 1: Mapping Data Architecture & Service [checkpoint: 2a5ebd1]
- [x] Task: Create `educational-scraper/data/file_mappings.json` with initial empty state. (f53e37b)
- [x] Task: Create `educational-scraper/src/utils/mapping-service.ts` to handle storage and CRUD. (f6601b5)
- [x] Task: Write Tests - Verify `MappingService` correctly saves, retrieves, and deletes file-to-ID links. (f6601b5)
- [x] Task: Implement Feature - `MappingService` core logic and persistence. (f6601b5)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Mapping Service' (Protocol in workflow.md) (2a5ebd1)

## Phase 2: AI Mapping API & Prediction Engine [checkpoint: 85b5a20]
- [x] Task: Implement `GET /api/mapping` and `POST /api/mapping/confirm` endpoints in `server.ts`. (85702b1)
- [x] Task: Implement `POST /api/mapping/predict` (Gemini logic to analyze PDF metadata/content). (85702b1)
- [x] Task: Write Tests - Verify API responses and AI prediction accuracy (mocked). (85702b1)
- [x] Task: Conductor - User Manual Verification 'Phase 2: AI Mapping API' (Protocol in workflow.md) (85b5a20)

## Phase 3: UI Integration (Explorer & Resources) [checkpoint: 7a8b387]
- [x] Task: Update `web/src/hooks/useCurriculum.ts` to fetch and handle mapping data. (b03b85c)
- [x] Task: Update `CurriculumExplorer.tsx` to display "Linked Resources" in the detail panel. (b03b85c)
- [x] Task: Update `FileManager.tsx` to show curriculum badges and add "Link to Curriculum" button. (b03b85c)
- [x] Task: Write Tests - Verify UI components render mapping data correctly. (8af5cdc)
- [x] Task: Conductor - User Manual Verification 'Phase 3: UI Integration' (Protocol in workflow.md) (7a8b387)

## Phase 4: Contextual Content Generation (RAG Lite)
- [ ] Task: Enhance `AIGeneratorService.ts` to include local PDF text snippets in prompts.
- [ ] Task: Update `LessonNoteGenerator` and `ExamBuilder` with "Reference Local Files" toggle.
- [ ] Task: Final Polish - Add navigation links (e.g., "View in Explorer" from File Manager).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Contextual Generation' (Protocol in workflow.md)
