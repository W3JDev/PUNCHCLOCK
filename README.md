# PUNCH⏰CLOCK Malaysia 🇲🇾

> **Next-Gen HR Attendance & Payroll System powered by Google Gemini AI**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-Neo--Brutalist-38B2AC.svg?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini_2.5-8E75B2.svg?logo=google)

## ⚡ Overview

**PUNCH⏰CLOCK** is a progressive web application (PWA) designed to modernize HR operations for Malaysian SMEs. It moves beyond traditional spreadsheets by integrating **Biometric Attendance**, **Automated Payroll (KWSP/SOCSO/LHDN)**, and **AI-Driven Legal Compliance** into a single, high-contrast "Neo-Brutalist" interface.

Built with **React 19** and **Google Gemini 2.5**, it features a real-time voice assistant for HR queries and an intelligent audit system that flags labor law violations before they become liabilities.

---

## 🚀 Key Features

### 1. 🛡️ Smart Attendance Kiosk
- **Hardware Agnostic:** Transforms any iPad, Tablet, or Laptop into a secure punch clock.
- **Anti-Spoofing Security:** 
  - **Liveness Detection:** Random challenges (e.g., "Blink Twice") to prevent photo spoofing.
  - **Geo-Fencing:** Haversine distance checks against office coordinates to prevent remote clock-ins.
- **Risk Scoring:** Auto-assigns risk scores (0-100) to attendance records based on location accuracy and timing patterns.

### 2. 💰 Malaysian Payroll Engine
- **Statutory Compliant:** Auto-calculates deductions based on **Employment Act 1955** & **LHDN** rules:
  - **EPF (KWSP):** Employee (11%) / Employer (13%).
  - **SOCSO (Perkeso):** Employment Injury & Invalidity Schemes.
  - **EIS:** Employment Insurance System.
  - **PCB:** Monthly Tax Deduction (Simplified MT5 Logic).
- **Bank Ready:** Generates `.txt` files compatible with bank portals (Form A, CP39).
- **Instant Payslips:** Client-side PDF generation using `jsPDF`.

### 3. ⚖️ AI Compliance & Legal Hub
- **Automated Audits:** Gemini AI scans attendance records and leave data to flag:
  - Chronic Tardiness.
  - Missing MCs (Medical Certificates).
  - Consecutive Absenteeism (MIA Risk).
- **Doc Gen:** Instantly drafts legally phrased documents:
  - Warning Letters (Misconduct).
  - Employment Contracts.
  - Probation Confirmation Letters.

### 4. 🎙️ Gemini Live Assistant
- **Voice-to-Voice:** Real-time conversation with an HR AI agent using raw PCM audio streaming via WebSocket.
- **Context Aware:** The AI is trained on company SOPs and Malaysian holidays (e.g., "Is tomorrow a public holiday for Hari Raya?").

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Custom Neo-Brutalist Config)
- **AI/ML:** Google GenAI SDK (`@google/genai` v1.30.0)
- **State Management:** React Context API (In-Memory Architecture for Demo)
- **Visualization:** Recharts (Analytics & Payroll Graphs)
- **PDF Generation:** jsPDF
- **PWA:** Service Workers, Manifest for installability

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key (Get one at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/punch-clock-my.git
   cd punch-clock-my
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Ensure your environment (or `.env` file) has the API key:
   ```env
   # Your Google Gemini API Key
   API_KEY=your_actual_api_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
/
├── components/          # Neo-Brutalist UI Components (NeoButton, NeoCard)
├── context/             # Global State (User, Payroll, Shifts)
├── docs/                # Extended Technical Documentation
├── pages/               # Application Views (Dashboard, Kiosk, Payroll)
├── services/            # Business Logic Layer
│   ├── complianceService.ts  # Statutory Calculation Logic (EPF/SOCSO)
│   ├── geminiService.ts      # AI Prompt Engineering & API
│   ├── securityService.ts    # Geo-fencing & Anti-spoofing
│   └── documentService.ts    # PDF Rendering Engine
└── types.ts             # TypeScript Interfaces & Data Models
```

---

## 📖 Documentation

For a deep dive into the architecture, payroll formulas, and AI prompt engineering, please refer to the internal documentation:

- [**Project Documentation**](./docs/PROJECT_DOCUMENTATION.md)
- [**Roadmap**](./ROADMAP.md)

---

## 📸 Screen Previews

| **Dashboard** | **Smart Kiosk** |
|:---:|:---:|
| High-contrast analytics for easy outdoor reading. | Tablet-optimized interface with Face ID simulation. |

| **Payroll Engine** | **AI Compliance** |
|:---:|:---:|
| Auto-calculation of EPF/SOCSO/PCB. | Legal document generation powered by Gemini. |

---

## 🤝 Contribution

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for Malaysian SMEs.*