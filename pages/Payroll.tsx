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
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [detailTab, setDetailTab] = useState<'payslip' | 'claims'>('payslip');

  const accessibleEmployees = useMemo(() => {
    return employees.filter(emp => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'HR') return true;
        if (currentUser?.role === 'Manager') return emp.reportsTo === currentUser.id;
        if (currentUser?.role === 'Staff') return emp.id === currentUser.id;
        return false;
    });
  }, [employees, currentUser]);

  const calculatePCB = (monthlyGross: number, monthlyEPF: number) => {
      const annualIncome = monthlyGross * 12;
      const personalRelief = 9000;
      const epfRelief = Math.min(monthlyEPF * 12, 4000); 
      let chargeableIncome = annualIncome - personalRelief - epfRelief;
      if (chargeableIncome <= 5000) return 0; 
      let tax = 0;
      const c = chargeableIncome;
      if (c > 2000000) tax = 528400 + (c - 2000000) * 0.30;
      else if (c > 600000) tax = 136400 + (c - 600000) * 0.28;
      else if (c > 400000) tax = 84400 + (c - 400000) * 0.26;
      else if (c > 100000) tax = 9400 + (c - 100000) * 0.25;
      else if (c > 70000) tax = 3700 + (c - 70000) * 0.19;
      else if (c > 50000) tax = 1500 + (c - 50000) * 0.11;
      else if (c > 35000) tax = 600 + (c - 35000) * 0.06;
      else if (c > 20000) tax = 150 + (c - 20000) * 0.03;
      else if (c > 5000) tax = 0 + (c - 5000) * 0.01;
      return Math.max(0, parseFloat((tax / 12).toFixed(2)));
  };

  const payrollData = useMemo(() => {
    return accessibleEmployees.filter(e => e.status === 'Active').map(emp => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      let standardDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
         if (new Date(year, month - 1, d).getDay() !== 0 && new Date(year, month - 1, d).getDay() !== 6) standardDays++;
      }
      const basic = emp.baseSalary || 0;
      const hourlyRate = (basic / 26) / 8; 

      let daysWorked = 0;
      let totalLatenessMins = 0;
      let overtimeAmount = 0;
      let unpaidLeaves = 0;

      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
          if (record && record.status !== 'Absent') {
              daysWorked++;
              if (record.lateMinutes) totalLatenessMins += record.lateMinutes;
              if (record.otMinutes) overtimeAmount += (record.otMinutes / 60 * hourlyRate * 1.5);
          }
          const leave = leaveRequests.find(l => l.employeeId === emp.id && l.date === dateStr && l.status === 'Approved');
          if (leave && leave.type.includes('Unpaid')) unpaidLeaves++;
      }

      // Filter approved claims for this month
      const approvedClaimsList = generalRequests.filter(r => 
        r.employeeId === emp.id && 
        r.type === 'Claim' && 
        r.status === 'Approved' && 
        r.date.startsWith(selectedMonth)
      );

      const approvedClaimsValue = approvedClaimsList.reduce((sum, r) => {
        const val = parseFloat(r.details.match(/(\d+(\.\d+)?)/)?.[0] || "0");
        return sum + val;
      }, 0);

      const fixedAllowances = payrollSettings.globalAllowances.transport + payrollSettings.globalAllowances.phone + payrollSettings.globalAllowances.meal;
      const lateDeduction = (totalLatenessMins / 60) * hourlyRate;
      const gross = Math.max(0, basic + fixedAllowances + approvedClaimsValue + overtimeAmount - (unpaidLeaves * (basic/26)) - lateDeduction);
      const isPerm = emp.employmentType === 'Permanent';
      const epf = isPerm ? Math.round(gross * 0.11) : 0;
      const socso = isPerm ? (gross > 4000 ? 19.75 : gross * 0.005) : 0;
      const eis = isPerm ? (gross > 4000 ? 7.90 : gross * 0.002) : 0;
      const pcb = isPerm ? calculatePCB(gross, epf) : 0;

      return {
        employeeId: emp.id, name: emp.name, role: emp.role, department: emp.department, employmentType: emp.employmentType,
        month: selectedMonth, standardDays, daysWorked, overtimeAmount, basicSalary: basic,
        allowances: fixedAllowances + approvedClaimsValue, grossPay: gross, epf, socso, eis, pcb, lateDeduction,
        netSalary: gross - epf - socso - eis - pcb,
        status: (new Date().getDate() > 25) ? 'PAID' : 'PENDING'
      } as PayrollEntry;
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [accessibleEmployees, attendanceRecords, leaveRequests, generalRequests, selectedMonth, searchTerm, payrollSettings]);

  const relatedClaims = useMemo(() => {
    if (!selectedEntry) return [];
    return generalRequests.filter(r => 
        r.employeeId === selectedEntry.employeeId && 
        r.type === 'Claim' && 
        r.status === 'Approved' && 
        r.date.startsWith(selectedEntry.month)
    );
  }, [selectedEntry, generalRequests]);

  const handleDownloadPayslip = (entry: PayrollEntry) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    if (!emp) return;
    const url = generatePayslipPDF(entry, emp, companyProfile);
    const a = document.createElement('a'); a.href = url; a.download = `Payslip_${emp.name}_${entry.month}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in w-full text-black dark:text-white">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-glossy-card relative overflow-hidden transition-colors">
        <div className="relative z-10">
            <h2 className="text-4xl font-black text-black dark:text-white italic tracking-tighter uppercase leading-none">PAYROLL<br/><span className="text-gray-400 dark:text-gray-500">ENGINE</span></h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 relative z-10">
             <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                 <button onClick={() => setActiveTab('run')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'run' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Process</button>
                 <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Config</button>
             </div>
             <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white dark:bg-[#121212] p-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg font-bold outline-none" />
        </div>
      </div>

      {activeTab === 'run' && (
        <div className="border-2 border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden bg-white dark:bg-[#121212] shadow-glossy-card flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between bg-gray-50 dark:bg-white/5">
                <input placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold w-full max-w-xs" />
            </div>
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-black border-b-2 border-gray-200 dark:border-white text-gray-700 dark:text-white uppercase text-[11px] font-black tracking-widest">
                            <th className="p-5 pl-8">Employee</th>
                            <th className="p-5">Basic Salary</th>
                            <th className="p-5">Allowances</th>
                            <th className="p-5">Statutory</th>
                            <th className="p-5">Net Pay</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-sm font-bold">
                        {payrollData.map((row) => (
                            <tr key={row.employeeId} onClick={() => { setSelectedEntry(row); setDetailTab('payslip'); }} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                <td className="p-5 pl-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">{row.name.charAt(0)}</div>
                                        <div className="flex flex-col"><span>{row.name}</span><span className="text-[10px] text-gray-500">{row.role}</span></div>
                                    </div>
                                </td>
                                <td className="p-5 font-mono">RM {row.basicSalary.toLocaleString()}</td>
                                <td className="p-5 font-mono text-green-600">+ {row.allowances.toLocaleString()}</td>
                                <td className="p-5 font-mono text-red-600">- {(row.epf + row.socso + row.eis + row.pcb).toFixed(0)}</td>
                                <td className="p-5 font-black text-base">RM {row.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="p-5 text-center"><button onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(row); }} className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200"><FileText className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NeoCard title="Statutory Contribution Rates" className="border-l-4 border-l-yellow-500">
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <NeoInput label="EPF Employee %" type="number" value={payrollSettings.statutoryRates.epfEmployee} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployee: parseFloat(e.target.value)}})} />
                          <NeoInput label="EPF Employer %" type="number" value={payrollSettings.statutoryRates.epfEmployer} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployer: parseFloat(e.target.value)}})} />
                      </div>
                      <NeoCheckbox label="Enable SOCSO Contribution" checked={payrollSettings.enableSocso} onChange={c => updatePayrollSettings({...payrollSettings, enableSocso: c})} />
                  </div>
              </NeoCard>
              <NeoCard title="Fixed Monthly Allowances" className="border-l-4 border-l-blue-500">
                  <div className="space-y-4">
                      <NeoInput label="Transport (RM)" type="number" value={payrollSettings.globalAllowances.transport} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, transport: parseFloat(e.target.value)}})} />
                      <NeoInput label="Meal (RM)" type="number" value={payrollSettings.globalAllowances.meal} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, meal: parseFloat(e.target.value)}})} />
                  </div>
              </NeoCard>
          </div>
      )}

      <NeoModal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={`${selectedEntry?.name} - Detailed Breakdown`}>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black rounded-xl mb-6 border border-gray-200 dark:border-white/10">
              <button onClick={() => setDetailTab('payslip')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase ${detailTab === 'payslip' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Summary</button>
              <button onClick={() => setDetailTab('claims')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase ${detailTab === 'claims' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Claims ({relatedClaims.length})</button>
          </div>
          {detailTab === 'payslip' && (
              <div className="space-y-4">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex justify-between items-center border border-blue-100 dark:border-blue-500/20">
                      <div><p className="text-xs font-bold uppercase opacity-50 mb-1">Net Disposable Income</p><p className="text-4xl font-black text-blue-600 dark:text-blue-400">RM {selectedEntry?.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                      <NeoButton onClick={() => handleDownloadPayslip(selectedEntry!)} variant="secondary" className="px-6">PDF Payslip</NeoButton>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Total Earnings</p>
                          <div className="space-y-2 text-sm font-mono">
                              <div className="flex justify-between"><span>Basic</span> <span>{selectedEntry?.basicSalary.toLocaleString()}</span></div>
                              <div className="flex justify-between text-green-600"><span>Allowances</span> <span>+{selectedEntry?.allowances.toLocaleString()}</span></div>
                              {selectedEntry && selectedEntry.overtimeAmount > 0 && <div className="flex justify-between text-green-600"><span>Overtime</span> <span>+{selectedEntry?.overtimeAmount.toLocaleString()}</span></div>}
                          </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Deductions</p>
                          <div className="space-y-2 text-sm font-mono text-red-600">
                              <div className="flex justify-between"><span>EPF (KWSP)</span> <span>-{selectedEntry?.epf.toLocaleString()}</span></div>
                              <div className="flex justify-between"><span>SOCSO/EIS</span> <span>-{(selectedEntry!.socso + selectedEntry!.eis).toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>LHDN PCB</span> <span>-{selectedEntry?.pcb.toFixed(2)}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
          {detailTab === 'claims' && (
              <div className="space-y-4">
                  {relatedClaims.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                          <Receipt className="w-12 h-12 opacity-20" />
                          <p className="uppercase text-xs font-black tracking-widest">No claims processed for {selectedEntry?.month}</p>
                      </div>
                  ) : (
                      relatedClaims.map(claim => (
                          <div key={claim.id} className="p-5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                                      <Receipt className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm uppercase">{claim.details}</p>
                                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{new Date(claim.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</p>
                                  </div>
                              </div>
                              <span className="font-mono font-black text-green-600 text-lg">RM {parseFloat(claim.details.match(/(\d+(\.\d+)?)/)?.[0] || "0").toFixed(2)}</span>
                          </div>
                      ))
                  )}
              </div>
          )}
      </NeoModal>
    </div>
  );
};
