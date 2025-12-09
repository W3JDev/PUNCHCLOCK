
import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoCheckbox, NeoModal } from '../components/NeoComponents';
import { Download, Printer, Check, Search, Calendar, DollarSign, User, MoreHorizontal, ArrowRight, Settings, BarChart2, FileText, BrainCircuit, Activity, AlertTriangle, TrendingUp, Clock, CalendarDays, Loader2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateKWSPFile, generateSOCSOFile, generateLHDNFile } from '../services/complianceService';
import { generatePayslipPDF } from '../services/documentService';
import { PayrollEntry } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Payroll: React.FC = () => {
  const { employees, attendanceRecords, shifts, leaveRequests, generalRequests, t, currentUser, addNotification, payrollSettings, updatePayrollSettings, companyProfile } = useGlobal();
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'settings'>('run');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drilldown State
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);

  // --- CALCULATION ENGINE ---
  const payrollData = useMemo(() => {
    return employees.filter(e => e.status === 'Active').map(emp => {
      
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
      const hourlyRate = ordinaryRateOfPay / 8; 

      // 2. Analyze Attendance & Leaves for this Month
      let daysWorked = 0;
      let totalLatenessMins = 0;
      let overtimeHours = 0;
      let unpaidLeaves = 0;

      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          
          // Check Attendance
          const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === dateStr);
          if (record && record.status !== 'Absent') {
              daysWorked++;
              if (record.status === 'Late') totalLatenessMins += 15; // Simplified logic
          }

          // Check Overtime (vs Shift)
          // STRICT RULE: Only count OT if there is a Shift AND the user clocked out late
          const shift = shifts.find(s => s.employeeId === emp.id && s.date === dateStr);
          if (record && record.checkOut && shift && shift.endTime) {
              const checkOutDate = new Date(`1970-01-01T${record.checkOut}`);
              const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
              const diffMs = checkOutDate.getTime() - shiftEnd.getTime();
              
              // Only count if diff is significant (> 30 mins) and Shift didn't reject OT
              if (diffMs > 30 * 60 * 1000 && shift.approvalStatus !== 'Rejected') {
                  overtimeHours += (diffMs / (1000 * 60 * 60)); 
              }
          }

          // Check APPROVED Leaves
          // Only deduct for Unpaid Leave
          const leave = leaveRequests.find(l => l.employeeId === emp.id && l.date === dateStr && l.status === 'Approved');
          if (leave && leave.type.includes('Unpaid')) { // Simplistic check for type name
              unpaidLeaves++;
          }
      }

      // 3. Claims (From Approved General Requests)
      // Filter for approved financial claims in this month
      const approvedClaims = generalRequests
        .filter(r => r.employeeId === emp.id && r.type === 'Claim' && r.status === 'Approved' && r.date.startsWith(selectedMonth))
        .reduce((sum, r) => sum + (parseFloat(r.details) || 0), 0);

      // 4. Calculate Allowances
      const globalAllowances = payrollSettings.globalAllowances.transport + payrollSettings.globalAllowances.phone + payrollSettings.globalAllowances.meal;
      const personalAllowances = (emp.customAllowances?.phone || 0) + (emp.customAllowances?.transport || 0) + (emp.customAllowances?.meal || 0) + (emp.customAllowances?.housing || 0);
      const totalFixedAllowances = globalAllowances + personalAllowances;

      // 5. Gross Calculation
      const unpaidDeduction = unpaidLeaves * ordinaryRateOfPay;
      const overtimeAmount = overtimeHours * (hourlyRate * 1.5); // Standard 1.5x Rate
      
      const gross = Math.max(0, basic + totalFixedAllowances + approvedClaims + overtimeAmount - unpaidDeduction);

      // 6. Statutory Calcs (Real Formulas roughly approximated)
      const isForeigner = emp.nric && emp.nric.length < 10;
      
      let epf = 0;
      if (!isForeigner || payrollSettings.enableEpfForForeigners) {
          epf = Math.round(gross * (payrollSettings.statutoryRates.epfEmployee / 100));
      }

      let socso = 0;
      if (payrollSettings.enableSocso) {
         if (gross > 4000) socso = 19.75;
         else socso = Math.round(gross * (payrollSettings.statutoryRates.socso / 100) * 10) / 10;
      }

      let eis = 0;
      if (gross > 4000) eis = 7.90;
      else eis = Math.round(gross * (payrollSettings.statutoryRates.eis / 100) * 10) / 10;

      let pcb = 0;
      if (gross > 3833) { // Tax threshold roughly
         pcb = Math.round((gross - 3833) * 0.05); 
      }

      return {
        employeeId: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
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
        netSalary: gross - epf - socso - eis - pcb,
        status: (new Date().getDate() > 25) ? 'PAID' : 'PENDING'
      } as PayrollEntry;

    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, attendanceRecords, shifts, leaveRequests, generalRequests, selectedMonth, searchTerm, payrollSettings]);

  const totalPayout = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);

  // --- AI INSIGHT GENERATOR ---
  const aiInsights = useMemo(() => {
     const totalOT = payrollData.reduce((acc, curr) => acc + curr.overtimeAmount, 0);
     const totalLate = payrollData.reduce((acc, curr) => acc + curr.totalLatenessMins, 0);
     const highEarners = payrollData.filter(p => p.overtimeAmount > (p.basicSalary * 0.2));
     
     return [
        { title: "Projected Burn", value: `RM ${totalPayout.toLocaleString()}`, trend: "+5% vs last month", status: "neutral" },
        { title: "Overtime Spike", value: `RM ${totalOT.toFixed(2)}`, trend: highEarners.length > 0 ? `${highEarners.length} staff >20% OT` : "Normal Levels", status: highEarners.length > 0 ? "warning" : "success" },
        { title: "Efficiency Loss", value: `${totalLate} mins`, trend: "Total Lateness", status: totalLate > 120 ? "danger" : "success" }
     ];
  }, [payrollData, totalPayout]);

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

  const handleProcessPayment = () => {
    setIsProcessing(true);
    // Simulate complex calculation delay
    setTimeout(() => {
        addNotification(`Processing payment batch for ${payrollData.length} employees...`, 'info');
        setTimeout(() => {
            setIsProcessing(false);
            addNotification(`Successfully processed RM ${totalPayout.toLocaleString()}`, 'success');
        }, 1500);
    }, 1000);
  };

  const getPeriodText = () => {
    const d = new Date(selectedMonth);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${month} 01 - ${month} ${lastDay}, ${year}`;
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in w-full">
      
      {/* Immersive Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-glossy-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-900/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-black uppercase tracking-[0.2em] text-green-500">Financial Command</span>
            </div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">PAYROLL<br/><span className="text-gray-500">INTELLIGENCE</span></h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
             <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                 <button onClick={() => setActiveTab('run')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'run' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Payroll Run</button>
                 <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Configuration</button>
             </div>
             <div className="flex items-center gap-4 bg-[#121212] p-3 rounded-xl border border-white/10 shadow-lg">
                <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none uppercase tracking-wide cursor-pointer"
                />
            </div>
        </div>
      </div>

      {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
             <NeoCard title="Statutory Settings" className="border-l-4 border-blue-500">
                <div className="space-y-4">
                    <NeoCheckbox 
                        label="Enable EPF for Foreigners" 
                        checked={payrollSettings.enableEpfForForeigners} 
                        onChange={v => updatePayrollSettings({...payrollSettings, enableEpfForForeigners: v})} 
                    />
                    <NeoCheckbox 
                        label="Enable SOCSO/EIS Contributions" 
                        checked={payrollSettings.enableSocso} 
                        onChange={v => updatePayrollSettings({...payrollSettings, enableSocso: v})} 
                    />
                    <div className="h-px bg-white/10 my-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">EPF Employee %</label>
                            <NeoInput type="number" value={payrollSettings.statutoryRates.epfEmployee} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployee: parseFloat(e.target.value)}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">EPF Employer %</label>
                            <NeoInput type="number" value={payrollSettings.statutoryRates.epfEmployer} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployer: parseFloat(e.target.value)}})} />
                        </div>
                    </div>
                </div>
             </NeoCard>

             <NeoCard title="Global Allowances (Fixed)" className="border-l-4 border-green-500">
                 <div className="space-y-4">
                     <p className="text-gray-400 text-xs mb-2">These allowances are applied to ALL active staff monthly.</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Transport (RM)</label>
                            <NeoInput type="number" value={payrollSettings.globalAllowances.transport} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, transport: parseFloat(e.target.value)}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Phone (RM)</label>
                            <NeoInput type="number" value={payrollSettings.globalAllowances.phone} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, phone: parseFloat(e.target.value)}})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase">Meal (RM)</label>
                            <NeoInput type="number" value={payrollSettings.globalAllowances.meal} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, meal: parseFloat(e.target.value)}})} />
                        </div>
                     </div>
                 </div>
             </NeoCard>
          </div>
      )}

      {activeTab === 'run' && (
        <>
            {/* AI Agent Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiInsights.map((insight, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className={`absolute top-0 right-0 p-2 opacity-50 ${insight.status === 'warning' ? 'text-orange-500' : insight.status === 'danger' ? 'text-red-500' : 'text-green-500'}`}>
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{insight.title}</p>
                        <h4 className="text-2xl font-black text-white mb-1">{insight.value}</h4>
                        <p className={`text-xs font-bold ${insight.status === 'warning' ? 'text-orange-400' : insight.status === 'danger' ? 'text-red-400' : 'text-green-400'}`}>
                           {insight.trend}
                        </p>
                    </div>
                ))}
            </div>

            {/* Hero Card - "Payroll Run" */}
            <div className="relative bg-[#0a0a0a] border-2 border-white rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">PAYROLL RUN</h3>
                    <p className="text-gray-400 font-mono text-xs md:text-sm">Period: <span className="text-white">{getPeriodText()}</span></p>
                    
                    <div className="mt-6 flex flex-wrap gap-3">
                    <NeoButton variant="icon" className="h-10 w-10 border-white/20 hover:bg-white/10" onClick={() => window.print()}>
                        <Printer className="w-5 h-5 text-white" />
                    </NeoButton>
                    <div className="relative group">
                        <NeoButton variant="icon" className="h-10 w-10 border-white/20 hover:bg-white/10">
                            <Download className="w-5 h-5 text-white" />
                        </NeoButton>
                        {/* Export Dropdown */}
                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/20 rounded-xl shadow-xl p-2 hidden group-hover:block z-50">
                            <button onClick={() => downloadFile(generateKWSPFile(payrollData as any, employees), `KWSP.txt`)} className="w-full text-left p-2 hover:bg-white/10 rounded-lg text-xs font-bold text-white mb-1">KWSP (Form A)</button>
                            <button onClick={() => downloadFile(generateSOCSOFile(payrollData as any, employees), `SOCSO.txt`)} className="w-full text-left p-2 hover:bg-white/10 rounded-lg text-xs font-bold text-white mb-1">SOCSO (Perkeso)</button>
                            <button onClick={() => downloadFile(generateLHDNFile(payrollData as any, employees), `CP39.txt`)} className="w-full text-left p-2 hover:bg-white/10 rounded-lg text-xs font-bold text-white">LHDN (CP39)</button>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="flex flex-col lg:items-end gap-2 text-left lg:text-right">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">TOTAL PAYOUT</span>
                    <span className="text-4xl md:text-5xl lg:text-6xl font-black text-[#4ade80] tracking-tighter drop-shadow-sm">
                        RM {totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex-shrink-0 w-full lg:w-auto">
                    <button 
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full lg:w-auto bg-[#4ade80] hover:bg-[#22c55e] text-black font-black text-lg px-8 py-4 rounded-xl shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all flex items-center justify-center gap-3 uppercase tracking-wide disabled:opacity-50"
                    >
                        {isProcessing ? <><Loader2 className="w-6 h-6 animate-spin"/> Calculating...</> : <><ArrowRight className="w-6 h-6" /> Process Payment</>}
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="border-2 border-white/10 rounded-3xl overflow-hidden bg-[#121212] shadow-glossy-card flex flex-col h-full">
                {/* Table Controls */}
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                        placeholder="Search Employee..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-white/30 w-full sm:w-64"
                        />
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{payrollData.length} RECORDS FOUND</div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-black border-b-2 border-white text-white uppercase text-[11px] font-black tracking-widest">
                            <th className="p-5 pl-8">Employee</th>
                            <th className="p-5">Basic</th>
                            <th className="p-5 text-blue-400">Allowances</th>
                            <th className="p-5 text-orange-400">Overtime</th>
                            <th className="p-5 text-red-400">Deductions</th>
                            <th className="p-5">Net Pay</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-bold">
                        {payrollData.map((row) => (
                            <tr key={row.employeeId} onClick={() => setSelectedEntry(row)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                <td className="p-5 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                                        {row.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm">{row.name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono tracking-wide">{row.role}</span>
                                    </div>
                                </div>
                                </td>
                                <td className="p-5 text-gray-300 font-mono">RM {row.basicSalary.toLocaleString()}</td>
                                <td className="p-5 text-blue-400 font-mono">+ RM {row.allowances.toLocaleString()}</td>
                                <td className="p-5 text-orange-400 font-mono">
                                {row.overtimeAmount > 0 ? `+ RM ${row.overtimeAmount.toFixed(2)}` : '-'}
                                </td>
                                <td className="p-5 text-red-400 font-mono">
                                    - RM {(row.epf + row.socso + row.eis + row.pcb).toFixed(2)}
                                </td>
                                <td className="p-5 text-white font-black text-base">RM {row.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="p-5 text-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(row); }}
                                        className="p-2 bg-white/10 rounded-lg hover:bg-white hover:text-black text-gray-400 transition-colors"
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

      {/* DETAILED BREAKDOWN MODAL */}
      <NeoModal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title="Payslip Breakdown">
         {selectedEntry && (
             <div className="space-y-8">
                 {/* Top Summary */}
                 <div className="flex justify-between items-start bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                     <div>
                         <h4 className="text-2xl font-black text-white">{selectedEntry.name}</h4>
                         <p className="text-sm text-blue-400 font-bold uppercase">{selectedEntry.role} • {selectedEntry.department}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-xs text-gray-500 font-bold uppercase">Net Pay</p>
                         <h4 className="text-3xl font-black text-white">RM {selectedEntry.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                     </div>
                 </div>

                 {/* Visual Attendance Calendar Heatmap for context */}
                 <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/10">
                     <div className="flex justify-between items-center mb-4">
                         <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <CalendarDays className="w-4 h-4" /> Attendance Logic
                         </h5>
                         <div className="flex gap-2">
                             <div className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Work</div>
                             <div className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Unpaid</div>
                             <div className="flex items-center gap-1 text-[10px] text-gray-500"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> OT</div>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-7 gap-1">
                         {Array.from({length: 31}, (_, i) => {
                             const day = i + 1;
                             const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                             // Find logic
                             const record = attendanceRecords.find(r => r.employeeId === selectedEntry.employeeId && r.date === dateStr);
                             const leave = leaveRequests.find(l => l.employeeId === selectedEntry.employeeId && l.date === dateStr && l.status === 'Approved');
                             const shift = shifts.find(s => s.employeeId === selectedEntry.employeeId && s.date === dateStr);
                             
                             let colorClass = 'bg-[#1a1a1a] border-white/5';
                             if (leave?.type.includes('Unpaid')) colorClass = 'bg-red-900/40 border-red-500/30';
                             else if (record?.status === 'Present') colorClass = 'bg-green-900/40 border-green-500/30';
                             
                             // Check for OT
                             if (record?.checkOut && shift?.endTime && shift.approvalStatus !== 'Rejected') {
                                if (record.checkOut > shift.endTime) colorClass = 'bg-orange-900/40 border-orange-500/30';
                             }

                             return (
                                 <div key={day} className={`h-8 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 border ${colorClass}`}>
                                     {day}
                                 </div>
                             );
                         })}
                     </div>
                     <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                         <div className="bg-white/5 p-2 rounded-lg">
                             <p className="text-[10px] text-gray-500 uppercase font-bold">Days Worked</p>
                             <p className="text-lg font-black text-white">{selectedEntry.daysWorked}</p>
                         </div>
                         <div className="bg-white/5 p-2 rounded-lg">
                             <p className="text-[10px] text-gray-500 uppercase font-bold">Unpaid Leaves</p>
                             <p className="text-lg font-black text-red-400">{selectedEntry.unpaidLeaves}</p>
                         </div>
                         <div className="bg-white/5 p-2 rounded-lg">
                             <p className="text-[10px] text-gray-500 uppercase font-bold">Lateness</p>
                             <p className="text-lg font-black text-yellow-400">{selectedEntry.totalLatenessMins}m</p>
                         </div>
                     </div>
                 </div>

                 {/* Detailed Line Items */}
                 <div className="grid grid-cols-2 gap-8 text-sm">
                     <div className="space-y-2">
                         <h5 className="font-black text-gray-500 uppercase text-xs mb-2">Earnings</h5>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>Basic Salary</span> <span>{selectedEntry.basicSalary.toLocaleString()}</span></div>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>Allowances & Claims</span> <span>{selectedEntry.allowances.toLocaleString()}</span></div>
                         <div className="flex justify-between p-2 bg-orange-500/10 rounded text-orange-200">
                             <span>Overtime ({selectedEntry.overtimeHours.toFixed(1)} hrs @ 1.5x)</span> 
                             <span>{selectedEntry.overtimeAmount.toFixed(2)}</span>
                         </div>
                     </div>
                     <div className="space-y-2">
                         <h5 className="font-black text-gray-500 uppercase text-xs mb-2">Deductions</h5>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>EPF (11%)</span> <span>{selectedEntry.epf.toFixed(2)}</span></div>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>SOCSO</span> <span>{selectedEntry.socso.toFixed(2)}</span></div>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>EIS</span> <span>{selectedEntry.eis.toFixed(2)}</span></div>
                         <div className="flex justify-between p-2 bg-white/5 rounded"><span>PCB (Tax)</span> <span>{selectedEntry.pcb.toFixed(2)}</span></div>
                         {selectedEntry.unpaidLeaves > 0 && (
                            <div className="flex justify-between p-2 bg-red-500/10 rounded text-red-300">
                                <span>Unpaid Leave ({selectedEntry.unpaidLeaves} days)</span> 
                                <span>- {(selectedEntry.unpaidLeaves * (selectedEntry.basicSalary / 26)).toFixed(2)}</span>
                            </div>
                         )}
                     </div>
                 </div>

                 <NeoButton className="w-full" onClick={() => handleDownloadPayslip(selectedEntry)}>
                    <Printer className="w-4 h-4 mr-2" /> Download Payslip PDF
                 </NeoButton>
             </div>
         )}
      </NeoModal>
    </div>
  );
};
