
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, Employee, LeaveRequest, ComplianceFlag, User, CompanyProfile, CompanyDocument, Shift } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. STATIC KNOWLEDGE
const GENERAL_POLICY = `
  MN JEWEL SDN BHD - SYSTEM PROTOCOLS:
  - HQ: Level 10, Menara KLCC, Kuala Lumpur.
  - Working Hours: 9:00 AM - 6:00 PM (Mon-Fri).
  - Flexible Window: 8:45 AM - 9:15 AM (Buffer).
  - Friday Solat Jumaat: 12:30 PM - 2:30 PM break extension.
  - EPF: Standard 11% Employee, 13% Employer.
  - Employment Act 1955: Max 45 hours/week, OT limit 104 hours/month.
`;

const buildContext = (
    currentUser: User, 
    allEmployees: Employee[], 
    attendance: AttendanceRecord[], 
    payrollSettings: any,
    profile: CompanyProfile,
    docs: CompanyDocument[],
    shifts: Shift[],
    userPreferences?: Record<string, number>
) => {
    
    let specificContext = "";
    const today = new Date().toISOString().split('T')[0];

    if (currentUser.role === 'Staff') {
        const myAttendance = attendance.filter(a => a.employeeId === currentUser.id).slice(0, 10);
        specificContext = `
          STAFF CONTEXT: ${currentUser.name} (ID: ${currentUser.id})
          RECENT_ATTENDANCE: ${JSON.stringify(myAttendance)}
          ROLE_PERMISSION: Can ONLY view personal data.
        `;
    } else {
        const stats = {
            total: allEmployees.length,
            lateToday: attendance.filter(a => a.date === today && a.status === 'Late').length,
            otHighRisk: attendance.filter(a => (a.otMinutes || 0) > 120).length,
        };
        specificContext = `
          ADMIN CONTEXT: Access to all 50 staff records.
          SNAPSHOT: ${JSON.stringify(stats)}
          STAFF_SAMPLE: ${JSON.stringify(allEmployees.slice(0, 15).map(e => ({id: e.id, name: e.name, role: e.role, salary: e.baseSalary})))}
          ANOMALIES: ${JSON.stringify(attendance.filter(a => a.status === 'Late').slice(0, 5))}
        `;
    }

    return `
      ${GENERAL_POLICY}
      ${specificContext}
      
      AGENT INSTRUCTIONS:
      1. TONE: Authoritative, Analytical, Consultant-level Expert.
      2. FORMATTING: You MUST use semantic Markdown that the UI will render into RICH COMPONENTS.
         - Use ### for Section Headers.
         - Use **Bold** for emphasis.
         - Use * for Bullet points.
         - NEVER output raw JSON or code blocks unless explicitly asked.
      
      3. INTELLIGENCE DECK:
         - When performing audits, always start with an "EXECUTIVE SUMMARY".
         - Use a "DATA INSIGHTS" section for findings.
         - End with "ACTIONABLE RECOMMENDATIONS".

      4. VISUAL TRIGGERS:
         - Append ONE relevant tag at the absolute end: [VISUAL: PAYROLL_CHART], [VISUAL: ATTENDANCE_CHART], [VISUAL: STAFF_TABLE], or [VISUAL: POLICY_DOC].

      5. CONTEXTUAL SUGGESTIONS:
         - You MUST provide exactly 3 suggestions at the end: [SUGGESTIONS: Action 1, Action 2, Action 3].
         - Tailor them to the user's role and previous query.
    `;
};

export const chatWithHRAssistant = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  globalState: any
): Promise<{ text: string, intent?: string, navigation?: string, suggestions?: string[] }> => {
  try {
    const dynamicInstruction = buildContext(
        globalState.currentUser, 
        globalState.employees, 
        globalState.attendanceRecords, 
        globalState.payrollSettings,
        globalState.companyProfile,
        globalState.documents,
        globalState.shifts,
        globalState.userPreferences
    );

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: { systemInstruction: dynamicInstruction }
    });

    const response = await chat.sendMessage({ message });
    let fullText = response.text || "";
    
    let intent, navigation, suggestions: string[] = [];

    const visualMatch = fullText.match(/\[VISUAL: (.*?)\]/);
    if (visualMatch) { intent = visualMatch[1]; fullText = fullText.replace(visualMatch[0], ''); }

    const navMatch = fullText.match(/\[NAVIGATE: (.*?)\]/);
    if (navMatch) { navigation = navMatch[1]; fullText = fullText.replace(navMatch[0], ''); }

    const sugMatch = fullText.match(/\[SUGGESTIONS:\s*(.*?)\]/is);
    if (sugMatch) { suggestions = sugMatch[1].split(',').map(s => s.trim()); fullText = fullText.replace(sugMatch[0], ''); }

    return { text: fullText.trim(), intent, navigation, suggestions };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "System Error: Unable to reach HR Intelligence core." };
  }
};

export const analyzeAttendancePatterns = async (chartData: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze: ${JSON.stringify(chartData)}. Provide riskLevel (Low/Med/High) and one suggestion in JSON.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { riskLevel: { type: Type.STRING }, suggestion: { type: Type.STRING } },
          required: ["riskLevel", "suggestion"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return { riskLevel: "N/A", suggestion: "Analysis unavailable." }; }
};

export const runComplianceAudit = async (employees: any[], attendance: any[], leaves: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit summary: ${employees.length} staff, ${attendance.length} logs. Return list of ComplianceFlags in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING }, employeeName: { type: Type.STRING }, issue: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['Critical', 'Warning', 'Info'] },
              policyReference: { type: Type.STRING }, actionItem: { type: Type.STRING }
            },
            required: ["id", "employeeName", "issue", "severity", "policyReference", "actionItem"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return []; }
};

export const generateHRDocument = async (type: string, context: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Draft professional HTML HR document for: ${type}. Context: ${JSON.stringify(context)}. Use Malaysian legal tone.`,
    });
    return response.text;
  } catch (e) { return "Drafting failure."; }
};

export const generateAutoRoster = async (profile: any, employees: any[], start: string, end: string, leaves: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate Shift array from ${start} to ${end} for ${employees.length} staff. Business: ${profile.businessType}. Exclude approved leaves.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING }, employeeId: { type: Type.STRING }, date: { type: Type.STRING },
              type: { type: Type.STRING }, startTime: { type: Type.STRING }, endTime: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["id", "employeeId", "date", "type", "startTime", "endTime", "color"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return []; }
};

export const suggestShiftReplacement = async (missingId: string, date: string, employees: any[], shifts: any[], otMap: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Replace ID: ${missingId} on ${date}. OT map: ${JSON.stringify(otMap)}. Return JSON array of {recommendedId, reason}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { recommendedId: { type: Type.STRING }, reason: { type: Type.STRING } },
            required: ["recommendedId", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) { return []; }
};

export const generateDashboardWallpaper = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-tech minimalist wallpaper. Theme: ${prompt}. Dark background, geometric patterns, 16:9.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) { return null; }
};
