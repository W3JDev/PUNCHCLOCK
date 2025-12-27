
import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoCheckbox, NeoModal } from '../components/NeoComponents';
import { 
  Download, FileText, Settings, AreaChart as AreaIcon, BarChart2, TrendingUp, 
  DollarSign, Clock, Users, PieChart as PieIcon, Calculator, ChevronRight, 
  Receipt, Briefcase, Calendar, Info, AlertTriangle, ArrowRight, Loader2, Search
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateKWSPFile, generateSOCSOFile, generateLHDNFile } from '../services/complianceService';
import { generatePayslipPDF } from '../services/documentService';
import { PayrollEntry } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#FFD700', '#EF4444', '#10B981', '#A855F7', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border-2 border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="font-black text-white mb-2 uppercase text-[10px] tracking-widest border-b border-white/10 pb-2">{label}</p>
          <div className="space-y-2">
              {payload.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }}></div>
                        <span className="text-gray-400">{p.name}</span>
                    </div>
                    <span className="text-white font-mono">RM {p.value.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
};

export const Payroll: React.FC = () => {
  const { employees, attendanceRecords, leaveRequests, generalRequests, payrollSettings, updatePayrollSettings, companyProfile, currentUser, addNotification } = useGlobal();
  const [activeTab, setActiveTab] = useState<'run' | 'analytics' | 'settings'>('run');
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

      const approvedClaimsList = generalRequests.filter(r => 
        r.employeeId === emp.id && r.type === 'Claim' && r.status === 'Approved' && r.date.startsWith(selectedMonth)
      );

      const approvedClaimsValue = approvedClaimsList.reduce((sum, r) => {
        const val = parseFloat(r.details.match(/(\d+(\.\d+)?)/)?.[0] || "0");
        return sum + val;
      }, 0);

      const fixedAllowances = (payrollSettings.globalAllowances.transport || 0) + (payrollSettings.globalAllowances.phone || 0) + (payrollSettings.globalAllowances.meal || 0);
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

  const analyticsData = useMemo(() => {
    const totalPayout = payrollData.reduce((acc, curr) => acc + curr.netSalary, 0);
    const totalEPF = payrollData.reduce((acc, curr) => acc + curr.epf, 0);
    const totalOT = payrollData.reduce((acc, curr) => acc + curr.overtimeAmount, 0);

    const deptMap: Record<string, number> = {};
    payrollData.forEach(p => {
        deptMap[p.department] = (deptMap[p.department] || 0) + p.grossPay;
    });
    const deptChart = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Mock trend for visual interest
    const trendChart = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
            month: d.toLocaleString('default', { month: 'short' }),
            gross: totalPayout * (0.8 + Math.random() * 0.4),
            ot: totalOT * (0.5 + Math.random() * 1)
        };
    });

    return { totalPayout, totalEPF, totalOT, deptChart, trendChart };
  }, [payrollData]);

  const handleDownloadPayslip = (entry: PayrollEntry) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    if (!emp) return;
    const url = generatePayslipPDF(entry, emp, companyProfile);
    const a = document.createElement('a'); a.href = url; a.download = `Payslip_${emp.name}_${entry.month}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in w-full max-w-[1600px] mx-auto text-black dark:text-white">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-white/50 dark:bg-white/5 backdrop-blur-3xl border border-white/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="h-8 w-1 rounded-full bg-green-500 shadow-[0_0_15px_#10B981]"></div>
               <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Financial Ops</h2>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white italic tracking-tighter uppercase leading-none">PAYROLL<br/><span className="text-blue-600">ENGINE.</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 relative z-10">
             <div className="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-2xl border border-gray-200 dark:border-white/10">
                 {['run', 'analytics', 'settings'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                    >
                        {tab === 'run' ? 'Process' : tab === 'analytics' ? 'Analytics' : 'Config'}
                    </button>
                 ))}
             </div>
             <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white dark:bg-black p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl font-black text-xs outline-none focus:border-blue-500 transition-all" />
        </div>
      </div>

      {activeTab === 'run' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-glossy-card flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-white/5">
                    <div className="relative w-full max-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input placeholder="Filter by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-bold w-full focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <NeoButton variant="secondary" className="py-3 px-6 text-xs" onClick={() => addNotification("Bank batch generation logic triggered", "info")}><Download className="w-4 h-4 mr-2"/> Export Batch</NeoButton>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                <th className="p-6 pl-10">Employee Identity</th>
                                <th className="p-6">Base Remuneration</th>
                                <th className="p-6">Allowances/OT</th>
                                <th className="p-6">Statutory Share</th>
                                <th className="p-6">Net Disposable</th>
                                <th className="p-6 text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                            {payrollData.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest opacity-30">No active records for this period</td></tr>
                            ) : (
                                payrollData.map((row) => (
                                    <tr key={row.employeeId} onClick={() => { setSelectedEntry(row); setDetailTab('payslip'); }} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">{row.name.charAt(0)}</div>
                                                <div className="flex flex-col"><span className="font-black text-black dark:text-white">{row.name}</span><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{row.role}</span></div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-mono font-bold text-gray-600 dark:text-gray-300">RM {row.basicSalary.toLocaleString()}</td>
                                        <td className="p-6 font-mono font-bold text-green-600">+{(row.allowances + row.overtimeAmount).toLocaleString()}</td>
                                        <td className="p-6 font-mono font-bold text-red-600">-{(row.epf + row.socso + row.eis + row.pcb).toLocaleString()}</td>
                                        <td className="p-6"><span className="font-black text-lg text-black dark:text-white">RM {row.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(row); }} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><FileText className="w-4 h-4" /></button>
                                                <button className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-green-500 hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-white/20 shadow-2xl p-8 min-h-[220px] transition-all hover:scale-[1.02] backdrop-blur-xl">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full"></div>
                      <p className="text-blue-500 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Total Disbursement</p>
                      <h3 className="text-5xl font-black text-black dark:text-white tracking-tighter tabular-nums mb-4">RM {(analyticsData.totalPayout / 1000).toFixed(1)}K</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                          <TrendingUp className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">+2.4% vs Last Month</span>
                      </div>
                  </div>
                  
                  <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-500/10 to-green-500/5 border border-white/20 shadow-2xl p-8 min-h-[220px] transition-all hover:scale-[1.02] backdrop-blur-xl">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full"></div>
                      <p className="text-green-500 dark:text-green-400 text-xs font-black uppercase tracking-[0.3em] mb-4">KWSP Compliance</p>
                      <h3 className="text-5xl font-black text-black dark:text-white tracking-tighter tabular-nums mb-4">RM {(analyticsData.totalEPF / 1000).toFixed(1)}K</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee + Employer Contribution</p>
                  </div>

                  <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-white/20 shadow-2xl p-8 min-h-[220px] transition-all hover:scale-[1.02] backdrop-blur-xl">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 blur-[60px] rounded-full"></div>
                      <p className="text-orange-500 dark:text-orange-400 text-xs font-black uppercase tracking-[0.3em] mb-4">OT Saturation</p>
                      <h3 className="text-5xl font-black text-black dark:text-white tracking-tighter tabular-nums mb-4">{Math.round((analyticsData.totalOT / Math.max(1, analyticsData.totalPayout)) * 100)}%</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Normal Threshold</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <NeoCard title="Budget Utilization Trends" className="min-h-[400px]">
                      <div className="h-full w-full min-h-[300px] pt-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                              <AreaChart data={analyticsData.trendChart}>
                                  <defs>
                                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                  <XAxis dataKey="month" tick={{fill: '#888', fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fill: '#888', fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Area type="monotone" dataKey="gross" name="Gross Payout" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorGross)" />
                                  <Area type="monotone" dataKey="ot" name="OT Portion" stroke="#F97316" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </NeoCard>

                  <NeoCard title="Cost Center Distribution" className="min-h-[400px]">
                      <div className="h-full w-full min-h-[300px] pt-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                              <BarChart data={analyticsData.deptChart} layout="vertical" margin={{left: 40}}>
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" tick={{fill: '#888', fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} content={<CustomTooltip />} />
                                  <Bar dataKey="value" name="Total Gross" radius={[0, 4, 4, 0]} barSize={32}>
                                      {analyticsData.deptChart.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </NeoCard>
              </div>
          </div>
      )}

      {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
              <NeoCard title="Statutory Contribution Profile" className="border-l-4 border-l-yellow-500">
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <NeoInput label="EPF Employee %" type="number" value={payrollSettings.statutoryRates.epfEmployee} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployee: parseFloat(e.target.value)}})} />
                          <NeoInput label="EPF Employer %" type="number" value={payrollSettings.statutoryRates.epfEmployer} onChange={e => updatePayrollSettings({...payrollSettings, statutoryRates: {...payrollSettings.statutoryRates, epfEmployer: parseFloat(e.target.value)}})} />
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl space-y-4">
                        <NeoCheckbox label="Automatic SOCSO Deductions" checked={payrollSettings.enableSocso} onChange={c => updatePayrollSettings({...payrollSettings, enableSocso: c})} />
                        <NeoCheckbox label="EIS (SIP) Contributions" checked={true} onChange={() => {}} />
                        <NeoCheckbox label="EPF for Foreign Nationals" checked={payrollSettings.enableEpfForForeigners} onChange={c => updatePayrollSettings({...payrollSettings, enableEpfForForeigners: c})} />
                      </div>
                  </div>
              </NeoCard>
              <NeoCard title="Corporate Allowance Structure" className="border-l-4 border-l-blue-500">
                  <div className="space-y-4">
                      <NeoInput label="Travel Allowance (Monthly)" type="number" value={payrollSettings.globalAllowances.transport} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, transport: parseFloat(e.target.value)}})} />
                      <NeoInput label="Mobile Connectivity" type="number" value={payrollSettings.globalAllowances.phone} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, phone: parseFloat(e.target.value)}})} />
                      <NeoInput label="Meal Stipend" type="number" value={payrollSettings.globalAllowances.meal} onChange={e => updatePayrollSettings({...payrollSettings, globalAllowances: {...payrollSettings.globalAllowances, meal: parseFloat(e.target.value)}})} />
                      <NeoButton onClick={() => addNotification("Settings Saved", "success")} className="w-full mt-4">Publish Config Changes</NeoButton>
                  </div>
              </NeoCard>
          </div>
      )}

      <NeoModal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={`${selectedEntry?.name} - Payroll Audit`}>
          <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-black rounded-2xl mb-8 border border-gray-200 dark:border-white/10">
              <button onClick={() => setDetailTab('payslip')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${detailTab === 'payslip' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Salary Statement</button>
              <button onClick={() => setDetailTab('claims')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${detailTab === 'claims' ? 'bg-white text-black shadow-md scale-[1.02]' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Itemized Claims</button>
          </div>
          {detailTab === 'payslip' && selectedEntry && (
              <div className="space-y-6">
                  <div className="p-8 bg-blue-600 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl text-white">
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Net Salary Disbursed</p>
                          <p className="text-5xl font-black">RM {selectedEntry.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      </div>
                      <NeoButton onClick={() => handleDownloadPayslip(selectedEntry)} variant="secondary" className="px-8 border-white">Generate PDF</NeoButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Earnings Breakdown</p>
                          <div className="space-y-3 text-sm font-bold">
                              <div className="flex justify-between"><span>Basic Salary</span> <span className="font-mono">RM {selectedEntry.basicSalary.toLocaleString()}</span></div>
                              <div className="flex justify-between text-green-600"><span>Allowances</span> <span className="font-mono">+{selectedEntry.allowances.toLocaleString()}</span></div>
                              {selectedEntry.overtimeAmount > 0 && <div className="flex justify-between text-green-600"><span>Overtime</span> <span className="font-mono">+{selectedEntry.overtimeAmount.toLocaleString()}</span></div>}
                          </div>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Statutory Deductions</p>
                          <div className="space-y-3 text-sm font-bold text-red-600">
                              <div className="flex justify-between"><span>KWSP (EPF)</span> <span className="font-mono">-{selectedEntry.epf.toLocaleString()}</span></div>
                              <div className="flex justify-between"><span>SOCSO/EIS</span> <span className="font-mono">-{(selectedEntry.socso + selectedEntry.eis).toFixed(2)}</span></div>
                              <div className="flex justify-between"><span>LHDN PCB</span> <span className="font-mono">-{selectedEntry.pcb.toFixed(2)}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
          {detailTab === 'claims' && (
              <div className="space-y-4">
                  {generalRequests.filter(r => r.employeeId === selectedEntry?.employeeId && r.type === 'Claim' && r.status === 'Approved' && r.date.startsWith(selectedEntry?.month || '')).length === 0 ? (
                      <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest opacity-20">No claims for this cycle</div>
                  ) : (
                      generalRequests.filter(r => r.employeeId === selectedEntry?.employeeId && r.type === 'Claim' && r.status === 'Approved' && r.date.startsWith(selectedEntry?.month || '')).map(claim => (
                          <div key={claim.id} className="p-5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
                                  <div><p className="font-black text-sm uppercase">{claim.details}</p><p className="text-[10px] text-gray-500 font-bold uppercase">{claim.date}</p></div>
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
