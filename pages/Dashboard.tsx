

import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoModal, NeoSelect } from '../components/NeoComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Clock, AlertTriangle, TrendingUp, ArrowRight, Download, 
  FileText, Briefcase, DollarSign, Calendar, Check, X, Plus, Play,
  Activity, UploadCloud, Megaphone, Bell, ClipboardList, Info
} from 'lucide-react';
import { analyzeAttendancePatterns } from '../services/geminiService';
import { useGlobal } from '../context/GlobalContext';
import { Link } from 'react-router-dom';

// High Contrast Colors
const COLORS = ['#3B82F6', '#FFD700', '#EF4444'];

export const Dashboard: React.FC = () => {
  const { currentUser, addNotification, attendanceRecords, employees, leaveRequests, addGeneralRequest, announcements, companyProfile } = useGlobal();
  const [insight, setInsight] = useState<{riskLevel: string, suggestion: string} | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'Attendance' | 'Leave' | 'Finance'>('Attendance');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  
  const [requestForm, setRequestForm] = useState({
    date: '', details: '', attachment: ''
  });

  const emp = employees.find(e => e.id === currentUser.id);
  const showOnboardingNudge = emp && (emp.onboardingStep || 0) < 4;

  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Present').length;
    const lateToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Late').length;
    const absentToday = employees.filter(e => e.status === 'Active').length - (presentToday + lateToday);

    const chartData = [];
    for(let i=4; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const recs = attendanceRecords.filter(r => r.date === dStr);
      chartData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        present: recs.filter(r => r.status === 'Present').length,
        late: recs.filter(r => r.status === 'Late').length,
      });
    }

    const pie = [
      { name: 'On Time', value: attendanceRecords.filter(r => r.status === 'Present').length },
      { name: 'Late', value: attendanceRecords.filter(r => r.status === 'Late').length },
      { name: 'Absent', value: attendanceRecords.filter(r => r.status === 'Absent').length },
    ];
    
    return { presentToday, lateToday, absentToday, chartData, pie };
  }, [attendanceRecords, employees]);

  const fetchAiInsight = async () => {
    setLoadingInsight(true);
    const result = await analyzeAttendancePatterns(dashboardStats.chartData);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSubmitRequest = () => {
      if (!requestForm.date || !requestForm.details) return addNotification("All fields required", "error");
      
      let typeName = requestCategory;
      if (requestCategory === 'Leave') {
          const policy = companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId);
          if (!policy) return addNotification("Please select a leave type", "error");
          
          typeName = policy.name;
          // Basic Validation
          if (policy.requireDocument && !requestForm.attachment) {
             // Just a warning for demo purposes as we don't have full attachment UI in dashboard yet
             addNotification(`Warning: ${policy.name} requires documentation (e.g. MC).`, "info");
          }
      } else if (requestCategory === 'Attendance') {
          typeName = 'Missing Punch';
      } else if (requestCategory === 'Finance') {
          typeName = 'Salary Advance';
      }

      addGeneralRequest({
        id: Math.random().toString(36).substr(2, 9),
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        type: typeName,
        details: requestForm.details,
        date: requestForm.date,
        status: 'Pending',
        policyId: selectedPolicyId
      });
      
      addNotification(`${typeName} Request Submitted`, "success");
      setIsRequestModalOpen(false);
      setRequestForm({ date: '', details: '', attachment: '' });
      setSelectedPolicyId('');
  };

  const tooltipStyle = {
    backgroundColor: '#000',
    border: '2px solid #fff',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '16px',
    padding: '12px'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Welcome Banner */}
      <div className="relative bg-white dark:bg-[#222] border-4 border-black dark:border-white p-10 rounded-[2rem] shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col md:flex-row justify-between items-end gap-6 transition-colors">
        <div>
           <h2 className="text-4xl md:text-6xl font-black text-black dark:text-white mb-2 uppercase tracking-tighter drop-shadow-sm">
             Hello, {currentUser.name.split(' ')[0]}
           </h2>
           <p className="text-xl font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">
             {new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}
           </p>
        </div>
        <div className="flex gap-4">
           {currentUser.role !== 'Staff' && (
               <NeoButton variant="secondary" onClick={fetchAiInsight} className="text-lg">
                  {loadingInsight ? 'Running AI...' : 'AI Analysis'}
               </NeoButton>
           )}
           <NeoButton className="text-lg" onClick={() => setIsRequestModalOpen(true)}>
              <Plus className="w-6 h-6" /> Requests
           </NeoButton>
        </div>
      </div>

      {/* Onboarding Nudge */}
      {showOnboardingNudge && currentUser.role === 'Staff' && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-6 rounded-2xl border-2 border-white flex items-center justify-between shadow-lg animate-pulse">
           <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full">
                 <ClipboardList className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase">Setup Incomplete</h3>
                 <p className="text-white/80 font-bold">You have pending tasks in your onboarding checklist.</p>
              </div>
           </div>
           <Link to="/onboarding">
              <button className="px-6 py-2 bg-white text-pink-600 font-black uppercase rounded-xl hover:scale-105 transition-transform">
                 Complete Now
              </button>
           </Link>
        </div>
      )}

      {/* Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <NeoCard title="Company Announcements" icon={Megaphone} className="lg:col-span-2">
            <div className="space-y-4">
               {announcements.map(ann => (
                  <div key={ann.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl flex gap-4 items-start">
                     <div className={`p-3 rounded-lg ${ann.type === 'Holiday' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : ann.type === 'Alert' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                        <Bell className="w-5 h-5" />
                     </div>
                     <div>
                        <div className="flex justify-between items-center mb-1">
                           <h4 className="font-bold text-black dark:text-white text-lg">{ann.title}</h4>
                           <span className="text-xs text-gray-500 uppercase font-bold">{ann.date}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{ann.content}</p>
                     </div>
                  </div>
               ))}
               {announcements.length === 0 && <p className="text-gray-500 italic">No new announcements.</p>}
            </div>
         </NeoCard>
         
         <NeoCard title="My Actions" icon={Activity}>
             <div className="space-y-3">
                <button onClick={() => { setIsRequestModalOpen(true); setRequestCategory('Attendance'); }} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-black group-hover:scale-110 transition-transform">!</div>
                    <div>
                       <p className="font-bold text-black dark:text-white">Missing Punch</p>
                       <p className="text-xs text-gray-500">Forgot to clock in/out?</p>
                    </div>
                </button>
                <button onClick={() => { setIsRequestModalOpen(true); setRequestCategory('Leave'); }} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">L</div>
                    <div>
                       <p className="font-bold text-black dark:text-white">Apply Leave</p>
                       <p className="text-xs text-gray-500">Annual, Medical, etc.</p>
                    </div>
                </button>
             </div>
         </NeoCard>
      </div>

      {/* Stats Grid */}
      {currentUser.role !== 'Staff' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <NeoCard title="Present Today" icon={Check} color="blue" className="min-h-[300px]">
                    <div className="flex flex-col justify-end h-full">
                        <p className="text-9xl font-black text-black dark:text-white tracking-tighter leading-none mb-4 drop-shadow-md">
                            {dashboardStats.presentToday}
                        </p>
                        <div className="w-full bg-gray-300 dark:bg-gray-800 h-6 rounded-full border-2 border-black dark:border-white overflow-hidden">
                            <div className="h-full bg-blue-600" style={{width: `${(dashboardStats.presentToday / employees.length) * 100}%`}}></div>
                        </div>
                        <p className="text-lg font-bold text-gray-500 dark:text-gray-400 mt-2 text-right">/ {employees.length} Active Staff</p>
                    </div>
                </NeoCard>

                <NeoCard title="Late Arrivals" icon={Clock} color="yellow">
                    <p className="text-9xl font-black text-yellow-600 dark:text-[#FFD700] tracking-tighter leading-none mt-auto drop-shadow-md">
                        {dashboardStats.lateToday}
                    </p>
                </NeoCard>

                <NeoCard title="Absent / MIA" icon={AlertTriangle} color="red">
                    <p className="text-9xl font-black text-red-600 dark:text-red-500 tracking-tighter leading-none mt-auto drop-shadow-md">
                        {dashboardStats.absentToday}
                    </p>
                </NeoCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <NeoCard title="Attendance Trend (5 Days)" className="min-h-[500px]">
                    <div className="h-[400px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardStats.chartData}>
                                <XAxis dataKey="name" tick={{fill: '#666', fontSize: 16, fontWeight: 'bold'}} axisLine={{stroke: '#666', strokeWidth: 2}} tickLine={false} dy={10} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.1)'}} />
                                <Bar dataKey="present" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="late" fill="#FFD700" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </NeoCard>

                <NeoCard title="Status Overview" className="min-h-[500px]">
                    <div className="h-[400px] w-full mt-6 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dashboardStats.pie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={120}
                                    outerRadius={160}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dashboardStats.pie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-7xl font-black text-black dark:text-white">
                                {Math.round((dashboardStats.presentToday / employees.length) * 100) || 0}%
                            </p>
                            <p className="text-xl font-bold text-gray-500 uppercase">On Time</p>
                        </div>
                    </div>
                </NeoCard>
            </div>
        </>
      )}

      <NeoModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Submit Request">
           <div className="space-y-6">
             <div className="flex gap-4 p-2 bg-gray-100 dark:bg-black rounded-xl border-2 border-black dark:border-white overflow-x-auto">
               {['Attendance', 'Leave', 'Finance'].map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setRequestCategory(cat as any)} 
                    className={`flex-1 py-4 px-2 rounded-lg font-black text-sm uppercase tracking-wide transition-all whitespace-nowrap ${requestCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                 >
                    {cat}
                 </button>
               ))}
             </div>

             <div className="space-y-4">
                 <label className="text-xs font-black uppercase text-gray-500">Date</label>
                 <NeoInput type="date" value={requestForm.date} onChange={e => setRequestForm({...requestForm, date: e.target.value})} />
                 
                 {requestCategory === 'Leave' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                         <label className="text-xs font-black uppercase text-gray-500">Leave Type</label>
                         <NeoSelect value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)}>
                             <option value="">Select Policy...</option>
                             {companyProfile.leavePolicies?.map(policy => (
                                 <option key={policy.id} value={policy.id}>{policy.name} ({policy.daysPerYear} days/yr)</option>
                             ))}
                         </NeoSelect>
                         
                         {selectedPolicyId && (
                             <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-xs text-blue-300">
                                 <Info className="w-5 h-5 shrink-0" />
                                 <div>
                                    <p><span className="font-bold text-white">Notice Required:</span> {companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId)?.minNoticeDays} Days</p>
                                    <p><span className="font-bold text-white">Document:</span> {companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId)?.requireDocument ? 'Required' : 'Optional'}</p>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}

                 <label className="text-xs font-black uppercase text-gray-500">
                    {requestCategory === 'Attendance' ? 'Time In/Out & Reason' : requestCategory === 'Finance' ? 'Amount (RM)' : 'Reason'}
                 </label>
                 <NeoInput 
                    value={requestForm.details} 
                    onChange={e => setRequestForm({...requestForm, details: e.target.value})} 
                    placeholder={requestCategory === 'Finance' ? 'e.g. 500' : 'Enter details...'} 
                 />
             </div>
             
             <NeoButton onClick={handleSubmitRequest} className="w-full">Submit Request</NeoButton>
           </div>
      </NeoModal>
    </div>
  );
};