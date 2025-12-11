
# PUNCH⏰CLOCK Malaysia 🇲🇾

> **The World's First "Neo-Brutalist" HR Operating System.**  
> *Powered by Google Gemini 2.5 • React 19 • FaceAPI • Local Storage Persistence*

![License](https://img.shields.io/badge/License-MIT-black.svg)
![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)
![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-8E75B2.svg?logo=google)
![Compliance](https://img.shields.io/badge/LHDN-Compliant-green.svg)
![Style](https://img.shields.io/badge/UI-Neo--Brutalist-EF4444.svg)

---

## 🧠 The "Neural" HR Ecosystem

PUNCH⏰CLOCK isn't just an app; it's a **closed-loop automation system**. It connects physical biometric data to financial statutory compliance in milliseconds.

```mermaid
graph TD
    A[📷 Smart Kiosk] -->|Face ID + GPS| B(Attendance Ledger)
    B -->|Time Logs| C{⚙️ Payroll Engine}
    D[📅 AI Roster] -->|OT & Shifts| C
    C -->|Auto-Calc| E[💰 Payslip Generation]
    C -->|Format| F[🏦 Bank Files (KWSP/SOCSO)]
    
    G[🤖 Gemini AI Agent] -.->|Audits| B
    G -.->|Drafts| I[⚖️ Contracts & Docs]
    G -.->|Plans| D
```

---

## 🚀 Key Innovations

### 1. 🎨 Adaptive "Bento" Dashboard
**Your Data, Your Layout.** 
- **Drag-and-Drop Engine:** Fully customizable grid. Hold "Edit Layout" to rearrange KPIs, charts, and action buttons.
- **State Persistence:** Your layout preference is saved locally and reloaded instantly on return.
- **Live Pulse:** Real-time visual pie charts showing workforce distribution (Active vs. Absent).

### 2. 🧠 Context-Aware AI Copilot
**It Learns You.**
- **Auto-Roster:** AI generates conflict-free shift schedules based on business type (F&B/Retail/Corporate) and approved leaves.
- **Emergency SOS:** Instantly finds replacements for no-show employees based on role match and OT cost.
- **Deep Context:** Uses `gemini-2.5-flash` to analyze your *specific* roster and attendance data.
- **Visual Responses:** Ask "Who is late?" -> AI renders a **dynamic table**. Ask "Payroll cost?" -> AI renders a **bar chart**.

### 3. 🛡️ Military-Grade Kiosk
**Zero Trust Architecture.**
- **Face Biometrics:** Integrated `face-api.js` for client-side face detection and matching.
- **Anti-Spoofing:** 
  - **Liveness:** Random challenges ("Blink twice").
  - **Geo-Fencing:** Haversine algorithm rejects "Fake GPS" emulators.
- **Offline First:** Works seamlessly without internet; syncs when online.

### 4. 💰 One-Click Statutory Payroll
**Malaysian Compliance Built-In.**
- **Automated Math:** Calculates **EPF (11%)**, **SOCSO**, **EIS**, and **PCB (Tax)** based on current LHDN progressive tax tiers.
- **Bank Integration:** Generates `.txt` batch files formatted for:
  - KWSP (Form A)
  - PERKESO (Assist Portal)
  - LHDN (CP39)
- **PDF Generation:** Instant, high-res payslips using `jsPDF`.

### 5. 📄 Document Factory
**Legal Docs on Autopilot.**
- **AI Drafting:** Generates Warning Letters, Employment Contracts, and Memos tailored to specific employee data.
- **Digital Signatures:** Draw or type signatures directly in the app.
- **Lifecycle Management:** Recurring document support (e.g., Annual NDA renewal).

### 6. 🏢 Organization Hub
**Brand & Policy Management.**
- **Asset Manager:** Upload company logos and letterheads used for PDF generation.
- **Event Center:** Create company-wide events (Meetings, Holidays) that sync to employee Dashboards.
- **Policy Engine:** AI-assisted drafting of Company Handbook sections.

---

## ⚡ Automation Showcase

### Scenario: The "No-Show" Crisis
**Traditional HR:** Manager calls 5 staff members, checks Excel for availability, argues about OT. (Time: 45 mins)

**PUNCH⏰CLOCK Automation:**
1. **Detection:** Kiosk flags "Absent" at 9:30 AM.
2. **Alert:** Manager clicks **SOS** button in Shifts module.
3. **AI Analysis:** Gemini scans 50 employees for:
   * Same Role
   * Currently Off-Shift
   * Lowest Accumulated OT
4. **Recommendation:** "Ali is the best match (0 OT this week)."
5. **Action:** Click "Assign". Roster updated.
6. **Total Time:** **< 30 Seconds.**

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Lightning-fast rendering & type safety. |
| **Styling** | Tailwind CSS | Custom "Neo-Brutalist" design system. |
| **Intelligence** | Google Gemini SDK | Natural Language Processing, Roster Generation, & Data Audit. |
| **Biometrics** | Face-API.js | Client-side TensorFlow implementation. |
| **State** | React Context + LocalStorage | "Sticky State" pattern for persistence without DB. |
| **Charts** | Recharts | Responsive data visualization. |

---

## 📦 Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-repo/punchclock.git
   npm install
   ```

2. **Configure Secrets**
   Create a `.env` file:
   ```env
   API_KEY=your_google_gemini_api_key
   ```

3. **Run**
   ```bash
   npm run dev
   ```

---

## 🤝 Contribution

We welcome PRs for:
- **LHDN 2025** Tax Table updates.
- **Baileys/WhatsApp** Integration for notification delivery.
- **Supabase** Backend integration for cloud sync.

---

*Built for efficiency. Engineered for compliance.*
