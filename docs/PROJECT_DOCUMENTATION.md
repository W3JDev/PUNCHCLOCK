
# PUNCH⏰CLOCK Malaysia - Technical Architecture v2.5

## 1. System Overview
**PUNCH⏰CLOCK** has evolved into a "Workforce Intelligence Monolith". Version 2.5 introduces heavy-entropy data support for medium-sized businesses (50-100 staff) with deep historical forensic analysis.

---

## 2. Forensic Data Topology
The system now generates and manages 180-day historical windows to feed the Gemini AI Agent.

```text
[Global Context]
      │
      ├── [History Engine] ━━━━> 180-Day Attendance Buffer (LocalStorage/IndexedDB)
      │
      ├── [Identity Index] ━━━━> Biometric Descriptors (O(1) Face Matching)
      │
      └── [Statutory Core] ━━━━> LHDN 2025 MTD Tiers & EPF Ceilings
```

---

## 3. The Agentic Sidebar (Sidekick Architecture)
The AI Assistant is no longer a chat bubble; it is a **Collapsible Sidecar** integrated into the workspace.

*   **Stateful Context**: The AI receives a truncated, role-filtered JSON snapshot of the last 6 months of workforce performance.
*   **Intent Extraction**: Frontend regex parsers identify specific AI "Intents" (e.g., `[VISUAL: PAYROLL_CHART]`) to dynamically update the dashboard in real-time.
*   **Report Synthesis**: A specialized service in `documentService.ts` translates raw AI Markdown analysis into structured, vectorized PDFs.

---

## 4. Biometric Security Protocols
We implement a "Zero Trust" hardware mode for kiosk terminals.

1.  **Spatial Indexing**: Face descriptors are indexed using `faceapi.LabeledFaceDescriptors` for sub-100ms identity verification.
2.  **Liveness Verification**: Random expression challenges (Smile/Neutral) prevent 2D photo spoofing.
3.  **GPS Pinning**: Punches are only accepted if the `calculateDistance` (Haversine) returns < 100m from the registered HQ coordinate.

---

## 5. Scaling Limits
| Component | Current (v2.5) | Enterprise Target (v3.0) |
| :--- | :--- | :--- |
| **Employee Limit** | 100 (LocalStorage) | 5,000 (PostgreSQL) |
| **History Window** | 180 Days | Unlimited (Archive S3) |
| **Audit Speed** | < 2s | < 500ms (Edge Functions) |

---
**Status**: All v2.5 specifications implementation-complete.
