# UI/UX Redesign Implementation Plan

Redesign the GhanaSchoolBot dashboard with a focus on simplicity, consistency, and professional aesthetics.

## Proposed Changes

### [Component Name] UI Core & Design System

#### [MODIFY] [index.css](file:///w:/CodeDeX/GhanaSchoolBot/web/src/index.css)
- Replace glassmorphism and gradients with solid-subtle-dark color palette.
- Define a consistent typography, spacing scale, and border radius.
- Implement CSS variables for themes (surface, surface-muted, surface-elevated).

#### [MODIFY] [App.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/App.tsx)
- **Categorization**: Group components into logical categories using a Tabbed Interface:
  - **Overview**: Real-time stats and health status.
  - **Process**: Control panel and localized log viewer (Area Scroll).
  - **Resources**: File manager with scrollable list (Area Scroll).
  - **Settings**: AI filters and configuration.
- **Area Scrolling**: Implement localized scrolling for specific sections (Logs, File Lists) using fixed-height containers to maintain a compact dashboard view.
- **Lucide Icons**: Replace all emojis with consistent SVG icons.

### [Component Name] Shared Components

#### [MODIFY] [StatCard.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/components/StatCard.tsx)
- Update styling to match the new design system.
- Replace emoji icons with SVG icons.
- Ensure consistent spacing and typography.

#### [MODIFY] All Other Components
- [ControlPanel.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/components/ControlPanel.tsx), [FileManager.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/components/FileManager.tsx), [LogViewer.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/components/LogViewer.tsx), etc.
- Standardize borders, padding, and interactive states.
- Ensure hooks are used for state management where appropriate.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no TypeScript or build errors.
- Run `npm run lint` to check for style consistency.

### Manual Verification
- View the dashboard in the browser to confirm:
  - Dark theme application.
  - SVG icons replacement.
  - Absence of emojis and gradients.
  - Consistent spacing and typography.
- Test interaction with buttons and modals.
- Verify mobile responsiveness.
### [Component Name] Sync & Intelligence Core

#### [MODIFY] [server.ts](file:///w:/CodeDeX/GhanaSchoolBot/educational-scraper/src/server.ts)
- Add `/api/sync/drive` and `/api/sync/sort` endpoints to trigger background sync/sort scripts.
- Integrate [GoogleDriveService](file:///w:/CodeDeX/GhanaSchoolBot/educational-scraper/src/utils/drive-uploader.ts#13-233) stats into the `/api/stats` endpoint.

#### [MODIFY] [App.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/App.tsx)
- Integrate new "Sync & Organize" controls into the Settings or Resources tab.
- Add toast notifications or progress bars for background tasks.

#### [MODIFY] [AIConfigPanel.tsx](file:///w:/CodeDeX/GhanaSchoolBot/web/src/components/AIConfigPanel.tsx)
- Add Google Drive configuration fields (Folder ID, Auto-Cleanup).
- Add "Maintenance" actions: Force Re-sync, Trigger AI Sorting.

## Verification Plan

### Automated Tests
- `npm run build` to verify no breaking changes in component headers.
- Mock drive sync trigger to verify process spawning in [server.ts](file:///w:/CodeDeX/GhanaSchoolBot/educational-scraper/src/server.ts).

### Manual Verification
- Trigger AI sorting on the Resources tab and verify files move into category folders.
- Trigger Drive Sync and check Google Drive for mirrored file structure.
