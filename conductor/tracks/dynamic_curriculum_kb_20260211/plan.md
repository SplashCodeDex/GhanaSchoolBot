# Implementation Plan: Dynamic Curriculum Knowledge Base

## Phase 1: Data Architecture & Storage [checkpoint: 8a3d0da]
- [x] Task: Create educational-scraper/data/curriculum_kb.json with initial schema and seed data (Sample subjects for Primary, JHS, SHS). (740d8d8)
- [x] Task: Create educational-scraper/src/utils/curriculum-service.ts to handle KB parsing and queries. (5d5523f)
- [x] Task: Write Tests - Verify CurriculumService correctly retrieves subjects and filters hierarchy. (f545c83)
- [x] Task: Implement Feature - CurriculumService core logic. (f545c83)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Architecture' (Protocol in workflow.md) (8a3d0da)

## Phase 2: Curriculum API & Semantic Search
- [x] Task: Implement /api/curriculum/structure and /api/curriculum/subjects endpoints in server.ts. (1cf5bc3)
- [x] Task: Write Tests - Verify API responses for dynamic curriculum data. (1cf5bc3)
- [x] Task: Implement /api/curriculum/search (Gemini Semantic Search). (90f9a8d)
- [x] Task: Write Tests - Verify semantic search returns relevant KB nodes. (90f9a8d)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Curriculum API' (Protocol in workflow.md)

## Phase 3: Dynamic Frontend Integration
- [ ] Task: Create web/src/hooks/useCurriculum.ts for fetching KB data.
- [ ] Task: Refactor web/src/components/LessonNoteGenerator.tsx to use dynamic subjects and strands.
- [ ] Task: Refactor web/src/components/ExamBuilder.tsx to use dynamic subjects and topics.
- [ ] Task: Write Tests - Verify UI updates correctly when subject selection changes.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dynamic Frontend' (Protocol in workflow.md)

## Phase 4: Curriculum Explorer & Search UI
- [ ] Task: Create web/src/components/CurriculumExplorer.tsx with tree browser and search bar.
- [ ] Task: Implement 'Semantic Search' display in the Explorer.
- [ ] Task: Integrate 'Curriculum Explorer' into the main Dashboard (App.tsx and Sidebar.tsx).
- [ ] Task: Final Polish - Ensure breadcrumbs or 'Selected Context' is clear in the UI.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Curriculum Explorer' (Protocol in workflow.md)
