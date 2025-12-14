
# AGENTS.md - Rules of Engagement for AI Coding Agents

> **⚠️ CRITICAL FOR AI AGENTS:** Read this file before making ANY code changes.
> **Primary Maintainer:** w3jdev (w3jdev.com)
> This repository uses a specific client-side architecture with LocalStorage persistence. Do NOT attempt to connect to a backend API or Database unless explicitly instructed to migrate to Supabase.

## 1. Project Overview
**PUNCH⏰CLOCK Malaysia** is a **Progressive Web App (PWA)** serving as an HR Operating System for Malaysian SMEs.
*   **Domain:** Human Resources, Payroll (LHDN/EPF/SOCSO), Biometric Attendance, AI Workforce Planning.
*   **Architecture:** Client-Side Monolith. Data persists in `localStorage` via custom hooks.
*   **Design System:** "Neo-Brutalist" (High contrast, thick borders, sharp shadows).

## 2. Tech Stack & Tools
*   **Framework:** React 19 + TypeScript (Strict Mode).
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS (Custom config in `index.html` script tag).
*   **AI Engine:** Google Gemini 2.5 Flash via `@google/genai` SDK.
*   **Biometrics:** `face-api.js` (loaded via CDN).
*   **Charts:** Recharts.
*   **Icons:** Lucide React.
*   **PDF:** jsPDF.

## 3. Core Commands
*   `npm install` - Install dependencies.
*   `npm run dev` - Start development server (Port 5173).
*   `npm run build` - Typecheck and build for production.
*   `npm run lint` - Linting checks.

## 4. Coding Standards & Patterns

### A. React & TypeScript
*   **Components:** Functional components only. Use `React.FC` typing.
*   **State Management:**
    *   Use `useGlobal()` context for app-wide state (Employees, Attendance).
    *   Use `useState` for local UI state.
    *   **Persistence:** All global data must use the `useStickyState` hook pattern found in `GlobalContext.tsx`.
*   **Hooks:** Place logic in `services/` or custom hooks. Do not bloat components.

### B. Styling (Neo-Brutalism)
*   **Borders:** `border-2` or `border-4` usually with `border-black` or `border-gray-200`.
*   **Shadows:** Use hard shadows. Example: `shadow-[4px_4px_0_0_#000]`.
*   **Colors:** Use the defined palette: `#FFD700` (Gold), `#3B82F6` (Blue), `#EF4444` (Red), `#000000` (Black).
*   **Dark Mode:** Must support `dark:` variants for ALL UI elements.

### C. Gemini AI Integration
*   **SDK:** Use `import { GoogleGenAI } from "@google/genai";`.
*   **Do NOT** use the deprecated `google-generative-ai` package.
*   **Context:** Always inject the `currentUser` role and relevant data slice into prompts to ensure context-aware answers.

## 5. Directory Structure & Boundaries
*   `/components/ui` - Generic "Neo" components (`NeoButton`, `NeoCard`). **Reuse these.**
*   `/pages` - Route views.
*   `/context` - Global State & Persistence logic.
*   `/services` - Business logic (Payroll math, AI calls, FaceAPI wrappers).
*   `/docs` - Documentation.

## 6. Strict Dos and Don'ts

| Category | DO | DON'T |
| :--- | :--- | :--- |
| **Data** | Use `id` generated via `Math.random().toString(36)`. | Assume a database auto-increment ID exists. |
| **Network** | Handle `localStorage` reads/writes synchronously. | Write `async/await` fetch calls to non-existent APIs. |
| **Payroll** | Follow Malaysian Statutory formulas (EPF 11%, etc). | Use generic/US payroll logic. |
| **UI** | Maintain high contrast and accessibility. | Use subtle shadows or gradients that break the brutalist style. |
| **Files** | Create new components in `components/` if reusable. | Modify `main.tsx` or `index.html` unless necessary. |

## 7. Workflow
1.  **Analyze**: Check `docs/product/PRD.md` or user prompt.
2.  **Plan**: Identify which Context Arrays (`employees`, `shifts`) need updating.
3.  **Implement**: Update `types.ts` first, then Context, then UI.
4.  **Verify**: Ensure Dark Mode works and Data persists after refresh.
