
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Language, AttendanceRecord, User, UserRole, Shift, LeaveRequest, CompanyProfile, PayrollSettings, Announcement, GeneralRequest, CompanyDocument, CompanyEvent, EmploymentType } from '../types';
import { translations } from '../services/i18n';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GlobalContextType {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  companyProfile: CompanyProfile;
  payrollSettings: PayrollSettings;
  announcements: Announcement[];
  generalRequests: GeneralRequest[];
  documents: CompanyDocument[];
  events: CompanyEvent[];
  userPreferences: Record<string, number>;
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  addAttendanceRecord: (record: AttendanceRecord) => void;
  getEmployeeAttendance: (employeeId: string) => AttendanceRecord[];
  addShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
  updateShiftStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  addLeaveRequest: (req: LeaveRequest) => void;
  updateLeaveRequest: (id: number, status: 'Approved' | 'Rejected') => void;
  updateCompanyProfile: (profile: CompanyProfile) => void;
  updateOnboardingStep: (employeeId: string, step: number) => void;
  updatePayrollSettings: (settings: PayrollSettings) => void;
  addAnnouncement: (ann: Announcement) => void;
  addGeneralRequest: (req: GeneralRequest) => void;
  updateGeneralRequestStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  addDocument: (doc: CompanyDocument) => void;
  updateDocument: (id: string, updates: Partial<CompanyDocument>) => void;
  addEvent: (evt: CompanyEvent) => void;
  deleteEvent: (id: string) => void;
  logInteraction: (topic: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  currentUser: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// --- ENTERPRISE DEMO DATA GENERATOR ---
const generateMediumBusinessData = () => {
  const depts = ['HR', 'Finance', 'Engineering', 'Operations', 'Sales', 'Logistics'];
  const firstNames = ['Ali', 'Chong', 'Muthu', 'Sarah', 'David', 'Siti', 'Wei', 'Raj', 'Jessica', 'Hassan', 'Tan', 'Kumar', 'Aishah', 'Yong', 'Mei', 'Ramesh', 'Kevin', 'Santhia', 'Zul', 'Nadia'];
  const lastNames = ['Bin Abu', 'Lee', 'Samy', 'Tan', 'Wong', 'Singh', 'Abdullah', 'Lim', 'Krishnan', 'Hussain', 'Teoh', 'Balan', 'Yusof', 'Loke', 'Kaur'];
  
  const generatedEmployees: Employee[] = [];
  const generatedAttendance: AttendanceRecord[] = [];

  // 1. Create 50 Employees (Medium Business Size)
  for (let i = 0; i < 50; i++) {
      const isManager = i < 8; // More managers for 50 people
      const dept = depts[i % depts.length];
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      
      const empType: EmploymentType = i > 45 ? 'Contract' : (i > 42 ? 'Intern' : 'Permanent');
      const salary = isManager ? (8000 + (i * 200)) : (empType === 'Intern' ? 1200 : (3500 + (i * 150)));

      let email = `${fName.toLowerCase()}.${lName.toLowerCase().replace(/\s/g, '')}@mnjewel.com`;
      if (i === 0) email = 'admin@mnjewel.com';
      if (i === 1) email = 'hr@mnjewel.com';
      if (i === 2) email = 'manager@mnjewel.com';
      if (i === 3) email = 'staff@mnjewel.com';

      generatedEmployees.push({
          id: `EMP-${1000 + i}`,
          name: `${fName} ${lName}`,
          nric: `${85 + (i % 15)}0101-14-${5000 + i}`,
          role: isManager ? 'Manager' : (empType === 'Intern' ? 'Intern' : 'Staff'),
          department: dept,
          employmentType: empType,
          status: 'Active',
          baseSalary: salary,
          joinDate: '2023-01-01',
          epfNo: `EPF-MY-${20000 + i}`,
          taxNo: `SG-${30000 + i}`,
          socsoNo: `SOC-${40000 + i}`,
          bankName: 'Maybank',
          bankAccount: `164000${12345 + i}`,
          email: email,
          pin: (111111 + i).toString(),
          faceRegistered: i % 2 === 0,
          reportsTo: isManager ? '' : `EMP-100${i % 8}`,
          onboardingStep: 4,
          skills: [dept, "Communication", "Teamwork"]
      });
  }

  // 2. Create 180 Days (Half-Year Cycle) of History
  const today = new Date();
  for (let d = 0; d < 180; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0) continue; // Skip Sundays (Rest Day)

      generatedEmployees.forEach(emp => {
          // Skip if Intern on Saturdays
          if (emp.employmentType === 'Intern' && dayOfWeek === 6) return;

          const rand = Math.random();
          // Leave Probability (2%)
          if (rand > 0.98) {
              generatedAttendance.push({
                  id: Math.random().toString(36).substr(2, 9),
                  employeeId: emp.id,
                  date: dateStr,
                  checkIn: null, checkOut: null,
                  location: null, method: 'PIN',
                  status: 'Leave', riskScore: 0
              });
              return;
          }

          // Absent Probability (1%)
          if (rand < 0.01) {
              generatedAttendance.push({
                  id: Math.random().toString(36).substr(2, 9),
                  employeeId: emp.id,
                  date: dateStr,
                  checkIn: null, checkOut: null,
                  location: null, method: 'Face',
                  status: 'Absent', riskScore: 100
              });
              return;
          }

          // Normal Attendance
          const isLate = Math.random() > 0.92;
          const hourIn = isLate ? 9 : 8;
          const minIn = isLate ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 55);
          const timeIn = `${hourIn.toString().padStart(2, '0')}:${minIn.toString().padStart(2, '0')}:00`;

          const isOT = Math.random() > 0.85;
          const hourOut = isOT ? (19 + Math.floor(Math.random() * 3)) : 18;
          const minOut = Math.floor(Math.random() * 59);
          const timeOut = `${hourOut.toString().padStart(2, '0')}:${minOut.toString().padStart(2, '0')}:00`;

          let lateMins = 0;
          if (hourIn > 9 || (hourIn === 9 && minIn > 5)) {
              lateMins = ((hourIn - 9) * 60) + minIn;
          }

          let otMins = 0;
          if (hourOut >= 18) {
              otMins = ((hourOut - 18) * 60) + minOut;
          }

          generatedAttendance.push({
              id: Math.random().toString(36).substr(2, 9),
              employeeId: emp.id,
              date: dateStr,
              checkIn: timeIn,
              checkOut: timeOut,
              location: { lat: 3.1578, lng: 101.7118, accuracy: 10 },
              method: 'Face',
              status: isLate ? 'Late' : 'Present',
              riskScore: isLate ? 40 : 0,
              lateMinutes: lateMins,
              otMinutes: otMins
          });
      });
  }

  return { employees: generatedEmployees, attendance: generatedAttendance };
};

const INITIAL_COMPANY: CompanyProfile = {
  name: "MN JEWEL SDN BHD",
  regNo: "123456-D",
  address: "Level 10, Menara KLCC, 50088 Kuala Lumpur, Malaysia",
  phone: "+603-2100-9999",
  email: "hr@mnjewel.com",
  website: "www.mnjewel.com",
  logoUrl: "",
  businessType: 'Retail',
  policies: "All employees must adhere to the company dress code. Working hours are 9-6. Leaves must be applied 3 days in advance.",
  leavePolicies: [
    { id: '1', name: 'Annual Leave', daysPerYear: 14, allowCarryForward: true, maxCarryForwardDays: 5, minNoticeDays: 3, requireDocument: false },
    { id: '2', name: 'Medical Leave', daysPerYear: 14, allowCarryForward: false, minNoticeDays: 0, requireDocument: true },
    { id: '3', name: 'Emergency Leave', daysPerYear: 5, allowCarryForward: false, minNoticeDays: 0, requireDocument: false },
  ]
};

const INITIAL_PAYROLL_SETTINGS: PayrollSettings = {
  enableEpfForForeigners: false,
  enableSocso: true,
  globalAllowances: { transport: 200, phone: 100, meal: 0 },
  statutoryRates: { epfEmployee: 11, epfEmployer: 13, socso: 0.5, eis: 0.2 }
};

const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const DATA = generateMediumBusinessData();

  const [employees, setEmployees] = useStickyState<Employee[]>('pc_employees', DATA.employees);
  const [attendanceRecords, setAttendanceRecords] = useStickyState<AttendanceRecord[]>('pc_attendance', DATA.attendance);
  const [shifts, setShifts] = useStickyState<Shift[]>('pc_shifts', []);
  const [leaveRequests, setLeaveRequests] = useStickyState<LeaveRequest[]>('pc_leaves', []);
  const [companyProfile, setCompanyProfile] = useStickyState<CompanyProfile>('pc_company', INITIAL_COMPANY);
  const [payrollSettings, setPayrollSettings] = useStickyState<PayrollSettings>('pc_payroll', INITIAL_PAYROLL_SETTINGS);
  const [announcements, setAnnouncements] = useStickyState<Announcement[]>('pc_announcements', []);
  const [generalRequests, setGeneralRequests] = useStickyState<GeneralRequest[]>('pc_requests', []);
  const [documents, setDocuments] = useStickyState<CompanyDocument[]>('pc_documents', []);
  const [events, setEvents] = useStickyState<CompanyEvent[]>('pc_events', []);
  const [userPreferences, setUserPreferences] = useStickyState<Record<string, number>>('pc_user_prefs', {});
  
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = window.localStorage.getItem('pc_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const logInteraction = (topic: string) => {
    setUserPreferences(prev => ({ ...prev, [topic]: (prev[topic] || 0) + 1 }));
  };

  const addEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    addNotification(`Employee ${emp.name} added.`, 'success');
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
    addNotification(`Employee ${emp.name} updated.`, 'success');
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    addNotification(`Employee removed.`, 'info');
  };

  const addAttendanceRecord = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => [record, ...prev]);
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendanceRecords.filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addShift = (shift: Shift) => {
    setShifts(prev => [...prev, shift]);
    addNotification("Shift added.", "success");
  };

  const deleteShift = (id: string) => setShifts(prev => prev.filter(s => s.id !== id));

  const updateShiftStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: status } : s));
  };

  const addLeaveRequest = (req: LeaveRequest) => {
    setLeaveRequests(prev => [req, ...prev]);
    addNotification("Leave request submitted.", "success");
  };

  const updateLeaveRequest = (id: number, status: 'Approved' | 'Rejected') => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    addNotification(`Leave request ${status}.`, status === 'Approved' ? 'success' : 'info');
  };

  const updateCompanyProfile = (profile: CompanyProfile) => setCompanyProfile(profile);
  const updateOnboardingStep = (employeeId: string, step: number) => {
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, onboardingStep: step } : e));
  };
  const updatePayrollSettings = (settings: PayrollSettings) => setPayrollSettings(settings);
  const addAnnouncement = (ann: Announcement) => setAnnouncements(prev => [ann, ...prev]);
  const addGeneralRequest = (req: GeneralRequest) => setGeneralRequests(prev => [req, ...prev]);
  const updateGeneralRequestStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setGeneralRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    addNotification(`Request ${status}.`, status === 'Approved' ? 'success' : 'info');
  };
  const addDocument = (doc: CompanyDocument) => {
      setDocuments(prev => [doc, ...prev]);
      addNotification("Document shared successfully.", "success");
  };
  const updateDocument = (id: string, updates: Partial<CompanyDocument>) => {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };
  const addEvent = (evt: CompanyEvent) => {
      setEvents(prev => [...prev, evt]);
      addNotification("Event created.", "success");
  };
  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 3000);
  };
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const login = (email: string, role: UserRole) => {
    const emp = employees.find(e => e.email === email);
    const user: User = {
      id: emp ? emp.id : 'ADMIN-001',
      name: emp ? emp.name : 'System Admin',
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${emp ? emp.name : 'Admin'}&background=random`,
      preferences: { aiInteractions: {} }
    };
    setCurrentUser(user);
    window.localStorage.setItem('pc_user', JSON.stringify(user));
    addNotification(`Welcome back, ${user.name}`, 'success');
  };

  const logout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem('pc_user');
    addNotification("Logged out successfully.", "info");
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <GlobalContext.Provider value={{ 
      employees, addEmployee, updateEmployee, deleteEmployee,
      attendanceRecords, addAttendanceRecord, getEmployeeAttendance,
      shifts, addShift, deleteShift, updateShiftStatus,
      leaveRequests, addLeaveRequest, updateLeaveRequest,
      companyProfile, updateCompanyProfile,
      payrollSettings, updatePayrollSettings,
      announcements, addAnnouncement,
      generalRequests, addGeneralRequest, updateGeneralRequestStatus,
      updateOnboardingStep, documents, addDocument, updateDocument,
      events, addEvent, deleteEvent,
      userPreferences, logInteraction,
      language, setLanguage, t: translations[language],
      theme, toggleTheme,
      notifications, addNotification, removeNotification,
      currentUser, login, logout, isAuthenticated: !!currentUser
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within GlobalProvider");
  return context;
};
