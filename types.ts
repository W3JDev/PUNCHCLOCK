
export interface CompanyProfile {
  name: string;
  regNo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string; // Base64
  letterheadUrl?: string; // Base64 for document background
  leavePolicies?: LeavePolicy[];
  policies?: string; // Markdown text for general handbook
  businessType?: 'Corporate' | 'F&B' | 'Retail' | 'Healthcare' | 'Logistics' | 'Technology'; // New: AI Context
  operatingHours?: { start: string; end: string }; // New: For auto-rostering
}

export interface CompanyEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string; // Base64
  type: 'Meeting' | 'Celebration' | 'Holiday' | 'Training';
}

export type DocumentCategory = 'Recruitment' | 'Onboarding' | 'Policy' | 'Performance' | 'Disciplinary' | 'Offboarding' | 'Payroll';

export interface CompanyDocument {
  id: string;
  title: string;
  category: DocumentCategory; // New: Lifecycle stage
  type: 'Contract' | 'Policy' | 'Memo' | 'Payslip' | 'Letter' | 'Form';
  url?: string; // Optional if content is generated
  content?: string; // New: HTML/Text content for system-generated docs
  assignedTo: string; // Employee ID or 'ALL' or 'ROLE:Manager'
  assignedBy: string;
  dateUploaded: string;
  status: 'Pending' | 'Signed' | 'Read';
  signature?: string; // Base64 signature image or text
  signedDate?: string; // ISO Date string
  isRecurring?: boolean; // New: For annual renewals
  recurrenceInterval?: 'Monthly' | 'Yearly'; // New
  expiryDate?: string; // New: When the document expires/needs renewal
  requiresAcknowledgment?: boolean;
}

export interface LeavePolicy {
  id: string;
  name: string; // e.g. Annual, Medical
  daysPerYear: number;
  allowCarryForward: boolean;
  maxCarryForwardDays?: number;
  minNoticeDays: number; // e.g. 3 days before
  requireDocument: boolean; // e.g. MC required
}

export interface PayrollSettings {
  enableEpfForForeigners: boolean;
  enableSocso: boolean;
  globalAllowances: {
    transport: number;
    phone: number;
    meal: number;
  };
  statutoryRates: {
    epfEmployee: number;
    epfEmployer: number;
    socso: number;
    eis: number;
  }
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'Info' | 'Alert' | 'Event' | 'Holiday';
  author: string;
}

export interface GeneralRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string; // Changed from literal union to string to support dynamic leave types
  details: string; // JSON stringified details
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  policyId?: string; // For leave requests
  attachment?: string; // For documents
}

export type EmploymentType = 'Permanent' | 'Contract' | 'Intern' | 'External';

export interface Employee {
  id: string;
  name: string;
  nric?: string; 
  role: string;
  department: string;
  employmentType: EmploymentType; // Added for contract mgmt
  contractEnd?: string; // For contractors
  status: 'Active' | 'On Leave' | 'MIA' | 'Terminated';
  baseSalary: number;
  hourlyRate?: number; // For part-timers/external
  joinDate: string;
  epfNo?: string;
  socsoNo?: string;
  taxNo?: string;
  bankAccount?: string;
  bankName?: string;
  email?: string;
  pin?: string; // New: Secure 6-digit PIN
  faceRegistered?: boolean;
  faceDescriptor?: number[]; 
  skills?: string[];
  reportsTo?: string; 
  onboardingStep?: number; 
  customAllowances?: {
    transport?: number;
    phone?: number;
    meal?: number;
    housing?: number;
  };
  documents?: {
    nric?: string;
    certificates?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  location: { lat: number; lng: number; accuracy?: number } | null;
  method: 'QR' | 'Face' | 'PIN';
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Rest Day';
  riskScore?: number; 
  lateMinutes?: number; // Computed
  otMinutes?: number; // Computed
}

export interface PayrollEntry {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  employmentType: EmploymentType;
  month: string;
  
  // Breakdown
  standardDays: number;
  daysWorked: number;
  unpaidLeaves: number;
  totalLatenessMins: number;
  
  // Money
  basicSalary: number;
  hourlyRate: number;
  
  allowances: number;
  
  overtimeHours: number;
  overtimeAmount: number;
  
  grossPay: number;
  
  // Deductions
  epf: number;
  socso: number;
  eis: number;
  pcb: number; 
  lateDeduction: number; // New: Penalty
  
  netSalary: number;
  status: 'PAID' | 'PENDING';
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; 
  type: 'Morning' | 'Afternoon' | 'Night' | 'Custom';
  startTime: string;
  endTime: string;
  color: string;
  isOvertime?: boolean;
  overtimeHours?: number;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  notes?: string; // New field for AI reasoning
}

export enum ComplianceRisk {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface ComplianceFlag {
  id: string;
  employeeName: string;
  issue: string;
  severity: 'Critical' | 'Warning' | 'Info';
  policyReference: string; 
  actionItem: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

export type Language = 'en' | 'ms' | 'zh' | 'ta';

export type UserRole = 'Admin' | 'HR' | 'Manager' | 'Staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  preferences?: {
    aiInteractions: Record<string, number>; // topic -> count
  }
}

export interface LeaveRequest {
  id: number;
  employeeId: string;
  name: string;
  type: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
  attachment?: string; 
}

export interface Translation {
  dashboard: string;
  kiosk: string;
  employees: string;
  payroll: string;
  compliance: string;
  shifts: string;
  onboarding: string;
  logout: string;
  welcome: string;
  totalEmployees: string;
  onTime: string;
  late: string;
  absent: string;
  exportReport: string;
  analyze: string;
  clockIn: string;
  clockOut: string;
  verifying: string;
  faceId: string;
  location: string;
  riskDetected: string;
  addEmployee: string;
  name: string;
  salary: string;
  role: string;
  actions: string;
  save: string;
  cancel: string;
  calculating: string;
  netPay: string;
}
