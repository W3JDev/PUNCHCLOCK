
import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, Employee, LeaveRequest, ComplianceFlag } from "../types";

// Initialize the client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COMPANY_CONTEXT = `
  COMPANY KNOWLEDGE BASE: PUNCHCLOCK MALAYSIA (MN JEWEL SDN BHD)

  1. **GENERAL HR POLICIES & SOPs**:
     - **Working Hours**: Mon-Fri, 9:00 AM - 6:00 PM. 1 Hour Lunch (1PM-2PM).
     - **Friday Prayers**: Extended lunch break 12:30 PM - 2:30 PM for Muslim staff.
     - **Flexible Work Arrangements (FWA)**: Staff may apply for WFH (Work From Home) up to 2 days a week, subject to HOD approval. Core hours 10AM-4PM must be maintained.
     - **Tardiness**: Grace period 15 mins. Late 3x/month = Verbal Warning. Late >1 hour without notice = 0.5 Day unpaid leave.
     - **Leave**:
       - Annual Leave: 12 Days (Staff), 18 Days (Manager). Must apply 3 days in advance.
       - MC: Upload digital copy to App within 24 hours. Original required upon return.
       - Emergency Leave: Must inform Line Manager by 8:30 AM via call.
       - Unpaid Leave: Requires HOD approval. Deducted at (Basic Salary / 26).
     - **Claims**:
       - Mileage: RM0.60/km (car), RM0.30/km (moto).
       - Client Meal: Max RM150/pax. Receipt required.
       - OT Meal: RM20 flat rate if working past 9:00 PM.
     - **Resignation**: 1 Month Notice (Probation), 2 Months (Confirmed Staff).

  2. **PRODUCT KNOWLEDGE (MN JEWEL)**:
     - **Core Collections**:
       - "The Heritage Series": 24K Gold traditional Malay motifs. Best seller: 'Bunga Raya Locket'.
       - "Urban Minimalist": 18K Rose Gold, targeted at Gen-Z.
       - "Bridal D'Amour": Custom diamond engagement rings (GIA Certified).
     - **Services**: Free ultrasonic cleaning for life. Resizing starts at RM50. Engraving is free for items >RM1000.

  3. **TERMS & CONDITIONS (CUSTOMER FACING)**:
     - **Returns**: Exchange within 7 days with original receipt. No cash refunds. Items must be unworn.
     - **Warranty**: 1 Year on craftsmanship (stone setting, clasps). Does not cover wear and tear or plating fading.
     - **Layaway Plan**: 30% Deposit, balance paid over 3 months. Item released upon full payment.

  4. **LEGAL & COMPLIANCE (MALAYSIA & REGIONAL)**:
     - **Employment Act 1955 (West Malaysia)**: 
       - Max Working Hours: 45 Hours per week.
       - OT Limit: 104 hours/month.
     - **Sabah Labour Ordinance (East Malaysia)**: 
       - Covers employees in Sabah. Similar to EA 1955 but distinct on holiday pay calculations.
       - Harvest Festival (Kaamatan) is a mandatory public holiday in Sabah.
     - **Sarawak Labour Ordinance**:
       - Covers employees in Sarawak.
       - Gawai Dayak is a mandatory public holiday.
     - **Remote Work Policy**: Employees working remotely must maintain "Online" status on Teams/Slack. Visual check-in via PUNCHCLOCK App is mandatory at 9AM.
     - **Maternity Leave**: 98 Days (Paid).
     - **Paternity Leave**: 7 Days (Paid) for married male employees.
     - **Sexual Harassment**: Company must display notice. Strict zero tolerance.
     - **EPF (KWSP)**: Employer 13% (salary <RM5k), 12% (>RM5k). Employee 11%.
     - **SOCSO**: Employment Injury Scheme & Invalidity Scheme mandatory.
     - **Minimum Wage**: RM1,700 (2025 Standard).
     - **Data Privacy**: All staff data handled per PDPA 2010.

  5. **APP USAGE SOP**:
     - **Check-In**: Use "Smart Kiosk" tablet at entrance. Face ID required.
     - **Forgot ID**: Use PIN code override (Subject to manager approval notification).
     - **Bug Reporting**: Contact IT Support at support@mnjewel.com.
`;

/**
 * Chat with the HR Assistant for policy Q&A
 */
export const chatWithHRAssistant = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: `You are the AI Assistant for MN Jewel (PUNCHCLOCK System).
        
        Your Mission:
        1. Answer staff inquiries accurately using the KNOWLEDGE BASE provided.
        2. If a staff asks about HR policy (e.g., "How many days leave do I have?"), provide the policy rule and guide them to the Dashboard to check their balance.
        3. If a staff asks about products (e.g., "What is the warranty?"), answer as a knowledgeable sales trainer.
        4. Be professional, concise, and empathetic.
        5. For legal/compliance questions, cite the relevant Malaysian act (Employment Act, Sabah/Sarawak Ordinance) based on context.

        KNOWLEDGE BASE:
        ${COMPANY_CONTEXT}
        `,
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the HR knowledge base right now. Please try again later.";
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
    // Prepare minified data for context window efficiency
    const auditData = {
      staff: employees.map(e => ({ id: e.id, name: e.name, joinDate: e.joinDate })),
      attendance: attendance.slice(0, 50).map(r => ({ empId: r.employeeId, status: r.status, date: r.date })),
      leaves: leaveRequests.map(l => ({ empId: l.employeeId, type: l.type, hasDoc: !!l.attachment, status: l.status }))
    };

    const prompt = `
      Perform a strict HR Compliance Audit on the provided data based on the PUNCHCLOCK MALAYSIA KNOWLEDGE BASE.
      
      Rules to Flag:
      1. **Chronic Tardiness**: Any employee with >3 "Late" status records. (Severity: Warning). Ref: Internal SOP.
      2. **Missing Documentation**: Any "Medical" leave status "Approved" but hasDoc is false. (Severity: Critical). Ref: Employment Act 1955 (Section 60F).
      3. **Consecutive Absences**: Any employee with "Absent" status for 2+ consecutive days without leave record (MIA Risk). (Severity: Critical). Ref: Employment Act Section 15(2).
      4. **Probation Overrun**: Any staff joined >3 months ago but still listed as "Probation" (Inferred if not active). (Severity: Info).
      
      Data: ${JSON.stringify(auditData)}

      Return a JSON array of "ComplianceFlag" objects.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
 * Generate a MIA (Missing In Action) Show Cause Letter
 */
export const generateMIALetter = async (employeeName: string, absentDates: string[]): Promise<string> => {
  try {
    const prompt = `
      Draft a formal "Show Cause Letter" for an employee named ${employeeName} who has been absent without leave on the following dates: ${absentDates.join(', ')}.
      
      The letter must:
      1. Be compliant with Malaysian Employment Act 1955 (Section 15(2) deems breach of contract if absent > 2 days).
      2. Use a professional, firm, yet fair tone.
      3. Ask the employee to provide a written explanation within 48 hours.
      4. Mention potential disciplinary action including termination if no valid reason is provided.
      5. Include placeholders for Company Name and HR Manager signature.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate letter.";
  } catch (error) {
    console.error("Gemini MIA Generation Error:", error);
    return "Error generating compliance document.";
  }
};

/**
 * Generate other HR Documents
 */
export const generateHRDocument = async (type: string, details: string): Promise<string> => {
  try {
    const prompt = `
      Draft a formal Malaysian HR Document: ${type}.
      Details: ${details}
      
      Requirements:
      - Compliant with Malaysian Labor Law.
      - Professional formatting.
      - Clear terms and conditions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate document.";
  } catch (error) {
    return "Error generating document.";
  }
}

/**
 * Analyze Attendance Patterns (Predictive Analytics)
 */
export const analyzeAttendancePatterns = async (attendanceData: any[]): Promise<any> => {
  try {
    const prompt = `
      Analyze the following attendance data for patterns of tardiness, potential burnout (excessive overtime), or frequent Monday absences.
      Data: ${JSON.stringify(attendanceData.slice(0, 15))} (truncated for demo).
      
      Return a JSON object with:
      - riskLevel: "Low" | "Medium" | "High"
      - summary: Short text summary of findings.
      - suggestion: actionable HR advice.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analytics Error:", error);
    return { riskLevel: "Low", summary: "Analysis failed", suggestion: "Check connection." };
  }
};
