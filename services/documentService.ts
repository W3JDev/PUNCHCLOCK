
import { CompanyProfile, Employee, PayrollEntry } from "../types";

// Access global jsPDF variable
declare const jspdf: any;

/**
 * Helper to add wrapped text
 */
const addWrappedText = (doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
  const splitText = doc.splitTextToSize(text, maxWidth);
  doc.text(splitText, x, y);
  return y + (splitText.length * lineHeight);
};

/**
 * Procedural Table Renderer for AI Reports
 * Draws a professional grid from markdown table data
 */
const drawReportTable = (doc: any, tableData: string[][], startY: number, margin: number, textWidth: number) => {
    const colCount = tableData[0].length;
    const colWidth = textWidth / colCount;
    const cellPadding = 3;
    let currentY = startY;
    const rowHeight = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    // Header Row
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, textWidth, rowHeight, 'F');
    tableData[0].forEach((cell, i) => {
        doc.text(cell.toUpperCase(), margin + (i * colWidth) + cellPadding, currentY + 7);
    });
    
    currentY += rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Data Rows
    tableData.slice(1).forEach((row) => {
        // Handle page overflow
        if (currentY > 260) {
            doc.addPage();
            currentY = 20;
        }

        row.forEach((cell, i) => {
            const cleanCell = cell.replace(/\*\*/g, '');
            doc.text(cleanCell, margin + (i * colWidth) + cellPadding, currentY + 7);
        });

        doc.setDrawColor(230);
        doc.line(margin, currentY + rowHeight, margin + textWidth, currentY + rowHeight);
        currentY += rowHeight;
    });

    return currentY + 10;
};

// Helper for Footer
const addW3jDevFooter = (doc: any, pageHeight: number, margin: number) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Generated with PUNCHCLOCK by w3jdev.com", margin, pageHeight - 10);
        doc.setTextColor(0); // Reset
    }
};

/**
 * Generates a formal AI-driven HR Intelligence Report
 */
export const generateAIReportPDF = (
    content: string,
    company: CompanyProfile,
    author: string
) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const PAGE_HEIGHT = 297;
    const MARGIN = 20;
    const TEXT_WIDTH = 170;
    const LINE_HEIGHT = 8;

    let y = 20;

    // 1. Executive Header
    doc.setFillColor(5, 5, 5); // Brutalist Dark
    doc.rect(0, 0, 210, 50, 'F');
    
    if (company.logoUrl) {
        try { doc.addImage(company.logoUrl, 'PNG', MARGIN, 10, 25, 25); } catch (e) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("HR INTELLIGENCE REPORT", 60, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`CONFIDENTIAL | ${company.name} | ${new Date().toLocaleDateString()}`, 60, 32);
    
    y = 65;
    doc.setTextColor(0, 0, 0);

    // 2. Report metadata
    doc.setFont("helvetica", "bold");
    doc.text("PREPARED BY:", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`PUNCHCLOCK AI AGENT (Certified for Malaysia Law)`, MARGIN + 40, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "bold");
    doc.text("REQUESTED BY:", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(author, MARGIN + 40, y);
    y += 15;

    // 3. Content Parsing
    const lines = content.split('\n');
    let tableBuffer: string[][] = [];

    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Detect Table
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
            if (!cells.every(c => c.match(/^[:\-\s]+$/))) {
                tableBuffer.push(cells);
            }
            return;
        } else if (tableBuffer.length > 0) {
            y = drawReportTable(doc, tableBuffer, y, MARGIN, TEXT_WIDTH);
            tableBuffer = [];
        }

        if (y > PAGE_HEIGHT - 30) {
            doc.addPage();
            y = 20;
        }

        if (trimmed.startsWith('### ')) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            y = addWrappedText(doc, trimmed.replace('### ', '').toUpperCase(), MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + 4;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
        } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const clean = trimmed.replace(/^[\*\-]\s/, '• ').replace(/\*\*/g, '');
            y = addWrappedText(doc, clean, MARGIN + 5, y, TEXT_WIDTH - 5, LINE_HEIGHT);
        } else if (trimmed !== '') {
            const clean = trimmed.replace(/\*\*/g, '');
            y = addWrappedText(doc, clean, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT);
        } else {
            y += 4; // Spacer
        }
    });

    if (tableBuffer.length > 0) {
        y = drawReportTable(doc, tableBuffer, y, MARGIN, TEXT_WIDTH);
    }

    // 4. Legal Footer
    y += 20;
    if (y > PAGE_HEIGHT - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(200);
    doc.line(MARGIN, y, MARGIN + 170, y);
    y += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const disclaimer = "This report is generated using advanced AI analysis based on internal system logs and the Malaysian Employment Act 1955. This is for advisory purposes and does not constitute formal legal advice.";
    y = addWrappedText(doc, disclaimer, MARGIN, y, TEXT_WIDTH, 4);

    addW3jDevFooter(doc, PAGE_HEIGHT, MARGIN);
    return doc.output('bloburl');
};

export const generateProfessionalPDF = (
  type: 'Warning' | 'Contract' | 'Probation',
  company: CompanyProfile,
  employee: Employee,
  details: { 
    date: string; 
    incidentDate?: string; 
    incidentTime?: string; 
    meetingDate?: string;
    misconductDescription?: string;
    customClause?: string; 
  }
) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  const PAGE_HEIGHT = 297;
  const MARGIN = 20;
  const TEXT_WIDTH = 170;
  const LINE_HEIGHT = 6;

  let y = 20;

  // --- 1. HEADER GENERATION ---
  const drawHeader = () => {
    // Logo
    if (company.logoUrl) {
      try {
        doc.addImage(company.logoUrl, 'PNG', MARGIN, 15, 25, 25);
      } catch (e) {
        console.warn("Logo add failed", e);
      }
    }

    // Company Info (Centered)
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(company.name.toUpperCase(), 105, 20, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`Registration No: ${company.regNo}`, 105, 25, { align: "center" });
    doc.text(company.address, 105, 30, { align: "center" });
    doc.text(`${company.phone} | ${company.email} | ${company.website}`, 105, 35, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(MARGIN, 45, 190, 45);
    return 55; // Return new Y position
  };

  y = drawHeader();

  // --- 2. DOCUMENT CONTENT ---

  const checkPageBreak = (currentY: number, neededSpace: number = 30) => {
    if (currentY + neededSpace > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      return drawHeader(); // Re-draw header on new page
    }
    return currentY;
  };

  if (type === 'Contract') {
     // === EMPLOYMENT CONTRACT ===
     doc.setFontSize(14);
     doc.setFont("times", "bold");
     doc.text("EMPLOYMENT CONTRACT", 105, y, { align: "center" });
     y += 15;
     
     // Intro
     doc.setFontSize(11);
     doc.setFont("times", "normal");
     const intro = `THIS AGREEMENT is made on ${details.date}, by and between:`;
     y = addWrappedText(doc, intro, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + 5;

     // Employer Section
     doc.setFont("times", "bold");
     doc.text("THE EMPLOYER:", MARGIN, y);
     y += LINE_HEIGHT;
     doc.setFont("times", "normal");
     doc.text(`${company.name} (${company.regNo})`, MARGIN, y);
     y += LINE_HEIGHT;
     doc.text(company.address, MARGIN, y);
     y += 10;

     // Employee Section
     doc.setFont("times", "bold");
     doc.text("THE EMPLOYEE:", MARGIN, y);
     y += LINE_HEIGHT;
     doc.setFont("times", "normal");
     doc.text(`Name: ${employee.name}`, MARGIN, y);
     y += LINE_HEIGHT;
     doc.text(`NRIC / Passport: ${employee.nric || 'N/A'}`, MARGIN, y);
     y += LINE_HEIGHT;
     doc.text(`Address: [Employee Address on File]`, MARGIN, y);
     y += 15;

     doc.text("IT IS HEREBY AGREED as follows:", MARGIN, y);
     y += 10;

     // Clauses
     const clauses = [
         { 
             title: "1. APPOINTMENT & REPORTING", 
             text: `The Employee is appointed to the position of ${employee.role.toUpperCase()} in the ${employee.department} Department. The Employee shall report to the Head of Department or any designated supervisor.` 
         },
         { 
             title: "2. COMMENCEMENT & TENURE", 
             text: `This employment shall commence on ${employee.joinDate}. The employment is permanent, subject to the successful completion of a probationary period as defined in Clause 3.` 
         },
         { 
             title: "3. PROBATIONARY PERIOD", 
             text: `The Employee shall serve a probationary period of three (3) months. The Company reserves the right to extend this period or terminate employment during probation with 24 hours' notice or salary in lieu.` 
         },
         { 
             title: "4. REMUNERATION", 
             text: `The Employee shall be paid a monthly basic salary of RM ${(employee.baseSalary || 0).toLocaleString('en-MY', {minimumFractionDigits: 2})}. Payment will be made by the last day of each calendar month. Statutory contributions (EPF, SOCSO, EIS) will be deducted as per Malaysian Law.` 
         },
         { 
             title: "5. WORKING HOURS", 
             text: `Normal working hours are 9:00 AM to 6:00 PM, Monday to Friday, with a one-hour lunch break. The Company reserves the right to alter these hours based on operational requirements.` 
         },
         { 
             title: "6. ANNUAL LEAVE & MEDICAL LEAVE", 
             text: `Upon confirmation, the Employee is entitled to 12 days of Annual Leave and 14 days of Medical Leave per annum, strictly in accordance with the Employment Act 1955.` 
         },
         { 
             title: "7. TERMINATION OF CONTRACT", 
             text: `Upon confirmation, either party may terminate this contract by giving one (1) month written notice or paying one (1) month salary in lieu of notice.` 
         },
         { 
             title: "8. CONFIDENTIALITY", 
             text: `The Employee shall not disclose any trade secrets or confidential information of the Company to any third party during or after employment.` 
         }
     ];
     
     // Add Custom Clause if present
     if (details.customClause && details.customClause.trim() !== '') {
        clauses.push({
            title: "9. ADDITIONAL TERMS",
            text: details.customClause
        });
     }

     clauses.forEach(clause => {
         y = checkPageBreak(y);
         doc.setFont("times", "bold");
         doc.text(clause.title, MARGIN, y);
         y += LINE_HEIGHT;
         doc.setFont("times", "normal");
         y = addWrappedText(doc, clause.text, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + 6;
     });

     y = checkPageBreak(y, 60); // Ensure space for signature
     y += 10;
     doc.text("IN WITNESS WHEREOF, the parties have executed this Agreement on the day and year first above written.", MARGIN, y);
     
     // Signatures
     y += 30;
     doc.setLineWidth(0.5);
     doc.line(MARGIN, y, MARGIN + 70, y); // Left line
     doc.line(120, y, 190, y); // Right line
     y += 5;
     
     doc.setFont("times", "bold");
     doc.text(`Signed for ${company.name}`, MARGIN, y);
     doc.text("Signed by Employee", 120, y);
     y += 5;
     doc.setFont("times", "normal");
     doc.text("Authorized Signatory", MARGIN, y);
     doc.text(employee.name, 120, y);
     y += 5;
     doc.text(`NRIC: ${employee.nric || ''}`, 120, y);

  } else {
      // === WARNING LETTER / PROBATION ===
      
      // Meta Data Block
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      
      const metaStart = y;
      doc.text("Ref No:", MARGIN, y);
      doc.text(`HR/${new Date().getFullYear()}/${employee.id.slice(-4)}`, MARGIN + 30, y);
      y += LINE_HEIGHT;
      
      doc.text("Date:", MARGIN, y);
      doc.text(details.date, MARGIN + 30, y);
      y += LINE_HEIGHT * 2;

      doc.setFont("times", "bold");
      doc.text("PRIVATE & CONFIDENTIAL", MARGIN, y);
      y += LINE_HEIGHT;
      
      doc.text(employee.name.toUpperCase(), MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("times", "normal");
      doc.text(`NRIC: ${employee.nric || 'N/A'}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.text(employee.role, MARGIN, y);
      y += LINE_HEIGHT;
      doc.text(employee.department, MARGIN, y);
      y += LINE_HEIGHT * 2;

      // Subject Line
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      const subject = type === 'Warning' 
          ? 'FORMAL WRITTEN WARNING FOR MISCONDUCT' 
          : 'CONFIRMATION OF EMPLOYMENT';
      
      doc.text(subject, MARGIN, y);
      // Underline subject
      const textWidth = doc.getTextWidth(subject);
      doc.line(MARGIN, y + 1, MARGIN + textWidth, y + 1);
      y += LINE_HEIGHT * 2;

      // Body Content
      doc.setFont("times", "normal");
      doc.setFontSize(11);

      let body = "";

      if (type === 'Warning') {
          doc.text(`Dear ${employee.name},`, MARGIN, y);
          y += LINE_HEIGHT * 2;

          const para1 = `This letter serves as a formal warning regarding your conduct. Following an internal review/investigation, it has been brought to our attention that you have violated Company Policy.`;
          y = addWrappedText(doc, para1, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;

          doc.setFont("times", "bold");
          doc.text("Details of Misconduct:", MARGIN, y);
          y += LINE_HEIGHT;
          doc.setFont("times", "normal");
          
          const incident = `Date of Incident: ${details.incidentDate || 'N/A'}\nTime: ${details.incidentTime || 'N/A'}\n\nDescription:\n${details.misconductDescription || 'Violation of code of conduct.'}`;
          y = addWrappedText(doc, incident, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;

          doc.setFont("times", "bold");
          doc.text("Required Improvement:", MARGIN, y);
          y += LINE_HEIGHT;
          doc.setFont("times", "normal");
          const improvement = `You are required to immediately improve your conduct. Failure to show immediate and sustained improvement may result in further disciplinary action, up to and including dismissal in accordance with Section 14 of the Employment Act 1955.`;
          y = addWrappedText(doc, improvement, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;
      } else {
          // Probation Confirmation
          doc.text(`Dear ${employee.name},`, MARGIN, y);
          y += LINE_HEIGHT * 2;

          const para1 = `We are pleased to inform you that you have successfully completed your probationary period with ${company.name}.`;
          y = addWrappedText(doc, para1, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;

          const para2 = `Management has reviewed your performance and we are satisfied with your contribution to the team. We hereby confirm your appointment as a permanent employee effective from ${details.date}.`;
          y = addWrappedText(doc, para2, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;

          const para3 = `All other terms and conditions of your employment as stated in your original letter of appointment remain unchanged.`;
          y = addWrappedText(doc, para3, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + LINE_HEIGHT;
          
          doc.text("We look forward to your continued success with the company.", MARGIN, y);
          y += LINE_HEIGHT * 2;
      }

      y = checkPageBreak(y, 60);

      doc.text("Sincerely,", MARGIN, y);
      y += 25;
      
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 60, y);
      y += 5;
      doc.setFont("times", "bold");
      doc.text("Human Resources Department", MARGIN, y);
      doc.setFont("times", "normal");
      doc.text(company.name, MARGIN, y + 5);

      y += 20;
      doc.setFont("times", "bold");
      doc.text("ACKNOWLEDGEMENT", MARGIN, y);
      y += 10;
      doc.setFont("times", "normal");
      const ack = `I, ${employee.name}, acknowledge receipt of this letter and understand its contents.`;
      y = addWrappedText(doc, ack, MARGIN, y, TEXT_WIDTH, LINE_HEIGHT) + 20;

      doc.line(MARGIN, y, MARGIN + 60, y);
      y += 5;
      doc.text("Employee Signature", MARGIN, y);
      doc.text(`Date: ______________`, MARGIN + 100, y);
  }

  addW3jDevFooter(doc, PAGE_HEIGHT, MARGIN);
  return doc.output('bloburl');
};

export const generatePayslipPDF = (
  entry: PayrollEntry,
  employee: Employee,
  company: CompanyProfile
) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  const PAGE_HEIGHT = 297;
  const MARGIN = 15;
  const WIDTH = 180;
  
  let y = 15;

  // 1. Header with Logo (Top Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Neo-blueish
  doc.text("PAYSLIP", MARGIN, y);
  doc.setTextColor(0, 0, 0);
  
  if (company.logoUrl) {
    try {
      doc.addImage(company.logoUrl, 'PNG', 170, 10, 25, 25);
    } catch(e) {}
  }
  
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(company.name.toUpperCase(), MARGIN, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(company.address.substring(0, 80) + "...", MARGIN, y);
  y += 5;
  doc.text(`Reg No: ${company.regNo}`, MARGIN, y);

  // Period Box
  y += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 247, 250);
  doc.rect(MARGIN, y, WIDTH, 14, 'FD');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`PAYMENT PERIOD: ${entry.month}`, MARGIN + 5, y + 9);
  doc.text(`DATE ISSUED: ${new Date().toISOString().split('T')[0]}`, 130, y + 9);

  // Employee Details
  y += 22;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE DETAILS", MARGIN, y);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y+2, WIDTH + MARGIN, y+2);
  y += 8;

  doc.setFont("helvetica", "normal");
  const leftColX = MARGIN;
  const rightColX = 110;
  
  doc.text(`Name: ${employee.name}`, leftColX, y);
  doc.text(`Employee ID: ${employee.id}`, rightColX, y);
  y += 6;
  doc.text(`Department: ${employee.department}`, leftColX, y);
  doc.text(`Position: ${employee.role}`, rightColX, y);
  y += 6;
  doc.text(`IC/Passport: ${employee.nric || '-'}`, leftColX, y);
  doc.text(`Bank Acct: ${employee.bankAccount || '-'} (${employee.bankName || ''})`, rightColX, y);
  y += 6;
  doc.text(`EPF No: ${employee.epfNo || '-'}`, leftColX, y);
  doc.text(`SOCSO No: ${employee.socsoNo || '-'}`, rightColX, y);

  // Earnings Table
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("EARNINGS", MARGIN, y);
  
  // Header
  y += 3;
  doc.setFillColor(50, 50, 50);
  doc.rect(MARGIN, y, WIDTH, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Description", MARGIN + 5, y + 5);
  doc.text("Amount (RM)", 185, y + 5, { align: "right" });
  doc.setTextColor(0, 0, 0);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Rows
  const addRow = (desc: string, amount: number) => {
     doc.text(desc, MARGIN + 5, y);
     doc.text(amount.toLocaleString('en-MY', {minimumFractionDigits: 2}), 185, y, { align: "right" });
     y += 8;
  };

  addRow("Basic Salary", entry.basicSalary);
  if (entry.allowances > 0) addRow("Allowances (Fixed & Variable)", entry.allowances);
  if (entry.overtimeAmount > 0) addRow("Overtime Pay", entry.overtimeAmount);
  
  const totalEarnings = entry.basicSalary + entry.allowances + entry.overtimeAmount;
  
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, MARGIN + WIDTH, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total Gross Pay", MARGIN + 5, y);
  doc.text(totalEarnings.toLocaleString('en-MY', {minimumFractionDigits: 2}), 185, y, { align: "right" });

  // Deductions Table
  y += 15;
  doc.text("DEDUCTIONS", MARGIN, y);
  
  y += 3;
  doc.setFillColor(50, 50, 50);
  doc.rect(MARGIN, y, WIDTH, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Description", MARGIN + 5, y + 5);
  doc.text("Amount (RM)", 185, y + 5, { align: "right" });
  doc.setTextColor(0, 0, 0);

  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  addRow("EPF (Employee Share)", entry.epf);
  addRow("SOCSO (PERKESO)", entry.socso);
  addRow("EIS (SIP)", entry.eis);
  addRow("PCB (Tax)", entry.pcb);

  const totalDeductions = entry.epf + entry.socso + entry.eis + entry.pcb;

  y += 2;
  doc.line(MARGIN, y, MARGIN + WIDTH, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total Deductions", MARGIN + 5, y);
  doc.text(totalDeductions.toLocaleString('en-MY', {minimumFractionDigits: 2}), 185, y, { align: "right" });

  // NET PAY
  y += 15;
  doc.setFillColor(239, 246, 255); // Light Blue bg
  doc.setDrawColor(59, 130, 246);
  doc.rect(MARGIN, y, WIDTH, 16, 'FD');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // Dark Blue text
  
  doc.setFont("helvetica", "bold");
  doc.text("NET PAY", MARGIN + 5, y + 11);
  doc.text(`RM ${entry.netSalary.toLocaleString('en-MY', {minimumFractionDigits: 2})}`, 185, y + 11, { align: "right" });

  addW3jDevFooter(doc, PAGE_HEIGHT, MARGIN);
  return doc.output('bloburl');
};
