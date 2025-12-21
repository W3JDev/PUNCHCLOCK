
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, Employee, LeaveRequest, ComplianceFlag, User, CompanyProfile, CompanyDocument, Shift } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. STATIC KNOWLEDGE (Public to all roles)
const GENERAL_POLICY = `
  COMPANY POLICIES (MN JEWEL SDN BHD):
  - Working Hours: 9:00 AM - 6:00 PM (Mon-Fri).
  - Friday Prayers: 12:30 PM - 2:30 PM break.
  - Overtime: Must be approved by manager. Rate 1.5x (Normal), 2.0x (Rest Day), 3.0x (Public Holiday).
  - EPF: Employer 13%, Employee 11%.
  - Annual Leave: 12 Days (Staff), 18 Days (Manager).
  - MC Policy: Must upload within 24 hours.
  - Claims: Mileage RM0.60/km.
`;

const SITE_MAP = `
  AVAILABLE APP ROUTES (Use these exact paths for navigation):
  - Dashboard / Overview: /
  - Smart Kiosk / Clock In: /attendance
  - Employee List / Profiles: /employees
  - Shift Schedule / Roster: /shifts
  - Payroll / Salary / Payslips: /payroll
  - Compliance / Policies / Contracts: /compliance
  - Onboarding: /onboarding
  - User Guide / Help: /help
  - Organization Settings: /organization
  - Documents / Files: /documents
`;

/**
 * dynamically builds the system instruction based on who is asking.
 */
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
    
    // --- ROLE BASED DATA FILTERING ---
    if (currentUser.role === 'Staff') {
        const myData = allEmployees.find(e => e.id === currentUser.id);
        const myAttendance = attendance.filter(a => a.employeeId === currentUser.id).slice(0, 5); 
        const myShifts = shifts.filter(s => s.employeeId === currentUser.id && new Date(s.date) >= new Date());
        const myDocs = docs.filter(d => d.assignedTo === currentUser.id || d.assignedTo === 'ALL' || d.assignedTo === 'ROLE:Staff');
        
        // Calculate Unclaimed Leave (Mock Logic)
        const usedLeave = 0; 
        const totalLeave = profile.leavePolicies?.find(p => p.name === 'Annual Leave')?.daysPerYear || 12;
        const balance = totalLeave - usedLeave;

        specificContext = `
          CURRENT USER (STAFF): ${currentUser.name} (ID: ${currentUser.id})
          MY PROFILE: ${JSON.stringify(myData)}
          MY UPCOMING SHIFTS: ${JSON.stringify(myShifts)}
          MY LEAVE BALANCE: ${balance} days remaining.
          MY ATTENDANCE (LAST 5): ${JSON.stringify(myAttendance)}
          SECURITY: Can ONLY discuss own data.
        `;
    } 
    else {
        // ADMIN/HR CONTEXT - FULL ACCESS
        const summary = {
            totalStaff: allEmployees.length,
            active: allEmployees.filter(e => e.status === 'Active').length,
            lateToday: attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Late').map(r => r.employeeId),
            onboardingCount: allEmployees.filter(e => (e.onboardingStep || 0) < 4).length
        };

        specificContext = `
          CURRENT USER (ADMIN/HR): ${currentUser.name}
          COMPANY PROFILE: ${JSON.stringify(profile)}
          COMPANY SNAPSHOT: ${JSON.stringify(summary)}
          EMPLOYEE ROSTER (SAMPLE): ${JSON.stringify(allEmployees.slice(0, 20).map(e => ({id: e.id, name: e.name, role: e.role, salary: e.baseSalary, status: e.status, onboardingStep: e.onboardingStep})))}
          ATTENDANCE LOG (SAMPLE): ${JSON.stringify(attendance.slice(0, 20))}
          SECURITY: Full Access.
        `;
    }

    const prefSummary = userPreferences ? `USER PREFERENCES (INTERACTION LOGS): ${JSON.stringify(userPreferences)}. Use this to prioritize topics the user frequently asks about.` : "";

    return `
      ${GENERAL_POLICY}
      CUSTOM COMPANY POLICIES: ${profile.policies || 'None defined.'}
      ${SITE_MAP}
      ${specificContext}
      ${prefSummary}
      
      YOUR AGENT PROTOCOL:
      1. You are an expert HR Consultant AI. You don't just answer; you analyze and advise.
      2. Use Markdown for formatting (Bold **text**, Bullet points *, Headers ###).
      
      3. **REQUIRED VISUAL TAGS (Append ONE of these tags to the END of response if applicable):**
         - If discussing Salary, Cost, Forecast, or Overtime -> [VISUAL: PAYROLL_CHART]
         - If discussing Lateness, Absence, or Headcount -> [VISUAL: ATTENDANCE_CHART]
         - If listing specific employees who are late/risky -> [VISUAL: STAFF_TABLE]
         - If drafting a Letter/Memo/Policy -> [VISUAL: POLICY_DOC]
         - If user needs to go to a page -> [NAVIGATE: /path]

      4. **SUGGESTION SYSTEM (CRITICAL):**
         - At the end of EVERY response, you MUST provide 3 relevant follow-up suggestion pills in the format: [SUGGESTIONS: Pill 1, Pill 2, Pill 3].
         - Tailor these suggestions based on the current conversation and the USER PREFERENCES provided.
         - E.g. If the user asked about Payroll, suggestions might be "Calculate next month's OT", "Download KWSP file", "View salary trends".

      5. **SCENARIO HANDLING:**
         - **Forecasting:** If asked to forecast, perform a linear projection based on provided data (e.g., if OT is high now, assume it continues). Be authoritative.
         - **Drafting:** If asked to draft a letter, write the full text in the response AND trigger [VISUAL: POLICY_DOC].
         - **Auditing:** If asked to audit, summarize the findings (e.g., "Found 3 employees late") and trigger [VISUAL: STAFF_TABLE].
    `;
};

/**
 * Chat with the HR Assistant
 */
export const chatWithHRAssistant = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  globalState: { 
      currentUser: User, 
      employees: Employee[], 
      attendanceRecords: AttendanceRecord[],
      payrollSettings: any,
      companyProfile: CompanyProfile,
      documents: CompanyDocument[],
      shifts: Shift[],
      userPreferences: Record<string, number>
  }
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

    // Fix: Using correct model name gemini-3-flash-preview for general chat tasks
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: { systemInstruction: dynamicInstruction }
    });

    const response = await chat.sendMessage({ message });
    // Fix: extraction using property .text (not .text())
    let fullText = response.text || "I couldn't generate a response.";
    
    // --- PARSE INTENTS & CLEAN TEXT ---
    let intent = undefined;
    let navigation = undefined;
    let suggestions: string[] = [];

    // 1. Extract Visuals
    const visualMatch = fullText.match(/\[VISUAL: (.*?)\]/);
    if (visualMatch) {
        intent = visualMatch[1];
        fullText = fullText.replace(visualMatch[0], '');
    }

    // 2. Extract Navigation
    const navMatch = fullText.match(/\[NAVIGATE: (.*?)\]/);
    if (navMatch) {
        navigation = navMatch[1];
        fullText = fullText.replace(navMatch[0], '');
    }

    // 3. Extract Suggestions
    const sugMatch = fullText.match(/\[SUGGESTIONS: (.*?)\]/);
    if (sugMatch) {
        suggestions = sugMatch[1].split(',').map(s => s.trim());
        fullText = fullText.replace(sugMatch[0], '');
    }

    return { text: fullText.trim(), intent, navigation, suggestions };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "Sorry, I'm having trouble connecting to the HR knowledge base right now. Please try again later." };
  }
};

/**
 * Run AI Compliance Audit on records
 */
export const runComplianceAudit = async (
  employees: Employee[],
  attendance: AttendanceRecord[],
  leaveRequests: LeaveRequest[]
): Promise<ComplianceFlag[]> => {
  try {
    const auditData = {
      staff: employees.map(e => ({ id: e.id, name: e.name, joinDate: e.joinDate })),
      attendance: attendance.slice(0, 50).map(r => ({ empId: r.employeeId, status: r.status, date: r.date })),
      leaves: leaveRequests.map(l => ({ empId: l.employeeId, type: l.type, hasDoc: !!l.attachment, status: l.status }))
    };

    const prompt = `
      Perform a strict HR Compliance Audit on the provided data based on the PUNCHCLOCK MALAYSIA KNOWLEDGE BASE.
      Rules:
      1. **Chronic Tardiness**: >3 "Late" status. (Warning).
      2. **Missing Documentation**: "Medical" leave without doc. (Critical).
      3. **MIA Risk**: "Absent" > 2 consecutive days. (Critical).
      
      Data: ${JSON.stringify(auditData)}
      Return JSON array of "ComplianceFlag".
    `;

    // Fix: Using correct model name gemini-3-pro-preview for complex reasoning tasks like auditing
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    employeeName: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["Critical", "Warning", "Info"] },
                    policyReference: { type: Type.STRING },
                    actionItem: { type: Type.STRING }
                }
            }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Audit Error", error);
    return [];
  }
};

/**
 * Enhanced Document Generator
 * Now accepts full objects to perform robust legal drafting.
 */
export const generateHRDocument = async (
    type: string, 
    data: string | { 
        company?: CompanyProfile; 
        employee?: Employee; 
        topic?: string; 
        additionalDetails?: string; 
    }
): Promise<string> => {
    
    let promptContext = "";

    // Handle polymorphism (string or object) to maintain backward compat
    if (typeof data === 'string') {
        promptContext = `Draft specific content: ${data}`;
    } else {
        const { company, employee, topic, additionalDetails } = data;
        
        promptContext = `
            ACT AS: Senior Legal Counsel & HR Director for a Malaysian Company.
            TASK: Draft a comprehensive, legally compliant ${type} document.
            
            PARTIES:
            - EMPLOYER: ${company?.name} (${company?.regNo}), located at ${company?.address}.
            - EMPLOYEE: ${employee?.name} (ID: ${employee?.id}), Position: ${employee?.role}, NRIC: ${employee?.nric || '[NRIC]'}.
            
            SPECIFIC TOPIC/DETAILS:
            ${topic || additionalDetails || 'Standard Template'}
            
            REQUIREMENTS:
            1. **Format**: Return clean, professional HTML (use <h3>, <p>, <ul>, <li>, <strong>, <br>). No markdown code blocks.
            2. **Compliance**: Strictly adhere to the Malaysian Employment Act 1955. Cite sections where relevant (e.g. Section 14 for Misconduct, Section 60A for Hours).
            3. **Tone**: Formal, authoritative, neutral, and professional.
            4. **Completeness**: The document must be complete (1-3 pages length equivalent). Do NOT summarize. Write every clause out fully.
            5. **Structure**: 
               - Formal Header (Date, Ref No).
               - Salutation.
               - Body Paragraphs (Situation, Clause, Action).
               - Footer (Signatures, Acknowledgment).
            
            LANGUGAGE: English (British/Malaysian standard).
        `;
    }

    try {
        // Fix: Using gemini-3-pro-preview for advanced text generation tasks like legal drafting
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: promptContext,
        });
        return response.text || "<p>Error: AI generation failed.</p>";
    } catch (e) {
        console.error("Doc Gen Error", e);
        return "<p>Error: Document generation service unavailable.</p>";
    }
}

/**
 * AI Auto-Roster Generator
 * Generates an optimized schedule based on business type, employees, and rules.
 */
export const generateAutoRoster = async (
    company: CompanyProfile,
    employees: Employee[],
    startDate: string,
    endDate: string,
    leaves: LeaveRequest[]
): Promise<Shift[]> => {
    const businessContext = company.businessType || 'General Office';
    const activeStaff = employees.filter(e => e.status === 'Active').map(e => ({ id: e.id, name: e.name, role: e.role }));
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').map(l => ({ empId: l.employeeId, date: l.date }));

    const prompt = `
        ACT AS: AI Workforce Planner for a ${businessContext} business in Malaysia.
        TASK: Generate an OPTIMIZED shift roster for the period ${startDate} to ${endDate}.
        
        STAFF AVAILABLE: ${JSON.stringify(activeStaff)}
        LEAVE EXCLUSIONS: ${JSON.stringify(approvedLeaves)} (Do NOT schedule these staff on these dates).
        
        BUSINESS RULES (${businessContext}):
        1. **F&B/Retail**: Fri/Sat/Sun are RUSH days. Increase staff count by 20%. Late shifts are required.
        2. **Office**: Mon-Fri 9-6 standard.
        3. **Constraint**: No employee should work 7 days in a row.
        4. **Role Mixing**: Ensure at least one Manager/Senior is present per shift if possible.
        
        OUTPUT FORMAT:
        Return a JSON ARRAY of Shift objects.
        Structure:
        [{
            "employeeId": "string",
            "date": "YYYY-MM-DD",
            "type": "Morning" | "Afternoon" | "Night",
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "color": "hex_code" (Blue=#3B82F6 for Morning, Orange=#F97316 for Afternoon),
            "notes": "Reason for assignment (e.g. Rush hour coverage)"
        }]
    `;

    try {
        // Fix: Using gemini-3-pro-preview for roster optimization
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const rawShifts = JSON.parse(response.text || "[]");
        
        // Post-processing to add IDs and calculate OT
        return rawShifts.map((s: any) => ({
            ...s,
            id: Math.random().toString(36).substr(2, 9),
            approvalStatus: 'Approved', // Auto-approved by AI
            isOvertime: false, // Simplification
            overtimeHours: 0
        }));

    } catch (e) {
        console.error("Auto Roster Error", e);
        return [];
    }
};

/**
 * Emergency Shift Replacement Logic
 */
export const suggestShiftReplacement = async (
    missingEmployeeId: string,
    shiftDate: string,
    employees: Employee[],
    currentShifts: Shift[],
    accumulatedOT: Record<string, number>
): Promise<{ recommendedId: string, reason: string }[]> => {
    
    const missingEmp = employees.find(e => e.id === missingEmployeeId);
    const availableStaff = employees.filter(e => 
        e.id !== missingEmployeeId && 
        e.status === 'Active' &&
        !currentShifts.some(s => s.employeeId === e.id && s.date === shiftDate) // Not already working that day
    ).map(e => ({ id: e.id, name: e.name, role: e.role, currentOT: accumulatedOT[e.id] || 0 }));

    const prompt = `
        EMERGENCY: Employee ${missingEmp?.name} (${missingEmp?.role}) is a NO-SHOW for shift on ${shiftDate}.
        TASK: Recommend the best 3 replacements from the available staff list.
        
        AVAILABLE STAFF: ${JSON.stringify(availableStaff)}
        
        CRITERIA:
        1. **Role Match**: Priority to same role.
        2. **Cost Efficiency**: Priority to staff with LOW existing OT.
        3. **Reliability**: (Assume senior staff are more reliable).
        
        OUTPUT JSON:
        [
            { "recommendedId": "id", "reason": "Explanation (e.g. Matches role, low OT)" }
        ]
    `;

    try {
        // Fix: Using gemini-3-pro-preview for critical reasoning
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Replacement Error", e);
        return [];
    }
};

export const analyzeAttendancePatterns = async (attendanceData: any[]): Promise<any> => {
    // Fix: Using gemini-3-flash-preview for quick analytical tasks
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze attendance: ${JSON.stringify(attendanceData.slice(0,10))}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
}
