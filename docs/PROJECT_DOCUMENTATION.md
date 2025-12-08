# PUNCH⏰CLOCK Malaysia - Technical Documentation

## 1. Project Overview

**PUNCH⏰CLOCK** is a "Neo-Brutalist" HR Management System (HRMS) Progressive Web App (PWA) tailored specifically for Malaysian SMEs.

### Value Proposition
*   **Localized Compliance:** Built-in logic for Malaysian statutory bodies (KWSP/EPF, SOCSO/PERKESO, LHDN/PCB) and the Employment Act 1955.
*   **AI-First:** Google Gemini integration for "Live" voice assistance, automated compliance auditing, and legal document generation.
*   **Hardware-Agnostic:** Transforms standard tablets/webcams into biometric attendance kiosks with anti-spoofing measures.

### User Roles
1.  **Admin:** Full system access, configuration, and sensitive data management.
2.  **HR Manager:** Payroll processing, compliance auditing, employee management.
3.  **Line Manager:** Shift scheduling, OT approvals, attendance monitoring.
4.  **Staff:** Self-service (check-in/out, view payslips, onboarding).

---

## 2. System Architecture

**Type:** Single Page Application (SPA) / Progressive Web App (PWA).  
**Current State:** Client-Side Simulation (Demo Profile).

### High-Level Diagram
```text
[User Device (Browser/PWA)]
      │
      ├── React Router (Navigation)
      │
      ├── GlobalContext (State Management - In-Memory DB)
      │      ├── Employees
      │      ├── Attendance Records
      │      ├── Shifts
      │      └── Payroll Settings
      │
      ├── Services Layer
      │      ├── GeminiService <-----> [Google Gemini API (Flash 2.5 / Live)]
      │      ├── SecurityService (Geo/Bio Logic)
      │      ├── ComplianceService (Statutory Calculations)
      │      └── DocumentService (PDF Generation)
      │
      └── UI Layer (Neo-Brutalist Components)
```

---

## 3. Tech Stack

### Languages & Frameworks
*   **Core:** React 19, TypeScript.
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS (Custom "Neo-Brutalist" config).
*   **State:** React Context API + Hooks.
*   **Routing:** React Router DOM v7.

### External Integrations
*   **AI/LLM:** Google GenAI SDK (`@google/genai` v1.30.0).
    *   *Models:* `gemini-2.5-flash` (Text/Audit), `gemini-2.5-flash-native-audio-preview-09-2025` (Live Voice).
*   **PDF Generation:** `jsPDF`.
*   **Visualization:** `recharts`.
*   **Icons:** `lucide-react`.

### Data Persistence
*   **Current:** In-Memory (Volatile). Resets on page reload.
*   **Assumption:** Future iterations will connect to a BAAS (Firebase/Supabase) or REST API.

---

## 4. Module Design

### A. Attendance & Smart Kiosk
*   **Purpose:** Biometric time tracking.
*   **Key Files:** `pages/Attendance.tsx`, `services/securityService.ts`.
*   **Key Logic:**
    *   **Anti-Spoofing:** Checks GPS accuracy (rejects perfect integers common in emulators) and Haversine distance from office.
    *   **Liveness:** Random challenges ("Blink twice") - *Simulated in current build*.
    *   **Risk Scoring:** Assigns 0-100 score based on location, time, and previous patterns.

### B. Payroll Engine
*   **Purpose:** Salary calculation and statutory file generation.
*   **Key Files:** `pages/Payroll.tsx`, `services/complianceService.ts`.
*   **Key Logic:**
    *   **Calculations:** `Gross = Basic + Allowances + OT`. `Net = Gross - (EPF + SOCSO + EIS + PCB)`.
    *   **Exports:** Generates `.txt` files mimicking formats for KWSP (Form A), SOCSO, and LHDN (CP39).
    *   **PDFs:** Client-side generation of payslips using `jspdf`.

### C. Compliance & Legal AI
*   **Purpose:** Automated auditing and document generation.
*   **Key Files:** `pages/Compliance.tsx`, `services/geminiService.ts`.
*   **Key Logic:**
    *   **Audit:** Sends anonymous employee data to Gemini to check against "Knowledge Base" (Employment Act 1955 rules).
    *   **Docs:** Generates Warning Letters, Contracts, and Probation letters based on prompts.

### D. AI Assistant (Live)
*   **Purpose:** Voice-based HR support.
*   **Key Files:** `components/AiAssistant.tsx`.
*   **Key Logic:**
    *   Uses `AudioContext` to capture raw PCM audio (16kHz).
    *   Streams via WebSocket to Gemini Live API.
    *   Handles audio output buffering for low-latency response.

---

## 5. Implementation Status & Feature Matrix

| Module | Feature | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Auth** | Role Switching | 🟡 Partial | Debug menu only; no real auth/JWT. |
| **Attendance** | Kiosk UI | 🟢 Complete | |
| **Attendance** | Face ID | 🟡 Simulated | Uses `setTimeout` mockup; no real Tensor/Face API. |
| **Attendance** | Geofencing | 🟢 Complete | Haversine logic implemented. |
| **Payroll** | Calculations | 🟢 Complete | Standard formulas implemented. |
| **Payroll** | Bank Files | 🟡 Partial | Txt format is simplified, not bank-spec compliant. |
| **Compliance** | AI Audit | 🟢 Complete | |
| **Compliance** | PDF Gen | 🟢 Complete | |
| **Shifts** | Rostering | 🟢 Complete | |
| **AI** | Live Voice | 🟢 Complete | Works via Gemini Live API. |

---

## 6. Bugs, Issues, and Technical Debt

### Priority: Critical (S)
1.  **Data Persistence:**
    *   *Issue:* All data (employees, attendance, payroll) is stored in `GlobalContext` state. Refreshing the browser resets the app to `INITIAL_EMPLOYEES`.
    *   *Estimate:* L (Requires backend/DB integration).
2.  **API Key Exposure:**
    *   *Issue:* `process.env.API_KEY` is used in client-side code. In a production build, this would be exposed to the user.
    *   *Fix:* Move AI calls to a server-side proxy (Next.js API route or Express).
    *   *Estimate:* M.

### Priority: High (M)
1.  **Biometric Security:**
    *   *Issue:* Face ID is currently a UI simulation (`setTimeout`). It does not actually verify the user's identity.
    *   *Fix:* Integrate `face-api.js` or a cloud-based biometric provider.
    *   *Estimate:* L.
2.  **Audio Compatibility:**
    *   *Issue:* The Live API implementation uses `AudioContext` and `ScriptProcessorNode` (deprecated) or `AudioWorklet`. Browser compatibility (Safari vs Chrome) for raw PCM streaming is fragile.
    *   *Estimate:* M.

### Priority: Medium (M)
1.  **Payroll Formulas:**
    *   *Issue:* PCB (Tax) calculation is a flat 5% simplification. Real LHDN formulas are complex tiered tables.
    *   *Estimate:* M.
2.  **Bank File Formats:**
    *   *Issue:* The generated `.txt` files for KWSP/SOCSO are illustrative. Real banking portals require exact byte-aligned positioning.
    *   *Estimate:* S.

---

## 7. Testing Strategy (Recommended)

*   **Unit Tests:**
    *   `services/complianceService.ts`: Verify statutory math (EPF 11%, SOCSO tiers).
    *   `services/securityService.ts`: Verify Haversine distance and spoof detection.
*   **Integration Tests:**
    *   Payroll Flow: Ensure attendance data correctly flows into overtime calculations in the payroll engine.
*   **E2E Tests:**
    *   Kiosk Flow: Test camera permission prompts and check-in success states.

---

## 8. Pre-Launch Checklist

1.  [ ] **Database:** Migrate `GlobalContext` state to a real database (Postgres/Firebase).
2.  [ ] **Authentication:** Implement true login (Auth0/Firebase Auth) to replace role switcher.
3.  [ ] **Face ID:** Replace biometric simulation with actual facial recognition library.
4.  [ ] **Statutory Validation:** Validate payroll output against official LHDN calculators.
5.  [ ] **Security:** Move Gemini API calls to a backend proxy to hide API keys.
6.  [ ] **PWA Assets:** Generate valid icons and splash screens for `manifest.json`.
