# Implementation Plan: AI Lesson Note and Examination Generation

## Phase 1: AI Service Foundation (Gemini Integration)
- [x] Task: Create educational-scraper/src/utils/ai-generator-service.ts scaffold. (4243aff)
- [x] Task: Write Tests - Verify Gemini initialization and basic text generation. (c68fcbf)
- [x] Task: Implement Feature - Basic AIGeneratorService with Gemini integration. (0a59afa)
- [x] Task: Write Tests - Verify prompt template construction for Lesson Notes. (8e19149)
- [x] Task: Implement Feature - generateLessonNotePrompt logic. (8ec8e37)
- [x] Task: Write Tests - Verify prompt template construction for Examinations. (2ae72f1)
- [ ] Task: Implement Feature - generateExamPrompt logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: AI Service Foundation' (Protocol in workflow.md)

## Phase 2: Backend API Implementation
- [ ] Task: Write Tests - Verify /api/ai/generate-lesson-note endpoint response.
- [ ] Task: Implement Feature - Lesson Note generation route in server.ts.
- [ ] Task: Write Tests - Verify /api/ai/generate-exam endpoint response.
- [ ] Task: Implement Feature - Examination generation route in server.ts.
- [ ] Task: Write Tests - Verify input validation for curriculum parameters.
- [ ] Task: Implement Feature - Middleware/Validation for AI routes.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend API Implementation' (Protocol in workflow.md)

## Phase 3: Frontend Integration (Core UI)
- [ ] Task: Create web/src/hooks/useAIGeneration.ts for managing generation state.
- [ ] Task: Write Tests - Verify useAIGeneration hook states (loading, success, error).
- [ ] Task: Implement Feature - useAIGeneration hook with Socket.io/Fetch integration.
- [ ] Task: Create web/src/components/LessonNoteGenerator.tsx.
- [ ] Task: Implement Feature - Form UI for Lesson Note generation.
- [ ] Task: Create web/src/components/ExamBuilder.tsx.
- [ ] Task: Implement Feature - Form UI for Exam building.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Integration' (Protocol in workflow.md)

## Phase 4: Content Preview & Persistence
- [ ] Task: Create web/src/components/ContentPreview.tsx using a Markdown renderer.
- [ ] Task: Implement Feature - Real-time preview of generated content.
- [ ] Task: Create persistence logic (e.g., local storage or simple backend save) for generated content.
- [ ] Task: Implement Feature - "Save for later" and "Export" functionality.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Polish and Export' (Protocol in workflow.md)
