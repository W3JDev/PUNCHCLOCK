# 🚀 Product Roadmap: PUNCH⏰CLOCK Malaysia

## 🗓️ Pre-Launch Phase (Immediate Actions)

These items are critical blockers for a production release.

*   **Infrastructure & Data**
    *   [ ] **Migrate to Persistent DB:** Replace in-memory Context API with Supabase or Firebase.
    *   [ ] **Secure Auth:** Implement JWT-based authentication. Remove debug role switcher.
    *   [ ] **Backend Proxy:** Create a Node.js/Edge function layer to handle Gemini API requests securely (hide `API_KEY`).

*   **Compliance & Logic**
    *   [ ] **Real Face ID:** Integrate `face-api.js` or AWS Rekognition for actual identity verification.
    *   [ ] **PCB Accuracy:** Update tax logic to use the official LHDN MT5 computerized calculation method.
    *   [ ] **Bank File Verification:** Test generated KWSP/SOCSO text files with actual bank test portals (Maybank2u/CIMB BizChannel).

---

## 🗺️ Short-Term Roadmap (Q3 2025)

Focus: Stability and Mobile Experience.

*   **Mobile App Wrapper**
    *   Wrap PWA in Capacitor/React Native for native store deployment (Play Store/App Store).
    *   Access native geofencing and background location services.

*   **Notification System**
    *   Implement WhatsApp integration (via Twilio/Meta API) for:
        *   "Late" alerts to managers.
        *   Payslip distribution to staff.
        *   OTP login.

*   **Rostering 2.0**
    *   Shift swapping marketplace (Staff can trade shifts with Manager approval).
    *   Open shift bidding.

---

## 🔭 Medium-Term Roadmap (Q4 2025)

Focus: Financial Integration & Automation.

*   **E-Wallet Disbursal**
    *   Integration with TNG eWallet / GrabPay for daily salary payout (Earned Wage Access).

*   **AI Recruiting Agent**
    *   Extend Gemini integration to screen resumes and schedule interviews automatically.
    *   Generate onboarding contracts instantly upon candidate acceptance.

*   **IoT Hardware**
    *   Support for thermal printers (Bluetooth) for physical shift receipts at Kiosk.

---

## 🌟 Nice-to-Have (Long Term)

*   **Sentiment Analysis:** Analyze staff communication (anonymous feedback) to predict turnover risk.
*   **Multi-Tenant SaaS:** Refactor architecture to support multiple companies on a single deployment.
*   **Offline-First Sync:** Use PouchDB/RxDB for full offline kiosk capability with sync-upon-reconnect.
