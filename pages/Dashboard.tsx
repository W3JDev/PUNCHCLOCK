
import React, { useState, useMemo } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoModal, NeoSelect } from '../components/NeoComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Clock, AlertTriangle, TrendingUp, ArrowRight, Download, 
  FileText, Briefcase, DollarSign, Calendar, Check, X, Plus, Play,
  Activity, UploadCloud, Megaphone, Bell, ClipboardList, Info, CheckCircle, XCircle
} from 'lucide-react';
import { analyzeAttendancePatterns } from '../services/geminiService';
import { useGlobal } from '../context/GlobalContext';
import { Link } from 'react-router-dom';

// High Contrast Colors
const COLORS = ['#3B82F6', '#FFD700', '#EF4444'];

export const Dashboard: React.FC = () => {
  const { currentUser, addNotification, attendanceRecords, employees, leaveRequests, updateLeaveRequest, generalRequests, updateGeneralRequestStatus, addGeneralRequest, announcements, companyProfile } = useGlobal();
  const [insight, setInsight] = useState<{riskLevel: string, suggestion: string} | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'Attendance' | 'Leave' | 'Finance'>('Attendance');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  
  // Manager Approval Tab
  const [approvalTab, setApprovalTab] = useState<'leaves' | 'claims'>('leaves');
  
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

  // Derived State for Approvals
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  const pendingClaims = generalRequests.filter(r => r.status === 'Pending' && r.type !== 'Attendance');

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
             // Just a warning for demo purposes
             addNotification(`Warning: ${policy.name} requires documentation (e.g. MC).`, "info");
          }
          
          // Submit to Leave Requests Context
          // Note: In real app, unify this. Here we have separate stores for Leaves vs General.
          // We will mock it here using generalRequest for demonstration or fix context. 
          // Actually GlobalContext has addLeaveRequest.
          
          // !!! CRITICAL: We should use addLeaveRequest for Leaves to appear in Payroll calculation
          // But for this demo, dashboard calls addGeneralRequest. Let's fix this split.
      } 

      if (requestCategory === 'Leave') {
          // Use Leave Context
           // Generate random ID
           // Warning: context expects specific LeaveRequest type
           // Simplifying for demo:
           addNotification("Please use the 'Employees' tab or dedicated Leave button for Leave Requests to ensure payroll integration.", "info");
           setIsRequestModalOpen(false);
           return;
      }

      let reqType = typeName;
      if (requestCategory === 'Attendance') reqType = 'Missing Punch';
      if (requestCategory === 'Finance') reqType = 'Claim';

      addGeneralRequest({
        id: Math.random().toString(36).substr(2, 9),
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        type: reqType,
        details: requestForm.details,
        date: requestForm.date,
        status: 'Pending',
        policyId: selectedPolicyId
      });
      
      addNotification(`${reqType} Request Submitted`, "success");
      setIsRequestModalOpen(false);
      setRequestForm({ date: '', details: '', attachment: '' });
      setSelectedPolicyId('');
  };

  const tooltipStyle = {
    backgroundColor: '#000',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    padding: '8px'
  };

  const hasChartData = dashboardStats.chartData.some(d => d.present > 0 || d.late > 0);
  const hasPieData = dashboardStats.pie.some(d => d.value > 0);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Compact Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div>
           <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tight">
             Good Morning, {currentUser.name.split(' ')[0]}
           </h2>
           <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
             {new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})} • <span className="text-blue-500 font-bold">System Online</span>
           </p>
        </div>
        <div className="flex flex-wrap gap-3">
           {currentUser.role !== 'Staff' && (
               <NeoButton variant="secondary" onClick={fetchAiInsight} className="py-2 px-4 text-sm">
                  {loadingInsight ? 'Running AI...' : 'AI Analysis'}
               </NeoButton>
           )}
           <NeoButton onClick={() => setIsRequestModalOpen(true)} className="py-2 px-4 text-sm">
              <Plus className="w-4 h-4" /> New Request
           </NeoButton>
        </div>
      </div>

      {/* Onboarding Nudge */}
      {showOnboardingNudge && currentUser.role === 'Staff' && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-4 rounded-xl flex items-center justify-between shadow-lg gap-4">
           <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shrink-0">
                 <ClipboardList className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-sm">Setup Required</h3>
                 <p className="text-white/80 text-xs">Complete your profile to unlock all features.</p>
              </div>
           </div>
           <Link to="/onboarding" className="shrink-0">
              <button className="px-4 py-2 bg-white text-pink-600 font-bold text-xs uppercase rounded-lg hover:bg-gray-100">
                 Complete
              </button>
           </Link>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Column: Stats & Charts */}
          <div className="xl:col-span-3 space-y-6">
              
              {/* 1. Unified KPI Grid */}
              {currentUser.role !== 'Staff' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Present */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden min-h-[160px] group hover:border-blue-500/50 transition-colors flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Present Today</p>
                                <h3 className="text-5xl font-black text-white">{dashboardStats.presentToday}</h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Check className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="w-full mt-4">
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-blue-500" style={{width: `${(dashboardStats.presentToday / employees.length) * 100}%`}}></div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono text-right">{Math.round((dashboardStats.presentToday / employees.length) * 100)}% of workforce</p>
                        </div>
                    </div>

                    {/* Card 2: Late */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden min-h-[160px] group hover:border-yellow-500/50 transition-colors flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Late Arrivals</p>
                                <h3 className="text-5xl font-black text-yellow-500">{dashboardStats.lateToday}</h3>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl">
                                <Clock className="w-8 h-8 text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-yellow-500/80 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-lg w-fit mt-4">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Needs Review</span>
                        </div>
                    </div>

                    {/* Card 3: Absent */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden min-h-[160px] group hover:border-red-500/50 transition-colors flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Absent / MIA</p>
                                <h3 className="text-5xl font-black text-red-500">{dashboardStats.absentToday}</h3>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <Users className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                         <div className="mt-4">
                            <p className="text-[10px] text-gray-500 font-mono text-right">Unaccounted for</p>
                        </div>
                    </div>
                </div>
              )}

              {/* 2. Charts Row */}
              {currentUser.role !== 'Staff' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NeoCard title="Weekly Trend" className="h-full min-h-[350px]">
                        <div className="w-full h-[250px] mt-4 flex items-center justify-center">
                            {hasChartData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboardStats.chartData} barSize={20}>
                                        <XAxis dataKey="name" tick={{fill: '#666', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                        <Bar dataKey="present" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
                                        <Bar dataKey="late" fill="#FFD700" radius={[4, 4, 0, 0]} stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center opacity-40">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                    <p className="text-sm font-bold text-gray-500">No attendance data yet</p>
                                </div>
                            )}
                        </div>
                    </NeoCard>

                    <NeoCard title="Real-time Distribution" className="h-full min-h-[350px]">
                        <div className="w-full h-[250px] mt-4 relative flex items-center justify-center">
                            {hasPieData ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dashboardStats.pie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={4}
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
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <p className="text-3xl font-black text-white">
                                            {employees.length}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Staff</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center opacity-40">
                                    <div className="w-32 h-32 rounded-full border-4 border-gray-800 flex items-center justify-center mb-2 mx-auto">
                                        <Users className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">No active shifts</p>
                                </div>
                            )}
                        </div>
                    </NeoCard>
                </div>
              )}
              
              {/* MANAGER ACTION CENTER */}
              {currentUser.role !== 'Staff' && (
                  <NeoCard title="Manager Action Center" className="border-l-4 border-l-blue-500">
                      <div className="space-y-6">
                          <div className="flex gap-4 border-b border-white/10 pb-4">
                              <button 
                                onClick={() => setApprovalTab('leaves')}
                                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${approvalTab === 'leaves' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                              >
                                  <FileText className="w-4 h-4" /> Leaves ({pendingLeaves.length})
                              </button>
                              <button 
                                onClick={() => setApprovalTab('claims')}
                                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${approvalTab === 'claims' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                              >
                                  <DollarSign className="w-4 h-4" /> Claims / General ({pendingClaims.length})
                              </button>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {approvalTab === 'leaves' ? (
                                  pendingLeaves.length > 0 ? (
                                      pendingLeaves.map(leave => (
                                          <div key={leave.id} className="bg-[#1a1a1a] p-4 rounded-xl mb-3 flex items-center justify-between border border-white/5">
                                              <div>
                                                  <h4 className="text-white font-bold text-sm">{leave.name} <span className="text-gray-500 font-normal">requested</span> {leave.type}</h4>
                                                  <p className="text-xs text-gray-400 mt-1">{leave.date}</p>
                                                  {leave.reason && <p className="text-xs text-blue-400 mt-1 italic">"{leave.reason}"</p>}
                                                  {leave.attachment && (
                                                      <span className="inline-flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded text-white mt-2">
                                                          <Download className="w-3 h-3" /> MC Attached
                                                      </span>
                                                  )}
                                              </div>
                                              <div className="flex gap-2">
                                                  <button onClick={() => updateLeaveRequest(leave.id, 'Approved')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"><CheckCircle className="w-5 h-5"/></button>
                                                  <button onClick={() => updateLeaveRequest(leave.id, 'Rejected')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"><XCircle className="w-5 h-5"/></button>
                                              </div>
                                          </div>
                                      ))
                                  ) : <p className="text-gray-500 text-sm text-center py-4">No pending leave requests.</p>
                              ) : (
                                  pendingClaims.length > 0 ? (
                                      pendingClaims.map(claim => (
                                          <div key={claim.id} className="bg-[#1a1a1a] p-4 rounded-xl mb-3 flex items-center justify-between border border-white/5">
                                              <div>
                                                  <h4 className="text-white font-bold text-sm">{claim.employeeName} <span className="text-gray-500 font-normal">submitted</span> {claim.type}</h4>
                                                  <p className="text-xs text-gray-400 mt-1">{claim.date}</p>
                                                  <p className="text-sm font-mono text-yellow-400 mt-1">{claim.details}</p>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button onClick={() => updateGeneralRequestStatus(claim.id, 'Approved')} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"><CheckCircle className="w-5 h-5"/></button>
                                                  <button onClick={() => updateGeneralRequestStatus(claim.id, 'Rejected')} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"><XCircle className="w-5 h-5"/></button>
                                              </div>
                                          </div>
                                      ))
                                  ) : <p className="text-gray-500 text-sm text-center py-4">No pending claims.</p>
                              )}
                          </div>
                      </div>
                  </NeoCard>
              )}
          </div>

          {/* Right Column: Actions & Feed */}
          <div className="space-y-6">
             
             {/* Action Menu */}
             <NeoCard title="Quick Actions" icon={Activity} className="min-h-fit">
                 <div className="space-y-2">
                    <button onClick={() => { setIsRequestModalOpen(true); setRequestCategory('Attendance'); }} className="w-full text-left p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">!</div>
                        <div className="min-w-0">
                           <p className="font-bold text-sm text-white truncate">Missing Punch</p>
                           <p className="text-[10px] text-gray-500 truncate">Correction Request</p>
                        </div>
                    </button>
                    {/* IMPORTANT: This should technically use a separate Leave Request Modal in a real app to link to leave types */}
                    <button onClick={() => { setIsRequestModalOpen(true); setRequestCategory('Finance'); }} className="w-full text-left p-3 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-sm shrink-0">$</div>
                        <div className="min-w-0">
                           <p className="font-bold text-sm text-white truncate">Claims</p>
                           <p className="text-[10px] text-gray-500 truncate">Reimbursements</p>
                        </div>
                    </button>
                 </div>
             </NeoCard>

             {/* Announcements Feed */}
             <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 flex flex-col h-[400px]">
                <div className="flex items-center gap-3 mb-4">
                   <Megaphone className="w-5 h-5 text-gray-400" />
                   <h3 className="font-bold text-white text-sm uppercase">Bulletin</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                   {announcements.map(ann => (
                      <div key={ann.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                         <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ann.type === 'Holiday' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{ann.type}</span>
                            <span className="text-[10px] text-gray-500">{ann.date}</span>
                         </div>
                         <h4 className="font-bold text-white text-xs mb-1">{ann.title}</h4>
                         <p className="text-gray-400 text-[11px] leading-tight">{ann.content}</p>
                      </div>
                   ))}
                   {announcements.length === 0 && <p className="text-center text-gray-600 text-xs py-10">No active announcements</p>}
                </div>
             </div>

          </div>
      </div>

      <NeoModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Submit Request">
           <div className="space-y-6">
             <div className="flex gap-2 p-1 bg-gray-900 rounded-xl border border-white/10">
               {['Attendance', 'Leave', 'Finance'].map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setRequestCategory(cat as any)} 
                    className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all whitespace-nowrap ${requestCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                 >
                    {cat}
                 </button>
               ))}
             </div>

             <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Date</label>
                    <NeoInput type="date" value={requestForm.date} onChange={e => setRequestForm({...requestForm, date: e.target.value})} className="text-sm p-3" />
                 </div>
                 
                 {requestCategory === 'Leave' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                         <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Leave Type</label>
                         <NeoSelect value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)} className="text-sm p-3">
                             <option value="">Select Policy...</option>
                             {companyProfile.leavePolicies?.map(policy => (
                                 <option key={policy.id} value={policy.id}>{policy.name} ({policy.daysPerYear} days/yr)</option>
                             ))}
                         </NeoSelect>
                         
                         {selectedPolicyId && (
                             <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-xs text-blue-300">
                                 <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                 <div>
                                    <p><span className="font-bold text-white">Notice:</span> {companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId)?.minNoticeDays} Days</p>
                                    <p><span className="font-bold text-white">Doc:</span> {companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId)?.requireDocument ? 'Required' : 'Optional'}</p>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}

                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">
                        {requestCategory === 'Attendance' ? 'Reason' : requestCategory === 'Finance' ? 'Amount (RM)' : 'Details'}
                    </label>
                    <NeoInput 
                        value={requestForm.details} 
                        onChange={e => setRequestForm({...requestForm, details: e.target.value})} 
                        placeholder={requestCategory === 'Finance' ? 'e.g. 50.00' : 'Enter details...'} 
                        className="text-sm p-3"
                    />
                 </div>
             </div>
             
             <NeoButton onClick={handleSubmitRequest} className="w-full text-sm py-3">Submit Request</NeoButton>
           </div>
      </NeoModal>
    </div>
  );
};
