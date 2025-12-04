

import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoCheckbox } from '../components/NeoComponents';
import { Download, Printer, Check, Search, Calendar, DollarSign, User, MoreHorizontal, ArrowRight, Settings, BarChart2, FileText } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateKWSPFile, generateSOCSOFile, generateLHDNFile } from '../services/complianceService';
import { generatePayslipPDF } from '../services/documentService';
import { PayrollEntry } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Payroll: React.FC = () => {
  const { employees, t, currentUser, addNotification, payrollSettings, updatePayrollSettings, companyProfile } = useGlobal();
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'settings'>('run');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  
  // Helper for deterministic pseudo-random values
  const getDeterministicValue = (seedStr: string, min: number, max: number) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const normalized = (Math.abs(hash) % 1000) / 1000; 
    return Math.floor(normalized * (max - min + 1)) + min;
  };

  // Auto-calculate payroll for all active employees
  const payrollData = useMemo(() => {
    return employees.filter(e => e.status === 'Active').map(emp => {
      const seed = `${emp.id}-${selectedMonth}`;
      
      const standardHours = 176; // 22 days * 8 hours
      const basic = emp.baseSalary;
      const hourlyRate = basic / standardHours;
      
      // Simulate Overtime
      const overtimeHours = getDeterministicValue(seed + 'OTH', 0, 10);
      const overtimeAmount = overtimeHours * (hourlyRate * 1.5);
      
      // Calculate Allowances
      const globalAllowances = payrollSettings.globalAllowances.transport + payrollSettings.globalAllowances.phone + payrollSettings.globalAllowances.meal;
      const personalAllowances = (emp.customAllowances?.phone || 0) + (emp.customAllowances?.transport || 0) + (emp.customAllowances?.meal || 0) + (emp.customAllowances?.housing || 0);
      const totalAllowances = globalAllowances + personalAllowances;

      const gross = basic + totalAllowances + overtimeAmount;

      // Statutory Calcs
      const isForeigner = emp.nric && emp.nric.length < 10; // Simple heuristic for demo
      
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
      if (gross > 3500) pcb = Math.round((gross - 3500) * 0.05); // Simplified Tax

      return {
        employeeId: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        month: selectedMonth,
        standardHours,
        hourlyRate,
        overtimeHours,
        overtimeAmount,
        basicSalary: basic,
        allowances: totalAllowances,
        grossPay: gross,
        epf,
        socso,
        eis,
        pcb,
        netSalary: gross - epf - socso - eis - pcb,
        status: getDeterministicValue(seed + 'STAT', 0, 10) > 8 ? 'PAID' : 'PENDING'
      };
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, selectedMonth, searchTerm, payrollSettings]);

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

  // Access Control
  if (currentUser.role === 'Staff' || currentUser.role === 'Manager') {
    // Filter to current user's payroll
    const myPayroll = payrollData.find(p => p.employeeId === currentUser.id);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">MY PAYSLIPS</h2>
            <NeoCard title="Salary History">
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { name: 'Jan', net: 4200 }, { name: 'Feb', net: 4250 }, { name: 'Mar', net: 4100 },
                        { name: 'Apr', net: 4400 }, { name: 'May', net: 4300 }, { name: 'Jun', net: myPayroll ? myPayroll.netSalary : 4350 }
                    ]}>
                        <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                        <Area type="monotone" dataKey="net" stroke="#3B82F6" fillOpacity={1} fill="url(#colorNet)" />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </NeoCard>
            <div className="space-y-4">
                 {/* Simulate previous months + current calculated */}
                 {myPayroll && (
                    <div className="p-4 bg-[#121212] border border-white/10 rounded-xl flex justify-between items-center hover:bg-white/5 cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold"><DollarSign /></div>
                            <div>
                                <p className="font-bold text-white">Payslip - {selectedMonth}</p>
                                <p className="text-xs text-gray-500">RM {myPayroll.netSalary.toLocaleString()}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDownloadPayslip(myPayroll)}
                            className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg font-bold uppercase text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>
                 )}
                 
                 {[1,2].map(i => (
                     <div key={i} className="p-4 bg-[#121212] border border-white/10 rounded-xl flex justify-between items-center opacity-50">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center text-gray-400 font-bold"><DollarSign /></div>
                             <div>
                                 <p className="font-bold text-white">Payslip - Previous</p>
                                 <p className="text-xs text-gray-500">Archived</p>
                             </div>
                         </div>
                         <button className="text-gray-500 font-bold uppercase text-xs cursor-not-allowed">Archived</button>
                     </div>
                 ))}
            </div>
        </div>
    );
  }

  const totalPayout = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);

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
    addNotification(`Processing payment batch for ${payrollData.length} employees...`, 'info');
    setTimeout(() => {
      addNotification(`Successfully processed RM ${totalPayout.toLocaleString()}`, 'success');
    }, 2000);
  };

  const getPeriodText = () => {
    const d = new Date(selectedMonth);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${month} 01 - ${month} ${lastDay}, ${year}`;
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">PAYROLL</h2>
        <div className="flex gap-4">
             <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                 <button onClick={() => setActiveTab('run')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${activeTab === 'run' ? 'bg-white text-black' : 'text-gray-400'}`}>Run Payroll</button>
                 <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${activeTab === 'settings' ? 'bg-white text-black' : 'text-gray-400'}`}>Configuration</button>
             </div>
             <div className="flex items-center gap-4 bg-[#121212] p-2 rounded-xl border border-white/10 shadow-lg">
                <Calendar className="w-5 h-5 text-gray-400 ml-2" />
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none uppercase tracking-wide"
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
            {/* Hero Card - "Payroll Run" */}
            <div className="relative bg-[#0a0a0a] border-2 border-white rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">PAYROLL RUN</h3>
                    <p className="text-gray-400 font-mono text-sm">Period: <span className="text-white">{getPeriodText()}</span></p>
                    
                    <div className="mt-6 flex gap-3">
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

                <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">TOTAL PAYOUT</span>
                    <span className="text-5xl lg:text-6xl font-black text-[#4ade80] tracking-tighter drop-shadow-sm">
                        RM {totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex-shrink-0">
                    <button 
                    onClick={handleProcessPayment}
                    className="bg-[#4ade80] hover:bg-[#22c55e] text-black font-black text-lg px-8 py-4 rounded-xl shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] transition-all flex items-center gap-3 uppercase tracking-wide"
                    >
                        Process Payment <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="border-2 border-white/10 rounded-3xl overflow-hidden bg-[#121212] shadow-glossy-card flex flex-col h-full">
                {/* Table Controls */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                        placeholder="Search Employee..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-white/30 w-64"
                        />
                    </div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest">{payrollData.length} RECORDS FOUND</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
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
                            <tr key={row.employeeId} className="hover:bg-white/5 transition-colors group">
                                <td className="p-5 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                                        {row.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm">{row.name}</span>
                                        <span className="text-[10px] text-gray-500 font-mono tracking-wide">{row.employeeId}</span>
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
                                <td className="p-5 text-white font-black text-base">RM {row.netSalary.toLocaleString()}</td>
                                <td className="p-5 text-center">
                                    <button 
                                        onClick={() => handleDownloadPayslip(row)}
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
    </div>
  );
};