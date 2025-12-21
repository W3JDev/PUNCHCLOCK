
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Language, AttendanceRecord, User, UserRole, Shift, LeaveRequest, CompanyProfile, PayrollSettings, Announcement, GeneralRequest, CompanyDocument, CompanyEvent, EmploymentType } from '../types';
import { translations } from '../services/i18n';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GlobalContextType {
  // Data
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
  
  // Actions
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

  // UI/State
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;

  // Auth
  currentUser: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// --- DEMO DATA GENERATOR ---
const generateDemoData = () => {
  const depts = ['HR', 'Sales', 'IT', 'Operations', 'Finance', 'Logistics'];
  const firstNames = ['Ali', 'Chong', 'Muthu', 'Sarah', 'David', 'Siti', 'Wei', 'Raj', 'Jessica', 'Hassan', 'Tan', 'Kumar'];
  const lastNames = ['Bin Abu', 'Lee', 'Samy', 'Tan', 'Wong', 'Singh', 'Abdullah', 'Lim', 'Krishnan'];
  
  const generatedEmployees: Employee[] = [];
  const generatedAttendance: AttendanceRecord[] = [];

  // 1. Create 50 Employees
  for (let i = 0; i < 50; i++) {
      const isManager = i < 5;
      const isContract = i > 40;
      const dept = depts[i % depts.length];
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      
      const empType: EmploymentType = isContract ? 'Contract' : (i > 35 ? 'Intern' : 'Permanent');
      
      // Assign Specific Emails for Demo Accounts
      let email = `${fName.toLowerCase()}.${lName.toLowerCase().replace(' ', '')}@mnjewel.com`;
      if (i === 0) email = 'admin@mnjewel.com';
      if (i === 1) email = 'hr@mnjewel.com';
      if (i === 2) email = 'manager@mnjewel.com';
      if (i === 3) email = 'staff@mnjewel.com';

      // Generate a stable PIN for demo (e.g., 123456 or based on ID)
      const demoPin = (100000 + i).toString();

      generatedEmployees.push({
          id: `EMP-${1000 + i}`,
          name: `${fName} ${lName}`,
          nric: `${90 + (i%10)}0101-10-${5000+i}`,
          role: isManager ? 'Manager' : (empType === 'Intern' ? 'Intern' : 'Staff'),
          department: dept,
          employmentType: empType,
          status: 'Active',
          baseSalary: isManager ? 8000 : (empType === 'Intern' ? 1000 : 3500 + (i * 100)),
          joinDate: '2022-01-15',
          epfNo: `EPF-${10000+i}`,
          faceRegistered: i % 3 === 0, // Some haven't registered
          reportsTo: isManager ? '' : `EMP-100${i % 5}`, // Distribute among first 5
          onboardingStep: 4,
          email: email,
          pin: demoPin // Generated PIN
      });
  }

  // 2. Create 30 Days of History
  const today = new Date();
  for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0) continue; // Skip Sundays

      generatedEmployees.forEach(emp => {
          // Attendance Probability
          const rand = Math.random();
          if (rand > 0.95) {
              // Absent
              generatedAttendance.push({
                  id: Math.random().toString(36),
                  employeeId: emp.id,
                  date: dateStr,
                  checkIn: null, checkOut: null,
                  location: null, method: 'Face',
                  status: 'Absent', riskScore: 100
              });
          } else {
              // Present
              // Late Logic: 10% chance
              const isLate = Math.random() > 0.9;
              const hourIn = isLate ? 9 : 8;
              const minIn = isLate ? Math.floor(Math.random() * 50) + 15 : Math.floor(Math.random() * 55);
              const timeIn = `${hourIn.toString().padStart(2,'0')}:${minIn.toString().padStart(2,'0')}:00`;

              // OT Logic: 15% chance
              const isOT = Math.random() > 0.85;
              const hourOut = isOT ? 20 : 18;
              const minOut = Math.floor(Math.random() * 30);
              const timeOut = `${hourOut.toString().padStart(2,'0')}:${minOut.toString().padStart(2,'0')}:00`;

              // Late Mins calc
              let lateMins = 0;
              if (hourIn > 9 || (hourIn === 9 && minIn > 0)) {
                  lateMins = ((hourIn - 9) * 60) + minIn;
              }

              // OT Mins calc (After 6pm)
              let otMins = 0;
              if (hourOut >= 18) {
                  otMins = ((hourOut - 18) * 60) + minOut;
              }

              generatedAttendance.push({
                  id: Math.random().toString(36),
                  employeeId: emp.id,
                  date: dateStr,
                  checkIn: timeIn,
                  checkOut: timeOut,
                  location: { lat: 3.1, lng: 101.7, accuracy: 10 },
                  method: 'Face',
                  status: isLate ? 'Late' : 'Present',
                  riskScore: isLate ? 30 : 0,
                  lateMinutes: lateMins,
                  otMinutes: otMins
              });
          }
      });
  }

  // 3. Generate Mock Announcements & Requests for Dashboard
  const mockAnnouncements: Announcement[] = [
      { id: '1', title: 'System Maintenance', content: 'Scheduled downtime this Sunday 2AM-4AM.', date: today.toISOString().split('T')[0], type: 'Alert', author: 'IT Dept' },
      { id: '2', title: 'Public Holiday (Thaipusam)', content: 'Office closed on Monday. OT rates apply for essential staff.', date: '2023-10-25', type: 'Holiday', author: 'HR' },
      { id: '3', title: 'Q3 Townhall Meeting', content: 'All hands meeting at Main Hall.', date: '2023-10-20', type: 'Event', author: 'CEO' },
      { id: '4', title: 'New Claims Policy', content: 'Mileage claim rate increased to RM0.70/km.', date: '2023-10-15', type: 'Info', author: 'Finance' },
      { id: '5', title: 'Fire Drill', content: 'Mandatory evacuation drill at 3PM tomorrow.', date: '2023-10-28', type: 'Alert', author: 'Safety' },
  ];

  const mockLeaves: LeaveRequest[] = [
      { id: 101, employeeId: generatedEmployees[5].id, name: generatedEmployees[5].name, type: 'Medical Leave', date: today.toISOString().split('T')[0], status: 'Pending', reason: 'High Fever', attachment: 'mc.jpg' },
      { id: 102, employeeId: generatedEmployees[8].id, name: generatedEmployees[8].name, type: 'Annual Leave', date: '2023-11-01', status: 'Pending', reason: 'Family trip' },
      { id: 103, employeeId: generatedEmployees[12].id, name: generatedEmployees[12].name, type: 'Emergency Leave', date: today.toISOString().split('T')[0], status: 'Pending', reason: 'Car breakdown' }
  ];

  const mockGeneralRequests: GeneralRequest[] = [
      { id: '201', employeeId: generatedEmployees[2].id, employeeName: generatedEmployees[2].name, type: 'Claim', details: 'Grab to Client Meeting (RM 45)', date: today.toISOString().split('T')[0], status: 'Pending' },
      { id: '202', employeeId: generatedEmployees[15].id, employeeName: generatedEmployees[15].name, type: 'Missing Punch', details: 'Forgot to clock out yesterday (18:00)', date: '2023-10-20', status: 'Pending' },
      { id: '203', employeeId: generatedEmployees[20].id, employeeName: generatedEmployees[20].name, type: 'Claim', details: 'Team Lunch (RM 120)', date: '2023-10-18', status: 'Pending' }
  ];

  return { 
      employees: generatedEmployees, 
      attendance: generatedAttendance,
      announcements: mockAnnouncements,
      leaveRequests: mockLeaves,
      generalRequests: mockGeneralRequests
  };
};

const DEMO_DATA = generateDemoData();

const INITIAL_COMPANY: CompanyProfile = {
  name: "MN JEWEL SDN BHD",
  regNo: "123456-D",
  address: "Level 10, Menara KLCC, 50088 Kuala Lumpur, Malaysia",
  phone: "+603-2100-9999",
  email: "hr@mnjewel.com",
  website: "www.mnjewel.com",
  logoUrl: "",
  policies: "All employees must adhere to the company dress code. Working hours are 9-6. Leaves must be applied 3 days in advance.",
  leavePolicies: [
    { id: '1', name: 'Annual Leave', daysPerYear: 12, allowCarryForward: true, maxCarryForwardDays: 5, minNoticeDays: 3, requireDocument: false },
    { id: '2', name: 'Medical Leave', daysPerYear: 14, allowCarryForward: false, minNoticeDays: 0, requireDocument: true },
    { id: '3', name: 'Emergency Leave', daysPerYear: 5, allowCarryForward: false, minNoticeDays: 0, requireDocument: false },
  ]
};

const INITIAL_PAYROLL_SETTINGS: PayrollSettings = {
  enableEpfForForeigners: false,
  enableSocso: true,
  globalAllowances: { transport: 150, phone: 50, meal: 0 },
  statutoryRates: { epfEmployee: 11, epfEmployer: 13, socso: 0.5, eis: 0.2 }
};

// --- PERSISTENCE HELPER ---
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
  // --- STATE WITH PERSISTENCE ---
  const [employees, setEmployees] = useStickyState<Employee[]>('pc_employees', DEMO_DATA.employees);
  const [attendanceRecords, setAttendanceRecords] = useStickyState<AttendanceRecord[]>('pc_attendance', DEMO_DATA.attendance);
  const [shifts, setShifts] = useStickyState<Shift[]>('pc_shifts', []);
  const [leaveRequests, setLeaveRequests] = useStickyState<LeaveRequest[]>('pc_leaves', DEMO_DATA.leaveRequests);
  const [companyProfile, setCompanyProfile] = useStickyState<CompanyProfile>('pc_company', INITIAL_COMPANY);
  const [payrollSettings, setPayrollSettings] = useStickyState<PayrollSettings>('pc_payroll', INITIAL_PAYROLL_SETTINGS);
  const [announcements, setAnnouncements] = useStickyState<Announcement[]>('pc_announcements', DEMO_DATA.announcements);
  const [generalRequests, setGeneralRequests] = useStickyState<GeneralRequest[]>('pc_requests', DEMO_DATA.generalRequests);
  const [documents, setDocuments] = useStickyState<CompanyDocument[]>('pc_documents', []);
  const [events, setEvents] = useStickyState<CompanyEvent[]>('pc_events', []);
  const [userPreferences, setUserPreferences] = useStickyState<Record<string, number>>('pc_user_prefs', {});
  
  // UI State (Non-persistent mostly)
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = window.localStorage.getItem('pc_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- ACTIONS ---

  const logInteraction = (topic: string) => {
    setUserPreferences(prev => ({
      ...prev,
      [topic]: (prev[topic] || 0) + 1
    }));
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
    return attendanceRecords
      .filter(r => r.employeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addShift = (shift: Shift) => {
    setShifts(prev => [...prev, shift]);
    addNotification("Shift added.", "success");
  };

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

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

  const deleteEvent = (id: string) => {
      setEvents(prev => prev.filter(e => e.id !== id));
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- NOTIFICATIONS ---
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- AUTH ---
  const login = (email: string, role: UserRole) => {
    // Find employee linked to this email (Simulated)
    const emp = employees.find(e => e.email === email);
    
    // Fallback for first time setup or if demo data is missing
    const user: User = {
      id: emp ? emp.id : 'ADMIN-001',
      name: emp ? emp.name : 'System Admin',
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${emp ? emp.name : 'Admin'}&background=random`,
      preferences: {
          aiInteractions: {}
      }
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
