

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Language, AttendanceRecord, User, UserRole, Shift, LeaveRequest, CompanyProfile, PayrollSettings, Announcement, GeneralRequest } from '../types';
import { translations } from '../services/i18n';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GlobalContextType {
  employees: Employee[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any; // Translation object
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: AttendanceRecord) => void;
  getEmployeeAttendance: (employeeId: string) => AttendanceRecord[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  shifts: Shift[];
  addShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
  updateShiftStatus: (id: string, status: 'Approved' | 'Rejected') => void;
  leaveRequests: LeaveRequest[];
  addLeaveRequest: (req: LeaveRequest) => void;
  updateLeaveRequest: (id: number, status: 'Approved' | 'Rejected') => void;
  companyProfile: CompanyProfile;
  updateCompanyProfile: (profile: CompanyProfile) => void;
  updateOnboardingStep: (employeeId: string, step: number) => void;
  payrollSettings: PayrollSettings;
  updatePayrollSettings: (settings: PayrollSettings) => void;
  announcements: Announcement[];
  addAnnouncement: (ann: Announcement) => void;
  generalRequests: GeneralRequest[];
  addGeneralRequest: (req: GeneralRequest) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: '850101-10-5521', name: 'Ali Bin Abu', nric: '850101-10-5521', role: 'Manager', department: 'HR', status: 'Active', 
    baseSalary: 6500, joinDate: '2020-01-15', epfNo: '12345678', socsoNo: '850101105521',
    faceRegistered: true, skills: ['Leadership', 'Labor Law', 'Payroll'], reportsTo: '', onboardingStep: 4,
    customAllowances: { phone: 100 }, documents: {}
  },
  { 
    id: '920505-14-1234', name: 'Sarah Lee', nric: '920505-14-1234', role: 'Developer', department: 'IT', status: 'Active', 
    baseSalary: 4500, joinDate: '2021-03-10', epfNo: '87654321', socsoNo: '920505141234',
    faceRegistered: true, skills: ['React', 'Node.js', 'AWS'], reportsTo: '850101-10-5521', onboardingStep: 4, documents: {}
  },
  { 
    id: '881212-01-9988', name: 'Muthusamy A/L Raju', nric: '881212-01-9988', role: 'Technician', department: 'Ops', status: 'On Leave', 
    baseSalary: 3200, joinDate: '2019-11-01', epfNo: '11223344', socsoNo: '881212019988',
    faceRegistered: false, skills: ['Maintenance', 'Electrical', 'Safety'], reportsTo: '850101-10-5521', onboardingStep: 4, documents: {}
  },
  { 
    id: '950202-05-5566', name: 'Wong Wei Ming', nric: '950202-05-5566', role: 'Sales Exec', department: 'Sales', status: 'MIA', 
    baseSalary: 3500, joinDate: '2022-06-20', epfNo: '99887766', socsoNo: '950202055566',
    faceRegistered: true, skills: ['Negotiation', 'CRM', 'Mandarin'], reportsTo: '850101-10-5521', onboardingStep: 4, documents: {}
  },
  { 
    id: 'NEW-HIRE-001', name: 'New Hire Demo', nric: '000000-00-0000', role: 'Intern', department: 'Admin', status: 'Active', 
    baseSalary: 1500, joinDate: '2023-10-01', epfNo: '', socsoNo: '',
    faceRegistered: false, skills: [], reportsTo: '850101-10-5521', onboardingStep: 0, documents: {}
  },
];

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
    { id: '4', name: 'Unpaid Leave', daysPerYear: 0, allowCarryForward: false, minNoticeDays: 7, requireDocument: false },
  ]
};

const INITIAL_PAYROLL_SETTINGS: PayrollSettings = {
  enableEpfForForeigners: false,
  enableSocso: true,
  globalAllowances: {
    transport: 150,
    phone: 50,
    meal: 0
  },
  statutoryRates: {
    epfEmployee: 11,
    epfEmployer: 13,
    socso: 0.5,
    eis: 0.2
  }
};

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Public Holiday Alert', content: 'Office will be closed on 31st August for Merdeka Day.', date: '2023-08-25', type: 'Holiday', author: 'HR' },
  { id: '2', title: 'New SOP: WFH', content: 'Updated Work From Home policy is now available in the handbook.', date: '2023-09-01', type: 'Info', author: 'Admin' }
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 1, employeeId: '920505-14-1234', name: 'Sarah Lee', type: 'Annual', date: 'Oct 24-26', status: 'Pending', reason: 'Family Trip' },
  { id: 2, employeeId: '850101-10-5521', name: 'Ali Bin Abu', type: 'Medical', date: 'Oct 23', status: 'Approved', reason: 'Fever', attachment: 'mc_ali.jpg' },
  { id: 3, employeeId: '950202-05-5566', name: 'Wong Wei Ming', type: 'Emergency', date: 'Oct 25', status: 'Pending', reason: 'Car Breakdown' },
];

const generateMockAttendance = (emps: Employee[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  emps.forEach(emp => {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const isLate = Math.random() > 0.8;
      const isAbsent = Math.random() > 0.95;

      if (isAbsent && emp.status !== 'MIA') {
        records.push({
          id: `${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          location: null,
          method: 'Face',
          status: 'Absent',
          riskScore: 0
        });
      } else if (emp.status === 'Active') {
        records.push({
          id: `${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: isLate ? '09:15 AM' : '08:55 AM',
          checkOut: '06:05 PM',
          location: { lat: 3.14, lng: 101.68 },
          method: Math.random() > 0.5 ? 'Face' : 'QR',
          status: isLate ? 'Late' : 'Present',
          riskScore: Math.floor(Math.random() * 10)
        });
      }
    }
  });
  return records;
};

const generateMockShifts = (emps: Employee[]): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();
  
  emps.forEach((emp, index) => {
    const shiftType = index % 2 === 0 ? 'Morning' : 'Afternoon';
    const startTime = shiftType === 'Morning' ? '09:00' : '14:00';
    let endTime = shiftType === 'Morning' ? '18:00' : '23:00';
    const color = shiftType === 'Morning' ? 'blue' : 'orange';

    const isOvertimeSample = index === 1; 

    for(let i = -5; i < 20; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if(d.getDay() !== 0 && d.getDay() !== 6) {
        
        let otHours = 0;
        let isOT = false;
        let status: 'Approved' | 'Pending' = 'Approved';

        if (isOvertimeSample && i === 5) {
            endTime = '21:00'; 
            otHours = 3;
            isOT = true;
            status = 'Pending';
        }

        shifts.push({
          id: `shift-${emp.id}-${d.toISOString().split('T')[0]}`,
          employeeId: emp.id,
          date: d.toISOString().split('T')[0],
          type: shiftType as any,
          startTime,
          endTime,
          color,
          isOvertime: isOT,
          overtimeHours: otHours,
          approvalStatus: status
        });
      }
    }
  });
  return shifts;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(INITIAL_PAYROLL_SETTINGS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [generalRequests, setGeneralRequests] = useState<GeneralRequest[]>([]);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'ADMIN-001',
    name: 'System Admin',
    role: 'Admin',
    avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=random'
  });

  useEffect(() => {
    setAttendanceRecords(generateMockAttendance(INITIAL_EMPLOYEES));
    setShifts(generateMockShifts(INITIAL_EMPLOYEES));
  }, []);

  // Theme Handling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    setAttendanceRecords(prev => [...prev, ...generateMockAttendance([emp])]);
    addNotification(`Employee ${emp.name} created successfully.`, 'success');
  };
  
  const updateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
    addNotification(`Employee ${emp.name} updated.`, 'success');
  };
  
  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    addNotification(`Employee record deleted.`, 'info');
  };

  const addAttendanceRecord = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === record.employeeId && r.date === record.date));
      return [record, ...filtered];
    });
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendanceRecords
      .filter(r => r.employeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const addShift = (shift: Shift) => {
    setShifts(prev => {
      const filtered = prev.filter(s => !(s.employeeId === shift.employeeId && s.date === shift.date));
      return [...filtered, shift];
    });
    addNotification("Shift assigned successfully.", "success");
  };

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    addNotification("Shift removed.", "info");
  };

  const updateShiftStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setShifts(prev => prev.map(s => {
       if (s.id === id) {
          return { ...s, approvalStatus: status };
       }
       return s;
    }));
    addNotification(`Shift overtime ${status}.`, status === 'Approved' ? 'success' : 'info');
  };

  const addLeaveRequest = (req: LeaveRequest) => {
    setLeaveRequests(prev => [req, ...prev]);
    addNotification("Leave request submitted.", "success");
  };

  const updateLeaveRequest = (id: number, status: 'Approved' | 'Rejected') => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    addNotification(`Request ${status}`, status === 'Approved' ? 'success' : 'info');
  };

  const updateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    addNotification("Company details updated.", "success");
  };

  const updateOnboardingStep = (employeeId: string, step: number) => {
     setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, onboardingStep: step } : e));
     if (step === 4) addNotification("Onboarding Completed!", "success");
  };

  const updatePayrollSettings = (settings: PayrollSettings) => {
    setPayrollSettings(settings);
    addNotification("Payroll configuration updated.", "success");
  };

  const addAnnouncement = (ann: Announcement) => {
    setAnnouncements(prev => [ann, ...prev]);
    addNotification("Announcement posted.", "success");
  };

  const addGeneralRequest = (req: GeneralRequest) => {
    setGeneralRequests(prev => [req, ...prev]);
    addNotification(`${req.type} request submitted.`, "success");
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const switchRole = (role: UserRole) => {
    const mockUsers: Record<UserRole, User> = {
      'Admin': { id: 'ADMIN-001', name: 'System Admin', role: 'Admin' },
      'HR': { id: 'HR-001', name: 'Sarah HR', role: 'HR' },
      'Manager': { id: 'MGR-001', name: 'Ali Manager', role: 'Manager' },
      'Staff': { id: 'NEW-HIRE-001', name: 'New Hire Demo', role: 'Staff' } 
    };
    setCurrentUser(mockUsers[role]);
    addNotification(`Switched role to ${role}`, 'info');
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <GlobalContext.Provider value={{ 
      employees, 
      addEmployee, 
      updateEmployee, 
      deleteEmployee, 
      language,
      setLanguage,
      t: translations[language],
      attendanceRecords,
      addAttendanceRecord,
      getEmployeeAttendance,
      theme,
      toggleTheme,
      currentUser,
      switchRole,
      notifications,
      addNotification,
      removeNotification,
      shifts,
      addShift,
      deleteShift,
      updateShiftStatus,
      leaveRequests,
      addLeaveRequest,
      updateLeaveRequest,
      companyProfile,
      updateCompanyProfile,
      updateOnboardingStep,
      payrollSettings,
      updatePayrollSettings,
      announcements,
      addAnnouncement,
      generalRequests,
      addGeneralRequest
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