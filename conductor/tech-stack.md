# Technology Stack: Ghana School Bot

## Core Languages
- **TypeScript:** Primary language for both backend and frontend, ensuring type safety and maintainability.
- **Node.js:** Runtime environment for the scraper and API server.

## Frontend (Dashboard)
- **React:** UI library for building the interactive dashboard.
- **Vite:** Fast build tool and development server.
- **Tailwind CSS:** (Inferred from modern React patterns) for utility-first styling and redesign implementation.
- **Lucide React:** SVG icon library for a professional UI.
- **Socket.io-client:** For real-time communication with the backend.

## Backend (API & Scraper)
- **Express:** Web framework for handling API requests and serving stats.
- **Crawlee & Playwright:** Robust scraping framework for automated web navigation and file collection.
- **Socket.io:** For broadcasting real-time logs and statistics to the dashboard.

## AI & Intelligence
- **Google Gemini API (@google/generative-ai):** Used for AI pre-filtering, resource classification, lesson note generation, and examination building.

## Infrastructure & Integrations
- **Google Drive API:** For cloud storage and organization of educational resources.
- **Google Auth Library:** For managing OAuth 2.0 authentication for Google services.
- **CommonJS/ESM:** Mixed module system (CommonJS in scraper, ESM in web) as per current project structure.
