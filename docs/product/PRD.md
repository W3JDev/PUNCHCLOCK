
# Product Requirements Document (PRD)

## 1. Smart Kiosk Module
**Goal:** Secure, fast, and fraud-proof attendance tracking.

*   **Face Recognition**:
    *   Must use `face-api.js` with client-side inference (SSD Mobilenet v1).
    *   Must match against 128-float descriptors stored in LocalStorage.
    *   **Liveness**: Random challenge ("Blink", "Smile") to prevent photo spoofing.
*   **Geofencing**:
    *   Calculate Haversine distance between device GPS and Office Coordinates.
    *   Reject clock-ins > 300m radius.
*   **UX**:
    *   Full-screen immersive mode.
    *   Specific flows for "Check In", "Check Out", and "Break".

## 2. Payroll Engine (Malaysian Context)
**Goal:** One-click payroll generation compliant with statutory bodies.

*   **Earnings**: Basic + Allowances (Fixed/Variable) + OT (1.5x/2.0x/3.0x).
*   **Deductions**:
    *   **EPF (KWSP)**: 11% (Employee), 13% (Employer).
    *   **SOCSO (Perkeso)**: Tiered rate based on salary range.
    *   **EIS (SIP)**: ~0.2%.
    *   **PCB (MTD)**: Progressive tax calculation based on annual projection.
*   **Outputs**:
    *   PDF Payslip (Generated via `jsPDF`).
    *   Bank Batch Files (.txt) for Maybank/CIMB integration.

## 3. AI Copilot (Gemini 2.5)
**Goal:** Reduce HR administrative load by 80%.

*   **Roster Generation**:
    *   Input: Business Type (F&B/Retail), Employee List, Leave Schedule.
    *   Output: JSON array of `Shift` objects optimization for coverage.
*   **Document Drafting**:
    *   Generate HTML content for Warning Letters, Contracts, and Memos.
    *   Inject specific employee variables (Name, IC, Salary).
*   **Compliance Audit**:
    *   Scan attendance logs for Section 60A violations (Work > 45 hours/week).
    *   Flag consecutive absentees (MIA).

## 4. Dashboard & Organization
*   **Bento Grid**: Drag-and-drop layout engine using `DashboardWidget[]` state.
*   **Organization**:
    *   Upload Logo/Letterhead (Base64 storage).
    *   Manage Company Events (Bulletin Board).
