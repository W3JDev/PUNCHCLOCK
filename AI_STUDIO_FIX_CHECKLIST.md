# 🛠️ PUNCH⏰CLOCK Malaysia: Implementation Checklist

This document contains specialized prompts and technical instructions to resolve the 47 critical issues identified in the system audit. Use these prompts in **Google AI Studio** with the `gemini-3-pro-preview` model for best results.

---

## 🔴 CRITICAL FIXES (Tier 1) - High Security & Compliance
*Estimated time: 4-6 hours*

### [ ] Issue #1 | Strict Biometric Liveness & Duplicate Check
**Prompt:**
> "Update `services/faceBiometricService.ts` and `pages/Attendance.tsx`. Implement a challenge-response liveness check that requires the user to perform a random expression (Smile, Blink, or Neutral) before a punch is accepted. Also, ensure the `findDuplicateFace` logic is integrated into the `Employees.tsx` enrollment flow to block any attempt to register a face already assigned to another ID."
**Files:** `services/faceBiometricService.ts`, `pages/Attendance.tsx`, `pages/Employees.tsx`
**Success Criteria:** Static photos fail to clock in; registering a duplicate face returns a 'Biometric Identity Conflict' error.

### [ ] Issue #2 | Secure PIN Fallback with Rate Limiting
**Prompt:**
> "Modify `pages/Attendance.tsx` to fix the PIN verification logic. Connect the PIN input to search the `employees` array for a matching `pin` property. Implement a 3-strike lockout: after 3 failed attempts, set the Kiosk to a 'locked' state for 30 seconds, preventing any further input (Face or PIN) and displaying a countdown timer."
**Files:** `pages/Attendance.tsx`
**Success Criteria:** Entering a valid 6-digit employee PIN successfully clocks the user; 3 fails trigger a 30s hardware lockout.

### [ ] Issue #3 | LHDN 2025 Compliance: Tiered PCB Calculation
**Prompt:**
> "Rewrite the `calculatePCB` function in `pages/Payroll.tsx`. Replace the current simplified logic with a robust implementation of the 2025 LHDN MTD (Monthly Tax Deduction) progressive tax tiers for Malaysia. Ensure it accounts for the RM9,000 personal relief and the EPF relief (capped at RM4,000 annually). Add a 'Tax Breakdown' section to the payroll detail modal."
**Files:** `pages/Payroll.tsx`
**Success Criteria:** Tax calculations match official LHDN calculator within +/- RM1.00.

### [ ] Issue #4 | GPS Geofencing & Spoofing Detection
**Prompt:**
> "Enhance `services/securityService.ts`. Update `calculateAttendanceRisk` to strictly enforce a 100m geofence radius from KLCC coordinates (3.1578, 101.7118). Add logic to detect common GPS spoofing signatures (e.g., accuracy = 0 or high precision integers). If spoofing is detected, set `riskScore` to 100 and block the punch."
**Files:** `services/securityService.ts`, `pages/Attendance.tsx`
**Success Criteria:** Clocking in from >100m away flags a 'High Risk' event; simulated locations are rejected.

### [ ] Issue #5 | Data Scale: IndexedDB Persistence Migration
**Prompt:**
> "Migrate the data persistence engine in `context/GlobalContext.tsx` from `localStorage` to `IndexedDB`. Create a `storageService.ts` that handles async CRUD operations. Ensure existing `localStorage` data is migrated on first load. This fix is critical to prevent app crashes when the 5MB localStorage limit is reached with 100+ employees."
**Files:** `context/GlobalContext.tsx`, `services/storageService.ts`
**Success Criteria:** App state persists across refreshes using IndexedDB; data capacity expands to 50MB+.

### [ ] Issue #6 | Sequential Clocking Logic (State Machine)
**Prompt:**
> "Implement a strict state machine for attendance in `pages/Attendance.tsx`. A user MUST NOT be allowed to 'Check In' if they are already clocked in for the current day. They MUST NOT be allowed to 'Check Out' if no 'Check In' exists. Provide clear visual 'Access Blocked' screens for protocol violations."
**Files:** `pages/Attendance.tsx`
**Success Criteria:** Sequential flow (In -> Out -> In) is enforced; redundant punches are blocked with error messages.

### [ ] Issue #7 | Statutory Contribution Ceilings (EPF/SOCSO)
**Prompt:**
> "Update the payroll math in `pages/Payroll.tsx`. Apply statutory contribution ceilings: EPF Employee/Employer contributions must only calculate up to the RM20,000 monthly ceiling, and SOCSO/EIS must follow the latest tiered caps (capped at RM5,000 salary tier). Ensure rounding is handled at the 2nd decimal place per ringgit."
**Files:** `pages/Payroll.tsx`
**Success Criteria:** Payroll totals for high-earners (>RM6k) match SOCSO/EPF contribution tables exactly.

---

## 🟠 HIGH PRIORITY (Tier 2) - Functional Completeness
*Estimated time: 3-5 hours*

### [ ] Issue #8 | AI Agent RBAC & Data Filtering
**Prompt:**
> "Refactor `services/geminiService.ts`. Ensure the `buildContext` function strictly filters the data sent to the model based on `currentUser.role`. 'Staff' roles must never receive information about other employees' salaries, descriptors, or NRICs. Truncate context to the last 10 relevant records to prevent token overflow."
**Files:** `services/geminiService.ts`
**Success Criteria:** Staff querying the AI about 'total company salary' get a 'Permission Denied' response from the AI.

### [ ] Issue #9 | Signature Pad Integration (Document Hub)
**Prompt:**
> "Enhance `pages/Documents.tsx`. Replace the 'Typed Name' signature with a high-fidelity HTML5 Canvas drawing pad. Support touch pressure and clear actions. On save, convert the canvas to a Base64 string and store it in the `CompanyDocument` object."
**Files:** `pages/Documents.tsx`
**Success Criteria:** Users can physically sign contracts on a tablet/mobile; signature is embedded in the document view.

### [ ] Issue #10 | Shift Conflict Detection Engine
**Prompt:**
> "Update `pages/Shifts.tsx`. Implement an automated check that prevents the same employee from being assigned to overlapping shifts on the same day. Flag assignments that exceed 45 hours in a single week with an 'Employment Act Violation' badge."
**Files:** `pages/Shifts.tsx`
**Success Criteria:** Manual and AI roster generation skip employees with existing conflicts.

### [ ] Issue #11 | Claims-to-Payroll Integration
**Prompt:**
> "Connect `generalRequests` to `pages/Payroll.tsx`. Approved requests of type 'Claim' must be automatically summed and added to the 'Allowances' column for the relevant month. Rejected or Pending claims must be excluded. Update the payslip generator to itemize these claims."
**Files:** `pages/Payroll.tsx`, `services/documentService.ts`
**Success Criteria:** Approving a RM50 claim in the Dashboard instantly reflects in the employee's pending payroll.

### [ ] Issue #12 | Email Notification Mock System
**Prompt:**
> "Create `services/notificationService.ts`. Implement a mock email trigger that 'sends' (logs to console) a notification when: 1. A leave request is approved/rejected. 2. A new document is assigned. 3. A payroll run is marked as PAID. Add a 'Notification History' list to the Dashboard for users."
**Files:** `services/notificationService.ts`, `components/Layout.tsx`
**Success Criteria:** Actioning a request triggers a UI toast and a simulated email log.

---

## 🟡 MEDIUM PRIORITY (Tier 3) - UI/UX & Polish
*Estimated time: 2-3 hours*

### [ ] Issue #13 | Mobile-Responsive KPI Scaling
**Prompt:**
> "Fix CSS in `pages/Dashboard.tsx`. KPI cards (Present/Late/Absent) must use `text-7xl` on large screens but scale down to `text-4xl` on mobile to prevent overflow. Increase `min-height` to `350px` for better touch targets."
**Files:** `pages/Dashboard.tsx`

### [ ] Issue #14 | Immersive Fullscreen Kiosk Mode
**Prompt:**
> "Update the Kiosk overlay in `pages/Attendance.tsx`. Use `position: fixed; inset: 0` to ensure the camera feed and UI cover the entire viewport including the navigation sidebar. Remove all padding from the parent container in terminal mode."
**Files:** `pages/Attendance.tsx`

---

## 🔵 INTEGRATION GAPS (Tier 4) - Enterprise Ready
*Estimated time: 8-10 hours (Requires external API keys)*

### [ ] System Integration: SMTP (SendGrid/AWS SES)
### [ ] System Integration: S3/Cloud Storage for PDF persistence
### [ ] System Integration: Twilio SMS for PIN recovery
### [ ] System Integration: Bank Batch File (Form A) exact formatting
### [ ] System Integration: Google Calendar Roster Sync
### [ ] System Integration: Real-time Multi-user Board (WebSockets)
### [ ] System Integration: GDPR 'Right to be Forgotten' workflow
### [ ] System Integration: Multi-tenancy (Company ID isolation)
