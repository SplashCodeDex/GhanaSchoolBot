# Track Spec: Implement Dynamic Curriculum Knowledge Base and Integrated Search

## Overview
This track focuses on moving away from hardcoded subjects and grades by implementing a centralized, dynamic Knowledge Base (KB). This KB will serve as the single source of truth for all curriculum-related data, powering both the UI dropdowns and providing context for AI content generation.

## Functional Requirements

### 1. Dynamic Knowledge Base (JSON Schema)
- **Data Structure:** A nested hierarchy of Grade -> Subject -> Strand -> Sub-strand -> Indicators.
- **Attributes:** Each entity should include a unique ID, display name, and optional description/tips.
- **Goal:** Ensure subjects are treated as data, making the system "Subject-Agnostic".

### 2. Curriculum API
- **Endpoint:** GET /api/curriculum/structure: Returns the full or filtered hierarchy.
- **Endpoint:** GET /api/curriculum/subjects: Returns a dynamic list of available subjects.
- **Endpoint:** POST /api/curriculum/search: Implements semantic search using Gemini to find relevant topics based on keywords or natural language.

### 3. Integrated Search & Discovery
- **"Curriculum Explorer" Tab:** A dedicated tab to browse the hierarchy and search for specific topics.
- **Semantic Search:** Allow users to find "Topics related to [query]" across different grades and subjects.

### 4. Dynamic UI Refactoring
- **Lesson Note Generator:** Update dropdowns to fetch subjects and strands dynamically from the API.
- **Exam Builder:** Update dropdowns to fetch subjects and topics dynamically.

## Technical Architecture

### Data Storage
- **educational-scraper/data/curriculum_kb.json**: The static JSON file containing the mapped curriculum data.

### Backend (Express)
- **CurriculumService**: A service to load, parse, and query the JSON data.
- **Semantic Search Integration**: Use Gemini to map natural language queries to the closest matching Strand/Sub-strand IDs in the JSON.

### Frontend (React)
- **useCurriculum Hook**: A shared hook to fetch and cache curriculum structure.
- **CurriculumExplorer Component**: A tree-view and search interface.

## Success Criteria
- No hardcoded subject lists in the frontend code.
- User can search for "Human body" and see results across Primary Science and SHS Biology.
- Lesson Note generator correctly updates Sub-strand options based on the dynamically selected Strand.
