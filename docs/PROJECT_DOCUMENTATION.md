
# PUNCH⏰CLOCK Malaysia - Technical Architecture v2.2

## 1. System Overview

**PUNCH⏰CLOCK** is a client-side heavy Progressive Web App (PWA) designed to function as a complete HR Operating System. Version 2.2 introduces an "Agentic" architecture where the AI actively plans workforce logistics, generates legal content, and audits compliance.

---

## 2. Core Architecture: The "Sticky State" Engine

Instead of a traditional database for this demo version, we utilize a custom `useStickyState` hook pattern. This provides **Database-like Persistence** completely within the browser's Local Storage.

### Data Topology
```text
[GlobalContext Provider]
      │
      ├── [Employees State] <====> localStorage('pc_employees')
      │
      ├── [Attendance State] <===> localStorage('pc_attendance')
      │
      ├── [Shifts State] <=======> localStorage('pc_shifts')
      │
      ├── [Documents State] <====> localStorage('pc_documents')
      │
      ├── [Company Profile] <====> localStorage('pc_company')
      │
      └── [Payroll Settings] <===> localStorage('pc_payroll')
```

**Benefit:** The app retains state even after a hard refresh, simulating a production environment without backend latency.

---

## 3. Feature Deep Dive

### A. The "Bento" Grid Engine (`Dashboard.tsx`)
*   **Logic:** Uses a dynamic array `layout: DashboardWidget[]`.
*   **Interaction:** Implements HTML5 Drag and Drop API (`onDragStart`, `onDragEnter`, `onDragEnd`).
*   **Swapping Algorithm:** Real-time array slicing and reordering persisted to `localStorage`.

### B. Adaptive AI Assistant (`geminiService.ts`)
*   **Context Injection:** The prompt sent to Gemini is dynamically constructed at runtime, injecting current User Role, Employee List subset, and recent Attendance logs.
*   **Visual Output:** The AI outputs special tokens like `[VISUAL: PAYROLL_CHART]` which the frontend parses to render Recharts components.

### C. AI Workforce Planner (`Shifts.tsx`)
*   **Auto-Rostering:** 
    1.  User selects business context (e.g., "F&B").
    2.  AI receives constraints: Approved Leaves, Role Distribution requirements.
    3.  AI generates a JSON array of `Shift` objects optimized for coverage.
*   **SOS Module:**
    1.  Identifies "No Show".
    2.  Scans available staff.
    3.  Filters by `Role === Missing_Role` and sorts by `Accumulated_OT asc`.

### D. Document Factory (`Documents.tsx`)
*   **Generation:** Uses Gemini to draft HTML content for contracts/letters based on Employee variables.
*   **Signing:** HTML5 Canvas based signature pad (`touch-action: none` for mobile support).
*   **Recurring Logic:** `expiryDate` calculated automatically based on `recurrenceInterval`.

### E. Biometric Kiosk (`Attendance.tsx`)
*   **Mode Logic:** Uses `createPortal` to render a full-screen, isolated scanning interface over the main app.
*   **User Flow:** Idle Screen -> Select Intent (In/Out/Break) -> Select Method (Face/PIN) -> Scan -> Result.
*   **Face Recognition:** Uses `face-api.js` (SSD Mobilenet v1).
*   **Anti-Spoofing:** GPS Geofencing (Haversine Formula) & Liveness Challenges.

### F. Statutory Payroll Engine (`Payroll.tsx`)
*   **PCB Calculation:** Implements the **Monthly Tax Deduction (MTD)** progressive tax rates for Malaysia.
*   **EPF/SOCSO:** Calculates employer vs employee contributions based on distinct rates defined in `GlobalContext`.
*   **Bank Export:** String builders generate fixed-width `.txt` files for KWSP/SOCSO/LHDN portals.

### G. Organization & Branding (`Organization.tsx`)
*   **Branding:** Allows Admin to upload Logo and Letterhead images (stored as Base64 strings) which are dynamically injected into PDF headers for Payslips and Contracts.
*   **Event Management:** CRUD operations for Company Events, which are fed into the Dashboard "Bulletin" widget.
*   **Policy Editor:** AI-powered text generation to expand the Employee Handbook.

---

## 4. Security & Compliance

| Layer | Implementation | Purpose |
| :--- | :--- | :--- |
| **Data** | LocalStorage | Data never leaves the device (Privacy First). |
| **AI** | Context Windowing | Only relevant/anonymized snippets sent to LLM. |
| **Labor Law** | Logic Gates | Code checks `OT Hours > 104` to flag EA 1955 violations. |
| **Access** | RBAC | Role-based rendering prevents Staff from seeing Payroll. |

---

## 5. Automation Flows

1.  **Onboarding:** New Hire -> Face Enrollment -> Auto-generate Contract -> Document Signed.
2.  **Daily Ops:** Biometric Check-in -> Risk Score Calc -> Dashboard Update.
3.  **Scheduling:** AI Auto-Roster -> SOS Handling -> Compliance Check.
4.  **Month End:** Auto-compile Attendance -> Calculate OT/Late -> Generate Payslip -> Export Bank File.

---

## 6. Future Implementations (v3.0)

*   **Server-Side:** Migrate `GlobalContext` to Supabase/PostgreSQL.
*   **Edge Functions:** Move Gemini calls to backend to hide API keys.
*   **WhatsApp API:** Push notifications for payslips and attendance alerts.
