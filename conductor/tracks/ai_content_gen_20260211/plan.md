# Implementation Plan: AI Lesson Note and Examination Generation

## Phase 1: AI Service Foundation (Gemini Integration) [checkpoint: 9460e45]
- [x] Task: Create educational-scraper/src/utils/ai-generator-service.ts scaffold. (4243aff)
- [x] Task: Write Tests - Verify Gemini initialization and basic text generation. (c68fcbf)
- [x] Task: Implement Feature - Basic AIGeneratorService with Gemini integration. (0a59afa)
- [x] Task: Write Tests - Verify prompt template construction for Lesson Notes. (8e19149)
- [x] Task: Implement Feature - generateLessonNotePrompt logic. (8ec8e37)
- [x] Task: Write Tests - Verify prompt template construction for Examinations. (2ae72f1)
- [x] Task: Implement Feature - generateExamPrompt logic. (eebf814)
- [x] Task: Conductor - User Manual Verification 'Phase 1: AI Service Foundation' (Protocol in workflow.md)

## Phase 2: Backend API Implementation [checkpoint: ca0daa9]
- [x] Task: Write Tests - Verify /api/ai/generate-lesson-note endpoint response. (d0d21f4)
- [x] Task: Implement Feature - Lesson Note generation route in server.ts. (9b85900)
- [x] Task: Write Tests - Verify /api/ai/generate-exam endpoint response. (9b85900)
- [x] Task: Implement Feature - Examination generation route in server.ts. (9b85900)
- [x] Task: Write Tests - Verify input validation for curriculum parameters. (b25ed1b)
- [x] Task: Implement Feature - Middleware/Validation for AI routes. (b25ed1b)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Backend API Implementation' (Protocol in workflow.md)

## Phase 3: Frontend Integration (Core UI)
- [x] Task: Create web/src/hooks/useAIGeneration.ts for managing generation state. (f2604f6)
- [x] Task: Write Tests - Verify useAIGeneration hook states (loading, success, error). (a9f5b83)
- [x] Task: Implement Feature - useAIGeneration hook with Socket.io/Fetch integration. (a9f5b83)
- [x] Task: Create web/src/components/LessonNoteGenerator.tsx. (92aee8a)
- [x] Task: Implement Feature - Form UI for Lesson Note generation. (92aee8a)
- [~] Task: Create web/src/components/ExamBuilder.tsx.
- [ ] Task: Implement Feature - Form UI for Exam building.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Integration' (Protocol in workflow.md)

## Phase 4: Content Preview & Persistence
- [ ] Task: Create web/src/components/ContentPreview.tsx using a Markdown renderer.
- [ ] Task: Implement Feature - Real-time preview of generated content.
- [ ] Task: Create persistence logic (e.g., local storage or simple backend save) for generated content.
- [ ] Task: Implement Feature - "Save for later" and "Export" functionality.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish and Export' (Protocol in workflow.md)
