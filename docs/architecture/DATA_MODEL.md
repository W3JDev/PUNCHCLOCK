
# Data Models

## Employee
```typescript
interface Employee {
  id: string;
  name: string;
  nric: string; // ID
  role: 'Admin' | 'HR' | 'Manager' | 'Staff';
  department: string;
  employmentType: 'Permanent' | 'Contract' | 'Intern';
  baseSalary: number;
  status: 'Active' | 'On Leave' | 'MIA';
  faceDescriptor?: number[]; // Serialized Float32Array
  onboardingStep: number;
}
```

## AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM:SS
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent';
  riskScore: number; // 0-100 (AI Determined)
  location: { lat: number, lng: number, accuracy: number };
}
```

## Shift
```typescript
interface Shift {
  id: string;
  employeeId: string;
  date: string;
  type: 'Morning' | 'Afternoon' | 'Night';
  startTime: string;
  endTime: string;
  approvalStatus: 'Approved' | 'Pending';
}
```

## PayrollEntry
```typescript
interface PayrollEntry {
  employeeId: string;
  month: string; // YYYY-MM
  grossPay: number;
  epf: number;
  socso: number;
  pcb: number;
  netSalary: number;
}
```
