

export interface CompanyProfile {
  name: string;
  regNo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string; // Base64 string for the image
  leavePolicies?: LeavePolicy[];
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

export interface Employee {
  id: string;
  name: string;
  nric?: string; 
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'MIA' | 'Terminated';
  baseSalary: number;
  joinDate: string;
  epfNo?: string;
  socsoNo?: string;
  taxNo?: string;
  bankAccount?: string;
  bankName?: string;
  email?: string;
  faceRegistered?: boolean;
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
  location: { lat: number; lng: number } | null;
  method: 'QR' | 'Face' | 'PIN';
  status: 'Present' | 'Late' | 'Absent';
  riskScore?: number; 
}

export interface PayrollEntry {
  employeeId: string;
  month: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  epf: number;
  socso: number;
  eis: number;
  pcb: number; 
  netSalary: number;
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
}

export type Language = 'en' | 'ms' | 'zh' | 'ta';

export type UserRole = 'Admin' | 'HR' | 'Manager' | 'Staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
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