import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoCheckbox, NeoModal } from '../components/NeoComponents';
import { Download, Printer, Check, Search, Calendar, DollarSign, User, MoreHorizontal, ArrowRight, Settings, BarChart2, FileText, BrainCircuit, Activity, AlertTriangle, TrendingUp, Clock, CalendarDays, Loader2, ChevronRight, Eye, Briefcase, AlertCircle, Receipt } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateKWSPFile, generateSOCSOFile, generateLHDNFile } from '../services/complianceService';
import { generatePayslipPDF } from '../services/documentService';
import { PayrollEntry, Announcement } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Payroll: React.FC = () => {
  const { employees, attendanceRecords, shifts, leaveRequests, generalRequests, t, currentUser, addNotification, payrollSettings, updatePayrollSettings, companyProfile, announcements } = useGlobal();
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'settings'>('run');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drilldown State
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [detailTab, setDetailTab] = useState<'payslip' | 'attendance' | 'claims'>('payslip');

  // --- ROLE BASED ACCESS CONTROL (RBAC) ---
  const accessibleEmployees = useMemo(() => {
    return employees.filter(emp => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'HR') return true;
        if (currentUser?.role === 'Manager') return emp.reportsTo === currentUser.id;
        if (currentUser?.role === 'Staff') return emp.id === currentUser.id;
        return false;
    });
  }, [employees, currentUser]);

  // --- CALCULATION ENGINE ---
  
  // Calculate LHDN PCB (Monthly Tax Deduction) using official progressive tiers
  const calculatePCB = (monthlyGross: number, monthlyEPF: number) => {
      // 1. Annualize Income (Simplified projection)
      const annualIncome = monthlyGross * 12;
      
      // 2. Apply Reliefs
      const personalRelief = 9000;
      const epfRelief = Math.min(monthlyEPF * 12, 4000); // EPF relief capped at 4000 for tax purposes
      
      let chargeableIncome = annualIncome - personalRelief - epfRelief;
      if (chargeableIncome <= 5000) return 0; // Tax threshold

      let tax = 0;
      
      // 3. 2024/2025 Resident Tax Rates (Progressive Tiers)
      // Iterative check against Chargeable Income (C)
      const c = chargeableIncome;
      
      if (c > 2000000) { tax = 528400 + (c - 2000000) * 0.30; }
      else if (c > 600000) { tax = 136400 + (c - 600000) * 0.28; }
      else if (c > 400000) { tax = 84400 + (c - 400000) * 0.26; }
      else if (c > 100000) { tax = 9400 + (c - 100000) * 0.25; }
      else if (c > 70000) { tax = 3700 + (c - 70000) * 0.19; }
      else if (c > 50000) { tax = 1500 + (c - 50000) * 0.11; }
      else if (c > 35000) { tax = 600 + (c - 35000) * 0.06; }
      else if (c > 20000) { tax = 150 + (c - 20000) * 0.03; }
      else if (c > 5000) { tax = 0 + (c - 5000) * 0.01; }
      
      // 4. Return Monthly PCB
      return Math.max(0, parseFloat((tax / 12).toFixed(2)));
  };

  const payrollData = useMemo(() => {
    return accessibleEmployees.filter(e => e.status === 'Active').map(emp => {
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // 1. Calculate Standard Working Days (Assume Mon-Fri)
      let standardDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
         const date = new Date(year, month - 1, d);
         const day = date.getDay();
         if (day !== 0 && day !== 6) standardDays++;
      }
      
      const basic = emp.baseSalary;
      // Statutory formulas in Malaysia typically use 26 days for OT calculation denominator
      const ordinaryRateOfPay = basic / 26; 
      const hourlyRate = emp.hourlyRate || (ordinaryRateOfPay / 8); 

      // 2. Analyze Attendance & Leaves for this Month
      let daysWorked = 0;
      let totalLatenessMins = 0;
      let overtimeHours = 0;
      let overtimeAmount = 0;
      let unpaidLeaves = 0;

      for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month - 1, d);
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          
          // Determine Day Type for OT Rate
          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun, Sat
          const isHoliday = announcements.some(a => a.date === dateStr && a.type === 'Holiday');
          
          let otRateMultiplier = 1.5; // Normal
          if (isHoliday) otRateMultiplier = 3.0;
          else if (isWeekend) otRateMultiplier = 2.0;

          // Check Attendance
          const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
          if (record && record.status !== 'Absent') {
              daysWorked++;
              if (record.lateMinutes) totalLatenessMins += record.lateMinutes;
              
              // New OT Logic from Record (more robust)
              if (record.otMinutes) {
                  const hours = record.otMinutes / 60;
                  overtimeHours += hours;
                  overtimeAmount += (hours * hourlyRate * otRateMultiplier);
              }
          }

          // Check APPROVED Leaves
          // Only deduct for Unpaid Leave
          const leave = leaveRequests.find(l => l.employeeId === emp.id && l.date === dateStr && l.status === 'Approved');
          if (leave && leave.type.includes('Unpaid')) { 
              unpaidLeaves++;
          }
      }

      // 3. Claims (From Approved General Requests)
      const approvedClaims = generalRequests
        .filter(r => r.employeeId === emp.id && r.type === 'Claim' && r.status === 'Approved' && r.date.startsWith(selectedMonth))
        .reduce((sum, r) => sum + (parseFloat(r.details) || 0), 0);

      // 4. Calculate Allowances
      const globalAllowances = payrollSettings.globalAllowances.transport + payrollSettings.globalAllowances.phone + payrollSettings.globalAllowances.meal;
      const personalAllowances = (emp.customAllowances?.phone || 0) + (emp.customAllowances?.transport || 0) + (emp.customAllowances?.meal || 0) + (emp.customAllowances?.housing || 0);
      const totalFixedAllowances = globalAllowances + personalAllowances;

      // 5. Gross Calculation
      const unpaidDeduction = unpaidLeaves * ordinaryRateOfPay;
      const lateDeduction = (totalLatenessMins / 60) * hourlyRate; // Simple deduction rule
      
      const gross = Math.max(0, basic + totalFixedAllowances + approvedClaims + overtimeAmount - unpaidDeduction - lateDeduction);

      // 6. Statutory Calcs (Real Formulas roughly approximated)
      // Skip for Contract/External/Intern unless forced
      const isStatutoryEligible = emp.employmentType === 'Permanent';
      
      let epf = 0;
      if (isStatutoryEligible) {
          epf = Math.round(gross * (payrollSettings.statutoryRates.epfEmployee / 100));
      }

      let socso = 0;
      if (payrollSettings.enableSocso && isStatutoryEligible) {
         if (gross > 4000) socso = 19.75;
         else socso = Math.round(gross * (payrollSettings.statutoryRates.socso / 100) * 10) / 10;
      }

      let eis = 0;
      if (isStatutoryEligible) {
          if (gross > 4000) eis = 7.90;
          else eis = Math.round(gross * (payrollSettings.statutoryRates.eis / 100) * 10) / 10;
      }

      // Accurate LHDN PCB Calculation
      const pcb = isStatutoryEligible ? calculatePCB(gross, epf) : 0;

      return {
        employeeId: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        employmentType: emp.employmentType,
        month: selectedMonth,
        standardDays,
        daysWorked,
        unpaidLeaves,
        totalLatenessMins,
        hourlyRate,
        overtimeHours,
        overtimeAmount,
        basicSalary: basic,
        allowances: totalFixedAllowances + approvedClaims, // Combine fixed + variable claims for display
        grossPay: gross,
        epf,
        socso,
        eis,
        pcb,
        lateDeduction,
        netSalary: gross - epf - socso - eis - pcb,
        status: (new Date().getDate() > 25) ? 'PAID' : 'PENDING'
      } as PayrollEntry;

    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [accessibleEmployees, attendanceRecords, shifts, leaveRequests, generalRequests, selectedMonth, searchTerm, payrollSettings, announcements]);

  const totalPayout = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalPerm = payrollData.filter(p => p.employmentType === 'Permanent').reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalContract = payrollData.filter(p => p.employmentType !== 'Permanent').reduce((acc, curr) => acc + curr.netSalary, 0);

  // Drilldown data for claims
  const relatedClaims = useMemo(() => {
    if (!selectedEntry) return [];
    return generalRequests.filter(r => 
        r.employeeId === selectedEntry.employeeId && 
        r.type === 'Claim' && 
        r.status === 'Approved' && 
        r.date.startsWith(selectedEntry.month)
    );
  }, [selectedEntry, generalRequests]);

  // --- ACTIONS ---
  const handleDownloadPayslip = (entry: PayrollEntry) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    if (!emp) return;
    try {
        const url = generatePayslipPDF(entry, emp, companyProfile);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${emp.name}_${entry.month}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addNotification(`Payslip for ${emp.name} downloaded.`, "success");
    } catch(e) {
        addNotification("Error generating PDF", "error");
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in w-full text-black dark:text-white">
      
      {/* Immersive Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-glossy-card relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 dark:bg-green-900/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-500">Financial Command</span>
            </div>
            <h2 className="text-4xl font-black text-black dark:text-white italic tracking-tighter uppercase leading-none">PAYROLL<br/><span className="text-gray-400 dark:text-gray-500">INTELLIGENCE</span></h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
             <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
                 <button onClick={() => setActiveTab('run')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'run' ? 'bg-white dark:bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Current Run</button>
                 <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-white dark:bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>History</button>
                 {currentUser.role !== 'Staff' && (
                    <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Config</button>
                 )}
             </div>
             {activeTab === 'run' && (
                <div className="flex items-center gap-4 bg-white dark:bg-[#121212] p-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg">
                    <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-black dark:text-white font-bold outline-none uppercase tracking-wide cursor-pointer"
                    />
                </div>
             )}
        </div>
      </div>

      {activeTab === 'run' && (
        <>
            {/* Split Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm transition-colors">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Staff Payroll</p>
                    <h4 className="text-2xl font-black text-black dark:text-white mb-1">RM {totalPerm.toLocaleString()}</h4>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">Includes EPF/SOCSO</p>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm transition-colors">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contractor/Ext Payout</p>
                    <h4 className="text-2xl font-black text-black dark:text-white mb-1">RM {totalContract.toLocaleString()}</h4>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold">No Statutory Deductions</p>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-sm transition-colors">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total OT & Claims</p>
                    <h4 className="text-2xl font-black text-black dark:text-white mb-1">RM {payrollData.reduce((a,c) => a + c.overtimeAmount + (c.allowances > 300 ? c.allowances - 300 : 0), 0).toLocaleString()}</h4>
                    <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">Variable Cost</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="border-2 border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden bg-white dark:bg-[#121212] shadow-glossy-card flex flex-col h-full transition-colors">
                {/* Table Controls */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-white/5">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                        placeholder="Search Employee..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-white/30 w-full sm:w-64 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <NeoButton variant="icon" className="h-10 w-10 border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 text-black dark:text-white" onClick={() => window.print()}>
                            <Printer className="w-5 h-5" />
                        </NeoButton>
                        <div className="relative group">
                            <NeoButton variant="icon" className="h-10 w-10 border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 text-black dark:text-white">
                                <Download className="w-5 h-5" />
                            </NeoButton>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/20 rounded-xl shadow-xl p-2 hidden group-hover:block z-50">
                                <button onClick={() => downloadFile(generateKWSPFile(payrollData as any, employees), `KWSP.txt`)} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-bold text-black dark:text-white mb-1">KWSP (Form A)</button>
                                <button onClick={() => downloadFile(generateSOCSOFile(payrollData as any, employees), `SOCSO.txt`)} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-bold text-black dark:text-white mb-1">SOCSO (Perkeso)</button>
                                <button onClick={() => downloadFile(generateLHDNFile(payrollData as any, employees), `CP39.txt`)} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-bold text-black dark:text-white">LHDN (CP39)</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-black border-b-2 border-gray-200 dark:border-white text-gray-700 dark:text-white uppercase text-[11px] font-black tracking-widest transition-colors">
                            <th className="p-5 pl-8">Employee</th>
                            <th className="p-5">Type</th>
                            <th className="p-5">Basic</th>
                            <th className="p-5 text-blue-600 dark:text-blue-400">Allowances</th>
                            <th className="p-5 text-orange-600 dark:text-orange-400">OT</th>
                            <th className="p-5 text-red-600 dark:text-red-400">Late Penalty</th>
                            <th className="p-5 text-red-600 dark:text-red-400">Statutory</th>
                            <th className="p-5">Net Pay</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-sm font-bold">
                        {payrollData.map((row) => (
                            <tr key={row.employeeId} onClick={() => { setSelectedEntry(row); setDetailTab('payslip'); }} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                <td className="p-5 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-black dark:text-white font-bold">
                                        {row.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-black dark:text-white text-sm">{row.name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono tracking-wide">{row.role}</span>
                                    </div>
                                </div>
                                </td>
                                <td className="p-5">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${row.employmentType === 'Permanent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'}`}>
                                        {row.employmentType}
                                    </span>
                                </td>
                                <td className="p-5 text-gray-600 dark:text-gray-300 font-mono">RM {row.basicSalary.toLocaleString()}</td>
                                <td className="p-5 text-blue-600 dark:text-blue-400 font-mono">+ {row.allowances.toLocaleString()}</td>
                                <td className="p-5 text-orange-600 dark:text-orange-400 font-mono">
                                {row.overtimeAmount > 0 ? `+ ${row.overtimeAmount.toFixed(0)}` : '-'}
                                </td>
                                <td className="p-5 text-red-600 dark:text-red-400 font-mono">
                                    {row.lateDeduction > 0 ? `- ${row.lateDeduction.toFixed(2)}` : '-'}
                                </td>
                                <td className="p-5 text-red-600 dark:text-red-400 font-mono">
                                    - {(row.epf + row.socso + row.eis + row.pcb).toFixed(0)}
                                </td>
                                <td className="p-5 text-black dark:text-white font-black text-base">RM {row.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="p-5 text-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(row); }}
                                        className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white hover:text-black text-gray-500 dark:text-gray-400 transition-colors"
                                        title="Download PDF"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
      
      {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NeoCard title="Statutory Rates Configuration" className="border-l-4 border-l-yellow-500 bg-white dark:bg-[#1a1a1a] text-black dark:text-white">
                  <div className="space-y-6">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Adjust the percentage contribution rates for EPF and SOCSO according to government mandates.</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <NeoInput 
                              label="EPF (Employee %)"
                              type="number" 
                              value={payrollSettings.statutoryRates.epfEmployee} 
                              onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployee: parseFloat(e.target.value)}})} 
                          />
                          <NeoInput 
                              label="EPF (Employer %)"
                              type="number" 
                              value={payrollSettings.statutoryRates.epfEmployer} 
                              onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployer: parseFloat(e.target.value)}})} 
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <NeoInput 
                              label="SOCSO (%)"
                              type="number" 
                              value={payrollSettings.statutoryRates.socso} 
                              onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, socso: parseFloat(e.target.value)}})} 
                          />
                          <NeoInput 
                              label="EIS (%)"
                              type="number" 
                              value={payrollSettings.statutoryRates.eis} 
                              onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, eis: parseFloat(e.target.value)}})} 
                          />
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                          <NeoCheckbox 
                              label="Enable EPF for Foreigners" 
                              checked={payrollSettings.enableEpfForForeigners}
                              onChange={c => updatePayrollSettings({...payrollSettings, enableEpfForForeigners: c})}
                          />
                          <NeoCheckbox 
                              label="Enable SOCSO Contribution" 
                              checked={payrollSettings.enableSocso}
                              onChange={c => updatePayrollSettings({...payrollSettings, enableSocso: c})}
                              className="mt-2"
                          />
                      </div>
                  </div>
              </NeoCard>

              <NeoCard title="Global Allowances" className="border-l-4 border-l-blue-500 bg-white dark:bg-[#1a1a1a] text-black dark:text-white">
                  <div className="space-y-6">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Set fixed allowances that apply to all permanent staff.</p>
                      
                      <NeoInput 
                          label="Transport Allowance (RM)"
                          type="number" 
                          value={payrollSettings.globalAllowances.transport} 
                          onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, transport: parseFloat(e.target.value)}})} 
                      />
                      
                      <NeoInput 
                          label="Phone Allowance (RM)"
                          type="number" 
                          value={payrollSettings.globalAllowances.phone} 
                          onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, phone: parseFloat(e.target.value)}})} 
                      />
                      
                      <NeoInput 
                          label="Meal Allowance (RM)"
                          type="number" 
                          value={payrollSettings.globalAllowances.meal} 
                          onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, meal: parseFloat(e.target.value)}})} 
                      />
                      
                      <NeoButton onClick={() => addNotification("Settings Saved", "success")} className="w-full mt-4">Update Configuration</NeoButton>
                  </div>
              </NeoCard>
          </div>
      )}

      {activeTab === 'history' && (
          <div className="p-8 text-center text-gray-500 bg-white dark:bg-[#121212] rounded-3xl border border-gray-200 dark:border-white/10 min-h-[400px] flex flex-col items-center justify-center shadow-sm transition-colors">
              <CalendarDays className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-black dark:text-white uppercase">Archive Vault</h3>
              <p className="text-sm">Historical payroll runs will appear here.</p>
          </div>
      )}

      {/* Detail Modal */}
      <NeoModal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={`${selectedEntry?.name} - ${selectedEntry?.month}`}>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 mb-6">
              <button 
                  onClick={() => setDetailTab('payslip')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${detailTab === 'payslip' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                  Overview
              </button>
              <button 
                  onClick={() => setDetailTab('claims')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${detailTab === 'claims' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                  Claims ({relatedClaims.length})
              </button>
          </div>

          {detailTab === 'payslip' && (
              <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between items-center">
                      <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Net Pay</p>
                          <p className="text-2xl font-black text-black dark:text-white">RM {selectedEntry?.netSalary.toLocaleString()}</p>
                      </div>
                      <NeoButton onClick={() => handleDownloadPayslip(selectedEntry!)} className="text-xs py-2 px-4">Download Slip</NeoButton>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Earnings</p>
                          <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span>Basic</span> <span>{selectedEntry?.basicSalary.toLocaleString()}</span></div>
                              <div className="flex justify-between text-green-600 dark:text-green-400"><span>Allowances</span> <span>+{selectedEntry?.allowances.toLocaleString()}</span></div>
                              <div className="flex justify-between text-orange-600 dark:text-orange-400"><span>Overtime</span> <span>+{selectedEntry?.overtimeAmount.toFixed(2)}</span></div>
                          </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Deductions</p>
                          <div className="space-y-1 text-sm text-red-600 dark:text-red-400">
                              <div className="flex justify-between"><span>EPF</span> <span>-{selectedEntry?.epf.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>SOCSO</span> <span>-{selectedEntry?.socso.toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>PCB</span> <span>-{selectedEntry?.pcb.toFixed(2)}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {detailTab === 'claims' && (
              <div className="space-y-4">
                  {relatedClaims.length === 0 ? (
                      <div className="text-center p-8 text-gray-500">No approved claims for this period.</div>
                  ) : (
                      relatedClaims.map(claim => (
                          <div key={claim.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between items-center">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <Receipt className="w-4 h-4 text-blue-500" />
                                      <p className="font-bold text-sm text-black dark:text-white">{claim.details}</p>
                                  </div>
                                  <p className="text-xs text-gray-500">{claim.date}</p>
                              </div>
                              <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                  RM {parseFloat(claim.details.match(/(\d+(\.\d+)?)/)?.[0] || "0").toLocaleString()}
                              </span>
                          </div>
                      ))
                  )}
                  {relatedClaims.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-gray-500">Total Claims</span>
                          <span className="text-lg font-black text-black dark:text-white">
                              RM {relatedClaims.reduce((sum, c) => sum + (parseFloat(c.details.match(/(\d+(\.\d+)?)/)?.[0] || "0")), 0).toLocaleString()}
                          </span>
                      </div>
                  )}
              </div>
          )}
      </NeoModal>

    </div>
  );
};