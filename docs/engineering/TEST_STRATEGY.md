
# Test Strategy

## 1. Unit Testing (Future)
*   **Tools**: Vitest + React Testing Library.
*   **Scope**:
    *   Payroll calculation functions (`calculatePCB`, `calculateEPF`).
    *   Geofencing logic (Haversine formula).
    *   UI Component rendering.

## 2. Manual QA (Current)
*   **Kiosk Flow**:
    1.  Open Kiosk in Incognito (Clean state).
    2.  Enroll Face.
    3.  Turn off WiFi.
    4.  Clock In.
    5.  Turn on WiFi -> Verify sync (persistence).
*   **Payroll Check**:
    1.  Generate payroll for employee with RM 5000 salary.
    2.  Verify EPF is RM 550 (11%).
    3.  Verify PCB matches LHDN calculator.

## 3. AI Evaluation
*   **Prompt Testing**: Verify Gemini returns valid JSON for `[VISUAL]` tags.
*   **Hallucination Check**: Ensure AI does not invent Malaysian labor laws.
