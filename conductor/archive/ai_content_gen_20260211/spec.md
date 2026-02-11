# Track Spec: Implement AI Lesson Note and Examination Generation Logic

## Overview
This track focuses on implementing the core logic for the two new AI-powered features: the **Lesson Note Generator** and the **Examination Builder**. These features will leverage the Google Gemini API to generate curriculum-aligned educational content for Ghanaian teachers and students.

## Functional Requirements

### 1. AI Lesson Note Generator
- **Input:** Subject, Grade Level (JHS/SHS), Strand, Sub-strand, and optional teacher prompts.
- **Processing:** 
    - Retrieve curriculum context (defined in system prompts).
    - Construct Gemini prompt to generate a structured lesson note (Objective, Introduction, Main Body, Conclusion, Evaluation).
- **Output:** A formatted Markdown or structured JSON document containing the lesson note.
- **Features:** Save generated notes, edit capability (frontend), and export options.

### 2. AI Examination Builder
- **Input:** Exam Type (Mock, BECE, WASSCE, Term Exam, Class Test), Subject, Grade, and Topics covered.
- **Processing:**
    - Construct Gemini prompt incorporating past WAEC/BECE patterns.
    - Generate multiple-choice and theory questions with marking schemes.
- **Output:** A structured examination paper with a separate marking scheme.

## Technical Architecture

### Backend (Express & Gemini)
- **AIService:** A dedicated utility class/service to interact with @google/generative-ai.
- **Prompt Templates:** Managed templates for different content types to ensure consistent quality.
- **API Endpoints:**
    - POST /api/ai/generate-lesson-note: Accepts parameters and returns generated content.
    - POST /api/ai/generate-exam: Accepts parameters and returns question paper and marking scheme.

### Frontend (React Dashboard)
- **Lesson Note View:** Dedicated tab with form inputs for curriculum selection.
- **Examination View:** Dedicated tab for exam configuration.
- **Preview Components:** Real-time rendering of generated Markdown content.
- **State Management:** Hooks to handle generation status (loading, success, error).

## Data Models

### Lesson Note Request
`	ypescript
interface LessonNoteRequest {
  subject: string;
  grade: string;
  strand: string;
  subStrand: string;
  additionalInstructions?: string;
}
`

### Examination Request
`	ypescript
interface ExamRequest {
  type: 'MOCK' | 'BECE' | 'WASSCE' | 'TERM' | 'CLASS_TEST' | 'HOMEWORK';
  subject: string;
  grade: string;
  topics: string[];
  numQuestions: number;
}
`

## Security & Reliability
- **Rate Limiting:** Implement backend rate limiting for AI generation to prevent API quota exhaustion.
- **Input Validation:** Strict validation of curriculum parameters.
- **Fallbacks:** Graceful handling of Gemini API errors or empty responses.
