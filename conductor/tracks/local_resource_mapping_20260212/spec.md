# Track Spec: Implement Local Resource Mapping (PDF Linker)

## Overview
This track introduces a "Smart Library" capability by linking local PDF resources (scraped or uploaded) to specific nodes in the Dynamic Curriculum Knowledge Base. This bridges the gap between raw files and the GES curriculum structure, enabling context-aware content generation and organized resource discovery.

## Functional Requirements

### 1. Resource Mapping Storage
- **Implementation:** Create `educational-scraper/data/file_mappings.json`.
- **Schema:** Store an array of objects linking `filePath` to `curriculumNodeId` (Strand or Sub-strand ID).

### 2. Hybrid Mapping Engine
- **AI Scanning:** A new service (`MappingService`) that uses Gemini to analyze file metadata and snippets of content to predict the most relevant curriculum node.
- **Human Confirmation:** A "Mapping Review" UI where users can see AI suggestions and confirm, change, or delete the link.

### 3. Integrated UI Features
- **Curriculum Explorer:** Add a "Linked Resources" section to the detail panel. Clicking a resource should open its preview.
- **Resources Tab:** Enhance the file manager to display badges showing which curriculum node a file is linked to.
- **Contextual Generation (RAG Lite):** In the Lesson Note and Exam builders, if a "Referenced Local Content" toggle is enabled, the AI will include the text content of mapped PDFs in its prompt for better accuracy.

## Technical Architecture
- **Backend:** `MappingService.ts` to handle CRUD operations on `file_mappings.json` and AI predictions.
- **API:**
    - `GET /api/mapping`: Retrieve all mappings.
    - `POST /api/mapping/predict`: Trigger AI analysis for a specific file.
    - `POST /api/mapping/confirm`: Save a confirmed mapping.
- **Frontend:** Update `CurriculumExplorer.tsx`, `FileManager.tsx`, and AI generator hooks.

## Acceptance Criteria
- User can select "Number" in the Curriculum Explorer and see a list of PDFs relevant to that topic.
- A file in the Resources tab clearly shows its curriculum context (e.g., "JHS1 > Mathematics > Number").
- Mappings are persisted across server restarts.

## Out of Scope
- Full-text vector database implementation (we will use simple text extraction for now).
- Mapping of non-PDF files.
