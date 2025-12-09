
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Language, AttendanceRecord, User, UserRole, Shift, LeaveRequest, CompanyProfile, PayrollSettings, Announcement, GeneralRequest } from '../types';
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

// --- INITIAL DATA (Fallbacks) ---
const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: '850101-10-5521', name: 'Ali Bin Abu', nric: '850101-10-5521', role: 'Manager', department: 'HR', status: 'Active', 
    baseSalary: 6500, joinDate: '2020-01-15', epfNo: '12345678', socsoNo: '850101105521',
    faceRegistered: true, skills: ['Leadership', 'Labor Law', 'Payroll'], reportsTo: '', onboardingStep: 4,
    customAllowances: { phone: 100 }, documents: {}, email: 'manager@mnjewel.com'
  },
  { 
    id: 'ADMIN-001', name: 'System Admin', nric: '000000', role: 'Admin', department: 'IT', status: 'Active',
    baseSalary: 0, joinDate: '2020-01-01', faceRegistered: false, onboardingStep: 4, email: 'admin@mnjewel.com'
  },
  { 
    id: 'HR-001', name: 'Sarah HR', nric: '000001', role: 'HR', department: 'HR', status: 'Active',
    baseSalary: 5000, joinDate: '2021-01-01', faceRegistered: true, onboardingStep: 4, email: 'hr@mnjewel.com'
  },
  { 
    id: 'STAFF-001', name: 'Siti Staff', nric: '990101-10-5522', role: 'Staff', department: 'Sales', status: 'Active',
    baseSalary: 2500, joinDate: '2022-05-20', faceRegistered: true, onboardingStep: 4, email: 'staff@mnjewel.com'
  }
];

// Generate some initial attendance data for the last 5 days to populate charts
const generateInitialAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Randomize attendance for 4 employees
    INITIAL_EMPLOYEES.forEach(emp => {
      const rand = Math.random();
      if (rand > 0.2) { // 80% attendance chance
        const isLate = Math.random() > 0.8;
        records.push({
          id: Math.random().toString(36).substr(2, 9),
          employeeId: emp.id,
          date: dateStr,
          checkIn: isLate ? '09:45:00' : '08:55:00',
          checkOut: '18:05:00',
          location: { lat: 3.1, lng: 101.7, accuracy: 10 },
          method: 'Face',
          status: isLate ? 'Late' : 'Present',
          riskScore: 0
        });
      }
    });
  }
  return records;
};

const INITIAL_COMPANY: CompanyProfile = {
  name: "MN JEWEL SDN BHD",
  regNo: "123456-D",
  address: "Level 10, Menara KLCC, 50088 Kuala Lumpur, Malaysia",
  phone: "+603-2100-9999",
  email: "hr@mnjewel.com",
  website: "www.mnjewel.com",
  logoUrl: "",
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
  const [employees, setEmployees] = useStickyState<Employee[]>('pc_employees', INITIAL_EMPLOYEES);
  const [attendanceRecords, setAttendanceRecords] = useStickyState<AttendanceRecord[]>('pc_attendance', generateInitialAttendance());
  const [shifts, setShifts] = useStickyState<Shift[]>('pc_shifts', []);
  const [leaveRequests, setLeaveRequests] = useStickyState<LeaveRequest[]>('pc_leaves', []);
  const [companyProfile, setCompanyProfile] = useStickyState<CompanyProfile>('pc_company', INITIAL_COMPANY);
  const [payrollSettings, setPayrollSettings] = useStickyState<PayrollSettings>('pc_payroll', INITIAL_PAYROLL_SETTINGS);
  const [announcements, setAnnouncements] = useStickyState<Announcement[]>('pc_announcements', []);
  const [generalRequests, setGeneralRequests] = useStickyState<GeneralRequest[]>('pc_requests', []);
  
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
    const user: User = {
      id: emp ? emp.id : 'ADMIN-001',
      name: emp ? emp.name : 'System Admin',
      role: role,
      avatar: `https://ui-avatars.com/api/?name=${emp ? emp.name : 'Admin'}&background=random`
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
      updateOnboardingStep,
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
